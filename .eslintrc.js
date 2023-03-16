module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: ['react', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-misused-promises': 0,
    'no-debugger': 1,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/strict-boolean-expressions': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/no-unused-vars' : 1,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/space-before-function-paren': 0,
    'react/self-closing-comp': [
      'error',
      {
        component: true,
        html: true
      }
    ]
  }
}
