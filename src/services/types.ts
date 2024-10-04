import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { BABToken, ERC20Token, WEB3PaymentGateway, WEB3ProRata } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface Web3SignatureContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getErc20Token: (address: string) => ERC20Token;
  getBABToken: (address: string) => BABToken;
  getWeb3PaymentGateway: (address: string) => WEB3PaymentGateway;
  getWeb3pProRata: (address: string) => WEB3ProRata;
}
