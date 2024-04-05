import { ethers } from 'ethers';
import {
  DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  DeployNetworkKey,
  config,
  objectFactory,
} from '~common-service';
import { SqrSignatureContext } from '~services';
import { SQRSignature__factory } from '~typechain-types';
import { getContractData } from '~utils';

export function getSqrSignatureContext(
  network: DeployNetworkKey,
  privateKey: string,
): SqrSignatureContext {
  const rawProvider = new ethers.JsonRpcProvider(
    config.web3.provider[network].http,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );
  const { sqrSignatureData } = getContractData(network);
  const addresses = sqrSignatureData.map((i) => i.address);
  const owner = new ethers.Wallet(privateKey, rawProvider);
  const sqrSignatures = objectFactory(addresses, (address) =>
    SQRSignature__factory.connect(address, owner),
  );

  return {
    owner,
    rawProvider,
    sqrSignatures,
  };
}
