import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "react/no-children-prop": "off",
      // Records from the API are keyed `id` (Postgres via Drizzle). `_id` came
      // from the previous backend and is always undefined here (#34). With
      // `any` allowed above, TypeScript can't catch it, so lint does.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='_id']",
          message: "Records are keyed `id`, not `_id` (#34).",
        },
        {
          selector: "Property[key.name='_id'], TSPropertySignature[key.name='_id']",
          message: "Records are keyed `id`, not `_id` (#34).",
        },
      ],
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
    },
  },
];

export default eslintConfig;
