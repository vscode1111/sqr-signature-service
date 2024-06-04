import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { ERC20Token, SQRPaymentGateway, SQRpProRata } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrSignatureContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getErc20Token: (address: string) => ERC20Token;
  getSqrPaymentGateway: (address: string) => SQRPaymentGateway;
  getSqrpProRata: (address: string) => SQRpProRata;
}
