import { DeployNetworkKey, Web3ConfigContract, config } from '~common-service';

export enum ContractList {
  WEB3Signature = 'WEB3Signature',
}

export const CONTRACTS: Record<ContractList, Record<DeployNetworkKey, Web3ConfigContract[]>> = {
  WEB3Signature: config.web3.contracts,
};

export const WEB3_SIGNATURE = {
  // address: CONTRACTS.WEB3Signature.bsc[0].address,
  address: 'test',
  blockNumber: 41364055, //test-my2
  blockNumberMax: 40536829,
};

export const BABT_ADDRESS = '0x2B09d47D550061f995A3b5C6F0Fd58005215D7c8';
