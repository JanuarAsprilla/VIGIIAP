/**
 * VIGIA-IIAP — Sección de presentación 3D scroll-driven
 * Narrativa en 3 capítulos con universo de partículas Three.js.
 * Capítulo 0: El territorio (nube dispersa = naturaleza salvaje)
 * Capítulo 1: La investigación (grilla curva = datos organizados)
 * Capítulo 2: La plataforma (esfera Fibonacci = conocimiento unificado)
 */
import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import * as THREE from 'three'

// ── Constantes ──────────────────────────────────────────────────────────────
const COUNT = 2200

// Ease: smooth step
const smoothstep = (t) => t * t * (3 - 2 * t)

// ── Generadores de formaciones ──────────────────────────────────────────────
function buildScatter() {
  const pos = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    // distribución en volumen de esfera con radio variable (bosque disperso)
    const r = 1.2 + Math.random() * 2.8
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)
  }
  return pos
}

function buildGrid() {
  const pos = new Float32Array(COUNT * 3)
  const side = Math.ceil(Math.sqrt(COUNT))
  for (let i = 0; i < COUNT; i++) {
    const col = (i % side) / (side - 1) - 0.5
    const row = Math.floor(i / side) / (side - 1) - 0.5
    // curvatura suave tipo mapa topográfico
    const z = Math.sin(col * 5.5) * Math.cos(row * 5.5) * 0.45
    pos[i * 3]     = col * 5.6
    pos[i * 3 + 1] = row * 5.6
    pos[i * 3 + 2] = z
  }
  return pos
}

function buildSphere() {
  const pos = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    // Distribución de Fibonacci — cobertura uniforme
    const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = 2.1 + (Math.random() - 0.5) * 0.25
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)
  }
  return pos
}

// ── Universo de partículas 3D ────────────────────────────────────────────────
function ParticleUniverse({ phase }) {
  const pointsRef = useRef()
  const lerpT     = useRef(0)

  // Formaciones — generadas una sola vez
  const { scatter, grid, sphere, work, colors, geometry } = useMemo(() => {
    const scatter = buildScatter()
    const grid    = buildGrid()
    const sphere  = buildSphere()
    const work    = scatter.slice() // buffer de trabajo, inicia en scatter

    // Gradiente de color: verde-IIAP → lima → dorado
    const colors = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT
      if (t < 0.45) {
        // Verde primario (#009846) → lima (#B0CB1F)
        const f = t / 0.45
        colors[i * 3]     = 0.0 + f * 0.44   // r
        colors[i * 3 + 1] = 0.60 + f * 0.19  // g
        colors[i * 3 + 2] = 0.28 - f * 0.16  // b
      } else {
        // Lima → dorado (#D4A373)
        const f = (t - 0.45) / 0.55
        colors[i * 3]     = 0.44 + f * 0.39  // r
        colors[i * 3 + 1] = 0.79 - f * 0.15  // g
        colors[i * 3 + 2] = 0.12 + f * 0.33  // b
      }
    }

    // Geometría imperativa para control total en useFrame
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(work.slice(), 3))
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3))

    return { scatter, grid, sphere, work, colors, geometry }
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    // Target: fase 0 → 0.0, fase 1 → 0.5, fase 2 → 1.0
    const target = phase * 0.5
    lerpT.current = THREE.MathUtils.lerp(lerpT.current, target, delta * 1.1)

    const t = lerpT.current
    let from, to, localT

    if (t <= 0.5) {
      from   = scatter
      to     = grid
      localT = smoothstep(Math.min(1, t * 2))
    } else {
      from   = grid
      to     = sphere
      localT = smoothstep(Math.min(1, (t - 0.5) * 2))
    }

    // Lerp posiciones → buffer de trabajo
    for (let i = 0; i < COUNT * 3; i++) {
      work[i] = from[i] + (to[i] - from[i]) * localT
    }

    const attr = pointsRef.current.geometry.attributes.position
    attr.array.set(work)
    attr.needsUpdate = true

    // Rotación suave — más rápida durante transición
    const transitionSpeed = Math.abs(target - lerpT.current) * 4
    pointsRef.current.rotation.y += delta * (0.06 + transitionSpeed)
    pointsRef.current.rotation.x  = Math.sin(state.clock.elapsedTime * 0.08) * 0.12
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.022}
        vertexColors
        transparent
        opacity={0.82}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ── Anillos atmosféricos (decorativos, no afectan performance) ───────────────
