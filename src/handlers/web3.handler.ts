import { Context } from 'moleculer';
import { checkIfNumber, toDate, toWeiWithFixed } from '~common';
import {
  CacheMachine,
  HandlerFunc,
  MissingServicePrivateKey,
  UINT32_MAX,
  checkIfNetwork,
  commonHandlers,
  config,
  getChainConfig,
  web3Constants,
} from '~common-service';
import { StatsData } from '~core';
import { services } from '~index';
import {
  GetBlockParams,
  GetBlockResponse,
  GetLaunchpadDepositSignatureParams,
  GetNetworkAddressesResponse,
  GetNetworkParams,
  GetSignatureDepositResponse,
  HandlerParams,
} from '~types';
import { getContractData, signMessageForDeposit } from '~utils';

const TIME_OUT = 3600;
const CONSTANT_TIME_LIMIT = false;
const BLOCK_KEY = 'BLOCK_KEY';
const CACHE_TIME_OUT = 60_000;

const cacheMachine = new CacheMachine();

const handlerFunc: HandlerFunc = () => ({
  actions: {
    ...commonHandlers,

    'network.addresses': {
      params: {
        network: { type: 'string' },
      } as HandlerParams<GetNetworkParams>,
      async handler(ctx: Context<GetNetworkParams>): Promise<GetNetworkAddressesResponse> {
        ctx.broker.logger.info(`web3.handler: network.addresses`);

        const network = checkIfNetwork(ctx?.params?.network);
        const result = getContractData(network);
        return result.sqrSignatureData;
      },
    },

    'network.blocks.id': {
      params: {
        network: { type: 'string' },
        id: { type: 'string' },
      } as HandlerParams<GetBlockParams>,
      async handler(ctx: Context<GetBlockParams>): Promise<GetBlockResponse> {
        ctx.broker.logger.info(`web3.handler: network.blocks.id`);

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
      },
    },

    'indexer.network.stats': {
      params: {
        network: { type: 'string' },
      } as HandlerParams<GetNetworkParams>,
      async handler(ctx: Context<GetBlockParams>): Promise<StatsData> {
        ctx.broker.logger.info(`web3.handler: indexer.network.stats`);
        const network = checkIfNetwork(ctx.params.network);
        const [engineStats, servicesStats] = await Promise.all([
          services.multiSyncEngine.getStats(network),
          services.getStats(),
        ]);
        return { ...engineStats, ...servicesStats };
      },
    },

    'network.launchpad.deposit-signature': {
      params: {
        network: { type: 'string' },
        userId: { type: 'string' },
        transactionId: { type: 'string' },
        account: { type: 'string' },
        amount: { type: 'number' },
      } as HandlerParams<GetLaunchpadDepositSignatureParams>,
      async handler(
        ctx: Context<GetLaunchpadDepositSignatureParams>,
      ): Promise<GetSignatureDepositResponse> {
        const network = checkIfNetwork(ctx?.params?.network);
        const { userId, transactionId, account, amount } = ctx?.params;
        const context = services.getNetworkContext(network);
        if (!context) {
          throw new MissingServicePrivateKey();
        }

        const { owner, sqrSignatures } = context;
        const { sqrDecimals } = getChainConfig(network);
        const amountInWei = toWeiWithFixed(amount, sqrDecimals);

        let nonce = -1;
        let timestampNow = -1;
        let timestampLimit = -1;

        const contractAddress = config.web3.contracts[network][0].address;

        if (CONSTANT_TIME_LIMIT) {
          nonce = Number(await sqrSignatures[contractAddress].getDepositNonce(userId));
          timestampLimit = UINT32_MAX;
        } else {
          const [block, nonceRaw] = await Promise.all([
            cacheMachine.call(
              () => BLOCK_KEY,
              () => services.getProvider(network).getBlockByNumber(web3Constants.latest),
              CACHE_TIME_OUT,
            ),
            sqrSignatures[contractAddress].getDepositNonce(userId),
          ]);
          nonce = Number(nonceRaw);
          timestampNow = block.timestamp;
          timestampLimit = timestampNow + TIME_OUT;
        }

        const signature = await signMessageForDeposit(
          owner,
          userId,
          transactionId,
          account,
          amountInWei,
          nonce,
          timestampLimit,
        );

        services.incrementSignatures(network);

        return {
          signature,
          amountInWei: String(amountInWei),
          nonce,
          timestampNow,
          timestampLimit,
        };
      },
    },
  },
});

module.exports = handlerFunc;
