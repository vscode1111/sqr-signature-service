import axios from 'axios';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { GetLaunchpadDepositSignatureParams, GetSignatureDepositResponse } from '~types';
import { services } from '..';
import { waitUntil } from '../common';
import { runConcurrently } from './utils';

// const SRV_URL = 'http://127.0.0.1:3000';
const SRV_URL = 'https://sqr.main.dev.msq.local/signature/api';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getLaunchDepositSignature(): Promise<GetSignatureDepositResponse | null> {
  const userId = uuidv4();
  const transactionId = uuidv4();

  const requestBody: Omit<GetLaunchpadDepositSignatureParams, 'network'> = {
    // userId: 'tu1-f75c73b1-0f13-46ae-88f8-2048765c5ad4',
    // transactionId: 'b7ae3413-1ccb-42d0-9edf-86e9e6d6953t+06',
    userId,
    transactionId,
    account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
    amount: 1,
  };

  const response = await axios.post<GetSignatureDepositResponse>(
    `${SRV_URL}/bsc/launchpad/deposit-signature`,
    requestBody,
    {
      httpsAgent,
    },
  );
  const { data } = response;

  return data;
}

describe('performance', () => {
  beforeEach(async function () {
    if (!services?.isStarted) {
      await services?.start();
    }
    await waitUntil(() => services?.isStarted);
  });

  afterEach(async function () {
    await services?.stop();
  });

  it('check address', async () => {
    console.log('checking address...');

    await runConcurrently(
      async () => {
        await getLaunchDepositSignature();
      },
      10_000,
      100,
      100,
    );
  });
});
