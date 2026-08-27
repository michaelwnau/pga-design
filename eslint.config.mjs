// Thin ESLint layer that runs ONLY the @next/next plugin rules that oxlint
// does not cover (e.g. no-img-element, no-html-link-for-pages, no-sync-scripts,
// google-font-display). All other linting is handled by oxlint — this config
// deliberately pulls in no typescript-eslint rule engine, only the parser so
// @next/next can read TSX.
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
