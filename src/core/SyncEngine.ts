import { SyncEngineBase } from '~common-service';
import { MonitoringWorker } from './MonitoringWorker';
import { StatsCallback } from './MonitoringWorker.types';
import { SyncEngineConfig, SyncWorkerControllers } from './SyncEngine.types';

export class SyncEngine extends SyncEngineBase {
  constructor({ broker, network, provider }: SyncEngineConfig) {
    super();

    this.workers = {
      monitoring: null,
    };

    const monitoring = new MonitoringWorker({
      broker,
      network,
      workerName: 'MonitoringWorker',
      tickDivider: 1,
      provider,
      workers: this.workers as any,
    });

    this.workers.monitoring = monitoring;
  }

  changeStats(callback: StatsCallback) {
    (this.workers as any as SyncWorkerControllers).monitoring?.changeStats(callback);
  }
}
