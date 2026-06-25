/**
 * Card3D — Wrapper de tilt 3D reutilizable.
 *
 * Uso:
 *   <Card3D className="rounded-2xl border bg-white overflow-hidden">
 *     contenido
 *   </Card3D>
 *
 * Props:
 *   intensity   — grados máximos de tilt (default 6)
 *   glare       — activa el reflejo de glare (default true)
 *   disabled    — desactiva el efecto (default false)
 *   glow        — color CSS para el box-shadow glow en hover (ej. "rgba(0,152,70,0.28)")
 *   className   — clases del contenedor
 *   children
 */
import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate } from 'framer-motion'

export default function Card3D({
  children,
  className  = '',
  intensity  = 6,
  glare      = true,
  disabled   = false,
  glow       = null,
  whileHover = {},
  style      = {},
  ...rest
}) {
  const ref    = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Tilt springs
  const rawRX  = useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity])
  const rawRY  = useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity])
  const rotateX = useSpring(rawRX, { stiffness: 300, damping: 30 })
  const rotateY = useSpring(rawRY, { stiffness: 300, damping: 30 })

  // Glare gradient
  const glareX  = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glareY  = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])
  const glareOp = useMotionValue(0)
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15), transparent 65%)`

  const onMove = (e) => {
    if (disabled) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width  - 0.5)
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5)
    glareOp.set(1)
  }

  const onLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    glareOp.set(0)
  }

  if (disabled) {
    return (
      <div className={className} style={style} {...rest}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={glow
        ? { ...whileHover, boxShadow: `0 24px 64px ${glow}, 0 4px 20px rgba(0,0,0,0.07)` }
        : whileHover
      }
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective:    900,
        ...style,
      }}
      className={className}
      {...rest}
    >
      {/* Glare overlay */}
      {glare && (
        <motion.div
          style={{ background: glareBg, opacity: glareOp }}
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-20"
        />
      )}
      {children}
    </motion.div>
  )
}
