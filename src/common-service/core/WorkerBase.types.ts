import { DeployNetworkKey } from '~common-service';

export interface WorkerBaseConfig {
  network: DeployNetworkKey;
  workerName: string;
  tickDivider?: number;
}

export type WorkerBaseStats = {
  executing: boolean;
  successCount: number;
  errorCount: number;
  executionTime: number;
  lastSuccessDate: Date;
  lastError?: string;
  lastErrorDate?: Date;
};
