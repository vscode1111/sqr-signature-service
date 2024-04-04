import { Web3ConfigContract } from 'msq-moleculer-core';
import { DeployNetworkKey, config } from '~common-service';

export enum ContractList {
  SQRSignature = 'SQRSignature',
}

export const CONTRACTS: Record<ContractList, Record<DeployNetworkKey, Web3ConfigContract[]>> = {
  SQRSignature: config.web3.contracts,
};

export const SQR_SIGNATURE = {
  // address: CONTRACTS.SQRSignature.bsc[0].address,
  address: 'test',
  blockNumber: 41364055, //test-my2
  blockNumberMax: 40536829,
};
