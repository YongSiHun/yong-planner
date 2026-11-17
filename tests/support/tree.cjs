function find(node, predicate) {
  if (!node) return undefined;
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (predicate(node)) return node;
  return find(node.props?.children, predicate);
}

module.exports = { find };

function expand(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(expand);
  if (typeof node.type === 'function') return expand(node.type(node.props));
  if (typeof node.type?.type === 'function') return expand(node.type.type(node.props));
  return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
}

module.exports.expand = expand;
