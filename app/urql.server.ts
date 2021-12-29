import { createClient } from '@urql/core';
import { executeExchange } from '@urql/exchange-execute';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

import { schema } from '~/graphql.server';
export * from '~/queries';

function getClient<User>(user?: User) {
  return createClient({
    // We don't actually use the `url` here but executing queries
    // on the local schema thanks to `executeExchange`. But `url` argument
    // is required by `createClient` even when no network is involved.
    url: '/graphql',
    exchanges: [executeExchange({ schema, context: { user } })],
  });
}

export async function query<QueryResult, Variables, User>(
  document: TypedDocumentNode<QueryResult, Variables>,
  variables?: Variables,
  user?: User
): Promise<QueryResult> {
  const { data, error } = await getClient(user)
    .query(document, variables as unknown as object)
    .toPromise();

  if (data && !error) {
    return data;
  }
  throw error;
}

export async function mutation<MutationResult, Input, User>(
  document: TypedDocumentNode<MutationResult, { input: Input }>,
  input: Input,
  user?: User
): Promise<MutationResult> {
  const { data, error } = await getClient(user)
    .mutation(document, { input })
    .toPromise();

  if (data && !error) {
    return data;
  }
  throw error;
}
