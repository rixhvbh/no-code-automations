# CLAUDE.md - AI Assistant Guide for no-code-automations

## Project Overview

**Repository:** no-code-automations
**Current Status:** Newly initialized - awaiting development
**Last Updated:** 2025-11-17

This document provides guidance for AI assistants working on this codebase. Update this file as the project evolves.

---

## Current State

This is a freshly initialized repository with minimal structure:
- Single initial commit (10dee6d)
- Contains only README.md placeholder
- No source code, dependencies, or configuration files yet

---

## Repository Structure

```
no-code-automations/
├── CLAUDE.md          # This file - AI assistant guidance
└── README.md          # Project overview (placeholder)
```

### Planned Structure (To Be Added)

When development begins, establish:
- `/src` or `/lib` - Source code
- `/tests` or `/__tests__` - Test files
- `/docs` - Documentation
- `/scripts` - Build and utility scripts
- Configuration files at root level

---

## Technology Stack

**Not yet defined.** When selecting, document:
- Primary language/runtime
- Framework(s)
- Package manager
- Build tools
- Testing framework
- Linting/formatting tools

---

## Development Commands

**None configured yet.** When established, add commands for:

```bash
# Install dependencies
# npm install / pip install -r requirements.txt / etc.

# Run development server
# npm run dev / python main.py / etc.

# Run tests
# npm test / pytest / etc.

# Lint code
# npm run lint / flake8 / etc.

# Build for production
# npm run build / etc.

# Format code
# npm run format / black . / etc.
```

---

## Code Conventions

### To Be Established

When development begins, define and document:

1. **File Naming**
   - Convention: kebab-case, camelCase, or snake_case
   - Example: `user-service.ts`, `userService.js`, or `user_service.py`

2. **Code Style**
   - Indentation: spaces or tabs, size
   - Quotes: single or double
   - Semicolons: required or not
   - Max line length

3. **Git Workflow**
   - Branch naming conventions
   - Commit message format (e.g., Conventional Commits)
   - PR requirements

4. **Documentation**
   - Code comments style
   - Function/method documentation
   - README standards

---

## Important Patterns

### Architecture (TBD)

Document architectural decisions here:
- Design patterns used
- Module organization
- Data flow
- State management approach

### Error Handling (TBD)

Define error handling conventions:
- How to throw/catch errors
- Logging strategy
- Error response formats

### Testing Strategy (TBD)

Establish testing requirements:
- Unit test coverage expectations
- Integration test patterns
- Test file naming/location
- Mocking conventions

---

## AI Assistant Guidelines

### When Working on This Repository

1. **Before Making Changes**
   - Read this CLAUDE.md file first
   - Review existing code patterns
   - Check for test requirements
   - Understand the technology stack

2. **Code Quality**
   - Follow established conventions
   - Write tests for new functionality
   - Document complex logic
   - Avoid introducing security vulnerabilities

3. **Git Practices**
   - Use descriptive commit messages
   - Keep commits focused and atomic
   - Push to the designated branch
   - Never force push without permission

4. **Communication**
   - Explain significant architectural decisions
   - Note any deviations from conventions
   - Flag potential issues or concerns
   - Ask for clarification when requirements are ambiguous

### Security Considerations

- Never commit secrets, API keys, or credentials
- Validate and sanitize user inputs
- Use parameterized queries for database operations
- Follow OWASP security guidelines
- Report any discovered vulnerabilities

---

## Dependencies

**None configured yet.**

When added, document:
- Production dependencies and their purposes
- Development dependencies
- Peer dependencies
- Version constraints and why

---

## Environment Configuration

**Not yet established.**

When needed, document:
- Required environment variables
- Configuration file formats
- Local vs. production differences
- Secrets management approach

---

## CI/CD Pipeline

**Not yet configured.**

When established, document:
- Pipeline stages
- Automated checks (lint, test, build)
- Deployment process
- Release procedures

---

## Common Tasks

### Adding a New Feature

1. Create feature branch from main
2. Implement changes following conventions
3. Write/update tests
4. Update documentation
5. Submit PR with description

### Fixing a Bug

1. Identify and reproduce the issue
2. Write a failing test (TDD approach)
3. Implement the fix
4. Verify all tests pass
5. Document the fix in commit message

### Refactoring Code

1. Ensure comprehensive test coverage exists
2. Make incremental changes
3. Run tests frequently
4. Keep commits small and focused
5. Document reasoning for major changes

---

## Known Issues and Limitations

**None currently.**

Document known issues, technical debt, and limitations here as they arise.

---

## Contact and Resources

**Project Author:** Rishabh G.
**Email:** work.rishabhgangrade@gmail.com

### External Resources

Add links to:
- Design documents
- API documentation
- Related repositories
- Relevant tutorials/guides

---

## Changelog

### 2025-11-17
- Initial CLAUDE.md created for newly initialized repository
- Established template structure for AI assistant guidance

---

**Note to AI Assistants:** This document should be updated as the project evolves. When adding new features, technologies, or conventions, ensure this file reflects those changes to maintain accurate guidance for future AI interactions.
