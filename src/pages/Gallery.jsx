import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectData } from '../data/projectData';
import PhotoLightbox from '../components/PhotoLightbox';
import Sidebar from '../components/Sidebar';

export default function Gallery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState({ isOpen: false, index: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const welaRed = '#E14D43';

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'facade', label: 'Facade' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'room', label: 'Room' },
    { id: 'video', label: 'Video' },
  ];

  const filteredImages = filter === 'all'
    ? projectData.gallery
    : projectData.gallery.filter(img => img.category === filter);

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans relative bg-white">

      {!lightbox.isOpen && (
        <Sidebar
          projectId={id}
          activeMenu="gallery"
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      )}

      <main className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden bg-white">

        <div className="md:hidden flex items-center p-4 border-b border-[#001a33]/10 bg-white sticky top-0 z-[60]">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-[#001a33]/70 hover:text-[#001a33] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className="ml-4 font-black italic text-[#001a33] tracking-[0.15em] uppercase">
            WE<span style={{ color: welaRed }}>L</span>A
          </span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 pt-10 pb-4 shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-8 h-[2px]" style={{ backgroundColor: welaRed }}></div>
              <span className="text-[10px] font-black tracking-[0.4em] text-[#001a33]/40 uppercase">Atmosphere</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#001a33] tracking-tighter uppercase italic">
              Project <span style={{ color: welaRed }}>Gallery</span>
            </h1>
          </div>

          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#001a33]/10 shrink-0">
            <div className="flex overflow-x-auto scrollbar-hide px-8 py-5 gap-3 justify-start">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`px-7 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap border ${
                    filter === cat.id
                      ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(225,77,67,0.3)]'
                      : 'bg-[#001a33]/5 border-[#001a33]/10 text-[#001a33]/50 hover:border-red-500/50 hover:text-[#001a33]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-5 lg:gap-8 pb-32">
            {filteredImages.map((img, index) => (
              <div
                key={img.id}
                onClick={() => setLightbox({ isOpen: true, index })}
                className="relative aspect-square overflow-hidden rounded-3xl bg-[#001a33]/5 group cursor-pointer border border-[#001a33]/5 shadow-md transition-all duration-500 hover:border-red-500/30 hover:shadow-xl"
              >
                {img.type === "video" ? (
                  <div className="relative w-full h-full">
                    <img
                      src={img.thumbnail}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      alt="video thumbnail"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-red-600/20 transition-colors">
                      <div className="bg-white/20 backdrop-blur-xl text-white w-16 h-16 rounded-full flex items-center justify-center text-xl shadow-2xl border border-white/20 group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-500">
                        ▶
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={img.url}
                    alt={img.category}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                    loading="lazy"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                   <div className="w-14 h-14 bg-white text-[#001a33] rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {lightbox.isOpen && (
        <PhotoLightbox
          images={filteredImages}
          startIndex={lightbox.index}
          onClose={() => setLightbox({ isOpen: false, index: 0 })}
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
