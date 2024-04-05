import { ServiceBroker } from 'moleculer';
import { NetworkObject, Provider } from '~common-service';

export interface SyncEngineConfigBase {
  broker: ServiceBroker;
  providers: NetworkObject<Provider>;
}
