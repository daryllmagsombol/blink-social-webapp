export const GRAPHQL_EVENTS = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  MESSAGE_READ: 'MESSAGE_READ',
} as const;

export type GraphQLEvent = (typeof GRAPHQL_EVENTS)[keyof typeof GRAPHQL_EVENTS];
