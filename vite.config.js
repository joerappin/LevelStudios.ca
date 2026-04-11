import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// ─── Account helpers ───────────────────────────────────────────────────────────
function sanitizeEmail(email) {
  return email.toLowerCase().trim().replace(/[^a-z0-9._@-]/g, '_')
}

function activeFolder(account, publicDir) {
  if (account.type === 'client') {
    return path.join(publicDir, 'customers', sanitizeEmail(account.email))
  }
  if (account.roleKey === 'admin' || account.type === 'admin') {
    return path.join(publicDir, 'admin', account.id)
  }
  return path.join(publicDir, 'workers', account.id)
}

function trashFolder(account, publicDir) {
  if (account.type === 'client') {
    return path.join(publicDir, 'trash', 'customers', sanitizeEmail(account.email))
  }
  if (account.roleKey === 'admin' || account.type === 'admin') {
    return path.join(publicDir, 'trash', 'admin', account.id)
  }
  return path.join(publicDir, 'trash', 'workers', account.id)
}

function readAccounts(publicDir, fromTrash = false) {
  const accounts = []
  const base = fromTrash ? path.join(publicDir, 'trash') : publicDir
  for (const folder of ['customers', 'workers', 'admin']) {
    const dir = path.join(base, folder)
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

function writeAccount(account, publicDir, inTrash = false) {
  const folder = inTrash ? trashFolder(account, publicDir) : activeFolder(account, publicDir)
  fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(path.join(folder, 'account.json'), JSON.stringify(account, null, 2))
}

function deleteAccountFile(account, publicDir, fromTrash = false) {
  const folder = fromTrash ? trashFolder(account, publicDir) : activeFolder(account, publicDir)
  const file = path.join(folder, 'account.json')
  if (fs.existsSync(file)) fs.unlinkSync(file)
  try { fs.rmdirSync(folder) } catch {}
}

// ─── Reservation helpers ───────────────────────────────────────────────────────
// Structure : public/customers/{email}/{resId}/reservation.json
function readReservations(publicDir) {
  const customersDir = path.join(publicDir, 'customers')
  if (!fs.existsSync(customersDir)) return []
  const reservations = []
  for (const emailFolder of fs.readdirSync(customersDir)) {
    const emailDir = path.join(customersDir, emailFolder)
    if (!fs.statSync(emailDir).isDirectory()) continue
    for (const entry of fs.readdirSync(emailDir)) {
      const file = path.join(emailDir, entry, 'reservation.json')
      if (fs.existsSync(file)) {
        try { reservations.push(JSON.parse(fs.readFileSync(file, 'utf8'))) } catch {}
      }
    }
  }
  return reservations
}

function writeReservation(reservation, publicDir) {
  if (!reservation.client_email) return
  const clientDir = path.join(publicDir, 'customers', sanitizeEmail(reservation.client_email), String(reservation.id))
  fs.mkdirSync(clientDir, { recursive: true })
  fs.writeFileSync(path.join(clientDir, 'reservation.json'), JSON.stringify(reservation, null, 2))
}

function deleteReservationFile(id, publicDir) {
  const customersDir = path.join(publicDir, 'customers')
  if (!fs.existsSync(customersDir)) return
  for (const emailFolder of fs.readdirSync(customersDir)) {
    const resDir = path.join(customersDir, emailFolder, String(id))
    const resFile = path.join(resDir, 'reservation.json')
    if (fs.existsSync(resFile)) {
      fs.unlinkSync(resFile)
      try { fs.rmdirSync(resDir) } catch {}
      return
    }
  }
}

// ─── Local Accounts API plugin ────────────────────────────────────────────────
function localAccountsPlugin() {
  const publicDir = path.resolve(__dirname, 'public')

  return {
    name: 'local-accounts-api',
    configureServer(server) {
      server.middlewares.use('/api/accounts.php', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }

        const url = new URL(req.url, 'http://localhost')
        const wantTrash = url.searchParams.get('trash') === '1'

        if (req.method === 'GET') {
          res.end(JSON.stringify(readAccounts(publicDir, wantTrash)))
          return
        }

        if (req.method === 'DELETE') {
          let body = ''
          req.on('data', c => { body += c })
          req.on('end', () => {
            try {
              const { id, _fromTrash } = JSON.parse(body)
              const all = readAccounts(publicDir, !!_fromTrash)
              const account = all.find(a => a.id === id)
              if (!account) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
              deleteAccountFile(account, publicDir, !!_fromTrash)
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
                const { _action, ...patch } = data

                if (_action === 'trash') {
                  // Move account from active → trash
                  const account = readAccounts(publicDir, false).find(a => a.id === patch.id)
                  if (!account) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
                  writeAccount({ ...account, trashed_at: new Date().toISOString() }, publicDir, true)
                  deleteAccountFile(account, publicDir, false)
                  res.end(JSON.stringify({ success: true })); return
                }

                if (_action === 'restore') {
                  // Move account from trash → active
                  const account = readAccounts(publicDir, true).find(a => a.id === patch.id)
                  if (!account) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
                  const { trashed_at, ...restored } = account
                  writeAccount(restored, publicDir, false)
                  deleteAccountFile(account, publicDir, true)
                  res.end(JSON.stringify({ success: true })); return
                }

                // Normal PATCH — merge fields
                const existing = readAccounts(publicDir, false).find(a => a.id === patch.id)
                if (!existing) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
                writeAccount({ ...existing, ...patch }, publicDir, false)
              } else {
                writeAccount(data, publicDir, false)
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

// ─── Local Reservations API plugin ───────────────────────────────────────────
function localReservationsPlugin() {
  const publicDir = path.resolve(__dirname, 'public')

  return {
    name: 'local-reservations-api',
    configureServer(server) {
      server.middlewares.use('/api/reservations.php', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }

        const url = new URL(req.url, 'http://localhost')
        const filterEmail = url.searchParams.get('client_email')

        if (req.method === 'GET') {
          const includeTrashed = url.searchParams.get('include_trashed') === '1'
          let all = readReservations(publicDir)
          if (!includeTrashed) all = all.filter(r => !r.trashed)
          if (filterEmail) all = all.filter(r => r.client_email === filterEmail)
          all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
          res.end(JSON.stringify(all))
          return
        }

        let body = ''
        req.on('data', c => { body += c })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)

            if (req.method === 'POST') {
              if (!data.id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
              writeReservation(data, publicDir)
              res.end(JSON.stringify({ success: true })); return
            }

            if (req.method === 'PATCH') {
              if (!data.id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
              const all = readReservations(publicDir)
              const existing = all.find(r => String(r.id) === String(data.id))
              if (!existing) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return }
              writeReservation({ ...existing, ...data }, publicDir)
              res.end(JSON.stringify({ success: true })); return
            }

            if (req.method === 'DELETE') {
              if (!data.id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
              deleteReservationFile(data.id, publicDir)
              res.end(JSON.stringify({ success: true })); return
            }

            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    },
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [react(), localAccountsPlugin(), localReservationsPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { host: true },
})
