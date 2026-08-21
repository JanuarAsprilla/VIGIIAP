/**
 * VIGIA-IIAP — PlatformIntroSection v-final
 * Geometría: polígono del Chocó Biogeográfico digitalizado desde cartografía oficial.
 * No hay shapefile en el proyecto; se usa el contorno verificado contra el mapa oficial IIAP.
 * Renderer: partículas circulares nítidas, corte duro, sin blur.
 */
import { useRef, useState, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import * as THREE from 'three'
import { useTheme } from '@/contexts/ThemeContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import { CinematicChocoScene } from './CinematicChocoScene'
import MarqueeStrip from './MarqueeStrip'

// ── Polígono oficial del Chocó Biogeográfico ──────────────────────────────────
// Coordenadas UTM Zona 17N en kilómetros, trazadas del mapa oficial IIAP/IGAC.
// Extensión real: X 827–1093 km (Este) · Y 618–1478 km (Norte)
// Dimensiones: 266 km ancho × 860 km alto → ratio real 3.23:1
//
// Borde este  = piedemonte cordillera Occidental de los Andes
// Borde oeste = costa Pacífico colombo-ecuatoriana
// Norte       = Darién / Urabá (~8.5°N) · Sur = Ecuador (~1.5°N)
const CHOCO_UTM_KM = [
  // Punta norte — Darién / Urabá
  [945,1478],
  // Borde ESTE — piedemonte Andes, bajando hacia el sur
  [965,1465],[990,1450],[1015,1432],[1042,1414],[1062,1396],[1079,1374],
  [1088,1350],[1092,1322],[1093,1292],[1092,1262],[1090,1232],[1088,1202],
  [1085,1172],[1082,1142],[1079,1108],[1075,1075],[1068,1040],[1058,1004],
  [1045, 967],[1028, 928],[1008, 888],[ 985, 848],[ 958, 808],[ 930, 768],
  [ 902, 728],[ 875, 687],[ 852, 645],[ 840, 620],
  // Punta sur — frontera Ecuador
  [832,618],
  // Borde OESTE — costa Pacífico, subiendo hacia el norte
  [828,638],[827,672],[829,712],[832,755],[838,800],[843,848],[847,898],
  [849,947],[852,995],[855,1042],[858,1088],[864,1133],[872,1177],
  [882,1222],[892,1265],[902,1308],[910,1350],[914,1390],[915,1428],
  [920,1457],[933,1472],
  // Cierre
  [945,1478],
]

// Centroide geográfico y escala
// SC: unidades Three.js por km → altura total de escena = 5.0 unidades
const UTM_CX = (827 + 1093) / 2   // 960 km
const UTM_CY = (618 + 1478) / 2   // 1048 km
const SC     = 5.0 / (1478 - 618) // ≈ 0.005814 u/km

const CHOCO_BOUNDARY = CHOCO_UTM_KM.map(([x, y]) => [
  (x - UTM_CX) * SC,
  (y - UTM_CY) * SC,
])

// Pre-calcular bounding box del polígono en espacio de escena
const _xs = CHOCO_BOUNDARY.map(p => p[0])
const _ys = CHOCO_BOUNDARY.map(p => p[1])
const B = {
  xMin: Math.min(..._xs) - 0.05, xMax: Math.max(..._xs) + 0.05,
  yMin: Math.min(..._ys) - 0.05, yMax: Math.max(..._ys) + 0.05,
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function insidePoly(px: number, py: number, poly: number[][]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, l2 = dx*dx + dy*dy
  if (l2 === 0) return Math.hypot(px-ax, py-ay)
  const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / l2))
  return Math.hypot(px-ax-t*dx, py-ay-t*dy)
}

function boundaryDist(px: number, py: number) {
  let m = Infinity
  for (let i = 0; i < CHOCO_BOUNDARY.length; i++) {
    const j = (i + 1) % CHOCO_BOUNDARY.length
    m = Math.min(m, segDist(px, py,
      CHOCO_BOUNDARY[i][0], CHOCO_BOUNDARY[i][1],
      CHOCO_BOUNDARY[j][0], CHOCO_BOUNDARY[j][1]))
  }
  return m
}

// ── Geometría de partículas ────────────────────────────────────────────────────
const EDGE_T = 0.14   // radio zona de borde — relativo a SC (ancho ~1.54 u)

