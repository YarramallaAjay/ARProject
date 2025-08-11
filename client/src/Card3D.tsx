import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useApp, type ThemeKey } from './store'

export function Card3D() {
  const groupRef = useRef<THREE.Group>(null)
  const cardRef = useRef<THREE.Group>(null)
  const debugCubeRef = useRef<THREE.Mesh>(null)

  const theme = useApp((s) => s.theme)
  const flipTrigger = useApp((s) => s.flipTrigger)

  const themeProps = useMemo(() => {
    const defs: Record<ThemeKey, { color: number; accent: number; metalness: number; roughness: number; emissive?: number; emissiveIntensity?: number }> = {
      midnight: { color: 0x1e293b, accent: 0x60a5fa, metalness: 0.5, roughness: 0.4 },
      sunset:   { color: 0xb45309, accent: 0xf59e0b, metalness: 0.6, roughness: 0.5, emissive: 0x331a06, emissiveIntensity: 0.2 },
      neon:     { color: 0x6b21a8, accent: 0xa855f7, metalness: 0.6, roughness: 0.4 },
      minimal:  { color: 0xe2e8f0, accent: 0x0ea5e9, metalness: 0.1, roughness: 0.5 },
      carbon:   { color: 0x0f172a, accent: 0x22d3ee, metalness: 0.8, roughness: 0.3 },
    }
    return defs[theme]
  }, [theme])

  const { geometry, thickness } = useMemo(() => {
    const width = 8.56 / 10
    const height = 5.398 / 10
    const t = 0.078 / 10
    const r = 0.55 / 10

    const shape = new THREE.Shape()
    const x = -width / 2
    const y = -height / 2

    shape.moveTo(x + r, y)
    shape.lineTo(x + width - r, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + r)
    shape.lineTo(x + width, y + height - r)
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    shape.lineTo(x + r, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)

    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: t,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003,
      curveSegments: 32,
    })

    extrude.translate(0, 0, -t / 2)
    extrude.computeVertexNormals()

    return { geometry: extrude, thickness: t }
  }, [])

  const flipState = useRef<{ start: number; from: number; to: number } | null>(null)
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    flipState.current = { start: performance.now(), from: card.rotation.y, to: card.rotation.y + Math.PI }
  }, [flipTrigger])

  useFrame((state, dt) => {
    const g = groupRef.current
    const c = cardRef.current
    if (g) {
      g.position.y = Math.sin(state.clock.elapsedTime * 1.6) * 0.02
      g.rotation.y += 0.003 * dt
    }
    if (c && flipState.current) {
      const { start, from, to } = flipState.current
      const t = Math.min(1, (state.clock.elapsedTime * 1000 - start) / 550)
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      c.rotation.y = from + (to - from) * ease
      if (t >= 1) flipState.current = null
    }
    if (debugCubeRef.current) {
      debugCubeRef.current.rotation.x += 0.6 * dt
      debugCubeRef.current.rotation.y += 1.0 * dt
    }
  })

  const frontZ = thickness / 2 + 0.001
  const backZ = -thickness / 2 - 0.001

  return (
    <group ref={groupRef}>
      <group ref={cardRef} rotation={[-0.2, 0.5, 0]} scale={1.8}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color={themeProps.color} metalness={themeProps.metalness} roughness={themeProps.roughness} />
        </mesh>

        <mesh position={[-0.22, 0.08, frontZ]}>
          <boxGeometry args={[0.18, 0.14, 0.01]} />
          <meshStandardMaterial color={0xd4af37} metalness={1} roughness={0.5} />
        </mesh>

        <mesh position={[0.25, 0.09, frontZ]}>
          <circleGeometry args={[0.08, 40]} />
          <meshStandardMaterial color={themeProps.accent} emissive={new THREE.Color(themeProps.accent)} emissiveIntensity={0.2} />
        </mesh>

        <mesh position={[0, -0.05, frontZ]}>
          <planeGeometry args={[0.55, 0.05]} />
          <meshStandardMaterial color={0x0e0e10} emissive={new THREE.Color(themeProps.accent)} roughness={0.8} />
        </mesh>

        <mesh position={[0, 0.15, backZ]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.72, 0.09]} />
          <meshStandardMaterial color={0x0c0c0c} />
        </mesh>

        <mesh position={[0.03, 0.02, backZ]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.4, 0.05]} />
          <meshStandardMaterial color={0xf1f5f9} />
        </mesh>

        <mesh position={[0, 0, frontZ + 0.001]}>
          <planeGeometry args={[0.92, 0.6]} />
          <meshBasicMaterial color={themeProps.accent} transparent opacity={0.06} />
        </mesh>

        {/* fallback visible cube */}
        <mesh ref={debugCubeRef} position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color={'hotpink'} />
        </mesh>
      </group>

      <gridHelper args={[30, 40, 0x1f2937, 0x0f172a]} position={[0, -0.749, 0]} />
    </group>
  )
} 