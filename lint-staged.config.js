module.exports = {
  '**/*.{js,ts}?(x)': (filenames) => [
    'npm run types:check',
    `prettier --check --ignore-path .gitignore ${filenames.join(' ')}`,
    `eslint --cache --ext js,ts --ignore-path .gitignore ${filenames.join(' ')}`,
  ],
};
