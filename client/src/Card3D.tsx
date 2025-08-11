import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useApp, type ThemeKey } from './store'
import { Text } from '@react-three/drei'

export function Card3D() {
  const groupRef = useRef<THREE.Group>(null)
  const cardRef = useRef<THREE.Group>(null)
  const frontDetailsRef = useRef<THREE.Group>(null)
  const backDetailsRef = useRef<THREE.Group>(null)

  const theme = useApp((s) => s.theme)
  const flipTrigger = useApp((s) => s.flipTrigger)
  const name = useApp((s) => s.name)
  const number = useApp((s) => s.number)

  const themeProps = useMemo(() => {
    const defs: Record<ThemeKey, { color: number; accent: number; metalness: number; roughness: number; emissive?: number; emissiveIntensity?: number }> = {
      midnight: { color: 0x0f1b2e, accent: 0x60a5fa, metalness: 0.5, roughness: 0.4 },
      sunset:   { color: 0x2a1a12, accent: 0xf59e0b, metalness: 0.6, roughness: 0.5, emissive: 0x331a06, emissiveIntensity: 0.2 },
      neon:     { color: 0x1c1030, accent: 0xa855f7, metalness: 0.6, roughness: 0.4 },
      minimal:  { color: 0xe5e7eb, accent: 0x0ea5e9, metalness: 0.1, roughness: 0.5 },
      carbon:   { color: 0x0b1220, accent: 0x22d3ee, metalness: 0.8, roughness: 0.3 },
    }
    return defs[theme]
  }, [theme])

  // Theme-aware UI colors using WCAG contrast (choose between white/black by higher contrast)
  const uiColors = useMemo(() => {
    const bg = new THREE.Color(themeProps.color)

    const srgbToLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    const relLuminance = (color: THREE.Color) => {
      const r = srgbToLin(color.r)
      const g = srgbToLin(color.g)
      const b = srgbToLin(color.b)
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const contrastRatio = (l1: number, l2: number) => {
      const [L1, L2] = l1 > l2 ? [l1, l2] : [l2, l1]
      return (L1 + 0.05) / (L2 + 0.05)
    }

    const white = new THREE.Color('#ffffff')
    const black = new THREE.Color('#000000')
    const bgLum = relLuminance(bg)
    const whiteLum = relLuminance(white)
    const blackLum = relLuminance(black)

    const contrastWithWhite = contrastRatio(bgLum, whiteLum)
    const contrastWithBlack = contrastRatio(bgLum, blackLum)

    const highContrast = contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000'

    // Secondary/muted still use high-contrast to guarantee readability
    return {
      textPrimary: highContrast,
      textSecondary: highContrast,
      textMuted: highContrast,
      stripe: '#111111',
      signatureBg: highContrast === '#ffffff' ? '#f8fafc' : '#e2e8f0',
      signatureLine: highContrast === '#ffffff' ? '#cbd5e1' : '#94a3b8',
      cvvBg: '#ffffff',
      cvvText: '#000000',
    }
  }, [themeProps.color])

  const cardDims = useMemo(() => ({
    width: 8.56 / 10,
    height: 5.398 / 10,
    thickness: 0.078 / 10,
    radius: 0.55 / 10,
  }), [])

  // Grid system: 100x100
  const gridSize = useMemo(() => ({
    width: cardDims.width / 100,
    height: cardDims.height / 100,
  }), [cardDims])

  // Grid to world coordinates helper
  const gridToWorld = useMemo(() => ({
    x: (col: number) => (col - 50) * gridSize.width,
    y: (row: number) => (50 - row) * gridSize.height,
  }), [gridSize])

  const { geometry, thickness } = useMemo(() => {
    const { width, height, radius } = cardDims
    const t = cardDims.thickness

    const shape = new THREE.Shape()
    const x = -width / 2
    const y = -height / 2

    shape.moveTo(x + radius, y)
    shape.lineTo(x + width - radius, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + radius)
    shape.lineTo(x + width, y + height - radius)
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    shape.lineTo(x + radius, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - radius)
    shape.lineTo(x, y + radius)
    shape.quadraticCurveTo(x, y, x + radius, y)

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
  }, [cardDims])

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
      g.rotation.y += 0.002 * dt
    }
    if (c && flipState.current) {
      const { start, from, to } = flipState.current
      const t = Math.min(1, (state.clock.elapsedTime * 1000 - start) / 550)
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      c.rotation.y = from + (to - from) * ease
      if (t >= 1) flipState.current = null
    }

    if (frontDetailsRef.current) frontDetailsRef.current.visible = true
    if (backDetailsRef.current) backDetailsRef.current.visible = true
  })

  const frontZ = thickness / 2 + 0.0018
  const backZ = -thickness / 2 - 0.005

  return (
    <group ref={groupRef}>
      <group ref={cardRef} rotation={[-0.1, 0.14, 0]} scale={2.2}>
        {/* Card body */}
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial color={themeProps.color} metalness={themeProps.metalness} roughness={themeProps.roughness} />
        </mesh>

        {/* FRONT DETAILS (colors theme-aware; positions preserved) */}
        <group ref={frontDetailsRef}>
          {/* Chip - rows 20-40, columns 20-40 (user-set size/pos retained) */}
          <mesh 
            position={[gridToWorld.x(20), gridToWorld.y(30), frontZ]} 
            castShadow
          >
            <boxGeometry args={[gridSize.width * 15, gridSize.height * 15, 0.020]} />
            <meshStandardMaterial color={0xe4c266} metalness={0.9} roughness={0.25} />
          </mesh>

          {/* Bank name */}
          <Text
            position={[gridToWorld.x(55), gridToWorld.y(30), frontZ + 0.001]}
            fontSize={0.035}
            color={uiColors.textPrimary}
            anchorX="center"
            anchorY="middle"
            maxWidth={gridSize.width * 50}
            textAlign="center"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={1}
          >
            Ajay Co-operative Bank
          </Text>

          {/* Card number */}
          <Text
            position={[gridToWorld.x(10), gridToWorld.y(70), frontZ + 0.001]}
            fontSize={0.065}
            color={uiColors.textPrimary}
            anchorX="left"
            anchorY="middle"
            maxWidth={gridSize.width * 80}
            textAlign="left"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={1}
          >
            {number}
          </Text>

          {/* Name */}
          <Text
            position={[gridToWorld.x(10), gridToWorld.y(88), frontZ + 0.001]}
            fontSize={0.025}
            color={uiColors.textPrimary}
            anchorX="left"
            anchorY="middle"
            maxWidth={gridSize.width * 60}
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={1}
          >
            {name}
          </Text>

          {/* Expiry */}
          <Text
            position={[gridToWorld.x(85), gridToWorld.y(88), frontZ + 0.001]}
            fontSize={0.025}
            color={uiColors.textPrimary}
            anchorX="right"
            anchorY="middle"
            maxWidth={gridSize.width * 40}
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={1}
          >
            00/00
          </Text>
        </group>

        {/* BACK DETAILS (signature 0-60 cols, CVV 60-75 cols) */}
        <group ref={backDetailsRef}>
          {/* Info text + Magnetic strip rows 15–25 */}
          <Text
            position={[gridToWorld.x(50), gridToWorld.y(17), backZ + 0.001]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.011}
            color={uiColors.textSecondary}
            anchorX="center"
            anchorY="middle"
            maxWidth={gridSize.width * 98}
            textAlign="center"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={2}
          >
            Please keep this card safe. For assistance, call Customer Service at 1-800-000-0000.
          </Text>

          <mesh position={[gridToWorld.x(50), gridToWorld.y(20), backZ]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[gridSize.width * 100, gridSize.height * 10]} />
            <meshBasicMaterial color={uiColors.stripe} side={THREE.FrontSide} />
          </mesh>

          {/* Signature strip rows 30–40, columns 0–60 (center at 30) */}
          <mesh position={[gridToWorld.x(70), gridToWorld.y(35), backZ]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[gridSize.width * 60, gridSize.height * 10]} />
            <meshBasicMaterial color={uiColors.signatureBg} side={THREE.FrontSide} />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`sig-line-${i}`} position={[gridToWorld.x(30), gridToWorld.y(31 + i), backZ + 0.0005]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[gridSize.width * 60, gridSize.height * 0.4]} />
              <meshBasicMaterial color={uiColors.signatureLine} side={THREE.FrontSide} />
            </mesh>
          ))}

          {/* CVV box rows 30–40, columns 60–75 (center at 67.5) */}
          <mesh position={[gridToWorld.x(40), gridToWorld.y(35), backZ]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[gridSize.width * 15, gridSize.height * 10]} />
            <meshBasicMaterial color={uiColors.cvvBg} side={THREE.FrontSide} />
          </mesh>
          <Text
            position={[gridToWorld.x(45), gridToWorld.y(35), backZ + 0.001]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.016}
            color={uiColors.cvvText}
            anchorX="right"
            anchorY="middle"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={2}
          >
            123
          </Text>

          {/* Title and paragraph below */}
          <Text
            position={[gridToWorld.x(50), gridToWorld.y(60), backZ + 0.001]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.018}
            color={uiColors.textPrimary}
            anchorX="center"
            anchorY="middle"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={2}
          >
            Important information
          </Text>

          <Text
            position={[gridToWorld.x(50), gridToWorld.y(75), backZ + 0.001]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.012}
            color={uiColors.textMuted}
            anchorX="center"
            anchorY="middle"
            maxWidth={cardDims.width - gridSize.width * 8}
            textAlign="center"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={2}
          >
            Use of this card is subject to the Cardholder Agreement. If found, please contact the issuer. Do not share your CVV.
          </Text>

          {/* Bottom marks */}
          <Text
            position={[gridToWorld.x(20), gridToWorld.y(92), backZ + 0.001]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.025}
            color={uiColors.textPrimary}
            anchorX="left"
            anchorY="middle"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={2}
          >
            VISA
          </Text>

          <Text
            position={[gridToWorld.x(80), gridToWorld.y(92), backZ + 0.001]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.02}
            color={uiColors.textPrimary}
            anchorX="right"
            anchorY="middle"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={2}
          >
            REWARDS
          </Text>

          <Text
            position={[gridToWorld.x(50), gridToWorld.y(98), backZ + 0.001]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.01}
            color={uiColors.textSecondary}
            anchorX="center"
            anchorY="middle"
            maxWidth={cardDims.width - gridSize.width * 8}
            textAlign="center"
            material-side={THREE.FrontSide}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={2}
          >
            This card remains the property of the issuer. Unauthorized use is prohibited.
          </Text>
        </group>

        {/* subtle front rim glow */}
        <mesh position={[0, 0, frontZ + 0.0023]}>
          <planeGeometry args={[cardDims.width + 0.06, cardDims.height + 0.04]} />
          <meshBasicMaterial color={themeProps.accent} transparent opacity={0.02} />
        </mesh>
      </group>

      {/* Floor for shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={0x0b1220} roughness={1} metalness={0} />
      </mesh>

      {/* Soft helper grid (very faint) */}
      <gridHelper args={[30, 40, 0x1f2937, 0x0f172a]} position={[0, -0.749, 0]} />
    </group>
  )
} 