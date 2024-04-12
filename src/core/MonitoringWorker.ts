import { SpeedCounter, calculateDiffSecFromNow, secondsToDhms } from '~common';
import { Provider, WorkerBase } from '~common-service';
import {
  MonitoringWorkerConfig,
  MonitoringWorkerStats,
  StatsCallback,
} from './MonitoringWorker.types';

export class MonitoringWorker extends WorkerBase<MonitoringWorkerStats | null> {
  public statsData!: MonitoringWorkerStats;
  private provider: Provider;

  private startDate: Date;

  private signatureCounter: SpeedCounter;

  constructor({ broker, network, workerName, tickDivider, provider }: MonitoringWorkerConfig) {
    super(broker, network, workerName, tickDivider);

    this.provider = provider;
    this.startDate = new Date();

    this.signatureCounter = new SpeedCounter();

    this.reset();
  }

  async start(): Promise<void> {}

  public async work(tickId: number) {
    this.statsData.startDate = this.startDate;
    this.statsData.uptime = secondsToDhms(calculateDiffSecFromNow(this.startDate));
    this.statsData.tickId = tickId;

    this.signatureCounter.store(this.statsData.signatures);
    this.statsData.signaturesPerSec = Math.round(this.signatureCounter.stats().speed);
  }

  async getStats(): Promise<MonitoringWorkerStats | null> {
    const chainBlockNumber = await this.provider.getBlockNumber();

    return { ...this.statsData, chainBlockNumber };
  }

  changeStats(callback: StatsCallback) {
    const partialStats = callback(this.statsData);
    this.statsData = { ...this.statsData, ...partialStats };
  }

  reset() {
    this.statsData = {
      uptime: '',
      tickId: 0,
      indexerLag: 0,
      chainBlockNumber: 0,
      signatures: 0,
      signaturesPerSec: 0,
      signatureErrors: 0,
      startDate: this.startDate,
    };
  }
}
