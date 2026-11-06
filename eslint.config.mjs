import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const config = [
  ...nextCoreWebVitals,
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".sst/**",
      "node_modules/**",
      "public/**",
      ".env",
      "package-lock.json",
      "pnpm-lock.yaml",
      "postcss.config.mjs",
      "tailwind.config.ts",
      "tsconfig.json",
      "src/types/supabase.ts",
    ],
  },
  {
    rules: {
      "eol-last": "error",
      "max-len": ["error", { code: 100 }],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": ["warn"],
    },
  },
];

export default config;
