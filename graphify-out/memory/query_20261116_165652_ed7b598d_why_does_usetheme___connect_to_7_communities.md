---
type: "query"
date: "2026-11-16T16:56:52.381944+00:00"
question: "Why does useTheme() connect to 7 communities?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["useTheme()", "ThemeProvider.tsx", "theme/index.ts", "ui/index.ts", "AppText()"]
---

# Q: Why does useTheme() connect to 7 communities?

## Answer

Expanded from original query via vocab: [theme, provider, context, colors, typography, spacing, radius, palette, light, dark]. useTheme() (src/theme/ThemeProvider.tsx:68) has degree 100: 52 calls + 45 imports + 2 re_exports + 1 contains. Its neighbors span 8 communities and 98 files: 46 in src/ui, 27 in src/screens, 23 in src/components, 2 in src/navigation, 2 in src/theme. Community attribution puts it in C0 (Gym Admin Management Screens, 37 edges) rather than C2 (Theme Tokens & UI Kit, 25 edges) because cluster gravity follows its largest consumer block, not its definition site. It is re-exported twice — src/theme/index.ts:158 and src/ui/index.ts:26 — which is what pulls it into every screen and modal. Architectural finding: every .tsx under src/ui, src/screens and src/components calls useTheme; the only non-consumer is src/components/DataSync.tsx, which is headless. So the design-token rule in src/theme/index.ts:3 ('never statically') holds. Risk: it is the single chokepoint of the design system — changing ThemeContextValue's shape touches 98 files. Also a real runtime import cycle exists: src/theme/index.ts:158 re-exports ThemeProvider, which imports darkColors/lightColors from ./index (values, not types).

## Outcome

- Signal: useful

## Source Nodes

- useTheme()
- ThemeProvider.tsx
- theme/index.ts
- ui/index.ts
- AppText()