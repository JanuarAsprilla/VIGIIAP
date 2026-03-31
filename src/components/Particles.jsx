import { useEffect, useRef } from 'react'

export default function Particles({ count = 40 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div')
      const size = Math.random() * 5 + 2
      const x = Math.random() * 100
      const y = Math.random() * 100
      const delay = Math.random() * 5
      const dur = Math.random() * 10 + 10

      Object.assign(dot.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        background: `rgba(149, 213, 178, ${Math.random() * 0.25 + 0.08})`,
        borderRadius: '50%',
        left: `${x}%`,
        top: `${y}%`,
        animation: `vigiiap-float ${dur}s ease-in-out ${delay}s infinite`,
      })
      container.appendChild(dot)
    }

    // Cleanup al desmontar
    return () => {
      container.innerHTML = ''
    }
  }, [count])

  return (
    <>
      <style>{`
        @keyframes vigiiap-float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-30px) translateX(20px);
            opacity: 1;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      />
    </>
  )
}