function AtmosphericRings() {
  const ringRef = useRef()
  useFrame((state) => {
    if (!ringRef.current) return
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.3
    ringRef.current.rotation.z += 0.0015
  })
  return (
    <group ref={ringRef}>
      {[2.8, 3.5, 4.4].map((r, i) => (
        <mesh key={i} rotation={[Math.PI * 0.28 + i * 0.15, 0, 0]}>
          <torusGeometry args={[r, 0.004, 4, 120]} />
          <meshBasicMaterial
            color={i === 0 ? '#009846' : i === 1 ? '#B0CB1F' : '#D4A373'}
            transparent
            opacity={0.08 - i * 0.02}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Escena Three.js ──────────────────────────────────────────────────────────
function Scene({ phase }) {
  return (
    <>
      <fog attach="fog" args={['#060f09', 4, 14]} />
      <ParticleUniverse phase={phase} />
      <AtmosphericRings />
    </>
  )
}

// ── Datos de capítulos ────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    num:      '01',
    eyebrow:  'El territorio',
    headline: 'La región más biodiversa del planeta',
    body:     'El Chocó Biogeográfico cubre el 9% del territorio colombiano pero alberga el 8% de la biodiversidad del planeta. Sus selvas húmedas tropicales —con más de 12.000 mm de lluvia al año— son hogar de miles de especies endémicas, muchas aún sin documentar.',
    stat:     { value: '8%',  label: 'de la biodiversidad global' },
    accent:   '#4ade80',
  },
  {
    num:      '02',
    eyebrow:  'La institución',
    headline: '30 años investigando el Pacífico',
    body:     'El Instituto de Investigaciones Ambientales del Pacífico genera, sistematiza y transfiere conocimiento científico sobre el Chocó Biogeográfico. Su labor apoya decisiones ambientales estratégicas y el desarrollo sostenible de las comunidades del Pacífico colombiano.',
    stat:     { value: '30+', label: 'años de investigación científica' },
    accent:   '#D4A373',
  },
  {
    num:      '03',
    eyebrow:  'La plataforma',
    headline: 'VIGIA-IIAP: datos que protegen el territorio',
    body:     'Una plataforma digital que centraliza mapas temáticos, documentos científicos, herramientas SIG y análisis geoespaciales del Pacífico colombiano. Democratizando el acceso al conocimiento ambiental para investigadores, gestores y comunidades.',
    stat:     { value: '6',   label: 'módulos integrados' },
    accent:   '#93c5fd',
  },
]

// ── Texto de capítulo ─────────────────────────────────────────────────────────
function ChapterText({ chapter, isActive }) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={chapter.num}
          initial={{ opacity: 0, x: -36, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -24, filter: 'blur(2px)' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-1/2 -translate-y-1/2 max-w-[min(480px,90vw)] lg:max-w-[44%]"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span
              className="text-[0.55rem] font-black uppercase tracking-[0.32em]"
              style={{ color: chapter.accent }}
            >
              {chapter.eyebrow}
            </span>
            <div className="flex-1 h-px opacity-20" style={{ background: chapter.accent }} />
          </div>

          {/* Headline */}
          <h2
            className="font-display font-black leading-[1.05] tracking-tight mb-5"
            style={{
              fontSize: 'clamp(1.85rem, 3.8vw, 3.2rem)',
              color: '#E8F5EC',
              textShadow: `0 0 60px ${chapter.accent}22`,
            }}
          >
            {chapter.headline}
          </h2>

          {/* Body */}
          <p
            className="leading-relaxed mb-8"
            style={{
              color: 'rgba(255,255,255,0.52)',
              fontSize: 'clamp(0.82rem, 1.1vw, 0.95rem)',
              maxWidth: '40ch',
            }}
          >
            {chapter.body}
          </p>

          {/* Stat */}
          <motion.div
            className="flex items-end gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="font-display font-black leading-none"
              style={{
                fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
                color: chapter.accent,
                textShadow: `0 0 40px ${chapter.accent}44`,
              }}
            >
              {chapter.stat.value}
            </span>
            <span
              className="text-[0.62rem] font-bold uppercase tracking-wider pb-2"
              style={{ color: 'rgba(255,255,255,0.32)' }}
            >
              {chapter.stat.label}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Indicador de progreso ────────────────────────────────────────────────────
function ProgressBar({ phase }) {
  return (
    <div className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-8 lg:px-16">
      {/* Líneas de capítulo */}
      <div className="flex items-center gap-2">
        {CHAPTERS.map((ch, i) => (
          <motion.div
            key={i}
            animate={{
              width:   phase === i ? '2.5rem' : '0.35rem',
              opacity: phase === i ? 1 : 0.22,
              backgroundColor: phase === i ? ch.accent : '#ffffff',
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '2px', borderRadius: '999px' }}
          />
        ))}
        <span
          className="text-[0.55rem] font-bold uppercase tracking-[0.28em] ml-2"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          {String(phase + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
        </span>
      </div>

      {/* Scroll hint */}
      <div className="hidden sm:flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.18)' }}>
        <span className="text-[0.55rem] uppercase tracking-[0.22em]">Scroll</span>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <rect x="1" y="1" width="8" height="10" rx="4" stroke="currentColor" strokeWidth="1.2" />
            <motion.rect
              x="4" y="3" width="2" height="3" rx="1" fill="currentColor"
              animate={{ y: [0, 2, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  )
}

// ── Número grande de fondo ────────────────────────────────────────────────────
function BackgroundNum({ phase }) {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none hidden xl:block overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={phase}
          initial={{ opacity: 0, scale: 0.85, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.1, x: -20 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-black leading-none pr-8"
          style={{
            fontSize: 'clamp(10rem, 20vw, 18rem)',
            color: 'rgba(255,255,255,0.025)',
            letterSpacing: '-0.05em',
          }}
        >
          {String(phase + 1).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// ── Etiqueta IIAP flotante ────────────────────────────────────────────────────
function IIAPBadge() {
  return (
    <div className="absolute top-8 right-8 lg:right-16 hidden sm:flex items-center gap-2.5">
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: '#4ade80', boxShadow: '0 0 8px #4ade8066' }}
      />
      <span
        className="text-[0.55rem] font-bold uppercase tracking-[0.28em]"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        IIAP · Chocó Biogeográfico
      </span>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function PlatformIntroSection() {
  const containerRef = useRef()
  const [phase, setPhase] = useState(0)

  // useScroll de Framer Motion — compatible con Lenis
  const { scrollYProgress } = useScroll({
    target:  containerRef,
    offset:  ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const newPhase = latest < 0.33 ? 0 : latest < 0.66 ? 1 : 2
    setPhase((prev) => (prev !== newPhase ? newPhase : prev))
  })

  return (
    /* Contenedor alto: 300vh — captura el scroll para los 3 capítulos */
    <div ref={containerRef} style={{ height: '300vh' }} className="-mx-4 lg:-mx-6 xl:-mx-10">

      {/* Panel sticky — se mantiene en pantalla mientras scrolleas */}
      <div
        className="sticky top-0 overflow-hidden"
        style={{
          height: '100vh',
          background: 'linear-gradient(140deg, #060f09 0%, #091a0e 45%, #0c1f14 100%)',
        }}
      >
        {/* Dot grid de fondo */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #009846 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Línea superior decorativa */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(0,152,70,0.5) 30%, rgba(176,203,31,0.35) 70%, transparent)',
          }}
        />

        {/* Canvas Three.js — ocupa todo el panel */}
        <div className="absolute inset-0" style={{ opacity: 0.88 }}>
          <Canvas
            camera={{ position: [0, 0, 7.5], fov: 58 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Scene phase={phase} />
          </Canvas>
        </div>

        {/* Degradado izquierdo — hace legible el texto sobre las partículas */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(6,15,9,0.88) 0%, rgba(6,15,9,0.55) 50%, rgba(6,15,9,0.05) 100%)',
          }}
        />

        {/* Etiqueta IIAP */}
        <IIAPBadge />

        {/* Número de fondo */}
        <BackgroundNum phase={phase} />

        {/* Texto de capítulos */}
        <div className="absolute inset-0 px-8 lg:px-16">
          {/* Eyebrow label superior */}
          <div className="absolute top-8 left-8 lg:left-16">
            <span
              className="text-[0.55rem] font-bold uppercase tracking-[0.3em]"
              style={{ color: 'rgba(255,255,255,0.18)' }}
            >
              VIGIA-IIAP · Presentación
            </span>
          </div>

          {/* Capítulos */}
          <div className="relative h-full">
            {CHAPTERS.map((ch, i) => (
              <ChapterText key={i} chapter={ch} isActive={phase === i} />
            ))}
          </div>
        </div>

        {/* Barra de progreso + scroll hint */}
        <ProgressBar phase={phase} />

        {/* Degradado inferior */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(6,15,9,0.95) 0%, rgba(6,15,9,0.0) 100%)',
          }}
        />
      </div>
    </div>
  )
}
