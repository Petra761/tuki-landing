// src/components/Logo.tsx
// Marca de Tuki: una "t" dentro de un cuadrado lima, más el nombre en minúsculas.

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#C8F25A" />
        {/* La "t": un trazo vertical con travesaño; el pie se curva hacia la derecha. */}
        <path
          d="M14 7v13.2c0 2 1.2 3.2 3.2 3.2H20M9.5 12.5H20"
          fill="none"
          stroke="#0E1F1A"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo__texto">tuki</span>
    </span>
  )
}
