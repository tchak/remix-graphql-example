import { createClient } from '@urql/core';
import { executeExchange } from '@urql/exchange-execute';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

import { schema } from '~/graphql.server';
export * from '~/queries';

function getClient() {
  return createClient({
    url: '/graphql',
    exchanges: [executeExchange({ schema })],
  });
}

export async function query<QueryResult, Variables>(
  document: TypedDocumentNode<QueryResult, Variables>,
  variables?: Variables
): Promise<QueryResult> {
  const { data, error } = await getClient()
    .query(document, variables as unknown as object)
    .toPromise();

  if (data && !error) {
    return data;
  }
  throw error;
}

export async function mutation<MutationResult, Input>(
  document: TypedDocumentNode<MutationResult, { input: Input }>,
  input: Input
): Promise<MutationResult> {
  const { data, error } = await getClient()
    .mutation(document, { input })
    .toPromise();

  if (data && !error) {
    return data;
  }
  throw error;
}
