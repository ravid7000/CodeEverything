# Project Agents

This document provides an overview of the specialized agents available in the CodeEverything project.

## JavaScript TDD Interviewer

- **Location**: `agents/javascript-tdd-interviewer.agent.md`
- **Description**: Helps candidates prepare for JavaScript interviews by writing comprehensive, production-quality test cases using a Test-Driven Development (TDD) approach. It focuses exclusively on writing tests for utility functions, async patterns, polyfills, data structures, and algorithms.

### Key Features
- **TDD First**: Guides users through writing tests before implementation.
- **Comprehensive Coverage**: Ensures happy paths, edge cases, and error scenarios are tested.
- **Interview Focused**: Tailored for common JavaScript interview topics and coding challenges.
- **Framework Agnostic**: Supports Jest, Mocha, Vitest, and more.

## Commit Message Generator

- **Location**: `agents/commit-message-generator.agent.md`
- **Description**: Generates high-quality, conventional commit messages by analyzing the current git diff. It ensures messages explain both the "what" and the "why" of the changes.

### Key Features
- **Conventional Commits**: Follows the `<type>(<scope>): <description>` format.
- **Diff Analysis**: Intelligently summarizes changes from `git diff`.
- **Professional Standards**: Uses imperative tense and keeps subject lines concise.
- **Contextual Awareness**: Can handle complex changes with descriptive bodies.
