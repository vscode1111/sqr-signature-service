import axios from 'axios';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { GetLaunchpadDepositSignatureParams, GetSignatureDepositResponse } from '~types';
import { runConcurrently } from './utils';

// const SRV_URL = 'http://127.0.0.1:3000';
const SRV_URL = 'https://sqr.main.dev.msq.local/signature/api';
// const SRV_URL = 'https://sqr.stage.msq.local/signature/api';
//0x4A6d75e590A2E511d6745d0a938A971c9B69B71C
//0x4a6d75e590a2e511d6745d0a938a971c9b69b71c

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getLaunchpadDepositSignature(): Promise<GetSignatureDepositResponse | null> {
  const userId = uuidv4();
  const transactionId = uuidv4();

  const requestBody: Omit<GetLaunchpadDepositSignatureParams, 'network'> = {
    // userId: 'tu1-f75c73b1-0f13-46ae-88f8-2048765c5ad4',
    // transactionId: 'b7ae3413-1ccb-42d0-9edf-86e9e6d6953t+06',
    contractType: 'fcfs',
    contractAddress: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852',
    userId,
    transactionId,
    account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
    amount: 1,
  };

  const response = await axios.post<GetSignatureDepositResponse>(
    `${SRV_URL}/bsc/launchpad/deposit-signature`,
    // `${SRV_URL}/bsc/launchpad/deposit-signature-instant`,
    requestBody,
    {
      httpsAgent,
    },
  );
  const { data } = response;

  return data;
}

describe('performance', () => {
  it('checking fetching signatures', async () => {
    console.log(`checking fetching signatures from ${SRV_URL}...`);

    await runConcurrently(
      async () => {
        await getLaunchpadDepositSignature();
      },
      1_000,
      100,
      100,
    );
  });
});
