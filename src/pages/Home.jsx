import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Leaf, ArrowDown, Globe } from 'lucide-react'
import Preloader from '@/components/Preloader'
import Particles from '@/components/Particles'
import StatCard from '@/components/ui/StatCard'
import { STATS } from '@/lib/constants'

// ── Animation helpers ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── Hero Section ──
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-16 px-6 overflow-hidden">
      {/* ── Background layers ── */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />

        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating particles */}
        <Particles />
      </div>

      {/* ── Content grid ── */}
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">
        {/* ── Left: Text Content ── */}
        <div className="text-white xl:text-left text-center">
          {/* Badge */}
          <motion.div
            {...fadeUp(0.1)}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm mb-6"
          >
            <Leaf className="w-4 h-4 text-primary-300" />
            <span>Instituto de Investigaciones Ambientales del Pacífico</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            {...fadeUp(0.2)}
            className="font-display text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.1] mb-6"
          >
            <span className="block">Chocó</span>
            <span className="block text-primary-300">Biogeográfico</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            {...fadeUp(0.3)}
            className="text-lg text-white/80 max-w-[540px] leading-relaxed mb-8 xl:mx-0 mx-auto"
          >
            La región del Pacífico es una de las seis regiones naturales de Colombia.
            Comprende casi la totalidad del departamento del Chocó, y las zonas costeras
            de los departamentos del Valle del Cauca, Cauca y Nariño.
          </motion.p>

          {/* Stats grid */}
          <motion.div
            {...fadeUp(0.4)}
            className="grid grid-cols-3 gap-3 mb-8 max-w-[600px] xl:mx-0 mx-auto"
          >
            {STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp(0.5)}
            className="flex flex-wrap gap-4 xl:justify-start justify-center"
          >
            <Link
              to="/mapas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-300 text-primary-900 rounded-full font-semibold text-[0.95rem] no-underline hover:bg-white hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-250"
            >
              <span>Explorar Módulos</span>
              <ArrowDown className="w-[18px] h-[18px]" />
            </Link>
            <Link
              to="/geovisor"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-full font-semibold text-[0.95rem] no-underline hover:bg-white/10 hover:border-white transition-all duration-250"
            >
              <span>Ver Geovisor</span>
              <Globe className="w-[18px] h-[18px]" />
            </Link>
          </motion.div>
        </div>

        {/* ── Right: Map placeholder ── */}
        <div className="xl:block max-w-[700px] xl:mx-0 mx-auto w-full">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <Globe className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/50 text-sm">
              Mapa interactivo — Tarea 7
            </p>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 text-xs animate-bounce">
        <div className="w-6 h-9 border-2 border-white/40 rounded-xl relative">
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-primary-300 rounded-full animate-pulse" />
        </div>
        <span>Desplázate para explorar</span>
      </div>
    </section>
  )
}

// ── Home Page ──
export default function Home() {
  return (
    <>
      <Preloader />
      <HeroSection />
    </>
  )
}