import { Initilized, Started, Stopped, parseError, parseStack } from '~common';
import {
  DeployNetworkKey,
  JsonRpcProvider,
  NetworkObject,
  Provider,
  ServicesBase,
  config,
  networkFactory,
} from '~common-service';
import { getSqrSignatureContext } from '~contracts';
import { KafkaNotifier, MultiSyncEngine } from '~core';
import { Web3BusEvent } from '~types';
import { SqrSignatureContext } from './types';

export class Services implements Initilized, Started, Stopped, ServicesBase {
  private started: boolean;
  private providers: NetworkObject<Provider>;
  private sqrSignatureContexts: NetworkObject<SqrSignatureContext> | null;

  private lastError: string | undefined;
  private lastErrorStack: string | undefined;
  private lastErrorDate: Date | undefined;
  private errorCount: number;

  public multiSyncEngine: MultiSyncEngine;
  public kafkaNotifier: KafkaNotifier<Web3BusEvent>;

  constructor() {
    this.started = false;
    this.lastErrorDate = undefined;
    this.errorCount = 0;

    this.providers = networkFactory(
      (network) =>
        new JsonRpcProvider(
          config.web3.provider[network].http as string,
          config.web3.provider[network].wss as string,
        ),
    );

    this.sqrSignatureContexts = null;

    this.kafkaNotifier = new KafkaNotifier(config.web3.kafka.outTopic);

    this.multiSyncEngine = new MultiSyncEngine({
      providers: this.providers,
    });
  }

  async init() {
    this.sqrSignatureContexts = networkFactory((network) => getSqrSignatureContext(network));
    await this.start();
  }

  async start() {
    await this.multiSyncEngine.start();
    this.started = true;
  }

  async stop() {
    this.started = false;
  }

  get isStarted() {
    return this.started;
  }

  getProvider(network: DeployNetworkKey) {
    return this.providers[network];
  }

  getNetworkContext(network: DeployNetworkKey) {
    return this.sqrSignatureContexts?.[network];
  }

  saveProcessError(error: any) {
    this.lastError = parseError(error);
    this.lastErrorStack = parseStack(error);
    this.lastErrorDate = new Date();
    this.errorCount++;
    return this.errorCount;
  }

  async getStats() {
    return {
      process: {
        lastError: this.lastError,
        lastErrorStack: this.lastErrorStack,
        lastErrorDate: this.lastErrorDate,
        errorCount: this.errorCount,
      },
    };
  }
}
