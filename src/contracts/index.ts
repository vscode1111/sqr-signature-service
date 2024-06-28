import { ethers } from 'ethers';
import { DEFAULT_JSON_RPC_PROVIDER_OPTIONS, DeployNetworkKey, config } from '~common-service';
import { SqrSignatureContext } from '~services';
import { BABToken__factory, ERC20Token__factory, SQRPaymentGateway__factory, SQRpProRata__factory } from '~typechain-types';

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
  const owner = new ethers.Wallet(privateKey, rawProvider);

  return {
    owner,
    rawProvider,
    getErc20Token: (address: string) => ERC20Token__factory.connect(address, owner),
    getBABToken: (address: string) => BABToken__factory.connect(address, owner),
    getSqrPaymentGateway: (address: string) => SQRPaymentGateway__factory.connect(address, owner),
    getSqrpProRata: (address: string) => SQRpProRata__factory.connect(address, owner),
  };
}
