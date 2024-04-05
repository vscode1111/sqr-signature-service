import { Context } from 'moleculer';
import { checkIfNumber, toDate, toWeiWithFixed } from '~common';
import {
  HandlerFunc,
  MissingServicePrivateKey,
  checkIfNetwork,
  commonHandlers,
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
  GetSignatureWithdrawResponse,
  HandlerParams,
} from '~types';
import { getContractData, signMessageForDeposit } from '~utils';

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
      ): Promise<GetSignatureWithdrawResponse> {
        const network = checkIfNetwork(ctx?.params?.network);
        // const timeOut = TIME_OUT;
        const { userId, transactionId, account, amount } = ctx?.params;
        const context = services.getNetworkContext(network);
        if (!context) {
          throw new MissingServicePrivateKey();
        }

        const { owner } = context;
        const { sqrDecimals } = getChainConfig(network);
        const amountInWei = toWeiWithFixed(amount, sqrDecimals);

        let timestampNow = 0;
        let timestampLimit = 2147483647;

        // if (ACCOUNT_TIME_BLOCKER) {
        //   const [block, claimDelay] = await Promise.all([
        //     services.getProvider(network).getBlockByNumber(web3Constants.latest),
        //     sqrClaim.claimDelay(),
        //   ]);
        //   timestampNow = block.timestamp;
        //   timestampLimit = timestampNow + timeOut;

        //   const fundItemStatus = await getFundItemStatus(
        //     account,
        //     sqrClaim,
        //     sqrDecimals,
        //     timestampNow,
        //     Number(claimDelay),
        //   );

        //   if (!fundItemStatus.permitted) {
        //     const result: GetSignatureClaimResponse = {
        //       error: 'ACCOUNT_TIME_BLOCKER_NOT_PASSED',
        //       ...fundItemStatus,
        //     };
        //     return result;
        //   }
        // } else {
        //   const [block] = await Promise.all([
        //     services.getProvider(network).getBlockByNumber(web3Constants.latest),
        //   ]);
        //   timestampNow = block.timestamp;
        //   timestampLimit = timestampNow + timeOut;
        // }

        const nonce = 0;

        let result: GetSignatureWithdrawResponse = {} as any;
        for (let i = 0; i < 1; i++) {
          const signature = await signMessageForDeposit(
            owner,
            userId,
            transactionId,
            account,
            amountInWei,
            nonce,
            timestampLimit,
          );
          result = {
            signature,
            amountInWei: String(amountInWei),
            timestampNow,
            timestampLimit,
          };
        }
        return result;
      },
    },
  },
});

module.exports = handlerFunc;
