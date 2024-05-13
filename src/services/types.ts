import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { ERC20Token, SQRSignature } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrSignatureContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getSqrSignature: (address: string) => SQRSignature;
  getErc20Token: (address: string) => ERC20Token;
}
