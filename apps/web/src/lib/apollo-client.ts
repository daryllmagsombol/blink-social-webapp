'use client';

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient, Client as WsClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WS_URL = API_URL.replace(/^http/, 'ws');

function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null };
  return {
    accessToken: localStorage.getItem('accessToken'),
  };
}

// Hold a module-level reference to the WS client so we can close it on logout
let wsClient: WsClient | null = null;

function createApolloClient() {
  // Auth link — attaches token to HTTP requests
  const authLink = setContext((_, { headers }) => {
    const { accessToken } = getTokens();
    return {
      headers: {
        ...headers,
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      },
    };
  });

  // Error link — handles 401 and other errors
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        console.error('[GraphQL Error]', err.message);
      }
    }
    if (networkError) {
      console.error('[Network Error]', networkError.message);
    }
  });

  // HTTP link for queries and mutations
  const httpLink = new HttpLink({
    uri: `${API_URL}/api/graphql`,
  });

  const httpLinkWithAuth = errorLink.concat(authLink.concat(httpLink));

  // WebSocket link for subscriptions (browser only)
  let wsLink: GraphQLWsLink | null = null;
  if (typeof window !== 'undefined') {
    wsClient = createClient({
      url: `${WS_URL}/api/graphql`,
      connectionParams: () => {
        const { accessToken } = getTokens();
        return { token: accessToken };
      },
      shouldRetry: () => true,
      retryAttempts: 5,
      retryWait: (attempt) =>
        new Promise((resolve) =>
          setTimeout(resolve, Math.min(attempt * 1000, 5000)),
        ),
      on: {
        closed: () => {
          // If the token is gone (user logged out), don't reconnect
          const { accessToken } = getTokens();
          if (!accessToken) {
            wsClient = null;
          }
        },
      },
    });
    wsLink = new GraphQLWsLink(wsClient);
  }

  // Split link — use WebSocket for subscriptions, HTTP for everything else
  const splitLink =
    typeof window !== 'undefined' && wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            );
          },
          wsLink,
          httpLinkWithAuth,
        )
      : httpLinkWithAuth;

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            conversation: {
              keyArgs: ['userId'],
              // Server returns oldest-first. Page 1 = newest messages, Page 2 = older messages.
              // When fetchMore loads page 2, prepend older data before existing newer data.
              merge(existing = { data: [] }, incoming, { args }) {
                // If this is the initial fetch (page 1), replace
                if (!args?.page || args.page === 1) {
                  return incoming;
                }
                // For subsequent pages (older messages), prepend
                return {
                  ...incoming,
                  data: [...(incoming.data || []), ...(existing.data || [])],
                };
              },
            },
          },
        },
        ConversationType: {
          keyFields: ['id'],
        },
        MessageEventType: {
          keyFields: ['id'],
        },
        UserType: {
          keyFields: ['id'],
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
      query: {
        fetchPolicy: 'network-only',
      },
    },
  });
}

let apolloClient: ApolloClient<unknown> | null = null;

export function getApolloClient() {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
}

export function resetApolloClient() {
  // Close the WebSocket connection so it doesn't remain authenticated after logout
  if (wsClient) {
    wsClient.dispose();
    wsClient = null;
  }
  if (apolloClient) {
    apolloClient.clearStore().catch(() => {});
    apolloClient = null;
  }
}
