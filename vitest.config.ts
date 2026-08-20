import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * The API's tests run in node, against the route handlers themselves —
 * imported and called with a Request, no server started and no port
 * bound. What they exercise is therefore the same code the deployment
 * runs, not a mock of it.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
