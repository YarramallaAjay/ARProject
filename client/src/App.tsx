import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import './App.css'

import { Card3D } from './Card3D'
import { useApp, type ThemeKey } from './store'
import { formatCardNumber, luhnCheck } from './utils'
import { listPresets, savePreset, type Preset } from './api'

function useWebGLSupport() {
  return useMemo(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    } catch {
      return false
    }
  }, [])
}

export default function App() {
  const theme = useApp((s) => s.theme)
  const setTheme = useApp((s) => s.setTheme)
  const triggerFlip = useApp((s) => s.triggerFlip)
  const name = useApp((s) => s.name)
  const number = useApp((s) => s.number)
  const setName = useApp((s) => s.setName)
  const setNumber = useApp((s) => s.setNumber)

  const [presets, setPresets] = useState<Preset[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const webgl = useWebGLSupport()

  useEffect(() => {
    console.log('App mounted')
    setLoading(true)
    listPresets()
      .then((r) => { setPresets(r); setApiError(null) })
      .catch((err) => { console.error('API error', err); setApiError(String(err)) })
      .finally(() => setLoading(false))
  }, [])

  const onNumberChange = (v: string) => setNumber(formatCardNumber(v))

  const onShot = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    console.log('Canvas element present?', !!canvas)
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'card.png'
    a.click()
  }

  const onSavePreset = async () => {
    setSaving(true)
    const p: Preset = { id: crypto.randomUUID(), name, number, theme }
    try {
      await savePreset(p)
      setPresets((arr) => [p, ...arr])
      setApiError(null)
    } catch (err) {
      console.error('Save error', err)
      setApiError(String(err))
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (p: Preset) => {
    setName(p.name)
    setNumber(p.number)
    setTheme(p.theme as ThemeKey)
  }

  const isValid = luhnCheck(number)

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="group">
          <label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeKey)}>
            <option value="midnight">Midnight Blue</option>
            <option value="sunset">Sunset Gold</option>
            <option value="neon">Neon Purple</option>
            <option value="minimal">Minimal White</option>
            <option value="carbon">Carbon Fiber</option>
          </select>
        </div>
        <div className="group">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cardholder" />
        </div>
        <div className="group">
          <label>Number</label>
          <input value={number} onChange={(e) => onNumberChange(e.target.value)} placeholder="#### #### #### ####" className={isValid ? '' : 'invalid'} />
        </div>
        <button onClick={triggerFlip}>Flip</button>
        <button onClick={onShot}>Screenshot</button>
        <button onClick={onSavePreset} disabled={saving || !isValid}>{saving ? 'Saving…' : 'Save preset'}</button>
      </div>

      <div className="presets">
        <div className="title">Presets {loading && <span className="muted">(loading…)</span>}</div>
        {apiError && <div className="muted" style={{ color: '#ef4444' }}>API: {apiError}</div>}
        <div className="list">
          {presets.length === 0 && <div className="muted">No presets yet</div>}
          {presets.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p)}>
              <span>{p.name}</span>
              <span className="muted">{p.number}</span>
              <span className="muted">{p.theme}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, padding: '6px 10px', background: 'rgba(2,6,23,0.65)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12 }}>
        <span style={{ color: '#cbd5e1', fontSize: 12 }}>WebGL: {webgl ? 'available' : 'not available'}</span>
      </div>

      <div className="scene" style={{ outline: '1px dashed #334155' }}>
        {webgl && (
          <Canvas style={{ width: '100%', height: '100%' }}           dpr={[1, 2]}
            camera={{ fov: 50, position: [0.7, 0.55, 3] }}
            onCreated={({ gl }) => { console.log('Canvas mounted'); gl.setClearColor('#0a0f1e'); }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          >
            <color attach="background" args={["#0a0f1e"]} />
            <fog attach="fog" args={[0x0b1022, 25, 120]} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={[0xbcd7ff, 0x0b0f1e, 0.8]} />
            <directionalLight position={[2.5, 3, 4]} intensity={1.2} />
            <directionalLight position={[-3.5, 1, -2.5]} intensity={0.6} color={'#88aaff'} />

            <axesHelper args={[5]} />
            <Card3D />

            <OrbitControls enablePan={false} minDistance={0.8} maxDistance={10} />
          </Canvas>
        )}
      </div>
    </div>
  )
}
