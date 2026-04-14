/**
 * VIGIIAP — Globo 3D del territorio
 * Esfera wireframe con puntos de datos geoespaciales animados.
 * Usa React Three Fiber + Drei.
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ── Genera puntos distribuidos en la superficie de la esfera ──
function generateSpherePoints(count, radius) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    const r     = radius * (0.95 + Math.random() * 0.1)
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

// ── Wireframe esfera ──
function GlobeWireframe() {
  const ref = useRef()

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.12
      ref.current.rotation.x += delta * 0.03
    }
  })

  return (
    <group ref={ref}>
      {/* Esfera principal wireframe */}
      <mesh>
        <sphereGeometry args={[1.6, 36, 36]} />
        <meshBasicMaterial
          color="#52B788"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Líneas de latitud — anillos */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((y, i) => {
        const r = Math.sqrt(1.6 * 1.6 - y * y * 1.6 * 1.6 / 1.6 / 1.6) * 1.6
        return (
          <mesh key={i} position={[0, y * 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.max(0.1, 1.6 * Math.cos(Math.asin(y))), 0.004, 6, 64]} />
            <meshBasicMaterial color="#52B788" transparent opacity={0.25} />
          </mesh>
        )
      })}

      {/* Puntos de datos en la superficie */}
      <DataPoints />

      {/* Halo exterior */}
      <mesh>
        <sphereGeometry args={[1.75, 32, 32]} />
        <meshBasicMaterial
          color="#1B4332"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

// ── Puntos de datos flotantes ──
function DataPoints() {
  const ref = useRef()
  const positions = useMemo(() => generateSpherePoints(800, 1.62), [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.08
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#D8F3DC"
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  )
}

// ── Partículas de fondo ──
function BackgroundParticles() {
  const ref = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 12
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return pos
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02
      ref.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#52B788"
        size={0.008}
        sizeAttenuation
        depthWrite={false}
        opacity={0.25}
      />
    </Points>
  )
}

// ── Anillo orbital ──
function OrbitalRing() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta * 0.2
    }
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.8, 0.3, 0]}>
      <torusGeometry args={[2.1, 0.006, 6, 120]} />
      <meshBasicMaterial color="#D4A373" transparent opacity={0.4} />
    </mesh>
  )
}

// ── Canvas exportado ──
export default function GlobeScene({ className = '' }) {
  return (
    <div className={`${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#52B788" />
        <pointLight position={[-10, -5, -5]} intensity={0.3} color="#D4A373" />
        <BackgroundParticles />
        <GlobeWireframe />
        <OrbitalRing />
      </Canvas>
    </div>
  )
}
