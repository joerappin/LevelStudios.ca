import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeEmail(email) {
  return email.toLowerCase().trim().replace(/[^a-z0-9._@-]/g, '_')
}

function accountFolder(account, publicDir) {
  if (account.type === 'client') {
    return path.join(publicDir, 'customers', sanitizeEmail(account.email))
  }
  if (account.roleKey === 'admin' || account.type === 'admin') {
    return path.join(publicDir, 'admin', account.id)
  }
  return path.join(publicDir, 'workers', account.id)
}

function readAllAccounts(publicDir) {
  const accounts = []
  for (const folder of ['customers', 'workers', 'admin']) {
    const dir = path.join(publicDir, folder)
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir)) {
      const file = path.join(dir, entry, 'account.json')
      if (fs.existsSync(file)) {
        try { accounts.push(JSON.parse(fs.readFileSync(file, 'utf8'))) } catch {}
      }
    }
  }
  return accounts
}

function writeAccount(account, publicDir) {
  const folder = accountFolder(account, publicDir)
  fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(path.join(folder, 'account.json'), JSON.stringify(account, null, 2))
}

// ─── Vite plugin — local account API ──────────────────────────────────────────
function localAccountsPlugin() {
  const publicDir = path.resolve(__dirname, 'public')

  return {
    name: 'local-accounts-api',
    configureServer(server) {
      server.middlewares.use('/api/accounts.php', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }

        // GET — list all accounts
        if (req.method === 'GET') {
          res.end(JSON.stringify(readAllAccounts(publicDir)))
          return
        }

        // POST — create account / PATCH — update fields
        if (req.method === 'DELETE') {
          let body = ''
          req.on('data', c => { body += c })
          req.on('end', () => {
            try {
              const { id } = JSON.parse(body)
              const all = readAllAccounts(publicDir)
              const account = all.find(a => a.id === id)
              if (!account) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
              const folder = accountFolder(account, publicDir)
              const file = path.join(folder, 'account.json')
              if (fs.existsSync(file)) fs.unlinkSync(file)
              res.end(JSON.stringify({ success: true }))
            } catch (e) {
              res.statusCode = 400; res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        if (req.method === 'POST' || req.method === 'PATCH') {
          let body = ''
          req.on('data', c => { body += c })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)

              if (req.method === 'PATCH') {
                // Merge with existing account
                const all = readAllAccounts(publicDir)
                const existing = all.find(a => a.id === data.id)
                if (!existing) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
                writeAccount({ ...existing, ...data }, publicDir)
              } else {
                writeAccount(data, publicDir)
              }

              res.end(JSON.stringify({ success: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
      })
    },
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [react(), localAccountsPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { host: true },
})
