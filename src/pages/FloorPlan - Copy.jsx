import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectData } from '../data/projectData';
import PhotoLightbox from '../components/PhotoLightbox';
import Sidebar from '../components/Sidebar'; 

export default function FloorPlan() {
  const { id } = useParams();
  
  const initialFloorIndex = projectData.floors.findIndex(f => f.level === 4);
  const [activeFloor, setActiveFloor] = useState(
    projectData.floors[initialFloorIndex] || projectData.floors[0]
  );
  const [isZoomed, setIsZoomed] = useState(false);

  const allFloorImages = projectData.floors.map(f => ({
    url: f.img,
    title: f.title
  }));

  const currentIndex = projectData.floors.findIndex(f => f.level === activeFloor.level);

  const handleDownload = async () => {
    try {
      const response = await fetch(activeFloor.img);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeFloor.title || 'floor-plan'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden font-sans">
      
      {/* --- SIDEBAR Section --- */}
      {/* ซ่อน Sidebar ทันทีเมื่อเปิด Full Screen (isZoomed) */}
      {!isZoomed && (
        <Sidebar projectId={id} activeMenu="floor-plan" />
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full bg-white relative min-w-0">
        
        {/* Header Section */}
        <div className="px-6 lg:px-12 pt-8 pb-4 flex flex-col items-start shrink-0 gap-6">
          <div className="shrink-0">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-8 h-[1px] bg-amber-500"></div>
              <span className="text-[10px] font-black tracking-[0.4em] text-amber-600 uppercase">Master Plan</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 tracking-tighter uppercase leading-none">
              Select <span className="font-serif italic text-amber-600">Level</span>
            </h2>
          </div>
          
          {/* Floor Selector */}
          <div className="w-full grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {projectData.floors.map((floor) => (
              <button
                key={floor.level}
                onClick={() => setActiveFloor(floor)}
                className={`py-3 rounded-xl text-[11px] lg:text-[12px] font-black tracking-widest transition-all duration-300 border text-center ${
                  activeFloor.level === floor.level
                  ? 'bg-[#1a2b3c] border-[#1a2b3c] text-amber-400 shadow-lg scale-105'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-amber-500/50 hover:text-amber-600'
                }`}
              >
                {typeof floor.level === 'string' && floor.level.startsWith('B') ? floor.level : `${floor.level}F`}
              </button>
            ))}
          </div>
        </div>

        {/* --- IMAGE DISPLAY --- */}
        <div className="flex-1 relative group cursor-zoom-in overflow-hidden bg-white min-h-0 flex items-center justify-center">
          <img 
            src={activeFloor.img} 
            alt={activeFloor.title} 
            className="max-w-full max-h-full object-contain transition-transform duration-[1.5s] ease-out group-hover:scale-105 px-4"
            onClick={() => setIsZoomed(true)}
          />
        </div>

        {/* --- FOOTER SECTION --- */}
        <div className="px-6 lg:px-12 py-6 flex flex-col items-center gap-4 shrink-0 border-t border-slate-50 bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-[9px] font-black tracking-[0.4em] text-slate-300 uppercase mb-0.5">Current Display</p>
            <h3 className="text-xl lg:text-2xl font-serif italic text-amber-600 uppercase leading-tight">
              {activeFloor.title}
            </h3>
          </div>

          <button 
            onClick={handleDownload}
            className="px-16 py-4 bg-amber-600 text-white rounded-full text-[10px] tracking-[0.3em] font-black shadow-xl shadow-amber-600/30 hover:bg-amber-700 hover:scale-105 transition-all uppercase"
          >
            Download PNG
          </button>
        </div>
      </main>

      {/* --- Lightbox (Full Screen) --- */}
      {isZoomed && (
        <PhotoLightbox 
          images={allFloorImages} 
          startIndex={currentIndex} 
          onClose={() => setIsZoomed(false)} 
          showThumbs={false} 
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}} />
    </div>
  );
}