import { checkVariable } from '~common';
import { BaseConfig } from '~common-service';

export function checkBaseConfig(config: BaseConfig) {
  checkVariable(config.web3.ownerPrivateKey, 'config.web3.ownerPrivateKey');
  checkVariable(config.web3.contracts, 'config.web3.contracts', true);
  checkVariable(config.web3.provider, 'config.web3.provider', true);
  checkVariable(config.web3.scheduler.enable, 'config.web3.scheduler.enable', true);
}
