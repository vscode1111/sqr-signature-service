import { DeployNetworkKey } from '~common-service';
import { CONTRACTS } from '~constants';
import { ContractDataCollection } from '~types';

export function getContractData(network: DeployNetworkKey): ContractDataCollection {
  const sqrSignatureData = CONTRACTS.SQRSignature[network];
  return {
    sqrSignatureData,
  };
}
