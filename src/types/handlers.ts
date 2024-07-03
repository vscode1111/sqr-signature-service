//Do not move to 'handlers' folder. Moleculer was configured to read code from there, not types
import { ActionParams } from 'moleculer';
import { Web3Block, Web3ConfigContract, Web3ReceiptStatus } from '~common-service';

export type StatusType = 'missing' | 'exists';

export type HandlerParams<T> = Record<keyof T, ActionParams>;

export interface GetNetworkParams {
  network: string;
}

export interface GetAccountParams {
  account: string;
}

export interface GetNetworkAddressesParams extends GetNetworkParams {}

export type GetNetworkAddressesResponse = Web3ConfigContract[];

export interface GetBlockParams extends GetNetworkParams {
  id: string;
}

export interface GetBlockResponse extends Web3Block {
  timestampDate: Date;
}

export interface GetTxParams extends GetNetworkParams {
  tx: string;
}

export interface GetTxResponse {
  tx: string;
  from: string;
  to: string;
  timestamp: Date;
  status: Web3ReceiptStatus;
  extra?: Record<string, any> | void;
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

export interface GetSQRPaymentGatewaySignatureResponse {
  signature: string;
  baseAmountInWei: string;
  nonce: number;
  timestampNow: number;
  timestampLimit: number;
  dateLimit: Date;
}

export interface GetSQRpProRataDepositSignatureParams extends GetNetworkParams {
  contractAddress: string;
  account: string;
  baseAmount: number;
  boost: boolean;
  boostExchangeRate: number;
  transactionId: string;
}

export interface GetSQRpProRataNonceParams extends GetNetworkParams {
  contractAddress: string;
  account: string;
}

export interface GetSQRpProRataDepositSignatureResponse {
  signature: string;
  baseAmountInWei: string;
  boostExchangeRateInWei: string;
  nonce: number;
  timestampNow: number;
  timestampLimit: number;
  dateLimit: Date;
}
