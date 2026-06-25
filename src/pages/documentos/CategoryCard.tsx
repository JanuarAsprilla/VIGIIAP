import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate } from 'framer-motion'
import { ArrowRight, BookOpen } from 'lucide-react'
import { categoryIcons, CATEGORY_COLORS } from './documentos.constants'

export function CategoryCard({ category, filteredCount, onOpen, index }) {
  const Icon   = categoryIcons[category.icon] || BookOpen
  const colors = CATEGORY_COLORS[category.title] || CATEGORY_COLORS.default
  const hasFilter = filteredCount !== null

  const ref    = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rawRX  = useTransform(mouseY, [-0.5, 0.5], [5, -5])
  const rawRY  = useTransform(mouseX, [-0.5, 0.5], [-5, 5])
  const rotateX = useSpring(rawRX, { stiffness: 300, damping: 30 })
  const rotateY = useSpring(rawRY, { stiffness: 300, damping: 30 })
  const glareX  = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glareY  = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])
  const glareOp = useMotionValue(0)
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.18), transparent 65%)`

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mouseX.set((e.clientX - r.left) / r.width - 0.5)
    mouseY.set((e.clientY - r.top) / r.height - 0.5)
    glareOp.set(1)
  }
  const onLeave = () => { mouseX.set(0); mouseY.set(0); glareOp.set(0) }

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 28, rotateX: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.05 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5 }}
      onClick={onOpen}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 900, aspectRatio: '4 / 3' }}
      className="group relative w-full text-left rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-800 focus-visible:ring-offset-2"
    >
      <motion.div style={{ background: glareBg, opacity: glareOp }}
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-20" />

      <div className="absolute inset-0 scale-100 group-hover:scale-110 transition-transform duration-700 ease-out">
        {category.thumbnail ? (
          <img src={category.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(145deg, ${colors.from} 0%, ${colors.to} 100%)` }}
          />
        )}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(ellipse at 15% 85%, rgba(255,255,255,0.35) 0%, transparent 55%),
                              radial-gradient(ellipse at 85% 10%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-[0.7rem] text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full font-semibold leading-none">
            {hasFilter
              ? `${filteredCount} / ${category.docs.length}`
              : `${category.docs.length} doc${category.docs.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>

        <div>
          <h3 className="text-white font-bold text-sm sm:text-base leading-snug mb-2 drop-shadow-sm">
            {category.title}
          </h3>
          <div className="flex items-center gap-1.5 text-white/0 group-hover:text-white/90 translate-y-1 group-hover:translate-y-0 transition-all duration-300 text-xs sm:text-sm font-semibold">
            <span>Ver documentos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}
