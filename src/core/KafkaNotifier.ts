import { channels } from 'msq-moleculer-core';
import { EventNotifier, logInfo } from '~common';
import { broker } from '~index';

const { sendToChannel } = channels;

export class KafkaNotifier<T> implements EventNotifier<T> {
  constructor(
    private topic: string,
    private enable = true,
  ) {}

  async send(event: T): Promise<void> {
    if (!this.enable) {
      return;
    }

    await sendToChannel(broker, this.topic, event as any, true);

    logInfo(`KafkaNotifier topic: ${this.topic}, payload: ${JSON.stringify(event)}`);
  }
}
