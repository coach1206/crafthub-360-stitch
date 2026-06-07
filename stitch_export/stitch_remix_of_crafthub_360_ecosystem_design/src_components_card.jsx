export default function Card({ title, subtitle, icon, children, className = "" }) {
  return (
    <div className={`glass-panel p-6 rounded-2xl relative overflow-hidden group ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          {title && <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">{title}</h3>}
          {subtitle && <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">{subtitle}</p>}
        </div>
        {icon && (
          <div className="bg-primary/10 p-3 rounded-xl text-primary border border-primary/20">
            {icon}
          </div>
        )}
      </div>
      <div className="relative z-10">
        {children}
      </div>
      <div className="absolute right-0 top-0 h-full w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}