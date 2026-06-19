import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSubEngine } from 'graphql-subscriptions';
import Redis from 'ioredis';

@Injectable()
export class PubSubProvider {
  private pubSub: PubSubEngine;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');

    if (redisUrl) {
      const options = redisUrl.startsWith('redis://')
        ? redisUrl
        : { host: 'localhost', port: 6379 };

      this.pubSub = new RedisPubSub({
        publisher: new Redis(options as any),
        subscriber: new Redis(options as any),
      });
    } else {
      // In-memory fallback for local development
      this.pubSub = new PubSub();
    }
  }

  get instance(): PubSubEngine {
    return this.pubSub;
  }
}
