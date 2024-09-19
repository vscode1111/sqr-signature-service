import { Started, Stopped } from '~common';
import { DataStorageBase } from '~common-service';

export class DataStorage extends DataStorageBase implements Started, Stopped {}
