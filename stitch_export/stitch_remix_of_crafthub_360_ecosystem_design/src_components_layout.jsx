import { motion } from 'framer-motion';
import { Search, MapPin, Star, MoreHorizontal } from 'lucide-react';

export default function Layout({ children, activePage, onNavigate }) {
  const navItems = [
    { id: 'home', icon: 'explore', label: 'Explore' },
    { id: 'crafthub', icon: 'inventory_2', label: 'Modules' },
    { id: 'passport', icon: 'menu_book', label: 'Passport' },
    { id: 'eat', icon: 'support_agent', label: 'Assistant' }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col max-w-md mx-auto shadow-2xl bg-surface/40">
      <header className="sticky top-0 z-50 glass-panel h-20 flex items-center justify-between px-6 border-b-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
            <img src="{{DATA:IMAGE:IMAGE_61}}" alt="Logo" className="w-6 h-6 opacity-80" />
          </div>
          <div>
            <h1 className="text-lg font-black gold-text uppercase tracking-tighter leading-none">CRAFTHUB 360</h1>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Founder Level 0</p>
          </div>
        </div>
        <button className="w-12 h-12 glass-panel rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 scroll-hide">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 glass-panel h-24 flex items-center justify-around px-4 border-t-primary/10 rounded-t-[40px]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 ${
              activePage === item.id ? 'text-primary scale-110' : 'text-on-surface-variant opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            {activePage === item.id && (
              <motion.div layoutId="nav-dot" className="w-1 h-1 bg-primary rounded-full mt-1" />
            )}
          </button>
        ))}
      </nav>

      {/* Global Cinematic Blur Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-primary/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}