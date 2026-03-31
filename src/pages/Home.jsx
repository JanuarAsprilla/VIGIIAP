export default function Home() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-16 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary-900 via-primary-800 to-primary-700" />

      <div className="max-w-350 mx-auto text-center text-white">
        <h1 className="font-display text-6xl font-bold mb-4">VIGIIAP</h1>
        <p className="text-xl text-white/70 mb-2">
          Portal Principal — Chocó Biogeográfico
        </p>
        <p className="text-sm text-white/40">
          El Hero completo se construirá en la Tarea 7
        </p>
      </div>
    </section>
  )
}