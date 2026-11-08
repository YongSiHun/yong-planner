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

// 복잡도: 논리 연산자별 가산.
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

const loopNodes = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
]);

function hasStructuralAncestor(node, types) {
  const ancestors = [];
  let parent = node.parent;

  while (parent) {
    ancestors.push(parent);
    parent = parent.parent;
  }
  const boundary = ancestors.findIndex((ancestor) => functionNodes.has(ancestor.type));
  const scope = boundary < 0 ? ancestors : ancestors.slice(0, boundary);

  return scope.some((ancestor) => types.has(ancestor.type));
}

function nestingRule(types, message) {
  return {
    meta: { type: 'suggestion', schema: [], messages: { nested: message } },
    create(context) {
      function check(node) {
        const nested = hasStructuralAncestor(node, types);

        if (!nested) {
          return;
        }
        context.report({ node, messageId: 'nested' });
      }

      return Object.fromEntries([...types].map((type) => [type, check]));
    },
  };
}

const noInlineStyles = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: { inline: '스타일은 .styles.ts로 분리하고 import해서 사용하세요.' },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const styleAttribute = ['style', 'contentContainerStyle', 'screenOptions'].includes(
          node.name.name,
        );
        const expression = node.value?.expression;
        const inline =
          styleAttribute &&
          ['ObjectExpression', 'ArrayExpression', 'ArrowFunctionExpression'].includes(
            expression?.type,
          );

        if (!inline) {
          return;
        }
        context.report({ node, messageId: 'inline' });
      },
    };
  },
};

module.exports = {
  rules: {
    'cognitive-complexity': cognitiveComplexity,
    'boolean-condition': booleanCondition,
    'no-nested-loops': nestingRule(loopNodes, '중첩 반복문은 인덱스 또는 단일 순회로 분리하세요.'),
    'no-nested-if': nestingRule(
      new Set(['IfStatement']),
      '중첩 if 대신 early return으로 분리하세요.',
    ),
    'no-inline-styles': noInlineStyles,
  },
};
