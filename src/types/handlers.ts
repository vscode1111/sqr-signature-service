//Do not move to 'handlers' folder. Moleculer was configured to read code from there, not types
import { ActionParams } from 'moleculer';
import { Web3Block, Web3ConfigContract } from '~common-service';
import { ContractType } from '~db';

export type StatusType = 'missing' | 'exists';

export type HandlerParams<T> = Record<keyof T, ActionParams>;

export interface GetNetworkParams {
  network: string;
}

export interface GetNetworkAddressesParams extends GetNetworkParams {}

export type GetNetworkAddressesResponse = Web3ConfigContract[];

export interface GetBlockParams extends GetNetworkParams {
  id: string;
}

export interface GetBlockResponse extends Web3Block {
  timestampDate: Date;
}

export interface GetLaunchpadDepositSignatureParams extends GetNetworkParams {
  contractType: ContractType;
  userId: string;
  transactionId: string;
  account: string;
  amount: number;
}

export interface GetSignatureDepositResponse {
  signature: string;
  // contractAddress?: string;
  amountInWei: string;
  nonce: number;
  timestampNow: number;
  timestampLimit: number;
  dateLimit: Date;
}

export interface GetTransactionItemsParams extends GetNetworkParams {
  transactionIds: string[];
}
