/**
 * VIGIA-IIAP — CinematicChocoScene
 * Carga el modelo 3D cinematográfico del Chocó (choco-cinematic.glb, exportado
 * headless desde Blender) y convierte el scroll de la sección en un scrub
 * determinista sobre las 3 cámaras animadas de la escena (Overview → Flythrough
 * → Macro Hotspot), con cross-fade de posición/rotación en cada transición en
 * vez de cortes duros.
 *
 * El muestreo NO usa AnimationMixer/AnimationAction: su doble buffer interno
 * (PropertyMixer) solo escribe en el objeto cuando detecta un cambio entre dos
 * ciclos alternos, pensado para reproducción con deltaTime real — con
 * deltaTime=0 (scrubbing manual) se queda "pegado". Se muestrean los
 * KeyframeTrack directamente vía su propio interpolant, la técnica estándar
 * para cámaras controladas por scroll.
 *
 * Las luces del .blend no se exportan: sus unidades fotométricas (lux/candela)
 * sobreexponen la escena bajo el tone-mapping de three.js. La iluminación se
 * arma aquí con intensidades calibradas por tema, preservando los colores
 * reales de los materiales horneados (sin recolorearlos).
 */
import { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'

const MODEL_URL = '/models/choco-cinematic.glb'

// Decoder Draco autoalojado (node_modules/three) en vez del CDN por defecto de
// drei — evita depender de un origen externo no cubierto por la CSP del sitio.
useGLTF.setDecoderPath('/draco/')

const CLIP_NAMES = [
  'CAM_01_Overview_HeroAction',
  'CAM_02_FlythroughAction',
  'CAM_03_Macro_HotspotAction',
] as const

// Fracción del progreso global de scroll dedicada a difuminar entre dos cámaras
// en cada uno de los 2 puntos de corte de la escena.
const CROSSFADE = 0.05

// three's type defs omit `createInterpolant` even though every KeyframeTrack
// instance carries it at runtime (assigned dynamically in the constructor).
interface InterpolatableTrack extends THREE.KeyframeTrack {
  createInterpolant(resultBuffer?: Float32Array): THREE.Interpolant
}

interface CamTrackSet {
  posInterpolant: THREE.Interpolant | null
  quatInterpolant: THREE.Interpolant | null
  fovInterpolant: THREE.Interpolant | null
  start: number
  duration: number
  fovBase: number
}

function buildTrackSet(clip: THREE.AnimationClip | undefined, fovBase: number): CamTrackSet {
  if (!clip) return { posInterpolant: null, quatInterpolant: null, fovInterpolant: null, start: 0, duration: 0, fovBase }
  const posTrack = clip.tracks.find(t => t.name.endsWith('.position'))
  const quatTrack = clip.tracks.find(t => t.name.endsWith('.quaternion'))
  const fovTrack = clip.tracks.find(t => t.name.endsWith('.fov'))
  let start = Infinity
  let end = -Infinity
  for (const track of clip.tracks) {
    if (track.times.length === 0) continue
    start = Math.min(start, track.times[0])
    end = Math.max(end, track.times[track.times.length - 1])
  }
  if (!Number.isFinite(start)) { start = 0; end = 0 }
  return {
    posInterpolant: posTrack ? (posTrack as InterpolatableTrack).createInterpolant() : null,
    quatInterpolant: quatTrack ? (quatTrack as InterpolatableTrack).createInterpolant() : null,
    fovInterpolant: fovTrack ? (fovTrack as InterpolatableTrack).createInterpolant() : null,
    start,
    duration: end - start,
    fovBase,
  }
}

function sample(set: CamTrackSet, localT: number, outPos: THREE.Vector3, outQuat: THREE.Quaternion) {
  const time = set.start + THREE.MathUtils.clamp(localT, 0, 1) * set.duration
  if (set.posInterpolant) {
    const v = set.posInterpolant.evaluate(time)
    outPos.set(v[0], v[1], v[2])
  }
  if (set.quatInterpolant) {
    const q = set.quatInterpolant.evaluate(time)
    outQuat.set(q[0], q[1], q[2], q[3]).normalize()
  }
  return set.fovInterpolant ? set.fovInterpolant.evaluate(time)[0] : set.fovBase
}

interface CinematicChocoSceneProps {
  scrollYProgress: MotionValue<number>
  isDark: boolean
}

export function CinematicChocoScene({ scrollYProgress, isDark }: CinematicChocoSceneProps) {
  const gltf = useGLTF(MODEL_URL)
  const { camera, scene, gl } = useThree()

  const rig = useMemo(() => {
    const camNames = ['CAM_01_Overview_Hero', 'CAM_02_Flythrough', 'CAM_03_Macro_Hotspot'] as const
    const cams = camNames.map(
      name => gltf.scene.getObjectByName(name) as THREE.PerspectiveCamera | undefined
    )
    const sets = CLIP_NAMES.map((clipName, i) =>
      buildTrackSet(gltf.animations.find(c => c.name === clipName), cams[i]?.fov ?? 52)
    )
    const durations = sets.map(s => s.duration)
    const total = durations.reduce((a, b) => a + b, 0) || 1
    // Fracciones acumuladas de progreso global donde termina cada clip.
    const boundaries: [number, number, number] = [
      durations[0] / total,
      (durations[0] + durations[1]) / total,
      1,
    ]
    return { sets, boundaries }
  }, [gltf])

  // El encuadre (near/far) y la niebla dependen del tamaño real del modelo — no
  // se pueden adivinar de antemano, se calculan una vez cargado el .glb.
  // Mutar camera/scene imperativamente es el patrón estándar de R3F para
  // objetos three.js obtenidos vía useThree() — no son estado de React.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = box.getSize(new THREE.Vector3()).length() || 10
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = Math.max(size * 0.002, 0.01)
      camera.far = size * 4
      camera.updateProjectionMatrix()
    }
    // El world shader del .blend ("Mundo_Selva_Nocturna") es un degradado
    // índigo nocturno → ámbar de horizonte que no exporta a glTF — se
    // aproxima aquí como niebla índigo (THREE.Fog solo admite un color). En
    // claro se usa un verde salvia pálido (no blanco puro) para no lavar el
    // territorio, con el rango empezando más lejos para conservar el primer plano.
    scene.fog = isDark
      ? new THREE.Fog(0x140f22, size * 0.18, size * 0.95)
      : new THREE.Fog(0xd7e8dc, size * 0.32, size * 1.3)
    return () => { scene.fog = null }
  }, [gltf, camera, scene, isDark])

  // Las intensidades de emisión horneadas en Blender (Mat_Chispa/Luciernaga/
  // Pulso, 5x-8x) están calibradas para el pipeline de EEVEE con su propio
  // bloom/exposición — bajo el tone-mapping ACES de three.js sin ajustar,
  // saturan a blanco (el "sol" en vez de un brillo verde biodiversidad).
  // Selva_Choco_PBR trae además un emissiveFactor gris plano (0.5,0.5,0.5)
  // del nodo "Auto_Iluminacion_Segura" (red de seguridad para el preview de
  // EEVEE) que lava el verde real de los vertex colors sin importar la luz
  // de escena — se anula por completo, ya que la iluminación la aporta React.
  // El clearcoat exportado (KHR_materials_clearcoat) suma su propio brillo
  // especular por cada luz de la escena — con 4 luces simultáneas termina
  // sumando un velo blanquecino sobre el verde real; se desactiva.
  useEffect(() => {
    const GLOW_INTENSITY = new Map([
      ['Mat_Chispa', 0.4],
      ['Mat_Luciernaga', 0.4],
      ['Mat_Pulso', 0.4],
      ['Selva_Choco_PBR', 0],
    ])
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      const intensity = mat && GLOW_INTENSITY.get(mat.name)
      if (mat && intensity !== undefined) {
        mat.emissiveIntensity = intensity
      }
      if (mat && mat.name === 'Selva_Choco_PBR') {
        // Factor base multiplicativo sobre los vertex colors: blanco en
        // oscuro (color real sin tocar), verde bosque real en claro (donde
        // el fondo pálido de la página necesitaba más presencia de verde).
        mat.color.set(isDark ? '#ffffff' : '#5fcb85')
        ;(mat as unknown as THREE.MeshPhysicalMaterial).clearcoat = 0
      }
    })
  }, [gltf, isDark])

  // Exposición reducida solo mientras esta escena cinematográfica está
  // montada — no afecta el fallback de partículas, que ya está calibrado
  // para la exposición por defecto del Canvas.
  useEffect(() => {
    const prevExposure = gl.toneMappingExposure
    gl.toneMappingExposure = 0.72
    return () => { gl.toneMappingExposure = prevExposure }
  }, [gl])
  /* eslint-enable react-hooks/immutability */

  const posA = useRef(new THREE.Vector3())
  const posB = useRef(new THREE.Vector3())
  const quatA = useRef(new THREE.Quaternion())
  const quatB = useRef(new THREE.Quaternion())
  const blendPos = useRef(new THREE.Vector3())
  const blendQuat = useRef(new THREE.Quaternion())

  // Scrubbing determinista: cada tick muestrea las 2 cámaras relevantes en el
  // tiempo derivado del scroll y mezcla su posición/rotación — mutación
  // imperativa esperada en el ciclo useFrame de R3F, no estado React.
  /* eslint-disable react-hooks/immutability */
  useFrame((state) => {
    const p = THREE.MathUtils.clamp(scrollYProgress.get(), 0, 1)
    const { sets, boundaries } = rig
    const [b0, b1] = boundaries

    const local0 = b0 > 0 ? p / b0 : 0
    const local1 = (b1 - b0) > 0 ? (p - b0) / (b1 - b0) : 0
    const local2 = (1 - b1) > 0 ? (p - b1) / (1 - b1) : 0
    const locals = [local0, local1, local2]

    let fromIdx = 0
    let toIdx = 0
    let t = 0
    if (p < b0 - CROSSFADE) {
      fromIdx = toIdx = 0
    } else if (p < b0 + CROSSFADE) {
      fromIdx = 0; toIdx = 1
      t = THREE.MathUtils.clamp((p - (b0 - CROSSFADE)) / (2 * CROSSFADE), 0, 1)
    } else if (p < b1 - CROSSFADE) {
      fromIdx = toIdx = 1
    } else if (p < b1 + CROSSFADE) {
      fromIdx = 1; toIdx = 2
      t = THREE.MathUtils.clamp((p - (b1 - CROSSFADE)) / (2 * CROSSFADE), 0, 1)
    } else {
      fromIdx = toIdx = 2
    }

    const fovA = sample(sets[fromIdx], locals[fromIdx], posA.current, quatA.current)
    const fovB = sample(sets[toIdx], locals[toIdx], posB.current, quatB.current)

    blendPos.current.lerpVectors(posA.current, posB.current, t)
    blendQuat.current.slerpQuaternions(quatA.current, quatB.current, t)
    camera.position.copy(blendPos.current)
    camera.quaternion.copy(blendQuat.current)

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(fovA, fovB, t)
      camera.updateProjectionMatrix()
    }

    state.invalidate()
  })
  /* eslint-enable react-hooks/immutability */

  return (
    <>
      {/* Iluminación propia — los colores de los materiales (selva, océano,
          bioluminiscencia) son los reales horneados desde Blender; solo la
          intensidad de luz se adapta por tema para que se vean bien en ambos. */}
      <ambientLight intensity={isDark ? 0.42 : 0.32} color={isDark ? '#3a8f5c' : '#ffffff'} />
      <hemisphereLight
        args={[isDark ? '#a8e6c9' : '#f4faf6', isDark ? '#04140a' : '#c8dcd0', isDark ? 0.4 : 0.3]}
      />
      <directionalLight
        position={[10, 14, 8]}
        intensity={isDark ? 0.75 : 0.85}
        color={isDark ? '#bfe8cf' : '#fff4e0'}
      />
      <directionalLight
        position={[0, 4, 12]}
        intensity={isDark ? 0.3 : 0.3}
        color={isDark ? '#8fd6a8' : '#ffffff'}
      />
      <primitive object={gltf.scene} />
    </>
  )
}

useGLTF.preload(MODEL_URL)
