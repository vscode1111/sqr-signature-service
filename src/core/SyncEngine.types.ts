import { Provider, WorkerBaseConfig } from '~common-service';
import { MonitoringWorker } from './MonitoringWorker';

export interface SyncEngineConfig extends WorkerBaseConfig {
  provider: Provider;
}

export interface SyncWorkerControllers {
  monitoring: MonitoringWorker | null;
}
