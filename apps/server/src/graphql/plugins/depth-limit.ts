import { GraphQLError, type ValidationContext } from 'graphql';

const MAX_DEPTH = 6;

/**
 * Custom validation rule that limits GraphQL query depth.
 * Resolves fragment spreads via the ValidationContext. GraphQL's built-in
 * NoFragmentCycles validation handles cyclic fragment references.
 */
export function depthLimitRule(
  maxDepth: number = MAX_DEPTH,
): (ctx: ValidationContext) => any {
  return function depthLimitValidationRule(context: ValidationContext) {
    return {
      OperationDefinition(node: any) {
        const depth = getQueryDepth(node, context);
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

function getQueryDepth(node: any, context: ValidationContext): number {
  if (!node.selectionSet) return 0;
  let maxDepth = 0;
  for (const selection of node.selectionSet.selections) {
    const depth = 1 + getSelectionDepth(selection, context);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}

function getSelectionDepth(
  selection: any,
  context: ValidationContext,
): number {
  // Handle FragmentSpread — resolve the fragment definition to calculate its depth
  if (selection.kind === 'FragmentSpread') {
    const fragment = context.getFragment(selection.name.value);
    if (fragment) {
      return getFragmentDepth(fragment, context);
    }
    return 0;
  }

  // InlineFragment
  if (selection.kind === 'InlineFragment') {
    return getFieldDepth(selection, context);
  }

  // Field
  return getFieldDepth(selection, context);
}

function getFieldDepth(
  selection: any,
  context: ValidationContext,
): number {
  if (!selection.selectionSet) return 0;
  let maxDepth = 0;
  for (const subSelection of selection.selectionSet.selections) {
    const depth = 1 + getSelectionDepth(subSelection, context);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}

function getFragmentDepth(
  fragment: any,
  context: ValidationContext,
): number {
  if (!fragment.selectionSet) return 0;
  let maxDepth = 0;
  for (const selection of fragment.selectionSet.selections) {
    const depth = 1 + getSelectionDepth(selection, context);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}
