/**
 * VIGIIAP — Globo 3D · Chocó Biogeográfico
 * Polígono real basado en límites del IIAP (Darién → Ecuador, Pacífico → Andes).
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'

const R = 1.8

// ── Utilidad: lat/lon → Vector3 en superficie de esfera ──
function ll(lat, lon, r = R) {
  const φ = (lat * Math.PI) / 180
  const λ = (lon * Math.PI) / 180
  return new THREE.Vector3(
    r * Math.cos(φ) * Math.cos(λ),
    r * Math.sin(φ),
    r * Math.cos(φ) * Math.sin(λ),
  )
}

// ── Polígono del Chocó Biogeográfico [lat°, lon°] ──
// Sentido horario: borde occidental (costa Pacífico) → borde oriental (Andes) → norte (Urabá/Darién)
const CHOCO = [
  // Borde NORTE — Darién / Urabá
  [8.7, -77.3],   // Cabo Tiburón / Darién Pacífico
  [8.5, -77.0],   // Zona Darién interior
  [8.1, -76.8],   // Urabá (Antioquia/Chocó)
  // Borde ORIENTAL — Cordillera Occidental (Andes)
  [7.5, -76.4],   // Norte Chocó — pie Andes
  [6.5, -76.1],   // Chocó central oriente
  [5.7, -76.0],   // Quibdó área (oriente)
  [5.0, -76.0],   // Límite Chocó/Valle
  [4.2, -76.2],   // Valle del Cauca oriente
  [3.5, -76.6],   // Límite Valle/Cauca
  [2.8, -77.0],   // Cauca oriente
  [1.8, -77.4],   // Nariño oriente
  [0.8, -77.9],   // Nariño sur oriente
  [0.0, -78.3],   // Frontera Colombia-Ecuador interior
  [-0.5, -78.7],  // Ecuador oriente (Carchi/Esmeraldas)
  // Borde SUR — Ecuador
  [-0.8, -79.3],  // Ecuador costa sur
  [-0.5, -79.8],  // Ecuador Pacífico
  // Borde OCCIDENTAL — Costa Pacífica (de sur a norte)
  [0.5, -79.4],   // Ecuador norte Pacífico
  [1.2, -79.0],   // Nariño — Tumaco area
  [2.0, -78.6],   // Nariño costa
  [3.0, -77.8],   // Cauca costa
  [3.9, -77.3],   // Buenaventura (Valle)
  [4.8, -77.4],   // Valle del Cauca costa
  [5.5, -77.4],   // Chocó sur costa
  [6.2, -77.5],   // Bahía Solano
  [7.0, -77.6],   // Chocó norte costa
  [7.8, -77.7],   // Chocó/Antioquia costa norte
  [8.3, -77.5],   // Darién Pacífico
  [8.7, -77.3],   // Cierre polígono
]

// Centroide real del Chocó (~4.2°N, 77.5°W)
const CENTER = [4.2, -77.5]

// Rotación Y inicial para que Colombia quede de frente al iniciar
// lon=-77° queda frente a la cámara con r ≈ -(-77°-90°)*π/180 = -2.92 rad
const INITIAL_Y = -2.92

// ── Genera círculo (paralelo o meridiano) ──
function circlePoints(radius, segments, axis = 'y', offset = 0) {
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    pts.push(
      axis === 'y'
        ? new THREE.Vector3(radius * Math.cos(t), offset, radius * Math.sin(t))
        : new THREE.Vector3(radius * Math.cos(t), radius * Math.sin(t), offset),
    )
  }
  return pts
}

// ── Líneas de latitud ──
function LatitudeLines() {
  return (
    <>
      {[-0.7, -0.35, 0, 0.35, 0.7].map((sinLat, i) => {
        const y = R * sinLat
        const r = Math.sqrt(Math.max(0, R * R - y * y))
        return (
          <Line key={i} points={circlePoints(r, 80, 'y', y)}
            color="#52B788" lineWidth={0.6} transparent opacity={0.18} />
        )
      })}
    </>
  )
}

// ── Líneas de longitud ──
function LongitudeLines() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI
        const pts = Array.from({ length: 81 }, (_, j) => {
          const phi = (j / 80) * Math.PI * 2
          return new THREE.Vector3(
            R * Math.sin(phi) * Math.cos(angle),
            R * Math.cos(phi),
            R * Math.sin(phi) * Math.sin(angle),
          )
        })
        return (
          <Line key={i} points={pts}
            color="#52B788" lineWidth={0.6} transparent opacity={0.12} />
        )
      })}
    </>
  )
}

// ── Puntos Fibonacci en toda la superficie ──
function SurfacePoints() {
  const ref = useRef()
  const pos = useMemo(() => {
    const arr = new Float32Array(900 * 3)
    for (let i = 0; i < 900; i++) {
      const phi   = Math.acos(1 - 2 * (i / 900))
      const theta = Math.sqrt(900 * Math.PI) * phi
      arr[i * 3]     = R * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = R * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = R * Math.cos(phi)
    }
    return arr
  }, [])
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.05 })
  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#D8F3DC" size={0.018} sizeAttenuation depthWrite={false} opacity={0.5} />
    </Points>
  )
}

// ── Región del Chocó Biogeográfico ──
function ChocoRegion() {
  const fillRef  = useRef()
  const glowRef  = useRef()
  const fill2Ref = useRef()

  // Puntos del contorno a distintas alturas para efecto de capas
  const outlineOuter = useMemo(() => CHOCO.map(([lat, lon]) => ll(lat, lon, R * 1.007)), [])
  const outlineInner = useMemo(() => CHOCO.map(([lat, lon]) => ll(lat, lon, R * 1.004)), [])

  // Geometría del relleno: triangulación en abanico desde centroide
  const fillGeo = useMemo(() => {
    const rFill  = R * 1.002
    const pts    = CHOCO.slice(0, -1).map(([lat, lon]) => ll(lat, lon, rFill))
    const center = ll(CENTER[0], CENTER[1], rFill)
    const verts  = []
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      verts.push(center.x, center.y, center.z, a.x, a.y, a.z, b.x, b.y, b.z)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  // Pulso animado
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.9)
    if (fillRef.current)  fillRef.current.material.opacity  = 0.22 + 0.10 * pulse
    if (fill2Ref.current) fill2Ref.current.material.opacity = 0.08 + 0.04 * pulse
    if (glowRef.current)  glowRef.current.material.opacity  = 0.35 + 0.20 * pulse
  })

  return (
    <>
      {/* Relleno base — verde bosque */}
      <mesh ref={fillRef} geometry={fillGeo}>
        <meshBasicMaterial color="#2D6A4F" transparent opacity={0.28}
          side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Segundo relleno — tono más claro (profundidad) */}
      <mesh ref={fill2Ref} geometry={fillGeo}>
        <meshBasicMaterial color="#74C69D" transparent opacity={0.10}
          side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Contorno interior — línea precisa */}
      <Line
        ref={glowRef}
        points={outlineInner}
        color="#52B788"
        lineWidth={2.2}
        transparent
        opacity={0.9}
      />

      {/* Contorno exterior difuso — efecto glow */}
      <Line
        points={outlineOuter}
        color="#B7E4C7"
        lineWidth={4.5}
        transparent
        opacity={0.20}
      />
    </>
  )
}

