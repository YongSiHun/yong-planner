require('./register.cjs');

module.exports = { ...require('node:test'), assert: require('node:assert/strict') };
