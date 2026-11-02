const structuralNodes = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'CatchClause',
  'ConditionalExpression',
]);
const functionNodes = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

function getChildren(node, visitorKeys) {
  return (visitorKeys[node.type] ?? [])
    .flatMap((key) => {
      const value = node[key];

      return Array.isArray(value) ? value : [value];
    })
    .filter(Boolean);
}

function isLogicalBranch(node) {
  const isLogicalExpression = node.type === 'LogicalExpression';

  return isLogicalExpression && node.operator !== '??';
}

function getExtraBranchCost(node) {
  const hasElseBranch = node.type === 'IfStatement' && node.alternate !== null;
  const hasLabelledJump =
    ['BreakStatement', 'ContinueStatement'].includes(node.type) && node.label !== null;

  return Number(hasElseBranch) + Number(hasLabelledJump) + Number(isLogicalBranch(node));
}

// 측정: 논리 연산자를 각각 세어 보수적으로 제한.
function measureNode(node, visitorKeys, nesting) {
  const isNestedFunction = functionNodes.has(node.type);

  if (isNestedFunction) {
    return 0;
  }

  const isStructural = structuralNodes.has(node.type);
  const structuralCost = isStructural ? nesting + 1 : 0;
  const childNesting = nesting + Number(isStructural);
  const childCost = getChildren(node, visitorKeys).reduce(
    (total, child) => total + measureNode(child, visitorKeys, childNesting),
    0,
  );

  return structuralCost + getExtraBranchCost(node) + childCost;
}

function isBooleanReference(node) {
  const isIdentifier = node.type === 'Identifier';
  const isNegatedIdentifier =
    node.type === 'UnaryExpression' && node.operator === '!' && node.argument.type === 'Identifier';

  return isIdentifier || isNegatedIdentifier;
}

const cognitiveComplexity = {
  meta: {
    type: 'suggestion',
    schema: [{ type: 'integer', minimum: 0 }],
    messages: { excessive: '인지 복잡도 {{score}}: 함수 분리로 {{maximum}} 이하를 유지하세요.' },
  },
  create(context) {
    const maximum = context.options[0] ?? 5;

    function checkFunction(node) {
      const score = measureNode(node.body, context.sourceCode.visitorKeys, 0);
      const exceedsMaximum = score > maximum;

      if (!exceedsMaximum) {
        return;
      }

      context.report({ node, messageId: 'excessive', data: { score, maximum } });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};

const booleanCondition = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: { named: 'if 조건을 의미 있는 boolean 변수로 분리하세요.' },
  },
  create(context) {
    return {
      IfStatement(node) {
        const hasBooleanReference = isBooleanReference(node.test);

        if (hasBooleanReference) {
          return;
        }

        context.report({ node: node.test, messageId: 'named' });
      },
    };
  },
};

module.exports = {
  rules: { 'cognitive-complexity': cognitiveComplexity, 'boolean-condition': booleanCondition },
};
