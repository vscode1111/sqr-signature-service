import dayjs from 'dayjs';
import { BigNumberish } from 'ethers';
import { Context } from 'moleculer';
import {
  DAYS,
  MINUTES,
  checkIfAddress,
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
  GetERC20BalanceParams,
  GetNetworkParams,
  GetWEB3PaymentGatewayDepositSignatureParams,
  GetWEB3PaymentGatewayNonceParams,
  GetWEB3PaymentGatewaySignatureResponse,
  GetWEB3ProRataDepositSignatureParams,
  GetWEB3ProRataDepositSignatureResponse,
  GetWEB3ProRataNonceParams,
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
      } as HandlerParams<GetWEB3PaymentGatewayDepositSignatureParams>,
      async handler(
        ctx: Context<GetWEB3PaymentGatewayDepositSignatureParams>,
      ): Promise<GetWEB3PaymentGatewaySignatureResponse> {
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

          const { owner, getErc20Token, getWeb3PaymentGateway } = context;

          let nonce = -1;
          let timestampNow = -1;
          let timestampLimit = -1;
          let dateLimit = new Date(1900, 1, 1);
          let decimals: BigNumberish = 18;

          const web3PaymentGateway = getWeb3PaymentGateway(contractAddress);

          if (CONSTANT_TIME_LIMIT) {
            nonce = Number(await web3PaymentGateway.getDepositNonce(userId));
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
                  const tokenAddress = await getWeb3PaymentGateway(contractAddress).erc20Token();
                  return getErc20Token(tokenAddress).decimals();
                },
              ),
              web3PaymentGateway.getDepositNonce(userId),
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
      } as HandlerParams<GetWEB3PaymentGatewayDepositSignatureParams>,
      async handler(
        ctx: Context<GetWEB3PaymentGatewayDepositSignatureParams>,
      ): Promise<GetWEB3PaymentGatewaySignatureResponse> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const account = checkIfAddress(ctx?.params?.account);
          const { userId, transactionId, amount } = ctx?.params;
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { owner, getWeb3PaymentGateway, getErc20Token } = context;

          let nonce = 0;
          let timestampNow = -1;
          let timestampLimit = UINT32_MAX;

          const decimals = await cacheMachine.call(
            () => getCacheContractSettingKey(network, contractAddress),
            async () => {
              const tokenAddress = await getWeb3PaymentGateway(contractAddress).erc20Token();
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
      } as HandlerParams<GetWEB3PaymentGatewayNonceParams>,
      async handler(ctx: Context<GetWEB3PaymentGatewayNonceParams>): Promise<number> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const { userId } = ctx?.params;
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { getWeb3PaymentGateway } = context;

          const web3PaymentGateway = getWeb3PaymentGateway(contractAddress);
          const nonceRaw = await web3PaymentGateway.getDepositNonce(userId);
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
      } as HandlerParams<GetWEB3ProRataDepositSignatureParams>,
      async handler(
        ctx: Context<GetWEB3ProRataDepositSignatureParams>,
      ): Promise<GetWEB3ProRataDepositSignatureResponse> {
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

          const { owner, getErc20Token, getWeb3pProRata } = context;

          let nonce = -1;
          let timestampNow = -1;
          let timestampLimit = -1;
          let dateLimit = new Date(1900, 1, 1);
          let decimals: BigNumberish = 18;

          const web3ProRata = getWeb3pProRata(contractAddress);

          if (CONSTANT_TIME_LIMIT) {
            nonce = Number(await web3ProRata.getAccountDepositNonce(account));
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
                  const tokenAddress = await getWeb3pProRata(contractAddress).baseToken();
                  return getErc20Token(tokenAddress).decimals();
                },
              ),
              web3ProRata.getAccountDepositNonce(account),
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
      } as HandlerParams<GetWEB3ProRataNonceParams>,
      async handler(ctx: Context<GetWEB3ProRataNonceParams>): Promise<number> {
        const network = checkIfNetwork(ctx?.params?.network);

        try {
          const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
          const account = checkIfAddress(ctx?.params?.account);
          const context = services.getNetworkContext(network);
          if (!context) {
            throw new MissingServicePrivateKey();
          }

          const { getWeb3pProRata } = context;

          const web3ProRata = getWeb3pProRata(contractAddress);
          const nonceRaw = await web3ProRata.getAccountDepositNonce(account);
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
