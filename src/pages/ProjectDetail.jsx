import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);

  // 1. ปรับ Path และ Tagline ให้เข้ากับคอนเซ็ปต์ WELA
  const menuItems = [
    { title: 'The Gallery', path: 'gallery', label: '01', tagline: 'SMOOTH LIFE PERSPECTIVE', img: '/projects/wela/gallery/facade.webp' },
    { title: 'Floor Plans', path: 'floor-plan', label: '02', tagline: 'URBAN SPACE DESIGN', img: '/projects/wela/floorplans/floor-main.webp' },
    { title: 'Room Units', path: 'room-plan', label: '03', tagline: 'FUNCTIONAL MODERN LIVING', img: '/projects/wela/roomplans/type-a.webp' },
    { title: 'Quotation', path: 'quotation', label: '04', tagline: 'VALUE INVESTMENT', img: '/projects/wela/gallery/interior.webp' },
  ];

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
    const handleEsc = (e) => { if (e.key === 'Escape') closeVideo(); };
    if (showVideo) {
      window.addEventListener('keydown', handleEsc);
      setTimeout(() => {
        if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen().catch(() => {});
      }, 200);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showVideo]);

  // CI Colors
  const welaNavy = '#003366';
  const welaRed = '#E14D43';

  return (
    <div className="min-h-screen bg-[#001a33] text-white font-sans selection:bg-red-500/30 overflow-x-hidden flex flex-col">
      
      {/* --- BACKGROUND: ปรับเป็น Navy Gradient --- */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/projects/wela/gallery/facade.webp" 
          className="w-full h-full object-cover opacity-40 scale-105 blur-[1px]" 
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#003366]/80 via-[#001a33]/60 to-[#001a33]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#001a33] via-transparent to-[#003366]/40"></div>
      </div>

      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-10 md:py-16 flex-1 flex flex-col justify-center">
        
        {/* --- HEADER: เปลี่ยนสไตล์เป็น Modern Bold --- */}
        <header className="mb-12 animate-reveal">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-[3px]`} style={{ backgroundColor: welaRed }}></div>
            <span className="text-[10px] tracking-[0.5em] uppercase text-white/60 font-black">
              WELA RAMKHAMHAENG 186
            </span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] text-white mb-8 italic uppercase">
            Smooth <span style={{ color: welaRed }}>Life.</span>
          </h1>
          
          <button 
            onClick={openVideo}
            className="group flex items-center gap-4 px-8 py-4 border border-white/10 rounded-full bg-white/5 backdrop-blur-md shadow-2xl hover:bg-white hover:text-[#003366] transition-all active:scale-95"
          >
            <div className={`w-2.5 h-2.5 rounded-full bg-red-500 group-hover:bg-[#003366] animate-pulse`}></div>
            <span className="text-[10px] tracking-[0.4em] font-black uppercase">Watch Movie</span>
          </button>
        </header>

        {/* --- LIST: เปลี่ยน Card เป็นสีเข้มแบบ Modern Glassmorphism --- */}
        <div className="flex flex-col gap-5">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(`/project/${id}/${item.path}`)}
              className="group relative w-full h-24 md:h-32 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-red-500/10 hover:border-red-500/40 active:scale-[0.98]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-700">
                <img src={item.img} className="w-full h-full object-cover" alt="preview" />
              </div>

              {/* Indicator Bar สีแดง WELA */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[6px] transition-all duration-500" 
                style={{ backgroundColor: welaRed }}
              ></div>

              <div className="relative z-10 flex items-center justify-between px-8 h-full">
                <div className="flex flex-col items-start text-left">
                  <span className={`text-[10px] font-black tracking-widest mb-1`} style={{ color: welaRed }}>
                    {item.label}
                  </span>
                  <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white uppercase group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h2>
                  <span className="text-[9px] tracking-[0.2em] text-white/40 font-bold uppercase mt-1">
                    {item.tagline}
                  </span>
                </div>
                
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 transition-all duration-500 shadow-xl">
                  <span className="text-white transform group-hover:translate-x-1 transition-all text-2xl font-light">
                    →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* --- FOOTER --- */}
        <footer className="mt-16 flex justify-between items-center text-[9px] tracking-[0.4em] text-white/20 uppercase font-bold border-t border-white/5 pt-8">
           <p>© 2026 Asakan Group</p>
           <p className="hidden sm:block">Ramkhamhaeng 186 Station</p>
        </footer>
      </main>

      {/* --- VIDEO MODAL --- */}
      {showVideo && (
        <div className="fixed inset-0 bg-[#001a33]/98 z-[100] flex items-center justify-center p-4">
          <button onClick={closeVideo} className="absolute top-8 right-8 text-white/60 hover:text-white text-[10px] tracking-widest uppercase border border-white/10 px-6 py-2 rounded-full z-[110] bg-white/5 backdrop-blur-md">
            Close ✕
          </button>
          <video ref={videoRef} src="/projects/wela/video/present.mp4" controls autoPlay className="w-full max-w-5xl aspect-video object-contain shadow-2xl rounded-lg" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes reveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-reveal { animation: reveal 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
      `}} />
    </div>
  );
}