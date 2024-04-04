import { NetworkObject, Provider } from '~common-service';

export interface SyncEngineConfigBase {
  providers: NetworkObject<Provider>;
}
