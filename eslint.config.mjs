import js from "@eslint/js";
import nextVitals from "eslint-config-next";

export default [
  js.configs.recommended,
  ...nextVitals,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];