function buildGeometry(total = 9000) {
  const pos   = new Float32Array(total * 3)
  const sz    = new Float32Array(total)
  const normY = new Float32Array(total)
  const edge  = new Float32Array(total)
  const yR    = B.yMax - B.yMin
  let placed  = 0

  // Relleno interior por rejection sampling
  for (let t = 0; t < total * 40 && placed < total; t++) {
    const x = B.xMin + Math.random() * (B.xMax - B.xMin)
    const y = B.yMin + Math.random() * (B.yMax - B.yMin)
    if (!insidePoly(x, y, CHOCO_BOUNDARY)) continue
    pos[placed*3]=x; pos[placed*3+1]=y; pos[placed*3+2]=(Math.random()-0.5)*0.14
    const d = boundaryDist(x, y)
    const ef = Math.max(0, 1 - d / EDGE_T)
    edge[placed]  = ef
    sz[placed]    = ef > 0.7
      ? 0.10 + Math.random() * 0.14   // borde: partículas pequeñas y nítidas
      : 0.14 + Math.random() * 0.22   // interior: algo más grandes
    normY[placed] = (y - B.yMin) / yR
    placed++
  }

  // Refuerzo de borde — partículas muy pequeñas directamente sobre el contorno
  const n = CHOCO_BOUNDARY.length
  while (placed < total) {
    const i = Math.floor(Math.random() * n), f = Math.random(), ni = (i+1)%n
    const bx = CHOCO_BOUNDARY[i][0]*(1-f)+CHOCO_BOUNDARY[ni][0]*f+(Math.random()-0.5)*0.008
    const by = CHOCO_BOUNDARY[i][1]*(1-f)+CHOCO_BOUNDARY[ni][1]*f+(Math.random()-0.5)*0.008
    pos[placed*3]=bx; pos[placed*3+1]=by; pos[placed*3+2]=(Math.random()-0.5)*0.03
    sz[placed]    = 0.08 + Math.random() * 0.10
    normY[placed] = (by - B.yMin) / yR
    edge[placed]  = 1.0
    placed++
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSize',    new THREE.BufferAttribute(sz, 1))
  g.setAttribute('aNormY',   new THREE.BufferAttribute(normY, 1))
  g.setAttribute('aEdge',    new THREE.BufferAttribute(edge, 1))
  return g
}

// ── Shaders ───────────────────────────────────────────────────────────────────
const VERT = /* glsl */`
  attribute float aSize;
  attribute float aNormY;
  attribute float aEdge;
  uniform float uTime;
  varying float vNormY;
  varying float vEdge;
  varying float vAlpha;
  varying float vDepth;

  void main(){
    vec3 p = position;
    vNormY = aNormY;
    vEdge  = aEdge;

    // Ondulación Z sutil (2 armónicos — elegante, no caótica)
    float z = sin(uTime*0.40 + p.y*2.10 + p.x*0.85) * 0.042
            + sin(uTime*0.25 + p.x*2.50 - p.y*0.60) * 0.022;
    p.z += z;

    // Micro-shimmer XY — preserva silueta
    p.x += sin(uTime*0.13 + p.y*1.55) * 0.0016;
    p.y += cos(uTime*0.11 + p.x*1.95) * 0.0011;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth  = -mv.z;

    // Borde: algo más grande para definir el contorno
    float sm = mix(0.80, 1.50, aEdge);
    gl_PointSize = aSize * sm * (128.0 / -mv.z);

    vAlpha = 0.68 + 0.32 * abs(sin(uTime*0.22 + p.y*1.1 + p.x*0.5));
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */`
  uniform vec3  uCA;      // color sur
  uniform vec3  uCB;      // color centro
  uniform vec3  uCC;      // color norte
  uniform float uGlow;
  uniform float uIsDark;
  varying float vNormY;
  varying float vEdge;
  varying float vAlpha;
  varying float vDepth;

  void main(){
    // Corte duro — cero blur/humo/acuarela
    float dist = length(gl_PointCoord - vec2(0.5));
    if(dist > 0.50) discard;

    // Círculo electrónico preciso: AA de 1px exacto en el borde exterior
    float circle = 1.0 - smoothstep(0.44, 0.50, dist);
    // Núcleo ligeramente más brillante (efecto data-point)
    float core   = 1.0 - smoothstep(0.00, 0.28, dist);

    float depth  = clamp(1.0 - (vDepth - 4.5)*0.08, 0.38, 1.0);
    // Interior: translúcido; borde: sólido
    float iAlpha = mix(0.52, 1.00, vEdge);
    float alpha  = (circle*0.90 + core*0.10) * iAlpha * vAlpha * uGlow * depth;

    // Degradado topográfico sur→centro→norte
    vec3 col = vNormY < 0.5
      ? mix(uCA, uCB, vNormY * 2.0)
      : mix(uCB, uCC, (vNormY-0.5)*2.0);

    // Borde más brillante (Fresnel simulado)
    col = mix(col, col * (1.55 + uIsDark*0.40), vEdge * 0.58);
    // Destello del núcleo
    col = mix(col, col + vec3(0.04,0.14,0.07)*uIsDark, core*0.38);

    gl_FragColor = vec4(col, alpha);
  }
`

// Paletas
const PAL = {
  dark:  { a:'#009850', b:'#00F087', c:'#80FFD8' },   // esmeralda → cian fluorescente
  light: { a:'#1A5E3A', b:'#007A5E', c:'#28997A' },   // esmeralda oscuro → teal
}

// ── ChocoMapCloud ─────────────────────────────────────────────────────────────
const GEO = buildGeometry(9000)   // precomputar al cargar el módulo

function ChocoMapCloud({ isDark, prefersReduced }: { isDark: boolean; prefersReduced: boolean }) {
  const matRef = useRef<import("three").ShaderMaterial | null>(null)

  const mat = useMemo(() => {
    const p = isDark ? PAL.dark : PAL.light
    const m = new THREE.ShaderMaterial({
      uniforms:{
        uTime:{value:0},
        uCA:{value:new THREE.Color(p.a)},
        uCB:{value:new THREE.Color(p.b)},
        uCC:{value:new THREE.Color(p.c)},
        uGlow:{value:isDark?0.96:0.88},
        uIsDark:{value:isDark?1:0},
      },
      vertexShader:VERT, fragmentShader:FRAG,
      transparent:true, depthWrite:false,
      blending:isDark?THREE.AdditiveBlending:THREE.NormalBlending,
    })
    // Cachea el material en el ref para acceso imperativo en useFrame/useEffect — patrón R3F estándar.
    // eslint-disable-next-line react-hooks/refs
    matRef.current = m
    return m
  // ShaderMaterial se crea una sola vez; isDark se actualiza vía el useEffect siguiente.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A2: dispose ShaderMaterial cuando el componente se desmonte
  useEffect(()=>{ return ()=>{ matRef.current?.dispose() } }, [])

  useEffect(()=>{
    const m=matRef.current; if(!m) return
    const p=isDark?PAL.dark:PAL.light
    m.uniforms.uCA.value.set(p.a)
    m.uniforms.uCB.value.set(p.b)
    m.uniforms.uCC.value.set(p.c)
    m.uniforms.uGlow.value  = isDark?0.96:0.88
    m.uniforms.uIsDark.value= isDark?1:0
    m.blending = isDark?THREE.AdditiveBlending:THREE.NormalBlending
    m.needsUpdate = true
  }, [isDark])

  useFrame((state)=>{
    if(matRef.current){
      matRef.current.uniforms.uTime.value = prefersReduced ? 0 : state.clock.getElapsedTime()
      state.invalidate()
    }
  })

  return <points geometry={GEO} material={mat} />
}

// ── Partículas ambientales — polvo cinematográfico (~180 puntos) ──────────────
function AmbientDust({ isDark, prefersReduced }: { isDark: boolean; prefersReduced: boolean }) {
  const matRef = useRef<import("three").ShaderMaterial | null>(null)
  // Distribución aleatoria de partículas generada una sola vez al montar — no re-render-dependiente.
  /* eslint-disable react-hooks/purity */
  const geo = useMemo(()=>{
    const N=180, p=new Float32Array(N*3), o=new Float32Array(N), s=new Float32Array(N)
    for(let i=0;i<N;i++){
      p[i*3]=(Math.random()-0.3)*4.5; p[i*3+1]=(Math.random()-0.5)*6.0; p[i*3+2]=(Math.random()-0.5)*3.0
      o[i]=Math.random()*Math.PI*2; s[i]=1.5+Math.random()*2.5
    }
    const g=new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.BufferAttribute(p,3))
    g.setAttribute('aO',new THREE.BufferAttribute(o,1))
    g.setAttribute('aS',new THREE.BufferAttribute(s,1))
    return g
  },[])
  /* eslint-enable react-hooks/purity */

  const mat = useMemo(()=>{
    const m=new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0},uC:{value:new THREE.Color(isDark?'#00c060':'#007A5E')}},
      vertexShader:`
        attribute float aO; attribute float aS; uniform float uTime; varying float vA;
        void main(){
          vec3 p=position;
          p.x+=sin(uTime*0.07+aO)*0.20; p.y+=cos(uTime*0.05+aO*1.3)*0.16; p.z+=sin(uTime*0.04+aO*0.8)*0.25;
          vA=0.08+0.08*sin(uTime*0.09+aO*2.0);
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_PointSize=aS*(300.0/-mv.z); gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader:`
        uniform vec3 uC; varying float vA;
        void main(){
          float d=length(gl_PointCoord-0.5)*2.0; if(d>1.0)discard;
          float a=(1.0-smoothstep(0.4,1.0,d))*0.4;
          gl_FragColor=vec4(uC,a*vA);
        }`,
      transparent:true, depthWrite:false,
      blending:isDark?THREE.AdditiveBlending:THREE.NormalBlending,
    })
    // eslint-disable-next-line react-hooks/refs -- cachea el material para acceso imperativo en useFrame/useEffect
    matRef.current=m; return m
  // Geometry se crea una sola vez; color se actualiza vía el useEffect siguiente.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // A2: dispose geometry + material al desmontar
  useEffect(()=>{ return ()=>{ geo.dispose(); matRef.current?.dispose() } }, [geo])

  useEffect(()=>{
    const m=matRef.current; if(!m) return
    m.uniforms.uC.value.set(isDark?'#00c060':'#007A5E')
    m.blending=isDark?THREE.AdditiveBlending:THREE.NormalBlending; m.needsUpdate=true
  },[isDark])

  useFrame((state)=>{
    if(matRef.current){
      matRef.current.uniforms.uTime.value = prefersReduced ? 0 : state.clock.getElapsedTime()
      state.invalidate()
    }
  })
  return <points geometry={geo} material={mat} />
}

