import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv('test', process.cwd(), '');
  
  return {
    test: {
      globals: true,
      environment: 'node',
      testTimeout: 30000,
      hookTimeout: 30000,
      setupFiles: ['./test/setup.ts'],
      env: {
        ...env,
        JWT_SECRET: env.JWT_SECRET || 'test-jwt-secret-for-testing-only',
        MONGO_URI: env.MONGO_URI || 'mongodb://localhost:27017/samsoul-test',
        NODE_ENV: 'test',
      }
    },
  };
})