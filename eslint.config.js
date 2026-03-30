const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node
            },
            ecmaVersion: 2022,
            sourceType: 'commonjs'
        },
        rules: {
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'no-unused-vars': ['warn'],
            'no-undef': 'error'
        }
    }
];
