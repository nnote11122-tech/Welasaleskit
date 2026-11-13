import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Images, Layers, BedDouble, MapPin, FileText, ChevronLeft, Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const WELA_RED = '#E14D43';

const sideMenus = [
  { name: 'Gallery',    path: 'gallery',    icon: Images },
  { name: 'Floor Plan', path: 'floor-plan', icon: Layers },
  { name: 'Room Plan',  path: 'room-plan',  icon: BedDouble },
  { name: 'Location',   path: 'location',   icon: MapPin },
  { name: 'Quotation',  path: 'quotation',  icon: FileText },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isManager } = useAuth();

  const handleNavigate = (path) => {
    navigate(`/project/${id}/${path}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[105] md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-[110] w-64
          flex flex-col
          transition-transform duration-500 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'linear-gradient(160deg, #002244 0%, #001a33 60%, #0d0d1a 100%)' }}
      >
        {/* Decorative top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(to right, ${WELA_RED}, transparent)` }}
        />

        {/* Mobile close */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Brand */}
        <div className="px-8 pt-12 pb-10 flex flex-col items-center">
          <span className="text-[8px] tracking-[0.6em] text-white/30 uppercase mb-3 font-bold">
            Asakan Development
          </span>

          <h1 className="text-[2.6rem] font-black tracking-[0.15em] text-white leading-none">
            WE<span style={{ color: WELA_RED }}>L</span>A
          </h1>

          <p className="text-[9px] tracking-[0.25em] text-white/40 mt-2 uppercase font-medium">
            Ramkhamhaeng 186
          </p>

          {/* Divider */}
          <div className="mt-8 w-full h-px bg-white/8" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {isManager && <button onClick={() => { navigate('/admin/prices'); setIsOpen(false); }} className="flex min-h-11 w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Upload size={15} aria-hidden="true" /> นำเข้าราคา</button>}
          {sideMenus.map((menu) => {
            const isActive = location.pathname.includes(menu.path);
            const Icon = menu.icon;
            return (
              <button
                key={menu.path}
                onClick={() => handleNavigate(menu.path)}
                className={`
                  w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl
                  text-[11px] font-bold uppercase tracking-[0.15em]
                  transition-all duration-200 relative group text-left
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                    style={{ backgroundColor: WELA_RED }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  size={15}
                  style={{ color: isActive ? WELA_RED : 'currentColor' }}
                  className="shrink-0 transition-colors"
                />
                <span>{menu.name}</span>

                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: WELA_RED }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-white/5">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-[9px] font-bold text-white/30 hover:text-white transition-all group uppercase tracking-widest w-full"
          >
            <ChevronLeft
              size={13}
              style={{ color: WELA_RED }}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to all projects
          </button>
        </div>
      </aside>
    </>
  );
}