// ── Rejilla cartográfica SIG ──────────────────────────────────────────────────
function CartographicGrid({ isDark }: { isDark: boolean }) {
  const geo = useMemo(()=>{
    const l: number[]=[], w=2.4, h=6.4, C=8, R=16
    for(let r=0;r<=R;r++){const y=-h/2+r*(h/R); l.push(-w/2,y,0,w/2,y,0)}
    for(let c=0;c<=C;c++){const x=-w/2+c*(w/C); l.push(x,-h/2,0,x,h/2,0)}
    const g=new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.Float32BufferAttribute(l,3))
    return g
  },[])
  return(
    <lineSegments geometry={geo} position={[0,0,-1.1]}>
      <lineBasicMaterial color={isDark?'#009846':'#007A5E'} opacity={isDark?0.055:0.070} transparent/>
    </lineSegments>
  )
}

// ── Escena ────────────────────────────────────────────────────────────────────
// Desktop: escena cinematográfica 3D (modelo real de Blender, cámara scrubbed por scroll).
// Móvil / prefers-reduced-motion: nube de partículas procedural — liviana, ya
// validada en dispositivos de gama baja, sin descarga de modelo pesado.
function Scene({ isDark, prefersReduced, scrollYProgress, mountCinematic }: {
  isDark: boolean
  prefersReduced: boolean
  scrollYProgress: MotionValue<number>
  mountCinematic: boolean
}) {
  if (mountCinematic) {
    return (
      <Suspense fallback={null}>
        <CinematicChocoScene scrollYProgress={scrollYProgress} isDark={isDark} />
      </Suspense>
    )
  }
  return(
    <>
      <fog attach="fog" args={[isDark?'#060f09':'#EEF5F1', 5, 24]}/>
      <group position={[0.90, 0, 0]}>
        <CartographicGrid isDark={isDark}/>
        <ChocoMapCloud    isDark={isDark} prefersReduced={prefersReduced}/>
        <AmbientDust      isDark={isDark} prefersReduced={prefersReduced}/>
      </group>
    </>
  )
}

