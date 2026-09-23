# Testdog API Server

Testdog is an open-source, community-powered API server offering a growing collection of free-to-use APIs for your projects. Whether you're building a side project, a portfolio piece, or an MVP feel free to plug in and go!

---

## Use These APIs in Your Projects

All APIs provided by Testdog are **completely free**. You can integrate them into your personal or commercial projects without any restrictions.

- No API keys required
- No rate limiting (unless explicitly mentioned)
- Easy to explore and consume

> ✨ Want a specific API? Raise a request or contribute by adding one yourself!

---

## Open for Contributions

Testdog is **open-source**, and we're always looking for contributors!

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Add your API or improve existing ones
4. Raise a Pull Request (PR)

If your PR aligns with our development direction and passes checks we’ll merge it. Simple as that.

> Please make sure to follow best practices and write clean, modular code.

---

## GenAI Implementation Guide

The API now includes a public guide endpoint for planning a LangChain-based GenAI feature.

- `GET /api/v1/gen-ai-implementation` returns the full guide for single-agent, multi-agent, and LangGraph approaches.
- `GET /api/v1/gen-ai-implementation?mode=single` returns only the single-agent blueprint.
- `GET /api/v1/gen-ai-implementation?mode=multi` returns the multi-agent blueprint.
- `GET /api/v1/gen-ai-implementation?mode=langgraph` returns the LangGraph blueprint.

The response is structured so a UI can render hero copy, theme data, comparison cards, and implementation steps.

---

## Found a Bug or Issue?

If you encounter any problems or have suggestions:

- [Open an issue](https://github.com/yourusername/testdog/issues) describing the problem.
- Be as detailed as possible so contributors can replicate and resolve it.

---

## Note

Testdog is powered entirely by its contributors. The addition of any new API depends on community support and availability. So if something’s missing feel free to build it!

---
