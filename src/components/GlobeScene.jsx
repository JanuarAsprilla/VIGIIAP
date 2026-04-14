/**
 * VIGIIAP — Globo 3D mejorado
 * Esfera limpia con líneas de latitud/longitud, puntos de datos y glow.
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Line } from '@react-three/drei'
import * as THREE from 'three'

const R = 1.8 // radio del globo

// ── Genera puntos en superficie de esfera ──
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

// ── Genera puntos de una circunferencia (latitud o longitud) ──
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
          <Line
            key={i}
            points={circlePoints(r, 80, 'y', y)}
            color="#52B788"
            lineWidth={0.6}
            transparent
            opacity={0.2}
          />
        )
      })}
    </>
  )
}

// ── Líneas de longitud ──
function LongitudeLines() {
  const count = 10
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI
        const pts = []
        for (let j = 0; j <= 80; j++) {
          const phi = (j / 80) * Math.PI * 2
          pts.push(new THREE.Vector3(
            R * Math.sin(phi) * Math.cos(angle),
            R * Math.cos(phi),
            R * Math.sin(phi) * Math.sin(angle)
          ))
        }
        return (
          <Line
            key={i}
            points={pts}
            color="#52B788"
            lineWidth={0.6}
            transparent
            opacity={0.15}
          />
        )
      })}
    </>
  )
}

// ── Puntos Fibonacci distribuidos uniformemente en la esfera ──
function SurfacePoints() {
  const ref  = useRef()
  const pos  = useSpherePoints(900)

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.07
  })

  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#D8F3DC" size={0.022} sizeAttenuation depthWrite={false} opacity={0.65} />
    </Points>
  )
}

// ── Puntos de calor — zona del Chocó (latitudes ~4-7°N) ──
function HotspotPoints() {
  const ref = useRef()
  const pos = useMemo(() => {
    const arr = new Float32Array(60 * 3)
    for (let i = 0; i < 60; i++) {
      // lat ≈ 5-8°N lon ≈ 74-77°W — zona Chocó Biogeográfico
      const lat = (5 + Math.random() * 6) * (Math.PI / 180)
      const lon = (-76 + Math.random() * 5) * (Math.PI / 180)
      const r   = R * 1.01
      arr[i * 3]     = r * Math.cos(lat) * Math.cos(lon)
      arr[i * 3 + 1] = r * Math.sin(lat)
      arr[i * 3 + 2] = r * Math.cos(lat) * Math.sin(lon)
    }
    return arr
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 1.5)
    }
  })

  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#D4A373" size={0.045} sizeAttenuation depthWrite={false} opacity={0.9} />
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
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.09
    }
  })

  return (
    <group ref={groupRef}>
      {/* Esfera base con transparencia */}
      <mesh>
        <sphereGeometry args={[R, 48, 48]} />
        <meshBasicMaterial color="#0a1f12" transparent opacity={0.55} />
      </mesh>

      {/* Grid geográfico */}
      <LatitudeLines />
      <LongitudeLines />

      {/* Puntos en la superficie */}
      <SurfacePoints />

      {/* Puntos dorados — zona Chocó */}
      <HotspotPoints />

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
