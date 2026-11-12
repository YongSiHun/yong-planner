// Resolve relative module paths from the calling test, then replace its CommonJS cache entry.
function createModuleMock(requireFromTest) {
  return (id, exports) => {
    const filename = requireFromTest.resolve(id);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  };
}

module.exports = { createModuleMock };
