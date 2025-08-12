import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

import { Card3D } from './Card3D'
import { useApp, type ThemeKey } from './store'
import { formatCardNumber, luhnCheck } from './utils'
import { listPresets, savePreset, type Preset } from './api'
import ScanPanel from './ScanPanel'
import ARScene from './ARScene'

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
  const [arMode, setArMode] = useState(false)

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

  if (arMode) {
    return <ARScene />
  }

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
        <button onClick={() => setArMode(true)} style={{ background: '#7c3aed' }}>AR Mode</button>
      </div>

      {/* <div className="presets">
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
      </div> */}

      <div className="scene">
        {webgl && (
          <Canvas
            dpr={[1, 2]}
            shadows
            camera={{ fov: 45, position: [0.1, 0.25, 2.2] }}
            onCreated={({ gl }) => { console.log('Canvas mounted'); gl.setClearColor('#0a0f1e'); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap as any; }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            style={{ width: '100%', height: '100%' }}
          >
            <color attach="background" args={["#0a0f1e"]} />
            <fog attach="fog" args={[0x0b1022, 25, 120]} />
            <ambientLight intensity={0.45} />
            {/* Key light (casts soft shadow) */}
            <directionalLight
              position={[2.2, 2.5, 2.0]}
              intensity={1.35}
              color={'#ffffff'}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-near={0.5}
              shadow-camera-far={10}
              shadow-camera-left={-2}
              shadow-camera-right={2}
              shadow-camera-top={2}
              shadow-camera-bottom={-2}
            />
            {/* Fill and rim */}
            <hemisphereLight args={[0xbcd7ff, 0x0b0f1e, 0.55]} />
            <directionalLight position={[-2.5, 1.5, -2.0]} intensity={0.5} color={'#88aaff'} />

            <Card3D />

            <OrbitControls enablePan={false} minDistance={1.0} maxDistance={6} />
          </Canvas>
        )}
      </div>

      <ScanPanel />
    </div>
  )
}
