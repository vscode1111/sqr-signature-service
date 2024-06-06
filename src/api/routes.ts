import { ApiRouteSchema } from 'moleculer-web';
import { commonRoutes, getApiPrefix, modifyRoutes } from '~common-service';

const apiPrefix = getApiPrefix();

export const routes: ApiRouteSchema[] = modifyRoutes([
  ...commonRoutes,
  {
    path: '/:network',
    aliases: {
      'GET addresses': `${apiPrefix}network.addresses`,
      'GET blocks/:id': `${apiPrefix}network.blocks.id`,
      'POST sqr-payment-gateway-contract/nonce': `${apiPrefix}network.sqr-payment-gateway-contract.nonce`,
      'POST sqr-payment-gateway-contract/deposit-signature': `${apiPrefix}network.sqr-payment-gateway-contract.deposit-signature`,
      'POST sqr-payment-gateway-contract/deposit-signature-instant': `${apiPrefix}network.sqr-payment-gateway-contract.deposit-signature-instant`,
      'POST sqr-p-pro-rata-contract/nonce': `${apiPrefix}network.sqr-p-pro-rata-contract.nonce`,
      'POST sqr-p-pro-rata-contract/deposit-signature': `${apiPrefix}network.sqr-p-pro-rata-contract.deposit-signature`,
    },
  },
  {
    path: '/indexer',
    aliases: {
      'GET :network/stats': `${apiPrefix}indexer.network.stats`,
    },
  },
]);
