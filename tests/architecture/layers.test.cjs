const { assert, test } = require('../support/test.cjs');
const { readdirSync, readFileSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');
const ts = require('typescript');
const root = resolve(dirname(require.resolve('./layers.test.cjs')), '../../src');
const files = readdirSync(root, { recursive: true }).filter((file) => /\.tsx?$/.test(file));
const sources = files.map((file) => ({
  file: file.replaceAll('\\', '/'),
  ast: ts.createSourceFile(
    file,
    readFileSync(join(root, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  ),
}));
function runtimeImports(ast) {
  return ast.statements
    .filter((node) => ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly)
    .filter((node) => !node.importClause?.namedBindings?.elements?.every((part) => part.isTypeOnly))
    .map((node) => node.moduleSpecifier.text);
}

test('domain services do not depend on UI, store, controllers or infrastructure', () => {
  const domain = sources.filter(
    ({ file }) => file.includes('/services/') || file.startsWith('services/'),
  );
  const violations = domain.flatMap(({ file, ast }) =>
    runtimeImports(ast)
      .filter((path) =>
        /(^react$|^react-native|^expo-|\/(components|screens|hooks|controllers|stores|database|data)\/)/.test(
          path,
        ),
      )
      .map((path) => file + ' -> ' + path),
  );
  assert.deepEqual(violations, []);
});

test('presentation accesses external IO through application actions', () => {
  const presentation = sources.filter(({ file }) => /\/(components|screens|hooks)\//.test(file));
  const violations = presentation.flatMap(({ file, ast }) =>
    runtimeImports(ast)
      .filter((path) => /\/(database|data)\//.test(path))
      .map((path) => file + ' -> ' + path),
  );
  assert.deepEqual(violations, []);
});

test('infrastructure and application commands do not import presentation runtime', () => {
  const commands = sources.filter(
    ({ file }) => /^(data|database)\//.test(file) || file.includes('/controllers/'),
  );
  const violations = commands.flatMap(({ file, ast }) =>
    runtimeImports(ast)
      .filter((path) => /(^react$|\/(components|screens|hooks)\/)/.test(path))
      .map((path) => file + ' -> ' + path),
  );
  assert.deepEqual(violations, []);
});
