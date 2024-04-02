import type ts from "typescript";
import { singlePackageModuleSystem } from "./package-evaluation";
import { createHoistImportsTransformer } from "./transformers";

export function compileUsingTypescript(
  userTs: typeof ts,
  filePath: string,
  fileContents: string,
  compilerOptions: ts.CompilerOptions,
): { outputText: string; sourceMapText?: string | undefined } {
  const hoistImportsTransformer = createHoistImportsTransformer(userTs);

  const start = performance.now();
  const { outputText, sourceMapText } = userTs.transpileModule(fileContents, {
    compilerOptions,
    fileName: filePath,
    transformers: {
      before: [hoistImportsTransformer],
    },
  });
  performance.measure(`Transpile ${filePath}`, { start });

  return { outputText, sourceMapText };
}

export type ExtractionMode = "production" | "development";

/**
 * accepts a file to analyze and returns all static/dynamic imports and requires
 */
export function extractModuleRequests(
  {
    SyntaxKind,
    isCallExpression,
    isImportDeclaration,
    isExportDeclaration,
    isExportAssignment,
    canHaveModifiers,
    getModifiers,
    forEachChild,
    isStringLiteral,
    isIdentifier,
    isIfStatement,
    isBinaryExpression,
    isPropertyAccessExpression,
  }: typeof ts,
  sourceFile: ts.SourceFile,
  mode: ExtractionMode = "development",
): {
  specifiers: string[];
  hasESM: boolean;
} {
  const { ImportKeyword, ExportKeyword } = SyntaxKind;

  function isRequireIdentifier(expression: ts.Expression): expression is ts.Identifier {
    return isIdentifier(expression) && expression.text === "require";
  }

  function isNodeEnvLookup(node: ts.Node): node is ts.PropertyAccessExpression {
    return (
      isPropertyAccessExpression(node) &&
      node.name.text === "NODE_ENV" &&
      isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "env" &&
      isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "process"
    );
  }
  function isExportedNode(node: ts.Node): boolean {
    if (canHaveModifiers(node)) {
      const modifiers = getModifiers(node);
      if (modifiers) {
        for (const { kind } of modifiers) {
          if (kind === ExportKeyword) {
            return true;
          }
        }
      }
    }
    return false;
  }

  const specifiers: string[] = [];
  let hasESM = false;
  function isDynamicImportKeyword({ kind }: ts.Expression) {
    return kind === ImportKeyword;
  }

  const dynamicImportsFinder = (node: ts.Node): void => {
    if (isCallExpression(node)) {
      const isDynamicImportNode = isDynamicImportKeyword(node.expression);
      hasESM ||= isDynamicImportNode;
      if (
        (isDynamicImportNode || isRequireIdentifier(node.expression)) &&
        node.arguments.length === 1 &&
        isStringLiteral(node.arguments[0]!)
      ) {
        const [{ text }] = node.arguments;
        specifiers.push(text);
        return;
      }
    }
    forEachChild(node, dynamicImportsFinder);
  };

  const importsFinder = (node: ts.Node) => {
    const isImportOrExport = isImportDeclaration(node) || isExportDeclaration(node);
    hasESM ||= isImportOrExport;
    if (isImportOrExport && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
      const originalTarget = node.moduleSpecifier.text;
      specifiers.push(originalTarget);
      return;
    } else if (isExportAssignment(node)) {
      hasESM = true;
    } else if (
      isIfStatement(node) &&
      isBinaryExpression(node.expression) &&
      node.expression.operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken &&
      isNodeEnvLookup(node.expression.left) &&
      isStringLiteral(node.expression.right)
    ) {
      const visitTarget = node.expression.right.text === mode ? node.thenStatement : node.elseStatement;
      if (visitTarget) {
        forEachChild(visitTarget, dynamicImportsFinder);
      }
      return;
    }

    hasESM ||= isExportedNode(node);

    // if not a static import/re-export, might be a dynamic import
    // so run that recursive visitor on `node`
    forEachChild(node, dynamicImportsFinder);
  };

  forEachChild(sourceFile, importsFinder);
  return { specifiers, hasESM };
}

export function evaluateTypescriptLib(typescriptURL: string, typescriptText: string) {
  typescriptText = fixTypescriptBundle(typescriptText);
  const typescriptModuleSystem = singlePackageModuleSystem("typescript", typescriptURL, typescriptText);
  return typescriptModuleSystem.requireModule(typescriptURL) as typeof import("typescript");
}

function fixTypescriptBundle(typescriptBundleText: string) {
  return (
    typescriptBundleText
      // remove broken typescript sourcemap
      .replace(`\n//# sourceMappingURL=typescript.js.map`, ``)
      // disable code causing caught exception
      .replace(`const etwModulePath =`, `// const etwModulePath =`)
      .replace(`var etwModulePath =`, `// var etwModulePath =`)
      .replace(`require(etwModulePath);`, `void 0`)
  );
}
