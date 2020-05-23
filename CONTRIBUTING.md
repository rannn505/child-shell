# Contributing

Hi there! I'm grateful that you'd like to contribute to this project. Your help is essential for keeping it great.
I promise to try to be kind and considerate with any **PR** or **Issues** you make.
Please read and follow these instructions to ensure that your contribution is as meaningful as possible:

### Reporting Issues

Before opening an issue, please search the [issue tracker](https://github.com/rannn505/node-powershell/issues) to make sure your issue hasn't already been reported.
I use it, and mainly its label feature to keep track of bugs and improvements to `NbSH` itself, its examples, and its documentation. I encourage you to open issues to discuss improvements, architecture, theory, internal implementation, etc. If a topic has been discussed before, I will ask you to join the previous discussion.

### Asking Questions

**For support or usage questions like “how do I do X with NbSH” and “my code doesn't work”, please search and ask on [StackOverflow with a NbSH tag](https://stackoverflow.com/questions/tagged/nbsh?sort=votes&pageSize=50) first.**

Some questions take a long time to get an answer. **If your question gets closed or you don't get a reply on StackOverflow for longer than a week or two,** I encourage you to post an issue linking to your question. I will label and close your issue but this will give people watching the repo an opportunity to see your question and reply to it on StackOverflow if they know the answer.

### Development

The following is a detailed list of all [npm scripts](https://docs.npmjs.com/misc/scripts) that will help you develope to `NbSH`:

| Script      | Use to                  | Snippet                 | Command                                                    |
| ----------- | ----------------------- | ----------------------- | ---------------------------------------------------------- |
| clean       | refresh .               | `$ npm run clean`       | npx rimraf dist coverage                                   |
| format      | make the code look sexy | `$ npm run format`      | prettier --write \"{lib,test}/**/\*.{js,ts}\" \"**/\*.md\  |
| lint        | find potential bugs     | `$ npm run lint`        | eslint --ext js,ts lib test --fix                          |
| test        | run UTs                 | `$ npm test`            | jest                                                       |
| test:watch  | watch UTs               | `$ npm run test:watch`  | npm test -- --watch                                        |
| test:cov    | get coverage numbers    | `$ npm run test:cov`    | npm test -- --coverage                                     |
| build       | just build              | `$ npm run build`       | npm run clean && tsc                                       |
| build:watch | watch build             | `$ npm run build:watch` | npm run build -- -w                                        |
| examples    | run all examples        | `$ npm run examples`    | npx ts-node examples/index.ts                              |
| start       | same as examples        | `$ npm start`           | npm run examples                                           |

### Sending a Pull Request

The workflow looks like this:

- Open a new issue in the [issue tracker](https://github.com/rannn505/node-powershell/issues).
- Fork the repo.
- Create a new feature branch based off the `master` branch.
- Make sure all tests pass and there are no linting errors.
- Submit a pull request, referencing any issues it addresses.

Please try to keep your pull request focused in scope and avoid including unrelated commits.
After you have submitted your pull request, I'll try to get back to you as soon as possible and may suggest some changes or improvements.

### Docs

Improvements to the documentation are always welcome. You can find them in the [`docs`](/website/docs) path. I use [Docusaurus](https://v2.docusaurus.io/) to build the documentation website. The website is published automatically whenever the `master` branch is updated.

### Examples

`NbSH` comes with some [examples](/examples) to demonstrate various concepts and best practices.
When adding a new example, please adhere to the style and format of the existing examples, and try to reuse as much code as possible.

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
- [JavaScript Standard Style](https://standardjs.com/)
- [Code of Conduct for Open Source Projects](https://www.contributor-covenant.org/)

Thank you for contributing :)
