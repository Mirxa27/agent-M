module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: ["dist", "node_modules", "coverage"],
  rules: {
    // place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    "react/react-in-jsx-scope": "off", // React 17+ with new JSX transform
  },
};