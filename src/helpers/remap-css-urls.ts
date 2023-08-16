import postcss from "postcss";
import valueParser from "postcss-value-parser";

export async function remapCSSURLs(
  root: postcss.Root | postcss.Document,
  remapRequest: (request: string) => string | Promise<string>,
): Promise<postcss.Root | postcss.Document> {
  const remappableNodes: Array<valueParser.StringNode | valueParser.WordNode> = [];
  const declsToUpdate = new Map<postcss.Declaration, valueParser.Node[]>();
  const atRulesToUpdate = new Map<postcss.AtRule, valueParser.Node[]>();

  root.walkDecls((decl) => {
    const parsedValue = valueParser(decl.value);
    findURLFunctionNodes(parsedValue, remappableNodes);
    declsToUpdate.set(decl, parsedValue.nodes);
  });

  root.walkAtRules((atRule) => {
    const parsedValue = valueParser(atRule.params);
    findURLFunctionNodes(parsedValue, remappableNodes);
    atRulesToUpdate.set(atRule, parsedValue.nodes);
  });

  for (const node of remappableNodes) {
    node.value = await remapRequest(node.value);
  }

  for (const [decl, nodes] of declsToUpdate) {
    decl.value = valueParser.stringify(nodes);
  }

  for (const [atRule, nodes] of atRulesToUpdate) {
    atRule.params = valueParser.stringify(nodes);
  }
  return root;
}

function findURLFunctionNodes(
  parsedValue: valueParser.ParsedValue,
  remappableNodes: Array<valueParser.StringNode | valueParser.WordNode>,
) {
  for (const node of parsedValue.nodes) {
    if (isURLFunctionNode(node) && node.nodes.length === 1) {
      const [firstNode] = node.nodes as [valueParser.Node];
      if (isRemappableNode(firstNode)) {
        remappableNodes.push(firstNode);
      }
    }
  }
}

function isRemappableNode(node: valueParser.Node): node is valueParser.StringNode | valueParser.WordNode {
  return node.type === "word" || node.type === "string";
}

function isURLFunctionNode(node: valueParser.Node): node is valueParser.FunctionNode {
  return node.type === "function" && node.value === "url";
}
