import { Interface } from 'ethers';
import { decodeInput, getFunction } from '~common';
import { BscScanApi } from '~services/bscScan';

export async function decodeFunctionParams(contractAddress: string, input: string) {
  const abi = await BscScanApi.fetchAbi(contractAddress);

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
