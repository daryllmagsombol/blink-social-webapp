import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { join } from 'path';
import { MessagesResolver } from './resolvers/messages.resolver';
import { MessagesModule } from '../messages/messages.module';
import { PubSubModule } from './providers/pubsub.module';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, PubSubModule, JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          secret: config.getOrThrow<string>('JWT_SECRET'),
        }),
      })],
      inject: [ConfigService, JwtService],
      useFactory: (config: ConfigService, jwt: JwtService) => ({
        autoSchemaFile: join(process.cwd(), 'apps/server/src/graphql/generated/schema.gql'),
        sortSchema: true,
        introspection: config.get('NODE_ENV') !== 'production',
        context: ({ req, extra }: { req?: any; extra?: any }) => {
          // For subscriptions, extra.request is the upgraded request
          if (extra?.request) {
            // We set req.user in the onConnect handler
            return { req: extra.request };
          }
          return { req };
        },
        subscriptions: {
          'graphql-ws': {
            onConnect: async (context: any) => {
              const token = context.connectionParams?.token;
              if (!token) throw new Error('Missing token');

              try {
                const payload = await jwt.verifyAsync(token, {
                  secret: config.getOrThrow<string>('JWT_SECRET'),
                });
                // Attach user to the extra request for the guard
                (context.extra as any).request = {
                  user: { id: payload.sub, ...payload },
                };
              } catch {
                throw new Error('Invalid token');
              }
            },
          },
        },
      }),
    }),
    PubSubModule,
    MessagesModule,
  ],
  providers: [MessagesResolver],
})
export class GraphqlModule {}
