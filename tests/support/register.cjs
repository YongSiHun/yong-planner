const fs = require('node:fs');
const ts = require('typescript');

// Node 테스트용 TS·컴포넌트 로더.
const compile = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
