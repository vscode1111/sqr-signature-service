import { JsonRpcProvider } from 'ethers';
import { SQRSignature } from '~typechain-types';

export interface SqrSignatureContext {
  rawProvider: JsonRpcProvider;
  sqrSignatures: Record<string, SQRSignature>;
}
