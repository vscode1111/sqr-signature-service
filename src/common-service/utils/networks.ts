import { Promisable } from '~common';
import { DeployNetworkKey } from '../types';

export const deployNetworks: Array<DeployNetworkKey> = ['bsc'];

export function objectFactory<K extends string, T>(array: K[], fn: (key: K) => T) {
  let result: Record<K, T> = {} as any;

  for (const item of array) {
    result[item] = fn(item as K);
  }

  return result;
}

export function networkFactory<T>(fn: (network: DeployNetworkKey) => T) {
  return objectFactory(deployNetworks, fn);
}

export async function processNetworkObject<T>(
  object: Record<DeployNetworkKey, T>,
  fn: (network: DeployNetworkKey) => Promisable<any>,
  sync = true,
) {
  for (const key of Object.keys(object)) {
    sync ? await fn(key as DeployNetworkKey) : fn(key as DeployNetworkKey);
  }
}
