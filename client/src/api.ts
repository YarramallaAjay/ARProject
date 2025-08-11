export type Preset = { id: string; name: string; number: string; theme: string }

const BASE = '' // use Vite proxy in dev

export async function listPresets(): Promise<Preset[]> {
  const res = await fetch(`${BASE}/api/presets`)
  if (!res.ok) throw new Error('Failed to fetch presets')
  return res.json()
}

export async function savePreset(p: Preset): Promise<void> {
  const res = await fetch(`${BASE}/api/presets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  })
  if (!res.ok) throw new Error('Failed to save preset')
} 