// ── Partículas de biodiversidad dentro del Chocó ──
function ChocoParticles() {
  const ref = useRef()
  const pos = useMemo(() => {
    const zones = [
      { lat: [6.5, 8.5], lon: [-77.6, -76.5], n: 25 },  // Darién / Chocó norte
      { lat: [4.5, 6.5], lon: [-77.5, -76.1], n: 40 },  // Chocó central
      { lat: [3.0, 4.5], lon: [-77.5, -76.2], n: 25 },  // Valle del Cauca
      { lat: [1.5, 3.0], lon: [-78.2, -77.0], n: 25 },  // Cauca
      { lat: [0.0, 1.5], lon: [-79.2, -77.5], n: 20 },  // Nariño
      { lat: [-0.5,0.0], lon: [-79.8, -78.5], n: 15 },  // Ecuador
    ]
    const arr = new Float32Array(150 * 3)
    let i = 0
    for (const z of zones) {
      for (let k = 0; k < z.n && i < 150; k++, i++) {
        const lat = z.lat[0] + Math.random() * (z.lat[1] - z.lat[0])
        const lon = z.lon[0] + Math.random() * (z.lon[1] - z.lon[0])
        const v   = ll(lat, lon, R * 1.006)
        arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z
      }
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.material.opacity = 0.6 + 0.4 * Math.abs(Math.sin(clock.elapsedTime * 1.4))
  })

  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#95D5B2" size={0.032} sizeAttenuation depthWrite={false} opacity={0.85} />
    </Points>
  )
}

