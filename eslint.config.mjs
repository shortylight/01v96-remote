import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**"]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["server.ts", "server/**/*.ts"],
        languageOptions: {
            globals: globals.node
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
                caughtErrors: "none"
            }],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-require-imports": "off"
        }
    }
);
