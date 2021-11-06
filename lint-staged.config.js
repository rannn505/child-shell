module.exports = {
  '**/*.{js,ts}?(x)': (filenames) => [
    `eslint --cache --ignore-path .gitignore ${filenames.join(' ')}`,
    `prettier --check --ignore-path .gitignore ${filenames.join(' ')}`,
    'tsc --build --clean tsconfig.build.json',
  ],
};
