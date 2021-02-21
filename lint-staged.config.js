module.exports = {
  '**/*.{js,ts}?(x)': (filenames) => [
    'npm run types:check'
    `eslint --cache --ext js,ts --ignore-path .gitignore ${filenames.join(' ')}`,
    `prettier --check --ignore-path .gitignore ${filenames.join(' ')}`,
  ]
}
