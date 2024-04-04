import { Started, logInfo } from '~common';
import {
  DeployNetworkKey,
  NetworkObject,
  networkFactory,
  processNetworkObject,
} from '~common-service';
import { SyncEngineConfigBase } from './MultiSyncEngine.types';
import { SyncEngine } from './SyncEngine';
import { StatsData } from './SyncEngine.types';

export class MultiSyncEngine implements Started {
  private syncEngines: NetworkObject<SyncEngine>;

  constructor({ providers }: SyncEngineConfigBase) {
    this.syncEngines = networkFactory((network) => {
      return new SyncEngine({
        provider: providers[network],
        network,
        workerName: 'SyncEngine',
      });
    });
  }

  async start(): Promise<void> {
    logInfo(`MultiSyncEngine init`);
    await processNetworkObject(this.syncEngines, (network) => this.syncEngines[network].start());
    this.sync();
  }

  public async sync(network?: DeployNetworkKey) {
    network
      ? this.syncEngines[network].sync()
      : processNetworkObject(
          this.syncEngines,
          (network) => this.syncEngines[network].sync(),
          false,
        );
  }

  async hardReset(): Promise<void> {
    await processNetworkObject(this.syncEngines, (network) => this.syncEngines[network].reset());
    this.sync();
  }

  async softReset(): Promise<void> {
    await this.sync();
  }

  async getStats(network: DeployNetworkKey): Promise<StatsData> {
    return this.syncEngines[network].getStats();
  }
}
