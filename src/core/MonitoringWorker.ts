import { calculateDiffSecFromNow, secondsToDhms } from '~common';
import { Provider, WorkerBase } from '~common-service';
import { MonitoringWorkerConfig, MonitoringWorkerStats } from './MonitoringWorker.types';

export class MonitoringWorker extends WorkerBase<MonitoringWorkerStats | null> {
  public statsData!: MonitoringWorkerStats;
  private provider: Provider;

  private startDate: Date;

  constructor({ broker, network, workerName, tickDivider, provider }: MonitoringWorkerConfig) {
    super(broker, network, workerName, tickDivider);

    this.provider = provider;
    this.startDate = new Date();
    this.reset();
  }

  async start(): Promise<void> {}

  public async work(tickId: number) {
    this.statsData.startDate = this.startDate;
    this.statsData.uptime = secondsToDhms(calculateDiffSecFromNow(this.startDate));
    this.statsData.tickId = tickId;
  }

  async getStats(): Promise<MonitoringWorkerStats | null> {
    const chainBlockNumber = await this.provider.getBlockNumber();

    return { ...this.statsData, chainBlockNumber };
  }

  reset() {
    this.statsData = {
      uptime: '',
      tickId: 0,
      indexerLag: 0,
      chainBlockNumber: 0,
      providerRequestsPerSec: 0,
      startDate: this.startDate,
    };
  }
}
