import { Interface } from 'ethers';
import { ApiError, decodeInput, getFunction } from '~common';
import { BscScanApi } from '~services/bscScan';

const INVALID_API_KEY_MESSAGE = 'Invalid API Key';

export async function decodeFunctionParams(contractAddress: string, input: string) {
  const abi = await BscScanApi.fetchAbi(contractAddress);

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
