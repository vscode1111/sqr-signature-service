import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { BABToken, ERC20Token, SQRPaymentGateway, SQRpProRata } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrSignatureContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getErc20Token: (address: string) => ERC20Token;
  getBABToken: (address: string) => BABToken;
  getSqrPaymentGateway: (address: string) => SQRPaymentGateway;
  getSqrpProRata: (address: string) => SQRpProRata;
}
