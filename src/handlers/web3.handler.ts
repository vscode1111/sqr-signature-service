import dayjs from 'dayjs';
import { BigNumberish } from 'ethers';
import { Context } from 'moleculer';
import {
  DAYS,
  MINUTES,
  checkIfAddress,
  checkIfNumber,
  toDate,
  toNumberDecimals,
  toWei,
  toWeiWithFixed,
} from '~common';
import {
  CacheMachine,
  DeployNetworkKey,
  HandlerFunc,
  MissingServicePrivateKey,
  NotFound,
  StatsData,
  UINT32_MAX,
  checkIfNetwork,
  commonHandlers,
  web3Constants,
} from '~common-service';
import { BABT_ADDRESS } from '~constants';
import { services } from '~index';
import {
  GetAccountParams,
  GetBlockParams,
  GetBlockResponse,
  GetERC20BalanceParams,
  GetNetworkParams,
  GetSQRPaymentGatewayDepositSignatureParams,
  GetSQRPaymentGatewayNonceParams,
  GetSQRPaymentGatewaySignatureResponse,
  GetSQRpProRataDepositSignatureParams,
  GetSQRpProRataDepositSignatureResponse,
  GetSQRpProRataNonceParams,
  GetTxParams,
  GetTxResponse,
  HandlerParams,
} from '~types';
import {
  decodeFunctionParams,
  getCacheContractSettingKey,
  monitoringError,
  signMessageForPaymentGatewayDeposit,
  signMessageForProRataDeposit,
} from '~utils';

// const TIME_OUT = 300;
// const INDEXER_OFFSET = 300;
// const CACHE_TIME_OUT = 60_000;

const TIME_OUT = 5 * MINUTES;
const INDEXER_OFFSET = 5 * MINUTES;
const CACHE_TIME_OUT = Math.round(TIME_OUT / 10);
const ABI_CACHE_TIME_OUT = DAYS;

const CONSTANT_TIME_LIMIT = false;
const BLOCK_KEY = 'BLOCK_KEY';

const cacheMachine = new CacheMachine();

