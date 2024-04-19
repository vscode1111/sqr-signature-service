import { ethers } from 'ethers';
import {
  DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  DeployNetworkKey,
  config,
  objectFactory,
} from '~common-service';
import { ContractType } from '~db';
import { ContractTypeMap, SqrSignatureContext } from '~services';
import { SQRSignature__factory } from '~typechain-types';
import { getContractData } from '~utils';

export function getSqrSignatureContext(
  network: DeployNetworkKey,
  privateKey: string,
): SqrSignatureContext {
  //https://habr.com/ru/articles/808111/
  // const rpcUrl = config.web3.provider[network].http;
  // const req = new ethers.FetchRequest(rpcUrl);

  // req.timeout = 10;
  // req.setThrottleParams({
  //   maxAttempts: 1,
  // });

  const rawProvider = new ethers.JsonRpcProvider(
    config.web3.provider[network].http,
    // req,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );
  const { sqrSignatureData } = getContractData(network);
  const owner = new ethers.Wallet(privateKey, rawProvider);

  const contractTypeMap: ContractTypeMap = {} as ContractTypeMap;

  const sqrSignatures = objectFactory(
    sqrSignatureData,
    (contractData) => {
      const { address } = contractData;

      const type: ContractType = contractData.type as ContractType;
      if (type) {
        if (!contractTypeMap[type]) {
          contractTypeMap[type] = [];
        }
        contractTypeMap[type].push(address);
      }

      return SQRSignature__factory.connect(address, owner);
    },
    (object) => object.address,
  );

  console.log(222, contractTypeMap);

  return {
    owner,
    rawProvider,
    sqrSignatures,
    contractTypeMap,
  };
}