// ── Capítulos ─────────────────────────────────────────────────────────────────
interface Chapter {
  num: string
  eyebrow: string
  headline: string
  body: string
  stat: { value: string; label: string }
  accent: string
}

const CHAPTERS: Chapter[] = [
  { num:'01', eyebrow:'El territorio',
    headline:'Donde la vida alcanza su máxima expresión',
    body:'El Chocó Biogeográfico es uno de los cinco hotspots de biodiversidad más importantes del planeta. Sus 187.000 km² de selvas húmedas tropicales —con más de 12.000 mm de lluvia al año— albergan miles de especies endémicas, muchas aún sin documentar. Un patrimonio natural sin igual que el mundo tiene el deber de proteger.',
    stat:{value:'8%',label:'de la biodiversidad global'}, accent:'#4ade80'},
  { num:'02', eyebrow:'30 años de ciencia',
    headline:'El IIAP: guardián del conocimiento ambiental',
    body:'Desde 1993, el Instituto de Investigaciones Ambientales del Pacífico genera conocimiento científico riguroso sobre el Chocó Biogeográfico. Sus investigadores documentan, sistematizan y transfieren datos que sustentan decisiones ambientales estratégicas para el desarrollo sostenible de las comunidades del Pacífico colombiano.',
    stat:{value:'30+',label:'años de investigación de campo'}, accent:'#D4A373'},
  { num:'03', eyebrow:'La plataforma digital',
    headline:'VIGIA-IIAP: cada dato cuenta, cada mapa importa',
    body:'Una plataforma diseñada para democratizar el acceso al conocimiento ambiental del Chocó. Mapas temáticos, documentos científicos, análisis SIG y herramientas especializadas —todo en un solo lugar— construido para investigadores, gestores territoriales y comunidades que necesitan información confiable para proteger su territorio.',
    stat:{value:'6',label:'módulos especializados integrados'}, accent:'#93c5fd'},
]

