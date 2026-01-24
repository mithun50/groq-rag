# Contributing to groq-rag

Thank you for your interest in contributing to groq-rag! This document provides guidelines and information for contributors.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/groq-rag.git
   cd groq-rag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## Project Structure

```
groq-rag/
├── src/
│   ├── index.ts        # Main exports
│   ├── client.ts       # GroqRAG client class
│   ├── types.ts        # TypeScript type definitions
│   ├── rag/            # RAG module (embeddings, vector store, retriever)
│   ├── web/            # Web module (fetcher, search providers)
│   ├── tools/          # Tool system (executor, built-in tools)
│   ├── agents/         # Agent implementation
│   └── utils/          # Utility functions (chunker, helpers)
├── tests/              # Test files (mirrors src/ structure)
├── examples/           # Usage examples
└── .github/workflows/  # CI/CD workflows
```

## Code Style

- **TypeScript**: All code must be written in TypeScript with proper type annotations
- **ESLint**: Run `npm run lint` to check for style issues
- **Formatting**: Use consistent formatting (2 spaces, no semicolons optional)
- **Comments**: Add JSDoc comments for public APIs

## Testing

- **Unit tests**: Write tests for all new functionality
- **Test location**: Place tests in `tests/` mirroring the `src/` structure
- **Test framework**: We use Vitest
- **Coverage**: Aim for good test coverage on new code

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Run checks locally**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issues if applicable

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```
   Then create a Pull Request on GitHub.

## PR Checklist

Before submitting a PR, ensure:

- [ ] Code compiles without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages are clear

## Adding New Features

### Adding a Vector Store Provider

1. Create a new class in `src/rag/vectorStore.ts` implementing `VectorStore`
2. Add the provider to `createVectorStore()` factory
3. Add tests in `tests/rag/vectorStore.test.ts`
4. Update documentation

### Adding a Search Provider

1. Create a new class in `src/web/search.ts` implementing `SearchProvider`
2. Add the provider to `createSearchProvider()` factory
3. Add tests in `tests/web/search.test.ts`
4. Update documentation

### Adding a Built-in Tool

1. Create the tool function in `src/tools/builtins.ts`
2. Add to `getBuiltinTools()` if it should be included by default
3. Add tests in `tests/tools/builtins.test.ts`
4. Update documentation

## Reporting Issues

When reporting issues, please include:

- **Description**: Clear description of the problem
- **Steps to reproduce**: How to trigger the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Node.js version, OS, etc.
- **Code sample**: Minimal reproduction if possible

## Feature Requests

For feature requests:

- Check existing issues first
- Describe the use case
- Explain why it would be valuable
- Suggest implementation approach if you have ideas

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for any questions about contributing!
