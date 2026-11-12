function find(node, predicate) {
  if (!node) return undefined;
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (predicate(node)) return node;
  return find(node.props?.children, predicate);
}

module.exports = { find };
