//Do not move to 'handlers' folder. Moleculer was configured to read code from there, not types
import { ActionParams } from 'moleculer';
import { Web3Block, Web3ConfigContract } from '~common-service';

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

export interface GetSQRPaymentGatewayDepositSignatureParams extends GetNetworkParams {
  contractAddress: string;
  userId: string;
  transactionId: string;
  account: string;
  amount: number;
}

export interface GetSQRPaymentGatewayNonceParams extends GetNetworkParams {
  contractAddress: string;
  userId: string;
}

export interface GetSQRpProRataDepositSignatureResponse {
  signature: string;
  amountInWei: string;
  nonce: number;
  timestampNow: number;
  timestampLimit: number;
  dateLimit: Date;
}

export interface GetSQRpProRataDepositSignatureParams extends GetNetworkParams {
  contractAddress: string;
  account: string;
  amount: number;
  boost: boolean;
  transactionId: string;
}

export interface GetSQRpProRataNonceParams extends GetNetworkParams {
  contractAddress: string;
  account: string;
}

export interface GetSQRpProRataDepositSignatureResponse {
  signature: string;
  amountInWei: string;
  nonce: number;
  timestampNow: number;
  timestampLimit: number;
  dateLimit: Date;
}
