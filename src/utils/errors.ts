import { parseError, parseStack } from '~common';
import { DeployNetworkKey } from '~common-service';
import { Services } from '~services';

export function monitoringError(network: DeployNetworkKey, services: Services, err: unknown) {
  services.changeStats(network, (stats) => ({
    errorCount: ++stats.errorCount,
    lastError: parseError(err),
    lastErrorStack: parseStack(err),
    lastErrorDate: new Date(),
  }));
}
