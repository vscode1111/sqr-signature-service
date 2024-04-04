import Moleculer from 'moleculer';
import 'tsconfig-paths/register';
import { routes } from '~api';
import { bootstrapService } from '~common-service';
import { App } from '~core';
import { Services } from '~services';

export let services: Services;
export let broker: Moleculer.ServiceBroker;

bootstrapService(routes, undefined, async () => {
  services = new Services();
  await services.init();
  const app = new App(services);
  await app.start();
  return services;
}).then(({ broker: brokerBoot }) => {
  broker = brokerBoot;
});
