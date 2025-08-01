# PRP Templates - Context Engineering Hub

> **Product Requirement Prompts (PRPs) = PRDs + curated codebase intelligence + agent runbooks**

Based on https://github.com/Wirasm/PRPs-agentic-eng

A collection of battle-tested PRP templates for different use cases. Each template provides the context engineering framework to help AI coding assistants deliver production-ready code on the first pass.

## 🚀 Templates Overview

### 🔧 [prp-base-python](./prp-templates/prp-base-python/) - Universal PRP Template

**Drop into any existing project**

Add comprehensive context engineering to any codebase in 30 seconds.

```bash
# Quick start
git clone https://github.com/coleam00/context-engineering-hub.git
cp -r context-engineering-hub/prp-templates/prp-base-python/PRPs/ your-project/
cp -r context-engineering-hub/prp-templates/prp-base-python/.claude/ your-project/
```

**Perfect for:** Adding structured feature development to existing projects

---

### 🌐 [mcp-server](./mcp-server/) - MCP Server Project Starter

**Complete MCP server with TypeScript, auth, and database tools**

Full project template for building Model Context Protocol servers.

```bash
# Quick start
git clone https://github.com/coleam00/context-engineering-hub.git
cp -r context-engineering-hub/prp-templates/mcp-server/ your-mcp-project/
cd your-mcp-project && npm install
```

**Perfect for:** Building MCP servers with authentication, database tools, and testing

---

### 🤖 [pydantic-ai](./pydantic-ai/) - Pydantic AI Agent Starter

**Multi-agent Python project with structured outputs**

Complete project template for building Pydantic AI agents with tools and validation.

```bash
# Quick start
git clone https://github.com/coleam00/context-engineering-hub.git
cp -r context-engineering-hub/prp-templates/pydantic-ai/ your-agent-project/
```

**Perfect for:** Building Python AI agents with structured outputs and tool integration

---

### ⚙️ [template-generator](./template-generator/) - PRP Template Generator

**Generate new PRP templates for any use case**

Meta-template that generates custom PRP templates for new domains and frameworks.

```bash
# Quick start
git clone https://github.com/coleam00/context-engineering-hub.git
cd context-engineering-hub/prp-templates/template-generator/
/generate-prp "Create a PRP template for FastAPI microservices"
```

**Perfect for:** Creating specialized PRP templates for new frameworks or domains

## 📚 What is Context Engineering?

Context Engineering represents a paradigm shift from traditional prompt engineering:

### Prompt Engineering vs Context Engineering

**Prompt Engineering:**

- Focuses on clever wording and specific phrasing
- Limited to how you phrase a task
- Like giving someone a sticky note

**Context Engineering:**

- A complete system for providing comprehensive context
- Includes documentation, examples, rules, patterns, and validation
- Like writing a full screenplay with all the details

### Why Context Engineering Matters

1. **Reduces AI Failures**: Most agent failures aren't model failures - they're context failures
2. **Ensures Consistency**: AI follows your project patterns and conventions
3. **Enables Complex Features**: AI can handle multi-step implementations with proper context
4. **Self-Correcting**: Validation loops allow AI to fix its own mistakes

## 🎯 Which Template Should You Use?

| Use Case                     | Template                                    | Type            |
| ---------------------------- | ------------------------------------------- | --------------- |
| Add PRPs to existing project | [prp-base-python](./prp-templates/prp-base-python/)                     | Drop-in         |
| Build MCP server             | [mcp-server](./mcp-server/)                 | Project starter |
| Build Python AI agents       | [pydantic-ai](./pydantic-ai/)               | Project starter |
| Create custom PRP template   | [template-generator](./template-generator/) | Meta-template   |

## 🏗️ Consistent Template Structure

Each template follows this structure:

```
template-name/
├── .claude/
│   ├── commands/              # Custom Claude Code commands
│   └── settings.local.json    # Permissions and settings
├── PRPs/
│   ├── templates/             # Base PRP templates
│   ├── examples/              # Code examples (critical for AI!)
│   ├── INITIAL.md            # Feature request template
│   └── ai_docs/              # Documentation context (when needed)
├── CLAUDE.md                 # Project-specific AI rules
└── README.md                 # Template-specific documentation
```

## Best Practices

### 1. Be Explicit in INITIAL.md

- Don't assume the AI knows your preferences
- Include specific requirements and constraints
- Reference examples liberally

### 2. Provide Comprehensive Examples

- More examples = better implementations
- Show both what to do AND what not to do
- Include error handling patterns

### 3. Use Validation Gates

- PRPs include test commands that must pass
- AI will iterate until all validations succeed
- This ensures working code on first try

### 4. Leverage Documentation

- Include official API docs
- Add MCP server resources
- Reference specific documentation sections

### 5. Customize CLAUDE.md

- Add your conventions
- Include project-specific rules
- Define coding standards

### What to Include in Examples

1. **Code Structure Patterns**
   - How you organize modules
   - Import conventions
   - Class/function patterns

2. **Testing Patterns**
   - Test file structure
   - Mocking approaches
   - Assertion styles

3. **Integration Patterns**
   - API client implementations
   - Database connections
   - Authentication flows

4. **CLI Patterns**
   - Argument parsing
   - Output formatting
   - Error handling

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Context Engineering Best Practices](https://www.philschmid.de/context-engineering)
