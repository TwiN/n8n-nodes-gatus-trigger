module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    'n8n-nodes-base',
  ],
  extends: [
    'plugin:n8n-nodes-base/community',
  ],
  rules: {
    'n8n-nodes-base/node-param-description-missing-final-period': 'error',
    'n8n-nodes-base/node-param-display-name-miscased': 'error',
  },
};
