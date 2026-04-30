import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handleCopy}
      className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded ${
        copied ? 'bg-emerald-100 text-emerald-600' : 'text-tbp-orange hover:bg-tbp-orange/10'
      }`}>
      {copied ? 'Copiat ✓' : 'Copiază ⎘'}
    </button>
  )
}
