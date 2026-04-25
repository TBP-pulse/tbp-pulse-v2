export default function StatusDonut({ green = 0, yellow = 0, red = 0, size = 48 }: { green?: number, yellow?: number, red?: number, size?: number }) {
  const total = green + yellow + red
  if (total === 0) return null

  const r = 18
  const circumference = 2 * Math.PI * r
  const greenPct = green / total
  const yellowPct = yellow / total
  const redPct = red / total

  const greenLen = greenPct * circumference
  const yellowLen = yellowPct * circumference
  const redLen = redPct * circumference

  const greenOffset = 0
  const yellowOffset = -greenLen
  const redOffset = -(greenLen + yellowLen)

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="transform -rotate-90">
      {/* Green segment */}
      {green > 0 && (
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke="#10B981"
          strokeWidth="6"
          strokeDasharray={`${greenLen} ${circumference - greenLen}`}
          strokeDashoffset={greenOffset}
          strokeLinecap="round"
        />
      )}
      {/* Yellow segment */}
      {yellow > 0 && (
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="6"
          strokeDasharray={`${yellowLen} ${circumference - yellowLen}`}
          strokeDashoffset={yellowOffset}
          strokeLinecap="round"
        />
      )}
      {/* Red segment */}
      {red > 0 && (
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke="#EF4444"
          strokeWidth="6"
          strokeDasharray={`${redLen} ${circumference - redLen}`}
          strokeDashoffset={redOffset}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
