import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    files: ["**/*.{ts,tsx,cts,mts}"],
    languageOptions: {
      parser: eslintParserTypeScript,
    },
  },
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "readable-tailwind": eslintPluginReadableTailwind,
    },
    rules: {
      "readable-tailwind/multiline": [
        "warn",
        { group: "newLine", lineBreakStyle: "windows" },
      ],
      "readable-tailwind/sort-classes": ["warn", { order: "improved" }],
      "readable-tailwind/no-unnecessary-whitespace": [
        "warn",
        { allowMultiline: true },
      ],
    },
  },
];
