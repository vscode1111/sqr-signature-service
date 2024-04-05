import { Wallet } from 'ethers';
import { signEncodedMessage } from '~common';

export async function signMessageForDeposit(
  signer: Wallet,
  userId: string,
  transactionId: string,
  account: string,
  amount: bigint,
  nonce: number,
  timestampLimit: number,
) {
  return signEncodedMessage(
    signer,
    // userId,  transactionId, account, amount, nonce, timestampLimit
    ['string', 'string', 'address', 'uint256', 'uint32', 'uint32'],
    [userId, transactionId, account, amount, nonce, timestampLimit],
  );
}
