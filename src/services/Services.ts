import { ServiceBroker } from 'moleculer';
import { Initilized, Started, Stopped } from '~common';
import {
  DeployNetworkKey,
  JsonRpcProvider,
  NetworkObject,
  Provider,
  ServicesBase,
  config,
  networkObjectFactory,
} from '~common-service';
import { getSqrSignatureContext } from '~contracts';
import { MultiSyncEngine, StatsCallback } from '~core';
import { SqrSignatureContext } from './types';

export class Services extends ServicesBase implements Initilized, Started, Stopped {
  private started: boolean;
  private providers: NetworkObject<Provider>;
  private sqrSignatureContexts: NetworkObject<SqrSignatureContext> | null;

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
      getSqrSignatureContext(network, config.web3.ownerPrivateKey!),
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

  changeStats(network: DeployNetworkKey, callback: StatsCallback) {
    this.multiSyncEngine.changeStats(network, callback);
  }
}
