import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next. Recursive (**/) so nested git
    // worktrees (e.g. .claude/worktrees/<name>/.next) don't get walked too.
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    // Generated Prisma client — machine-written, not lintable source
    "**/src/generated/**",
    // Nested worktrees created for isolated agent tasks
    ".claude/worktrees/**",
  ]),
  // Allow explicit `any` in this project (turn off the rule from upstream)
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