const handlerFunc: HandlerFunc = () => ({
  actions: {
    ...commonHandlers,

    'network.blocks.id': {
      params: {
        network: { type: 'string' },
        id: { type: 'string' },
      } as HandlerParams<GetBlockParams>,
      async handler(ctx: Context<GetBlockParams>): Promise<GetBlockResponse> {
        try {
          const network = checkIfNetwork(ctx?.params?.network);
          const paramId = ctx?.params.id;

          let id: string | number = paramId;
          if (paramId !== web3Constants.latest) {
            id = checkIfNumber(ctx?.params.id);
          }

          const block = await services.getProvider(network).getBlockByNumber(id);
          return {
            ...block,
            timestampDate: toDate(block.timestamp),
          };
        } catch (e) {
          throw new NotFound();
        }
      },
    },

    'network.tx': {
      params: {
        network: { type: 'string' },
        tx: { type: 'string' },
      } as HandlerParams<GetTxParams>,
      async handler(ctx: Context<GetTxParams>): Promise<GetTxResponse> {
        const network = checkIfNetwork(ctx?.params?.network);

        let tx = ctx?.params?.tx;

        const provider = services.getProvider(network);

        try {
          const [txResponse, receiptResponse] = await Promise.all([
            provider.getTransactionByHash(tx),
            provider.getTransactionReceipt(tx),
          ]);

          const { input } = txResponse;
          const { transactionHash, from, to, blockNumber, status } = receiptResponse;

          const [blockResponse, extra] = await Promise.all([
            provider.getBlockByNumber(blockNumber),
            decodeFunctionParams(network, to, input, cacheMachine, ABI_CACHE_TIME_OUT).catch(
              () => {},
            ),
          ]);
          const { timestamp } = blockResponse;

          return {
            tx: transactionHash,
            from,
            to,
            timestamp: toDate(timestamp),
            status,
            extra,
          };
        } catch (e) {
          throw new NotFound();
        }
      },
    },

    'indexer.network.stats': {
      params: {
        network: { type: 'string' },
      } as HandlerParams<GetNetworkParams>,
      async handler(ctx: Context<GetBlockParams>): Promise<StatsData> {
        const network = checkIfNetwork(ctx.params.network);
        const [engineStats, servicesStats] = await Promise.all([
          services.multiSyncEngine.getStats(network),
          services.getStats(),
        ]);
        return { ...engineStats, ...servicesStats };
      },
    },

    'network.payment-gateway-contract.deposit-signature': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
        userId: { type: 'string' },
        transactionId: { type: 'string' },
        account: { type: 'string' },
        amount: { type: 'number' },
      } as HandlerParams<GetSQRPaymentGatewayDepositSignatureParams>,
      async handler(
        ctx: Context<GetSQRPaymentGatewayDepositSignatureParams>,
      ): Promise<GetSQRPaymentGatewaySignatureResponse> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const network = checkIfNetwork(ctx?.params?.network);
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const account = checkIfAddress(ctx?.params?.account);
          const { userId, transactionId, amount } = ctx?.params;
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { owner, getErc20Token, getSqrPaymentGateway } = context;

          let nonce = -1;
          let timestampNow = -1;
          let timestampLimit = -1;
          let dateLimit = new Date(1900, 1, 1);
          let decimals: BigNumberish = 18;

          const sqrPaymentGateway = getSqrPaymentGateway(contractAddress);

          if (CONSTANT_TIME_LIMIT) {
            nonce = Number(await sqrPaymentGateway.getDepositNonce(userId));
            timestampLimit = UINT32_MAX;
          } else {
            const [block, _decimals, nonceRaw] = await Promise.all([
              cacheMachine.call(
                () => BLOCK_KEY,
                () => services.getProvider(network).getBlockByNumber(web3Constants.latest),
                CACHE_TIME_OUT,
              ),
              cacheMachine.call(
                () => getCacheContractSettingKey(network, contractAddress),
                async () => {
                  const tokenAddress = await getSqrPaymentGateway(contractAddress).erc20Token();
                  return getErc20Token(tokenAddress).decimals();
                },
              ),
              sqrPaymentGateway.getDepositNonce(userId),
            ]);
            decimals = _decimals;
            nonce = Number(nonceRaw);
            timestampNow = block.timestamp;
            timestampLimit = timestampNow + TIME_OUT;
            dateLimit = dayjs()
              .add(TIME_OUT + INDEXER_OFFSET, 'seconds')
              .toDate();
          }

          const amountInWei = toWeiWithFixed(amount, decimals);

          const signature = await signMessageForPaymentGatewayDeposit(
            owner,
            userId,
            transactionId,
            account,
            amountInWei,
            nonce,
            timestampLimit,
          );

          services.changeStats(network, (stats) => ({ signatures: ++stats.signatures }));

          return {
            signature,
            amountInWei: String(amountInWei),
            nonce,
            timestampNow,
            timestampLimit,
            dateLimit,
          };
        } catch (err) {
          monitoringError(network, services, err);
          throw err;
        }
      },
    },

    'network.payment-gateway-contract.deposit-signature-instant': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
        userId: { type: 'string' },
        transactionId: { type: 'string' },
        account: { type: 'string' },
        amount: { type: 'number' },
      } as HandlerParams<GetSQRPaymentGatewayDepositSignatureParams>,
      async handler(
        ctx: Context<GetSQRPaymentGatewayDepositSignatureParams>,
      ): Promise<GetSQRPaymentGatewaySignatureResponse> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const account = checkIfAddress(ctx?.params?.account);
          const { userId, transactionId, amount } = ctx?.params;
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { owner, getSqrPaymentGateway, getErc20Token } = context;

          let nonce = 0;
          let timestampNow = -1;
          let timestampLimit = UINT32_MAX;

          const decimals = await cacheMachine.call(
            () => getCacheContractSettingKey(network, contractAddress),
            async () => {
              const tokenAddress = await getSqrPaymentGateway(contractAddress).erc20Token();
              return getErc20Token(tokenAddress).decimals();
            },
          );

          const amountInWei = toWeiWithFixed(amount, decimals);

          const signature = await signMessageForPaymentGatewayDeposit(
            owner,
            userId,
            transactionId,
            account,
            amountInWei,
            nonce,
            timestampLimit,
          );

          const dateLimit = dayjs()
            .add(TIME_OUT + INDEXER_OFFSET, 'seconds')
            .toDate();

          services.changeStats(network, (stats) => ({ signatures: ++stats.signatures }));

          return {
            signature,
            amountInWei: String(amountInWei),

            nonce,
            timestampNow,
            timestampLimit,
            dateLimit,
          };
        } catch (err) {
          monitoringError(network, services, err);
          throw err;
        }
      },
    },

    'network.payment-gateway-contract.nonce': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
        userId: { type: 'string' },
      } as HandlerParams<GetSQRPaymentGatewayNonceParams>,
      async handler(ctx: Context<GetSQRPaymentGatewayNonceParams>): Promise<number> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const { userId } = ctx?.params;
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { getSqrPaymentGateway } = context;

          const sqrPaymentGateway = getSqrPaymentGateway(contractAddress);
          const nonceRaw = await sqrPaymentGateway.getDepositNonce(userId);
          return Number(nonceRaw);
        } catch (err) {
          monitoringError(network, services, err);
          throw err;
        }
      },
    },

    'network.pro-rata-contract.deposit-signature': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
        account: { type: 'string' },
        baseAmount: { type: 'number' },
        boost: { type: 'boolean' },
        boostExchangeRate: { type: 'number' },
        transactionId: { type: 'string' },
      } as HandlerParams<GetSQRpProRataDepositSignatureParams>,
      async handler(
        ctx: Context<GetSQRpProRataDepositSignatureParams>,
      ): Promise<GetSQRpProRataDepositSignatureResponse> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const network = checkIfNetwork(ctx?.params?.network);
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const account = checkIfAddress(ctx?.params?.account);
          const { baseAmount, transactionId, boost, boostExchangeRate } = ctx?.params;
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { owner, getErc20Token, getSqrpProRata } = context;

          let nonce = -1;
          let timestampNow = -1;
          let timestampLimit = -1;
          let dateLimit = new Date(1900, 1, 1);
          let decimals: BigNumberish = 18;

          const sqrpProRata = getSqrpProRata(contractAddress);

          if (CONSTANT_TIME_LIMIT) {
            nonce = Number(await sqrpProRata.getAccountDepositNonce(account));
            timestampLimit = UINT32_MAX;
          } else {
            const [block, _decimals, nonceRaw] = await Promise.all([
              cacheMachine.call(
                () => BLOCK_KEY,
                () => services.getProvider(network).getBlockByNumber(web3Constants.latest),
                CACHE_TIME_OUT,
              ),
              cacheMachine.call(
                () => getCacheContractSettingKey(network, contractAddress),
                async () => {
                  const tokenAddress = await getSqrpProRata(contractAddress).baseToken();
                  return getErc20Token(tokenAddress).decimals();
                },
              ),
              sqrpProRata.getAccountDepositNonce(account),
            ]);
            decimals = _decimals;
            nonce = Number(nonceRaw);
            timestampNow = block.timestamp;
            timestampLimit = timestampNow + TIME_OUT;
            dateLimit = dayjs()
              .add(TIME_OUT + INDEXER_OFFSET, 'seconds')
              .toDate();
          }

          const amountInWei = toWeiWithFixed(baseAmount, decimals);
          const boostExchangeRateInWei = toWei(boostExchangeRate);

          const signature = await signMessageForProRataDeposit(
            owner,
            account,
            amountInWei,
            boost,
            boostExchangeRateInWei,
            nonce,
            transactionId,
            timestampLimit,
          );

          services.changeStats(network, (stats) => ({ signatures: ++stats.signatures }));

          return {
            signature,
            baseAmountInWei: String(amountInWei),
            boostExchangeRateInWei: String(boostExchangeRateInWei),
            nonce,
            timestampNow,
            timestampLimit,
            dateLimit,
          };
        } catch (err) {
          monitoringError(network, services, err);
          throw err;
        }
      },
    },

    'network.pro-rata-contract.nonce': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
        account: { type: 'string' },
      } as HandlerParams<GetSQRpProRataNonceParams>,
      async handler(ctx: Context<GetSQRpProRataNonceParams>): Promise<number> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const account = checkIfAddress(ctx?.params?.account);
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { getSqrpProRata } = context;

          const sqrpProRata = getSqrpProRata(contractAddress);
          const nonceRaw = await sqrpProRata.getAccountDepositNonce(account);
          return Number(nonceRaw);
        } catch (err) {
          monitoringError(network, services, err);
          throw err;
        }
      },
    },

    'network.babt-contract.account-owns-token': {
      params: {
        account: { type: 'string' },
      } as HandlerParams<GetAccountParams>,
      async handler(ctx: Context<GetAccountParams>): Promise<boolean> {
        const network: DeployNetworkKey = 'bsc';
        try {
          const account = checkIfAddress(ctx?.params?.account);
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { getBABToken } = context;

          const babToken = getBABToken(BABT_ADDRESS);
          const balance = await babToken.balanceOf(account);
          return Boolean(balance);
        } catch (err) {
          monitoringError(network, services, err);
          throw err;
        }
      },
    },

    'network.erc20.balance': {
      params: {
        network: { type: 'string', optional: true, default: 'bsc' },
        contractAddress: { type: 'string' },
        account: { type: 'string' },
      } as HandlerParams<GetERC20BalanceParams>,
      cache: {
        ttl: 5 * 60,
      },
      async handler(ctx: Context<GetERC20BalanceParams>): Promise<number> {
        const network = checkIfNetwork(ctx?.params?.network);
        try {
          const account = checkIfAddress(ctx?.params?.account);
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { getErc20Token } = context;

          const erc20Token = getErc20Token(contractAddress);
          const [balance, decimals] = await Promise.all([
            erc20Token.balanceOf(account),
            erc20Token.decimals(),
          ]);
          return toNumberDecimals(balance, decimals);
        } catch (err) {
          monitoringError(network, services, err);
          throw err;
        }
      },
    },
  },
});

module.exports = handlerFunc;
