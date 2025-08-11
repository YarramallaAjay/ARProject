import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

type Preset = { id: string; name: string; number: string; theme: string }
const presets = new Map<string, Preset>()

app.get('/', (_req, res) => {
  res.type('text/plain').send('Three.js Card Server is running. Use GET /api/presets or POST /api/presets.')
})

app.get('/api/presets', (_req, res) => {
  res.json(Array.from(presets.values()))
})

app.post('/api/presets', (req, res) => {
  const { id, name, number, theme } = req.body as Preset
  if (!id || !name || !number || !theme) return res.status(400).json({ error: 'Missing fields' })
  presets.set(id, { id, name, number, theme })
  res.json({ ok: true })
})

const PORT = process.env.PORT || 5180
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`)) 