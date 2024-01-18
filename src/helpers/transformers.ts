import type ts from "typescript";

/**
 * Moves all import statements to the top of the file to workaround esm to cjs bug:
 * https://github.com/microsoft/TypeScript/issues/16166
 *
 * Makes monaco-editor work, as its esm bundle uses a symbol before its import statement.
 */
export function createHoistImportsTransformer({
  isImportDeclaration,
}: typeof ts): ts.TransformerFactory<ts.SourceFile> {
  return ({ factory }) => {
    return (sourceFile) => {
      const importStatements: ts.Statement[] = [];
      const nonImportStatements: ts.Statement[] = [];
      for (const statement of sourceFile.statements) {
        if (isImportDeclaration(statement)) {
          importStatements.push(statement);
        } else {
          nonImportStatements.push(statement);
        }
      }
      return factory.updateSourceFile(sourceFile, [...importStatements, ...nonImportStatements]);
    };
  };
}

/**
 * Turn all top-level `require()` calls into `await targetFnName()`.
 */
export function createRequireToAwaitImportTransformer(
  {
    isCallExpression,
    isStringLiteral,
    visitEachChild,
    isExpressionStatement,
    isVariableStatement,
    isVariableDeclaration,
    isVariableDeclarationList,
    isIdentifier,
    isBinaryExpression,
  }: typeof ts,
  targetFnName: string,
): ts.TransformerFactory<ts.SourceFile> {
  const isRequireCallExpression = (node: ts.CallExpression): boolean => {
    return (
      isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.length === 1 &&
      isStringLiteral(node.arguments[0]!)
    );
  };
  return (context) => {
    const { factory } = context;
    const requireToAwaitDynamicImport: ts.Visitor = (node) => {
      if (isCallExpression(node)) {
        if (isRequireCallExpression(node)) {
          return factory.createAwaitExpression(
            factory.updateCallExpression(node, factory.createIdentifier(targetFnName), undefined, node.arguments),
          );
        } else {
          return visitEachChild(node, requireToAwaitDynamicImport, context);
        }
      }
      return node;
    };

    return (sourceFile) => {
      const topLevelVisitor: ts.Visitor = (node) => {
        if (isExpressionStatement(node)) {
          return visitEachChild(node, requireToAwaitDynamicImport, context);
        } else if (
          isVariableStatement(node) ||
          isVariableDeclaration(node) ||
          isVariableDeclarationList(node) ||
          isBinaryExpression(node)
        ) {
          return visitEachChild(node, topLevelVisitor, context);
        } else {
          return requireToAwaitDynamicImport(node);
        }
      };
      return visitEachChild(sourceFile, topLevelVisitor, context);
    };
  };
}

/**
 * Turn all `import()` into calls to a function.
 */
export function createOwnDynamicImportTransformer(
  { isCallExpression, isStringLiteral, visitEachChild, SyntaxKind: { ImportKeyword } }: typeof ts,
  targetFnName: string,
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const { factory } = context;
    return (sourceFile) => {
      const visitor: ts.Visitor = (node) => {
        if (
          isCallExpression(node) &&
          node.expression.kind === ImportKeyword &&
          node.arguments.length >= 1 &&
          isStringLiteral(node.arguments[0]!)
        ) {
          return factory.updateCallExpression(node, factory.createIdentifier(targetFnName), undefined, node.arguments);
        }
        return visitEachChild(node, visitor, context);
      };
      return visitEachChild(sourceFile, visitor, context);
    };
  };
}
