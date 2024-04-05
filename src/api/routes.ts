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
      'POST transaction-items': `${apiPrefix}network.transaction-items.transaction-ids`,
      'POST launchpad/deposit-signature': `${apiPrefix}network.launchpad.deposit-signature`,
    },
  },
  {
    path: '/indexer',
    aliases: {
      'GET :network/stats': `${apiPrefix}indexer.network.stats`,
    },
  },
]);
