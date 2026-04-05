'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderSecondaryProps {
  onBackClick?: () => void
  title?: string
}

export default function HeaderSecondary({
  onBackClick,
  title
}: HeaderSecondaryProps) {

  const router = useRouter()

  function handleBack() {
    if (onBackClick) {
      onBackClick()
    } else {
      router.back()
    }
  }

  return (
    <header className="w-full h-14 px-5 flex items-center justify-between border-b border-zinc-800">

      {/* LEFT (espaço vazio para manter layout equilibrado) */}
      <div className="w-1/3"></div>

      {/* CENTER */}
      <div className="flex justify-center w-1/3">
        {title && (
          <h1 className="text-base font-semibold text-edu-agenda text-center truncate">
            {title}
          </h1>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex justify-end w-1/3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-edu-agenda text-sm font-semibold hover:underline transition-all bg-transparent border-none cursor-pointer"
          data-testid="button-voltar"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
      </div>

    </header>
  )
}