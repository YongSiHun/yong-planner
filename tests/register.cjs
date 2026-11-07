const fs = require('node:fs');
const ts = require('typescript');

// 앱의 TypeScript 모듈과 컴포넌트를 Node 테스트에서 로드한다.
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
