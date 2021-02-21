module.exports = {
  '**/*.{js,ts}?(x)': (filenames) => [
    'tsc -p tsconfig.json --noEmit',
    `eslint --cache --ext js,ts --ignore-path .gitignore ${filenames.join(' ')}`,
    `prettier --check --ignore-path .gitignore ${filenames.join(' ')}`,
  ]
}
