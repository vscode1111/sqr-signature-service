export function getCacheContractSettingKey(networkName: string, contractAddress: string) {
  return `CONTRACT-SETTINGS-${networkName}-${contractAddress}`;
}

export function getCacheContractAbiKey(networkName: string, contractAddress: string) {
  return `CONTRACT-ABI-${networkName}-${contractAddress}`;
}
