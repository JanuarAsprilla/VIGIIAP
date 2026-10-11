import { motion } from 'framer-motion'

export default function Switch({ checked, onChange, label, disabled = false }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-primary-700' : 'bg-bg-alt border border-border'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm ${checked ? 'ml-[1.125rem]' : 'ml-0.5'}`}
      />
    </button>
  )
}
