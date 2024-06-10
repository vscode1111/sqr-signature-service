export function getCacheContractSettingKey(contractAddress: string) {
  return `CONTRACT-SETTINGS-${contractAddress}`;
}
