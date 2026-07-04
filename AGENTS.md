# Agent Rules

- Before creating a new page or changing UI, read `DESIGN.md` and follow it.
- Reuse existing components, tokens, navigation config, and build scripts before adding new abstractions.
- Keep verification proportional to risk: small style or doc changes do not require broad audits unless they touch shared routing, build output, deployment, or critical flows.
- Do not change medical/professional content or business logic unless the user explicitly asks for that.
