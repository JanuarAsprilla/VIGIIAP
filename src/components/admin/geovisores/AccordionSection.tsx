import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function AccordionSection({ n, title, hint, icon: Icon, defaultOpen = false, children }: {
  n: number
  title: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-start gap-2.5 p-3.5 text-left hover:bg-bg-alt/50 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-primary-800 text-white text-[0.65rem] font-bold flex items-center justify-center shrink-0 mt-0.5">
          {n}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-text flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-primary-700 shrink-0" aria-hidden="true" />
            {title}
          </h4>
          <p className="text-xs text-text-muted mt-0.5">{hint}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 mt-1">
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3.5 pt-0 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
