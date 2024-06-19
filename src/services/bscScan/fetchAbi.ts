import axios from 'axios';
import { config } from '~common-service';
import { BscScanAbiResponse } from './fetchAbi.types';

export async function fetchAbi(contractAddress: string) {
  if (!config?.web3?.apiKey?.bscScan) {
    return null;
  }

  const abiResponse = await axios.get<BscScanAbiResponse>(
    `https://api.bscscan.com/api?module=contract&action=getabi&address=${contractAddress}&apikey=${config.web3.apiKey.bscScan}`,
  );

  return abiResponse.data.result;
}
