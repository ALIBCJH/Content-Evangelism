import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * The API's tests run in node, against the route handlers themselves —
 * imported and called with a Request, no server started and no port
 * bound. What they exercise is therefore the same code the deployment
 * runs, not a mock of it.
 *
 * .tsx is included for the desk's own board, whose bands are rendered to
 * markup with react-dom/server and read back. That needs no browser and
 * no new dependency, and it catches the half of a component that
 * arithmetic tests cannot — the empty array it throws on, the share it
 * divides by nothing.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  /* The same JSX transform the app is built with, so a band under test is
     the band that ships rather than one needing React in scope. */
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
