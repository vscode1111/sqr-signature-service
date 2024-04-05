import { ServiceBroker } from 'moleculer';
import { Initilized, Started, Stopped, parseError, parseStack } from '~common';
import {
  DeployNetworkKey,
  JsonRpcProvider,
  NetworkObject,
  Provider,
  ServiceBrokerBase,
  ServicesBase,
  config,
  networkObjectFactory,
} from '~common-service';
import { getSqrSignatureContext } from '~contracts';
import { MultiSyncEngine } from '~core';
import { SqrSignatureContext } from './types';

export class Services
  extends ServiceBrokerBase
  implements Initilized, Started, Stopped, ServicesBase
{
  private started: boolean;
  private providers: NetworkObject<Provider>;
  private sqrSignatureContexts: NetworkObject<SqrSignatureContext> | null;

  private lastError: string | undefined;
  private lastErrorStack: string | undefined;
  private lastErrorDate: Date | undefined;
  private errorCount: number;

  public multiSyncEngine: MultiSyncEngine;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.started = false;
    this.lastErrorDate = undefined;
    this.errorCount = 0;

    this.providers = networkObjectFactory(
      (network) =>
        new JsonRpcProvider(
          config.web3.provider[network].http as string,
          config.web3.provider[network].wss as string,
        ),
    );

    this.sqrSignatureContexts = null;

    this.multiSyncEngine = new MultiSyncEngine({
      broker,
      providers: this.providers,
    });
  }

  async init() {
    this.sqrSignatureContexts = networkObjectFactory((network) =>
      getSqrSignatureContext(network, config.web3.ownerPrivateKey),
    );
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
