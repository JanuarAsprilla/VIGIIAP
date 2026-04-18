/**
 * VIGIIAP — Globo 3D con Chocó Biogeográfico
 * Polígono aproximado del Chocó Biogeográfico (Colombia, Panamá, Ecuador)
 * basado en la representación del IIAP y límites geográficos oficiales.
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'

const R = 1.8

// ── Polígono del Chocó Biogeográfico [lat°, lon°] sentido horario ──
// Cubre: franja costera del Pacífico desde Darién (Panamá) hasta Ecuador,
// incluyendo Chocó, Valle del Cauca, Cauca, Nariño y el Urabá chocoano.
const CHOCO_POLY = [
  [8.6, -76.9],   // Urabá — costa Caribe (Antioquia/Chocó)
  [8.7, -77.2],   // Frontera Colombia-Panamá (área Darién)
  [8.2, -77.7],   // Costa Pacífica norte (Panamá-Colombia)
  [7.5, -77.6],   // Costa norte Chocó
  [6.2, -77.4],   // Bahía Solano
  [5.5, -77.3],   // Nuquí / Golfo de Tribugá
  [4.5, -77.3],   // Costa media Chocó
  [3.9, -77.1],   // Buenaventura (Valle del Cauca)
  [3.0, -77.5],   // Costa Cauca
  [1.8, -78.9],   // Tumaco (Nariño)
  [1.0, -79.2],   // Costa sur Nariño
  [0.2, -79.5],   // Frontera Colombia-Ecuador (Pacífico)
  [-0.5, -80.0],  // Ecuador norte — costa Pacífica
  [-0.5, -79.0],  // Ecuador — límite oriental
  [0.5, -78.2],   // Frontera Colombia-Ecuador (interior)
  [1.5, -77.7],   // Piedemonte Nariño (Cordillera Occidental)
  [2.5, -77.2],   // Piedemonte Cauca
  [3.5, -76.7],   // Piedemonte Valle del Cauca
  [4.0, -76.3],   // Valle del Cauca oriental
  [5.0, -76.1],   // Límite Chocó/Valle — Cordillera
  [6.0, -76.2],   // Chocó central oriental
  [7.0, -76.3],   // Chocó norte oriental
  [7.5, -76.5],   // Área Urabá / Chocó
  [8.0, -76.8],   // Antioquia / costa Caribe
  [8.6, -76.9],   // Cierre del polígono
]

// Centroide aproximado del Chocó Biogeográfico
const CHOCO_CENTER = [4.5, -77.8]

function latLonToVec3(lat, lon, r = R) {
  const φ = (lat * Math.PI) / 180
  const λ = (lon * Math.PI) / 180
  return new THREE.Vector3(
    r * Math.cos(φ) * Math.cos(λ),
    r * Math.sin(φ),
    r * Math.cos(φ) * Math.sin(λ),
  )
}

// ── Genera puntos en superficie de esfera (distribución Fibonacci) ──
function useSpherePoints(count) {
  return useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const phi   = Math.acos(1 - 2 * (i / count))
      const theta = Math.sqrt(count * Math.PI) * phi
      pos[i * 3]     = R * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = R * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = R * Math.cos(phi)
    }
    return pos
  }, [count])
}

// ── Círculo (latitud o longitud) ──
function circlePoints(radius, segments, axis = 'y', offset = 0) {
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    if (axis === 'y') {
      pts.push(new THREE.Vector3(radius * Math.cos(t), offset, radius * Math.sin(t)))
    } else {
      pts.push(new THREE.Vector3(radius * Math.cos(t), radius * Math.sin(t), offset))
    }
  }
  return pts
}

// ── Líneas de latitud ──
function LatitudeLines() {
  const latitudes = [-0.7, -0.35, 0, 0.35, 0.7]
  return (
    <>
      {latitudes.map((sinLat, i) => {
        const y = R * sinLat
        const r = Math.sqrt(Math.max(0, R * R - y * y))
        return (
          <Line key={i} points={circlePoints(r, 80, 'y', y)}
            color="#52B788" lineWidth={0.6} transparent opacity={0.2} />
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
        const pts = []
        for (let j = 0; j <= 80; j++) {
          const phi = (j / 80) * Math.PI * 2
          pts.push(new THREE.Vector3(
            R * Math.sin(phi) * Math.cos(angle),
            R * Math.cos(phi),
            R * Math.sin(phi) * Math.sin(angle),
          ))
        }
        return (
          <Line key={i} points={pts}
            color="#52B788" lineWidth={0.6} transparent opacity={0.15} />
        )
      })}
    </>
  )
}

// ── Puntos de superficie (distribución global) ──
function SurfacePoints() {
  const ref = useRef()
  const pos = useSpherePoints(900)
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.07
  })
  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#D8F3DC" size={0.022} sizeAttenuation depthWrite={false} opacity={0.65} />
    </Points>
  )
}

// ── Polígono del Chocó Biogeográfico ──
function ChocoRegion() {
  const fillRef  = useRef()
  const glowRef  = useRef()

  // Puntos del contorno en superficie
  const outlinePoints = useMemo(
    () => CHOCO_POLY.map(([lat, lon]) => latLonToVec3(lat, lon, R * 1.004)),
    [],
  )

  // Relleno: triangulación en abanico desde el centroide
  const fillGeo = useMemo(() => {
    const rFill   = R * 1.002
    const boundary = CHOCO_POLY.slice(0, -1).map(([lat, lon]) => latLonToVec3(lat, lon, rFill))
    const center   = latLonToVec3(CHOCO_CENTER[0], CHOCO_CENTER[1], rFill)
    const verts    = []
    for (let i = 0; i < boundary.length; i++) {
      const a = boundary[i]
      const b = boundary[(i + 1) % boundary.length]
      verts.push(center.x, center.y, center.z)
      verts.push(a.x, a.y, a.z)
      verts.push(b.x, b.y, b.z)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  // Animación: pulso suave en la región
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (fillRef.current) fillRef.current.material.opacity = 0.14 + 0.06 * Math.sin(t * 0.7)
    if (glowRef.current) glowRef.current.material.opacity = 0.04 + 0.03 * Math.sin(t * 0.7 + 1)
  })

  return (
    <>
      {/* Relleno principal — verde Chocó */}
      <mesh ref={fillRef} geometry={fillGeo}>
        <meshBasicMaterial
          color="#52B788"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Halo exterior del relleno */}
      <mesh ref={glowRef} geometry={fillGeo}>
        <meshBasicMaterial
          color="#95D5B2"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Contorno del territorio */}
      <Line
        points={outlinePoints}
        color="#74C69D"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />

      {/* Línea exterior difusa (efecto glow) */}
      <Line
        points={outlinePoints.map(v => v.clone().multiplyScalar(1.003))}
        color="#B7E4C7"
        lineWidth={3.0}
        transparent
        opacity={0.18}
      />
    </>
  )
}

