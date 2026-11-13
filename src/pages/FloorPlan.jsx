import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectData } from '../data/projectData';
import PhotoLightbox from '../components/PhotoLightbox';
import Sidebar from '../components/Sidebar';

export default function FloorPlan() {
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const welaRed = '#E14D43';

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
    <div className="h-screen w-full flex text-[#001a33] font-sans overflow-hidden bg-white">

      {!isZoomed && (
        <Sidebar
          projectId={id}
          activeMenu="floor-plan"
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      )}

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white">

        <div className="md:hidden flex items-center p-4 border-b border-[#001a33]/10 bg-white sticky top-0 z-[60]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#001a33]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span className="ml-4 font-black italic text-[#001a33] tracking-[0.15em] uppercase">
            WE<span style={{ color: welaRed }}>L</span>A
          </span>
        </div>

        <div className="px-6 lg:px-12 pt-8 pb-4 flex flex-col items-start shrink-0 gap-6">
          <div className="shrink-0">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-8 h-[2px]" style={{ backgroundColor: welaRed }}></div>
              <span className="text-[10px] font-black tracking-[0.4em] text-[#001a33]/40 uppercase">Master Plan</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-[#001a33] tracking-tighter uppercase leading-none italic">
              Select <span style={{ color: welaRed }}>Level</span>
            </h2>
          </div>

          <div className="w-full grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2 scrollbar-hide">
            {projectData.floors.map((floor) => (
              <button
                key={floor.level}
                onClick={() => setActiveFloor(floor)}
                className={`py-3 rounded-xl text-[11px] lg:text-[12px] font-black tracking-widest transition-all duration-300 border text-center ${
                  activeFloor.level === floor.level
                  ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(225,77,67,0.4)] scale-105'
                  : 'bg-[#001a33]/5 border-[#001a33]/10 text-[#001a33]/60 hover:border-red-500/50 hover:text-[#001a33]'
                }`}
              >
                {typeof floor.level === 'string' && floor.level.startsWith('B') ? floor.level : `${floor.level}F`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative group cursor-zoom-in overflow-hidden min-h-0 flex items-center justify-center px-4 lg:px-8">
          <img
            src={activeFloor.img}
            alt={activeFloor.title}
            className="w-full h-full object-contain transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            onClick={() => setIsZoomed(true)}
          />
          <div className="absolute bottom-4 right-4 bg-[#001a33]/10 backdrop-blur-md px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-[#001a33]/10 pointer-events-none">
             <span className="text-[8px] font-bold tracking-widest uppercase text-[#001a33]/60">Click to Zoom</span>
          </div>
        </div>

        <div className="px-6 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 border-t border-[#001a33]/10 bg-white">
          <div className="text-center md:text-left">
            <p className="text-[9px] font-black tracking-[0.4em] text-[#001a33]/30 uppercase mb-0.5">Current Display</p>
            <h3 className="text-xl lg:text-2xl font-black italic text-[#001a33] uppercase leading-tight tracking-tighter">
              {activeFloor.title}
            </h3>
          </div>

          <button
            onClick={handleDownload}
            className="w-full md:w-auto px-12 py-4 text-white rounded-2xl text-[10px] tracking-[0.3em] font-black shadow-2xl hover:brightness-110 hover:scale-105 transition-all uppercase active:scale-95"
            style={{ backgroundColor: welaRed }}
          >
            Download Plan
          </button>
        </div>
      </main>

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
      `}} />
    </div>
  );
}
