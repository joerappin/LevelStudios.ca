import express from 'express'
import multer from 'multer'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CUSTOMERS_DIR = path.join(__dirname, 'customers')
if (!fs.existsSync(CUSTOMERS_DIR)) fs.mkdirSync(CUSTOMERS_DIR, { recursive: true })

const WORKERS_DIR = path.join(__dirname, 'workers')
if (!fs.existsSync(WORKERS_DIR)) fs.mkdirSync(WORKERS_DIR, { recursive: true })

const CLIENTS_DIR = path.join(__dirname, 'clients')
if (!fs.existsSync(CLIENTS_DIR)) fs.mkdirSync(CLIENTS_DIR, { recursive: true })

const app = express()
app.use(cors())
app.use(express.json())
app.use('/files', express.static(CUSTOMERS_DIR))

app.get('/api/folders', (req, res) => {
  const result = []
  if (!fs.existsSync(CUSTOMERS_DIR)) return res.json([])
  for (const email of fs.readdirSync(CUSTOMERS_DIR)) {
    const emailDir = path.join(CUSTOMERS_DIR, email)
    if (!fs.statSync(emailDir).isDirectory()) continue
    const reservations = {}
    for (const resId of fs.readdirSync(emailDir)) {
      const resDir = path.join(emailDir, resId)
      if (!fs.statSync(resDir).isDirectory()) continue
      reservations[resId] = fs.readdirSync(resDir)
        .filter(f => fs.statSync(path.join(resDir, f)).isFile())
        .map(f => {
          const stat = fs.statSync(path.join(resDir, f))
          return { name: f, size: stat.size, modified: stat.mtime.toISOString() }
        })
    }
    result.push({ email, reservations })
  }
  res.json(result)
})

app.post('/api/folders/sync', (req, res) => {
  const list = req.body
  for (const { email, resId } of list) {
    fs.mkdirSync(path.join(CUSTOMERS_DIR, email, resId), { recursive: true })
  }
  res.json({ ok: true })
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const email = decodeURIComponent(req.params.email)
    const { resId } = req.params
    const dir = path.join(CUSTOMERS_DIR, email, resId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, file.originalname)
})
const upload = multer({ storage })

app.post('/api/folders/:email/:resId/upload', upload.array('files'), (req, res) => {
  res.json({ ok: true, files: req.files.map(f => ({ name: f.filename, size: f.size })) })
})

app.delete('/api/folders/:email/:resId/:filename', (req, res) => {
  const email = decodeURIComponent(req.params.email)
  const { resId, filename } = req.params
  const p = path.join(CUSTOMERS_DIR, email, resId, filename)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  res.json({ ok: true })
})

app.delete('/api/folders/:email/:resId', (req, res) => {
  const email = decodeURIComponent(req.params.email)
  const { resId } = req.params
  const dir = path.join(CUSTOMERS_DIR, email, resId)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  res.json({ ok: true })
})

// ─── ZIP download ─────────────────────────────────────────────────────────────
const ZIP_EXTS = {
  video: ['mp4','mov','avi','mkv','webm','m4v','wmv','flv','ogv','3gp'],
  audio: ['mp3','wav','aac','ogg','flac','m4a','wma','opus','aiff'],
  image: ['jpg','jpeg','png','gif','webp','bmp','svg','tiff','tif'],
}

app.get('/api/folders/:email/:resId/zip', (req, res) => {
  const email = decodeURIComponent(req.params.email)
  const { resId } = req.params
  const type = req.query.type || 'all' // 'all' | 'video' | 'audio' | 'image'
  const files = req.query.files ? req.query.files.split(',').map(decodeURIComponent) : null

  const dir = path.join(CUSTOMERS_DIR, email, resId)
  if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Dossier introuvable' })

  const allFiles = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile())
  const filtered = allFiles.filter(f => {
    if (files) return files.includes(f)
    if (type === 'all') return true
    const ext = f.split('.').pop()?.toLowerCase() || ''
    return (ZIP_EXTS[type] || []).includes(ext)
  })

  if (filtered.length === 0) return res.status(404).json({ error: 'Aucun fichier correspondant' })

  const label = type === 'all' ? 'rushes' : type
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="level-studios_${resId}_${label}.zip"`)

  const archive = archiver('zip', { zlib: { level: 6 } })
  archive.on('error', err => { console.error('ZIP error', err); res.status(500).end() })
  archive.pipe(res)
  filtered.forEach(f => archive.file(path.join(dir, f), { name: f }))
  archive.finalize()
})

// ─── Workers archive ──────────────────────────────────────────────────────────
app.get('/api/workers', (req, res) => {
  const workers = fs.readdirSync(WORKERS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(WORKERS_DIR, f), 'utf8')) } catch { return null }
    })
    .filter(Boolean)
  res.json(workers)
})

app.post('/api/workers', (req, res) => {
  const worker = req.body
  if (!worker?.id) return res.status(400).json({ error: 'id requis' })
  const filename = `${worker.id}.json`
  fs.writeFileSync(path.join(WORKERS_DIR, filename), JSON.stringify(worker, null, 2), 'utf8')
  res.json({ ok: true, filename })
})

app.delete('/api/workers/:id', (req, res) => {
  const p = path.join(WORKERS_DIR, `${req.params.id}.json`)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  res.json({ ok: true })
})

// ─── Clients archive ───────────────────────────────────────────────────────────
app.get('/api/clients', (req, res) => {
  const clients = fs.readdirSync(CLIENTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(CLIENTS_DIR, f), 'utf8')) } catch { return null }
    })
    .filter(Boolean)
  res.json(clients)
})

app.post('/api/clients', (req, res) => {
  const client = req.body
  if (!client?.id) return res.status(400).json({ error: 'id requis' })
  const filename = `${client.id}.json`
  fs.writeFileSync(path.join(CLIENTS_DIR, filename), JSON.stringify(client, null, 2), 'utf8')
  res.json({ ok: true, filename })
})

app.delete('/api/clients/:id', (req, res) => {
  const p = path.join(CLIENTS_DIR, `${req.params.id}.json`)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  res.json({ ok: true })
})

app.listen(3001, () => console.log('📁 File server → http://localhost:3001'))
