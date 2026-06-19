import { GraphQLError } from 'graphql';

const MAX_DEPTH = 6;

/**
 * Custom validation rule that limits GraphQL query depth.
 * Prevents deeply nested queries from hammering the database.
 */
export function depthLimitRule(
  maxDepth: number = MAX_DEPTH,
): (ctx: any) => any {
  return function depthLimitValidationRule(context: any) {
    return {
      Field(node: any) {
        // We track depth in a simpler way: reject queries
        // whose selection nesting exceeds the limit.
        // This is checked once at validation time per query.
      },
      OperationDefinition(node: any) {
        const depth = getQueryDepth(node);
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(
              `Query depth ${depth} exceeds maximum allowed depth of ${maxDepth}`,
              { nodes: [node] },
            ),
          );
        }
      },
    };
  };
}

function getQueryDepth(node: any): number {
  if (!node.selectionSet) return 0;
  let maxDepth = 0;
  for (const selection of node.selectionSet.selections) {
    const depth = 1 + getFieldDepth(selection);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}

function getFieldDepth(selection: any): number {
  if (!selection.selectionSet) return 0;
  let maxDepth = 0;
  for (const subSelection of selection.selectionSet.selections) {
    const depth = 1 + getFieldDepth(subSelection);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}
