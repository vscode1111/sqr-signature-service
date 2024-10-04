import { ServiceBroker } from 'moleculer';
import { Initialized, Started, Stopped } from '~common';
import {
  DeployNetworkKey,
  JsonRpcProvider,
  NetworkObject,
  Provider,
  SecurityBlocker,
  ServicesBase,
  config,
  networkObjectFactory,
} from '~common-service';
import { getWeb3SignatureContext } from '~contracts';
import { MultiSyncEngine, StatsCallback } from '~core';
import { DataStorage } from '~db';
import { Web3SignatureContext } from './types';

export class Services extends ServicesBase implements Initialized, Started, Stopped {
  private started: boolean;
  private providers: NetworkObject<Provider>;
  private web3SignatureContexts: NetworkObject<Web3SignatureContext> | null;

  public multiSyncEngine: MultiSyncEngine;
  public dataStorage!: DataStorage;
  public securityBlocker!: SecurityBlocker;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.started = false;

    this.providers = networkObjectFactory(
      (network) =>
        new JsonRpcProvider(
          config.web3.provider[network].http as string,
          config.web3.provider[network].wss as string,
        ),
    );

    this.web3SignatureContexts = null;

    this.multiSyncEngine = new MultiSyncEngine({
      broker,
      providers: this.providers,
    });
  }

  async init() {
    this.web3SignatureContexts = networkObjectFactory((network) =>
      getWeb3SignatureContext(network, config.web3.ownerPrivateKey!),
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
    return this.web3SignatureContexts?.[network];
  }

  changeStats(network: DeployNetworkKey, callback: StatsCallback) {
    this.multiSyncEngine.changeStats(network, callback);
  }
}