// ── Marcador IIAP — Quibdó (5.69°N, 76.66°W) ──
function IIAPMarker() {
  const ref  = useRef()
  const ref2 = useRef()

  const center = useMemo(() => ll(5.69, -76.66, R * 1.008), [])
  const pos    = useMemo(() => new Float32Array([center.x, center.y, center.z]), [center])

  // Anillo pulsante alrededor del marcador
  const ringPts = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 64; i++) {
      const t   = (i / 64) * Math.PI * 2
      const lat = 5.69 + 0.5 * Math.cos(t)
      const lon = -76.66 + 0.7 * Math.sin(t)
      pts.push(ll(lat, lon, R * 1.009))
    }
    return pts
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ref.current)  ref.current.material.opacity = 0.7 + 0.3 * Math.abs(Math.sin(t * 2.5))
    if (ref2.current) ref2.current.material.opacity = 0.3 + 0.3 * Math.abs(Math.sin(t * 2.5 + 1))
  })

  return (
    <>
      {/* Punto principal */}
      <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#D4A373" size={0.07} sizeAttenuation depthWrite={false} opacity={1} />
      </Points>

      {/* Anillo dorado (indica sede IIAP) */}
      <Line ref={ref2} points={ringPts} color="#D4A373" lineWidth={1.4} transparent opacity={0.5} />
    </>
  )
}

// ── Polvo de fondo ──
function BackgroundDust() {
  const ref = useRef()
  const pos = useMemo(() => {
    const arr = new Float32Array(1200 * 3)
    for (let i = 0; i < 1200; i++) {
      const phi   = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r     = 3.5 + Math.random() * 3
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.012 })
  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#52B788" size={0.009} sizeAttenuation depthWrite={false} opacity={0.18} />
    </Points>
  )
}

// ── Globo principal ──
function Globe() {
  const groupRef = useRef()

  // Inicia rotado para que Colombia quede de frente
  const initialized = useRef(false)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (!initialized.current) {
      groupRef.current.rotation.y = INITIAL_Y
      initialized.current = true
    }
    groupRef.current.rotation.y += delta * 0.09
  })

  return (
    <group ref={groupRef}>
      {/* Esfera base */}
      <mesh>
        <sphereGeometry args={[R, 52, 52]} />
        <meshBasicMaterial color="#071a0e" transparent opacity={0.60} />
      </mesh>

      <LatitudeLines />
      <LongitudeLines />
      <SurfacePoints />

      {/* ── Chocó Biogeográfico ── */}
      <ChocoRegion />
      <ChocoParticles />
      <IIAPMarker />

      {/* Atmósfera */}
      <mesh>
        <sphereGeometry args={[R * 1.09, 32, 32]} />
        <meshBasicMaterial color="#52B788" transparent opacity={0.028} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// ── Anillo ecuatorial ──
function EquatorRing() {
  return (
    <Line points={circlePoints(R * 1.06, 120, 'y', 0)}
      color="#D4A373" lineWidth={1.2} transparent opacity={0.30} />
  )
}

export default function GlobeScene({ className = '' }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 1.0, 4.8], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[6, 6, 6]}   intensity={1.4} color="#52B788" />
        <pointLight position={[-5, -3, -4]} intensity={0.5} color="#D4A373" />
        <BackgroundDust />
        <Globe />
        <EquatorRing />
      </Canvas>
    </div>
  )
}
