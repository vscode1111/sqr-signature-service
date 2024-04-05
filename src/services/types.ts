import { JsonRpcProvider, Wallet } from 'ethers';
import { SQRSignature } from '~typechain-types';

export interface SqrSignatureContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  sqrSignatures: Record<string, SQRSignature>;
}
