// import { broker } from '~index';

const isRunScript = process.env.RUN_SCRIPT || false;

export function logInfo(...msg: any[]) {
  // const date = dayjs().format("YYYY-MM-DD HH:mm:ss");
  // console.log(`[${date}]`, ...msg);

  if (isRunScript) {
    return;
  }

  const { broker } = require('../index');
  broker?.logger.info(...msg);
}

export function logConsoleInfo(...msg: any[]) {
  logInfo(...msg);
  console.log(...msg);
}

export function logError(...msg: any[]) {
  if (isRunScript) {
    return;
  }

  const { broker } = require('../index');
  broker?.logger.error(...msg);
}

export function logConsoleError(...msg: any[]) {
  logError(...msg);
  console.error(...msg);
}
