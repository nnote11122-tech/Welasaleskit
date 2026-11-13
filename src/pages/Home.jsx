import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowRight, MapPin, Building2, X, Upload } from 'lucide-react';

const WELA_RED = '#E14D43';
const WELA_NAVY = '#001a33';

const menuItems = [
  {
    label: '01',
    title: 'Gallery',
    tagline: 'Atmosphere & Perspective',
    path: 'gallery',
    img: '/projects/elysium/gallery/facade/facade-0.webp',
  },
  {
    label: '02',
    title: 'Floor Plans',
    tagline: 'Urban Space Design',
    path: 'floor-plan',
    img: '/projects/elysium/gallery/facilities/facilities-1.webp',
  },
  {
    label: '03',
    title: 'Room Units',
    tagline: 'Functional Modern Living',
    path: 'room-plan',
    img: '/projects/elysium/gallery/room/23 SQM/1.webp',
  },
  {
    label: '04',
    title: 'Quotation',
    tagline: 'Value Investment',
    path: 'quotation',
    img: '/projects/elysium/gallery/facilities/facilities-2.webp',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
};

export default function Home() {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);

  const openVideo = () => setShowVideo(true);
  const closeVideo = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideo(false);
  };

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') closeVideo(); };
    if (showVideo) window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [showVideo]);

  return (
    <div className="h-[100dvh] bg-[#C8DCF0] text-[#001a33] font-sans overflow-hidden flex flex-col selection:bg-[#E14D43]/20 relative">

      {/* ── CSS สำหรับ Animation บนการ์ด ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          50%, 100% { transform: translateX(150%) skewX(-15deg); }
        }
        .animate-shimmer {
          animation: shimmer 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}} />

      {/* ── Subtle background texture ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(225,77,67,0.06)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,26,51,0.04)_0%,_transparent_60%)]" />
      </div>

      {/* ── HEADER ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-20 flex justify-between items-center px-6 md:px-16 py-5 md:py-8 shrink-0"
      >
        <div className="flex flex-col cursor-pointer">
          <span className="text-[9px] tracking-[0.5em] uppercase text-[#001a33]/40 font-bold mb-1">
            Asakan Development
          </span>
          <h1 className="text-3xl font-black tracking-[0.15em] text-[#001a33] leading-none">
            WE<span style={{ color: WELA_RED }}>L</span>A
          </h1>
        </div>

        <button onClick={() => navigate('/admin/prices')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#a8b7c5] px-4 py-2 text-sm font-medium text-[#001a33] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#001a33]"><Upload size={16} aria-hidden="true" /> นำเข้าราคา</button>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#001a33]/50">
            <MapPin size={13} style={{ color: WELA_RED }} />
            <span className="text-[10px] tracking-widest uppercase font-bold">
              Ramkhamhaeng 186
            </span>
          </div>
          <div className="w-px h-6 bg-[#001a33]/10" />
          <div className="flex items-center gap-2">
            <Building2 size={13} style={{ color: WELA_RED }} />
            <span className="text-[10px] tracking-widest uppercase font-bold text-[#001a33]/50">
              Sales Office
            </span>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-4 min-h-0">
        <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center">
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="outline" className="mb-4 md:mb-8 text-[#001a33]/50 border-[#001a33]/15 bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
              Smooth Life @ Station
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-6xl md:text-[9.5rem] font-black leading-[0.85] mb-3 md:mb-5 uppercase italic tracking-tighter"
            style={{ color: WELA_NAVY }}
          >
            Live{' '}
            <span className="relative inline-block" style={{ color: WELA_RED }}>
              Simple.
              <motion.span
                className="absolute -bottom-1 md:-bottom-2 left-0 h-[3px] md:h-[5px] rounded-full"
                style={{ backgroundColor: WELA_RED }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
              />
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-[#001a33]/50 text-xs md:text-base max-w-md mb-6 md:mb-10 font-medium leading-relaxed"
          >
            คอนโดติดสถานีรถไฟฟ้า ใกล้มหาวิทยาลัยรามคำแหง
            <br className="hidden md:block" />ออกแบบเพื่อชีวิตที่ลงตัวทุกวัน
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={openVideo}
              size="lg"
              className="group gap-4 shadow-xl shadow-[#E14D43]/20 rounded-full px-8 py-6"
              style={{ backgroundColor: WELA_RED }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <span className="font-bold tracking-widest uppercase text-[10px]">Watch Movie</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/project/wela/gallery')}
              className="group rounded-full px-8 py-6 border-[#001a33]/15 bg-white/30 backdrop-blur-md hover:bg-white text-[#001a33]"
            >
              <span className="font-bold tracking-widest uppercase text-[10px]">Explore</span>
              <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* ── MENU CARDS (Interactive & Touch-Friendly) ── */}
      <motion.footer
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-20 px-6 md:px-16 pb-6 md:pb-10 shrink-0"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-4 md:mb-8">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.path}
              variants={fadeUp}
              custom={i}
              onClick={() => navigate(`/project/wela/${item.path}`)}
              /* เปลี่ยนจาก React State มาใช้ Native Class ของ Tailwind (group, hover, active) เพื่อให้ตอบสนองบนมือถือไวที่สุด */
              className="group relative h-32 md:h-48 rounded-[2rem] overflow-hidden cursor-pointer border border-white/60 bg-white/30 backdrop-blur-md shadow-[0_8px_24px_rgba(0,26,51,0.03)] hover:shadow-[0_16px_40px_rgba(0,26,51,0.08)] active:scale-[0.96] transition-all duration-300"
              whileHover={{ y: -6 }}
            >
              
              {/* แสง Shimmer วิ่งผ่านการ์ด (ทำงานตลอดเวลา ทำให้มือถือดูมีลูกเล่น) */}
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[150%] h-full animate-shimmer pointer-events-none mix-blend-overlay" />

              {/* Background Image: ซ่อนอยู่ และจะโชว์เมื่อ Hover (คอม) หรือ เอานิ้วแตะค้าง (มือถือ) */}
              <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-500 ease-out">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover scale-110 group-hover:scale-100 group-active:scale-100 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001a33]/90 via-[#001a33]/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-between h-full p-4 md:p-6 pointer-events-none">
                
                {/* Header: Number & Arrow */}
                <div className="flex justify-between items-start">
                  <span className="text-2xl md:text-3xl font-black tracking-widest text-[#E14D43] group-hover:text-white/95 group-active:text-white/95 transition-colors duration-300 drop-shadow-sm">
                    {item.label}
                  </span>
                  
                  {/* ปุ่มลูกศร */}
                  <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/80 bg-white/60 group-hover:bg-[#E14D43] group-active:bg-[#E14D43] group-hover:border-[#E14D43] group-active:border-[#E14D43] flex items-center justify-center backdrop-blur-md transition-all duration-300 -rotate-45 group-hover:rotate-0 group-active:rotate-0 shadow-sm">
                    <ArrowRight size={14} className="text-[#001a33] group-hover:text-white group-active:text-white transition-colors" />
                    {/* จุดสังเกตกระพริบเบาๆ (แสดงเฉพาะบนมือถือเพื่อบอกให้กด) */}
                    <span className="absolute -inset-1 rounded-full border border-[#E14D43]/30 animate-ping md:hidden" />
                  </div>
                </div>

                {/* Footer: Title & Tagline */}
                <div>
                  <h3 className="text-base md:text-xl font-black uppercase tracking-tight text-[#001a33] group-hover:text-white group-active:text-white transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-[9px] md:text-[10px] tracking-widest uppercase font-bold mt-1 text-[#001a33]/40 group-hover:text-white/70 group-active:text-white/70 transition-colors duration-300">
                    {item.tagline}
                  </p>
                </div>
              </div>

              {/* เส้น Accent สีแดง วิ่งจากซ้ายไปขวาเมื่อ Hover / แตะ */}
              <div className="absolute bottom-0 left-0 h-[3px] rounded-t-full bg-[#E14D43] w-0 group-hover:w-full group-active:w-full transition-all duration-500 ease-out" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-between items-center text-[9px] tracking-[0.3em] text-[#001a33]/30 uppercase font-bold border-t border-[#001a33]/10 pt-6"
        >
          <p>© 2026 Asakan Group</p>
          <p className="hidden sm:block">WELA Ramkhamhaeng 186</p>
        </motion.div>
      </motion.footer>

      {/* ── VIDEO MODAL ── */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#001a33]/96 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl"
            >
              <button
                onClick={closeVideo}
                className="absolute -top-14 right-0 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[10px] tracking-widest uppercase font-black"
              >
                <X size={14} /> Close
              </button>
              <video
                ref={videoRef}
                src="/projects/elysium/video/project-tour.mp4"
                controls
                autoPlay
                className="w-full aspect-video rounded-2xl shadow-2xl border border-white/5 object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
