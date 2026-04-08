import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@repo/utils$":
      "<rootDir>/../../shared-packages/utils/src/index.ts",
  },
};

export default config;