// ── Partículas de biodiversidad dentro del Chocó ──
function ChocoParticles() {
  const ref = useRef()

  const pos = useMemo(() => {
    const arr = new Float32Array(140 * 3)
    let count = 0
    // Puntos dentro de la caja del Chocó con densidad controlada
    const zones = [
      { lat: [6, 8.5], lon: [-77.5, -76.8], n: 30 },  // Norte (Darién/Chocó norte)
      { lat: [4, 6],   lon: [-77.4, -76.2], n: 45 },  // Centro (Chocó medio)
      { lat: [2, 4],   lon: [-77.6, -76.5], n: 30 },  // Sur (Valle/Cauca)
      { lat: [0, 2],   lon: [-79.0, -77.5], n: 20 },  // Nariño
      { lat: [-0.5, 0],lon: [-79.5, -78.5], n: 15 },  // Ecuador
    ]
    for (const z of zones) {
      for (let i = 0; i < z.n && count < 140; i++) {
        const lat = z.lat[0] + Math.random() * (z.lat[1] - z.lat[0])
        const lon = z.lon[0] + Math.random() * (z.lon[1] - z.lon[0])
        const v   = latLonToVec3(lat, lon, R * 1.005)
        arr[count * 3]     = v.x
        arr[count * 3 + 1] = v.y
        arr[count * 3 + 2] = v.z
        count++
      }
    }
    return arr
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.55 + 0.45 * Math.sin(state.clock.elapsedTime * 1.2)
    }
  })

  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#D8F3DC" size={0.028} sizeAttenuation depthWrite={false} opacity={0.8} />
    </Points>
  )
}

// ── Marcador sede IIAP — Quibdó (5.69°N, 76.66°W) ──
function IIAPMarker() {
  const ref = useRef()
  const pos = useMemo(() => {
    const v = latLonToVec3(5.69, -76.66, R * 1.007)
    return new Float32Array([v.x, v.y, v.z])
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.7 + 0.3 * Math.abs(Math.sin(state.clock.elapsedTime * 2))
      ref.current.material.size    = 0.055 + 0.015 * Math.abs(Math.sin(state.clock.elapsedTime * 2))
    }
  })

  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#D4A373" size={0.06} sizeAttenuation depthWrite={false} opacity={1} />
    </Points>
  )
}

// ── Partículas de fondo ──
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
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.015 })
  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#52B788" size={0.01} sizeAttenuation depthWrite={false} opacity={0.2} />
    </Points>
  )
}

// ── Grupo principal del globo ──
function Globe() {
  const groupRef = useRef()
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.09
  })

  return (
    <group ref={groupRef}>
      {/* Esfera base */}
      <mesh>
        <sphereGeometry args={[R, 48, 48]} />
        <meshBasicMaterial color="#0a1f12" transparent opacity={0.55} />
      </mesh>

      {/* Grid geográfico */}
      <LatitudeLines />
      <LongitudeLines />

      {/* Puntos globales en superficie */}
      <SurfacePoints />

      {/* ── Chocó Biogeográfico ── */}
      <ChocoRegion />
      <ChocoParticles />
      <IIAPMarker />

      {/* Halo atmosférico */}
      <mesh>
        <sphereGeometry args={[R * 1.08, 32, 32]} />
        <meshBasicMaterial color="#52B788" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// ── Anillo ecuatorial ──
function EquatorRing() {
  const pts = circlePoints(R * 1.06, 120, 'y', 0)
  return <Line points={pts} color="#D4A373" lineWidth={1.2} transparent opacity={0.35} />
}

export default function GlobeScene({ className = '' }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 1.2, 5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[6, 6, 6]}   intensity={1.2} color="#52B788" />
        <pointLight position={[-6, -3, -4]} intensity={0.4} color="#D4A373" />
        <BackgroundDust />
        <Globe />
        <EquatorRing />
      </Canvas>
    </div>
  )
}
