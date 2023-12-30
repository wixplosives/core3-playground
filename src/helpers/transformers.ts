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
