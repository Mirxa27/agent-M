# Contributing to Mirxa AI Platform

First off, thank you for considering contributing to the Mirxa AI Platform! It's people like you that make it such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [conduct@mirxa.ai](mailto:conduct@mirxa.ai).

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers understand your report, reproduce the issue, and find related reports.

#### Before Submitting A Bug Report

- Check the documentation for tips on how to use the platform correctly.
- Check the issue tracker to see if the bug has already been reported.
- If you're unable to find an open issue addressing the problem, open a new one.

#### How Do I Submit A Good Bug Report?

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as much detail as possible.
- Provide specific examples to demonstrate the steps.
- Describe the behavior you observed after following the steps and why this is a problem.
- Explain which behavior you expected to see instead and why.
- Include screenshots or animated GIFs if possible.
- Include details about your configuration and environment.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

#### How Do I Submit A Good Enhancement Suggestion?

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Provide specific examples to demonstrate the steps or point out the part of Mirxa AI Platform that the suggestion relates to.
- Describe the current behavior and explain which behavior you expected to see instead and why.
- Explain why this enhancement would be useful to most Mirxa AI Platform users.
- List some other applications where this enhancement exists, if applicable.
- Specify which version of Mirxa AI Platform you're using.

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through 'beginner' and 'help-wanted' issues:

- **Beginner issues** - issues which should only require a few lines of code, and a test or two.
- **Help wanted issues** - issues which are typically more complex than beginner issues.

### Pull Requests

- Fill in the required PR template
- Do not include issue numbers in the PR title
- Follow the TypeScript and JavaScript styleguides
- Include thoughtfully-worded, well-structured tests
- Document new code
- End all files with a newline

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐎 `:racehorse:` when improving performance
  - 📝 `:memo:` when writing docs
  - 🐛 `:bug:` when fixing a bug
  - 🔥 `:fire:` when removing code or files
  - 💚 `:green_heart:` when fixing the CI build
  - ✅ `:white_check_mark:` when adding tests
  - 🔒 `:lock:` when dealing with security
  - ⬆️ `:arrow_up:` when upgrading dependencies
  - ⬇️ `:arrow_down:` when downgrading dependencies
  - 👕 `:shirt:` when removing linter warnings

### JavaScript and TypeScript Styleguide

All JavaScript and TypeScript code is linted with ESLint and formatted with Prettier.

- Prefer const over let
- Use TypeScript interfaces and types for all objects and components
- Use async/await instead of callbacks or raw promises
- Use functional components with hooks instead of class components
- Use destructuring assignments where appropriate
- Document complex code with comments

### React Component Styleguide

- Use functional components with hooks
- Follow the naming convention ComponentName.tsx
- Use TSX for all React components
- Use the shadcn/ui patterns for component design
- Organize components logically in folders
- Import order: external libraries, then internal components, then styles

### CSS Styleguide

- Use TailwindCSS utility classes
- For custom styles, follow the BEM naming convention
- Use the cn utility for conditional class names
- Prefer composition over nesting

### Documentation Styleguide

- Use Markdown for documentation
- Include code examples where appropriate
- Keep documentation up to date with code changes
- Document both what the code does and why it does it

## Development Workflow

### Setting Up Your Development Environment

1. Fork the repository
2. Clone your fork locally
3. Install dependencies with `npm install`
4. Setup local environment variables in a `.env` file
5. Start the development server with `npm run dev`

### Development Process

1. Create a feature branch from `main`
2. Make your changes
3. Write or update tests as necessary
4. Update documentation as necessary
5. Run the tests with `npm run test`
6. Commit your changes
7. Push to your fork
8. Submit a pull request

### Code Review Process

1. Maintainers review pull requests
2. Changes may be requested
3. Once approved, a maintainer will merge the PR
4. The PR will be included in the next release

## Additional Notes

### Issue and Pull Request Labels

This project uses the following labels to track issues and pull requests:

- `bug`: Something isn't working
- `documentation`: Improvements or additions to documentation
- `enhancement`: New feature or request
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `invalid`: This doesn't seem right
- `question`: Further information is requested
- `wontfix`: This will not be worked on

## Thank You!

Your contributions to open source, large or small, make great projects like this possible. Thank you for taking the time to contribute.