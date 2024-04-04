import { Started } from '~common';
import { MonitoringWorker } from './MonitoringWorker';
import { StatsData, SyncEngineConfig, SyncWorkerControllers } from './SyncEngine.types';

export class SyncEngine implements Started {
  private tickId: number;

  private workers: SyncWorkerControllers;

  constructor({ network, provider }: SyncEngineConfig) {
    this.tickId = 0;

    this.workers = {
      monitoring: null,
    };

    const monitoring = new MonitoringWorker({
      network,
      workerName: 'MonitoringWorker',
      tickDivider: 1,
      provider,
      workers: this.workers,
    });

    this.workers.monitoring = monitoring;
  }

  async start(): Promise<void> {
    for (const worker of Object.values(this.workers)) {
      await worker.start();
    }
  }

  reset() {
    for (const worker of Object.values(this.workers)) {
      worker.reset();
    }
  }

  public async sync() {
    for (const worker of Object.values(this.workers)) {
      worker?.execute(this.tickId);
    }
    this.tickId++;
  }

  async getStats(): Promise<StatsData> {
    const workersStats = {} as any;

    for (const [key, worker] of Object.entries(this.workers)) {
      workersStats[key] = await worker.getStats();
    }

    return workersStats;
  }
}
