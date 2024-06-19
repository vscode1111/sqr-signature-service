import { Interface } from 'ethers';
import { decodeInput, getFunction } from '~common';
import { CacheMachine } from '~common-service';
import { BscScanApi } from '~services/bscScan';
import { getCacheContractAbiKey } from './misc';

export async function decodeFunctionParams(
  network: string,
  contractAddress: string,
  input: string,
  cacheMachine: CacheMachine,
  timeOut: number,
) {
  const abi = await cacheMachine.call(
    () => getCacheContractAbiKey(network, contractAddress),
    async () => {
      return BscScanApi.fetchAbi(contractAddress);
    },
    timeOut,
  );

  if (!abi) {
    return;
  }

  const abiInterface = new Interface(abi);
  const abiFunction = getFunction(input, abiInterface);
  const method = abiFunction?.name;
  const inputs = abiFunction?.inputs;
  const args: Record<string, string> = decodeInput(input, abiInterface);
  const params: Record<string, string> = {};

  inputs?.forEach((input, index) => {
    params[input.name] = args[index];
  });

  return {
    method,
    params,
  };
}
