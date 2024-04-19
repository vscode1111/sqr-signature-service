import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { SQRSignature } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrSignatureContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  sqrSignatures: Record<string, SQRSignature>;
  contractTypeMap: ContractTypeMap;
}
