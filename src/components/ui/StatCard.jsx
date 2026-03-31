import { useAnimatedCounter } from '@/lib/useAnimatedCounter'

export default function StatCard({ icon: Icon, value, suffix = '', label, format = false }) {
  const { count, ref } = useAnimatedCounter(value)

  const displayValue = format
    ? count.toLocaleString('es-CO') + suffix
    : count + suffix

  return (
    <div
      ref={ref}
      className="glass rounded-xl p-4 text-center transition-all duration-250 hover:bg-white/12 hover:-translate-y-0.5 cursor-default"
    >
      <div className="mb-2">
        <Icon className="w-6 h-6 text-gold-400 mx-auto" />
      </div>
      <div className="font-display text-[1.75rem] font-bold text-white leading-tight">
        {displayValue}
      </div>
      <div className="text-[0.75rem] text-white/60 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  )
}