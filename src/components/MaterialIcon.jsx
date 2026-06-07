export default function MaterialIcon({ icon, fill = false, className = '', style = {} }) {
  const varSettings = fill
    ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"

  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ''}`}
      style={{ fontVariationSettings: varSettings, ...style }}
    >
      {icon}
    </span>
  )
}
