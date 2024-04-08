import { Provider, WorkerBaseConfig } from '~common-service';
import { SyncWorkerControllers } from './SyncEngine.types';

export interface MonitoringWorkerConfig extends WorkerBaseConfig {
  provider: Provider;
  workers: SyncWorkerControllers;
}

export interface MonitoringWorkerStats {
  uptime: string;
  tickId: number;
  indexerLag: number;
  chainBlockNumber: number;
  signatures: number;
  signaturesPerSec: number;
  startDate: Date;
}
