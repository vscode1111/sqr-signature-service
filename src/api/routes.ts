import { ApiRouteSchema } from 'moleculer-web';
import { commonRoutes, getApiPrefix, modifyRoutes } from '~common-service';

const apiPrefix = getApiPrefix();

export const routes: ApiRouteSchema[] = modifyRoutes([
  ...commonRoutes,
  {
    path: '/:network',
    aliases: {
      'GET tx/:tx': `${apiPrefix}network.tx`,
      'POST payment-gateway-contract/nonce': `${apiPrefix}network.payment-gateway-contract.nonce`,
      'POST payment-gateway-contract/deposit-signature': `${apiPrefix}network.payment-gateway-contract.deposit-signature`,
      'POST payment-gateway-contract/deposit-signature-instant': `${apiPrefix}network.payment-gateway-contract.deposit-signature-instant`,
      'POST pro-rata-contract/nonce': `${apiPrefix}network.pro-rata-contract.nonce`,
      'POST pro-rata-contract/deposit-signature': `${apiPrefix}network.pro-rata-contract.deposit-signature`,
      'POST babt-contract/account-owns-token': `${apiPrefix}network.babt-contract.account-owns-token`,
    },
  },
]);
