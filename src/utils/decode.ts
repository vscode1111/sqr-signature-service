import { Interface } from 'ethers';
import { ApiError } from '~common';
import { decodeInput, getFunction } from '~common-back';
import { CacheMachine } from '~common-service';
import { BscScanApi } from '~services/bscScan';
import { getCacheContractAbiKey } from './misc';

const INVALID_API_KEY_MESSAGE = 'Invalid API Key';

export async function decodeFunctionParams(
  network: string,
  contractAddress: string,
  input: string,
  cacheMachine: CacheMachine,
  timeOut: number,
) {
  const abi = await cacheMachine.call(
    () => getCacheContractAbiKey(network, contractAddress),
    () => BscScanApi.fetchAbi(contractAddress),
    timeOut,
  );

  if (abi === INVALID_API_KEY_MESSAGE) {
    throw new ApiError(INVALID_API_KEY_MESSAGE, 404);
  }

  if (!abi) {
    throw new ApiError('ABI not recieved', 404);
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
