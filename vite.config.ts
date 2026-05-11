import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * Vite plugin that serves /api/* routes in development mode.
 * This mimics the Vercel serverless function runtime so you can
 * run `npm run dev` without needing `vercel dev` separately.
 *
 * In production (Vercel), the real serverless functions in api/ handle these routes.
 */
function apiDevMiddleware(): Plugin {
  let envLoaded = false

  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        // Only intercept /api/* routes
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        // Load ALL .env vars into process.env (not just VITE_*).
        // Using prefix '' tells loadEnv to load every variable.
        if (!envLoaded) {
          const env = loadEnv('development', process.cwd(), '')
          for (const [key, val] of Object.entries(env)) {
            if (!process.env[key]) {
              process.env[key] = val
            }
          }
          envLoaded = true
        }

        // Parse JSON body for POST requests
        let body: Record<string, any> = {}
        if (req.method === 'POST') {
          body = await new Promise((resolve) => {
            let data = ''
            req.on('data', (chunk: Buffer) => { data += chunk.toString() })
            req.on('end', () => {
              try { resolve(JSON.parse(data)) }
              catch { resolve({}) }
            })
          })
        }

        // Resolve the handler file from the api/ directory
        const apiRoute = req.url.split('?')[0].replace('/api/', '')
        const handlerPath = path.resolve(__dirname, `api/${apiRoute}.ts`)

        try {
          // Use Vite's SSR module loader to load the TypeScript handler
          const mod = await server.ssrLoadModule(handlerPath)
          if (!mod.default) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `No default export found in api/${apiRoute}.ts` }))
            return
          }

          // Augment req with parsed body and query (like Vercel does)
          const reqAny = req as any
          reqAny.body = body
          reqAny.query = Object.fromEntries(
            new URL(req.url!, `http://${req.headers.host || 'localhost'}`).searchParams
          )

          // Augment res with Vercel-like .status() and .json() helpers
          const resAny = res as any
          resAny.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
            return res
          }
          resAny.status = (code: number) => {
            res.statusCode = code
            return res // Chainable: res.status(200).json({...})
          }

          // Call the handler
          await mod.default(req, res)
        } catch (err: any) {
          console.error('[api-dev-middleware] Error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'Dev server API error',
            message: err.message,
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDevMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
