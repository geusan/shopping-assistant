import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: { alias: { '@fits/core': path.resolve('packages/core/src/index.ts') } },
  test: { include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'], environment: 'node', testTimeout: 10_000 },
});
