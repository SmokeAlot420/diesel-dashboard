# Global Rules for AI Coding Assistants

Global Rules are high-level directives that shape how AI coding assistants behave across entire projects. They act as foundational instructions that complement your existing project-specific rules and PRPs (Product Requirement Prompts).

## 🎯 What Are Global Rules?

Global Rules are:

- **High-level behavioral guidelines** that apply across your entire codebase
- **Additive by default** - they enhance rather than replace your existing rules
- **Tool-specific optimizations** for different platforms (MCP servers, IDEs, etc.)
- **Context-aware patterns** that improve AI decision-making

## 📋 Available Global Rules

### 🏛️ Archon

**For projects using the Archon MCP server - use the README in `archon/` as a template for global rule READMEs**

Establishes Archon as the primary knowledge and task management system. Ensures AI assistants always check Archon for tasks before writing code, use its RAG capabilities for research, and maintain proper task lifecycle management.

Key behaviors:

- Task-first development workflow
- Integrated knowledge base queries
- Project and feature organization
- Research-driven implementation

[View Archon Global Rules →](./archon/README.md)

### 🎨 Framework-Specific CLAUDE Rules

**⚠️ These are opinionated rulesets. Please read through them carefully before use to ensure they align with your project's standards and preferences.**

These framework-specific CLAUDE.md files contain comprehensive guidelines for AI coding assistants working with specific technologies:

- **[CLAUDE-REACT.md](.claude-md-files//CLAUDE-REACT.md)** - React development patterns, hooks, state management, and component architecture
- **[CLAUDE-NEXTJS.md](.claude-md-files//CLAUDE-NEXTJS.md)** - Next.js app router, server components, routing, and deployment patterns
- **[CLAUDE-NODE.md](.claude-md-files//CLAUDE-NODE.md)** - Node.js backend development, Express patterns, middleware, and API design
- **[CLAUDE-ASTRO.md](.claude-md-files//CLAUDE-ASTRO.md)** - Astro static site generation, content collections, and deployment
- **[CLAUDE-PYTHON.md](./claude-md-files/CLAUDE-PYTHON.md)** - Python development standards, testing, packaging, and best practices

**Important Notes:**

- These rules are **highly opinionated** and reflect specific development approaches
- Review the entire file before integrating to ensure compatibility with your workflow
- Some rules may conflict with your existing project standards
- Consider selectively copying sections rather than using the entire file

## 🚀 How to Use Global Rules

### 1. Choose Relevant Rules

Select global rules that match your project's tools and workflow. Multiple rule sets can be combined when they don't conflict.

### 2. Add to Your Project

Global rules can be integrated via:

- **CLAUDE.md** at the root of your project for Claude Code
- **.cursorrules** at the root of your project for Cursor
- **.windsurfrules** at the root of your project for Windsurf
- Similar setup for other AI coding assistants

## ⚡ Quick Integration

For most projects, simply append the global rules to your existing CLAUDE.md (or whatever the file is for your AI coding assistant):

```markdown
# [Your existing CLAUDE.md content]

# Global Rules

[Paste relevant global rules here]
```

## 🔄 Compatibility

Global rules are designed to be:

- **Non-destructive** - Won't break existing workflows
- **Complementary** - Enhance rather than override
- **Flexible** - Can be selectively applied

## 📝 Creating Custom Global Rules

When creating new global rules:

1. Focus on high-level behaviors, not implementation details
2. Make them tool-agnostic where possible
3. Document when they should/shouldn't be used
4. Include examples of the desired behavior
5. Test compatibility with common project types

## 🤝 Contributing

To add new global rules:

1. Create a new directory under `global-rules/`
2. Include a comprehensive README.md
3. Add the RULES.md with the actual rules (or AI-specific files like CLAUDE.md, .cursorrules, .windsurfrules)
4. Update this main README with a description
5. Submit a PR with usage examples

**Note**: Some global rules may need different files for different AI coding assistants. For example, Archon includes CLAUDE.md, .cursorrules, and .windsurfrules because the rules vary slightly between AI assistants. Include the appropriate files for your target platforms.

## 📚 Best Practices

- **Start minimal** - Add only the global rules you need
- **Monitor behavior** - Ensure rules improve rather than hinder
- **Iterate gradually** - Refine rules based on actual usage
- **Document conflicts** - Note any incompatibilities discovered
