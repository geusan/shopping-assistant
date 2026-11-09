import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e',timeout:60_000,expect:{timeout:15_000},workers:1,fullyParallel:false,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://localhost:5173',trace:'retain-on-failure',screenshot:'only-on-failure',actionTimeout:15000},
  webServer:[
    {command:'pnpm exec tsx apps/api/src/server.ts',url:'http://localhost:4317/api/health',reuseExistingServer:false,env:{NODE_ENV:'test',FITS_TEST_MODE:'1'},timeout:30_000},
    {command:'pnpm dev:web',url:'http://localhost:5173',reuseExistingServer:false,timeout:30_000},
  ],
});