function ChapterText({ chapter, isActive, isDark }: { chapter: Chapter; isActive: boolean; isDark: boolean }){
  return(
    <AnimatePresence mode="wait">
      {isActive&&(
        <motion.div key={chapter.num}
          initial={{opacity:0,x:-36,filter:'blur(4px)'}}
          animate={{opacity:1,x:0,filter:'blur(0px)'}}
          exit={{opacity:0,x:-24,filter:'blur(2px)'}}
          transition={{duration:0.65,ease:[0.22,1,0.36,1]}}
          className="absolute left-0 top-1/2 -translate-y-1/2 max-w-[min(480px,90vw)] lg:max-w-[44%]"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[0.55rem] font-black uppercase tracking-[0.32em]" style={{color:chapter.accent}}>
              {chapter.eyebrow}
            </span>
            <div className="flex-1 h-px opacity-20" style={{background:chapter.accent}}/>
          </div>
          <h2 className="font-display font-black leading-[1.05] tracking-tight mb-5"
            style={{fontSize:'clamp(1.85rem,3.8vw,3.2rem)',color:isDark?'#E8F5EC':'#1A3D24',textShadow:`0 0 60px ${chapter.accent}22`}}>
            {chapter.headline}
          </h2>
          <p className="leading-relaxed mb-8"
            style={{color:isDark?'rgba(255,255,255,0.52)':'rgba(26,61,36,0.65)',fontSize:'clamp(0.82rem,1.1vw,0.95rem)',maxWidth:'40ch'}}>
            {chapter.body}
          </p>
          <motion.div className="flex items-end gap-3"
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            transition={{delay:0.22,duration:0.5,ease:[0.22,1,0.36,1]}}>
            <span className="font-display font-black leading-none"
              style={{fontSize:'clamp(2.6rem,5vw,4.2rem)',color:chapter.accent,textShadow:`0 0 40px ${chapter.accent}44`}}>
              {chapter.stat.value}
            </span>
            <span className="text-[0.62rem] font-bold uppercase tracking-wider pb-2"
              style={{color:isDark?'rgba(255,255,255,0.32)':'rgba(26,61,36,0.45)'}}>
              {chapter.stat.label}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function IIAPBadge({ isDark }: { isDark: boolean }){
  return(
    <div className="absolute bottom-10 right-8 lg:right-16 hidden sm:flex items-center gap-2.5">
      <div className="w-2 h-2 rounded-full animate-pulse"
        style={{background:isDark?'#4ade80':'#007A5E',boxShadow:isDark?'0 0 8px #4ade8066':'none'}}/>
      <span className="text-[0.55rem] font-bold uppercase tracking-[0.28em]"
        style={{color:isDark?'rgba(255,255,255,0.22)':'rgba(0,122,94,0.60)'}}>
        IIAP · Chocó Biogeográfico
      </span>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PlatformIntroSection(){
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const { isDark } = useTheme()
  const prefersReduced = useReducedMotion()
  const isMobile = useIsMobileViewport()
  // Escena cinematográfica solo en desktop y con movimiento habilitado — en
  // móvil o reduced-motion se mantiene la nube de partículas (más liviana).
  const useCinematic = !isMobile && !prefersReduced

  // A1: IntersectionObserver — pausa el canvas cuando no es visible en el viewport.
  // El modelo 3D solo se monta (y descarga) la primera vez que la sección entra
  // en viewport, y permanece montado después — evita recargarlo al hacer scroll
  // hacia atrás y evita competir con el LCP inicial de la página.
  useEffect(()=>{
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        if (entry.isIntersecting) setHasBeenVisible(true)
      },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({target:containerRef,offset:['start start','end end']})
  useMotionValueEvent(scrollYProgress,'change',v=>{
    const p=v<0.33?0:v<0.66?1:2; setPhase(prev=>prev!==p?p:prev)
  })

  return(
    <>
      <div ref={containerRef} style={{height:'300vh'}} className="-mx-4 lg:-mx-6 xl:-mx-10">
        <div className="sticky top-0 overflow-hidden" style={{
          height:'100vh',
          background:isDark
            ?'linear-gradient(140deg,#060f09 0%,#091a0e 45%,#0c1f14 100%)'
            :'linear-gradient(140deg,#EEF5F1 0%,#F2F7F3 45%,#EBF4EE 100%)',
        }}>
          {/* Dot grid de fondo */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage:isDark
              ?'radial-gradient(circle,#009846 1px,transparent 1px)'
              :'radial-gradient(circle,rgba(0,122,94,.26) 1px,transparent 1px)',
            backgroundSize:'28px 28px',
          }}/>

          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
            background:'linear-gradient(90deg,transparent,rgba(0,152,70,.5) 30%,rgba(0,122,94,.35) 70%,transparent)',
          }}/>

          {/* Canvas Three.js — frameloop="demand": solo renderiza cuando useFrame llama state.invalidate() */}
          <div className="absolute inset-0" style={{opacity:isDark?0.93:0.90}}>
            <Canvas
              frameloop={isVisible ? 'demand' : 'never'}
              camera={{position:[0.25,0,8],fov:52}}
              gl={{antialias:true,alpha:true}}
              style={{background:'transparent'}}
            >
              <Scene
                isDark={isDark}
                prefersReduced={prefersReduced}
                scrollYProgress={scrollYProgress}
                mountCinematic={useCinematic && hasBeenVisible}
              />
            </Canvas>
          </div>

          {/* Gradiente izquierdo para legibilidad del texto */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background:isDark
              ?'linear-gradient(90deg,rgba(6,15,9,.93) 0%,rgba(6,15,9,.62) 44%,rgba(6,15,9,.02) 100%)'
              :'linear-gradient(90deg,rgba(238,245,241,.96) 0%,rgba(238,245,241,.72) 44%,rgba(238,245,241,.02) 100%)',
          }}/>

          {/* Texto de capítulos */}
          <div className="absolute inset-0 px-8 lg:px-16">
            <div className="absolute top-8 left-8 lg:left-16">
              <span className="text-[0.55rem] font-bold uppercase tracking-[0.3em]"
                style={{color:isDark?'rgba(255,255,255,0.18)':'rgba(0,122,94,0.55)'}}>
                Descubre el Chocó Biogeográfico
              </span>
            </div>
            <div className="relative h-full">
              {CHAPTERS.map((ch,i)=>(
                <ChapterText key={i} chapter={ch} isActive={phase===i} isDark={isDark}/>
              ))}
            </div>
          </div>

          <IIAPBadge isDark={isDark}/>

          <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none" style={{
            background:isDark
              ?'linear-gradient(to top,rgba(6,15,9,.95) 0%,rgba(6,15,9,0) 100%)'
              :'linear-gradient(to top,rgba(238,245,241,.95) 0%,rgba(238,245,241,0) 100%)',
          }}/>
        </div>
      </div>
      <MarqueeStrip/>
    </>
  )
}
