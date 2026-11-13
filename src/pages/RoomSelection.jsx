import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectData } from '../data/projectData';
import Sidebar from '../components/Sidebar';
import PhotoLightbox from '../components/PhotoLightbox';

export default function RoomSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('perspective');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const welaRed = '#E14D43';

  const roomPlanList = projectData.roomTypes.map((r, i) => ({
    id: i + 1,
    name: r.name,
    size: r.size,
    img: r.planImg,
  }));

  const [activeRoomPlan, setActiveRoomPlan] = useState(roomPlanList[0]);
  const [lightbox, setLightbox] = useState({ isOpen: false, images: [], index: 0 });

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans relative bg-white">

      {!lightbox.isOpen && (
        <Sidebar
          projectId={id}
          activeMenu="room-selection"
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      )}

      <main className="flex-1 flex flex-col h-full relative min-w-0 overflow-y-auto scrollbar-hide bg-white">

        <div className="md:hidden flex items-center p-4 border-b border-[#001a33]/10 bg-white sticky top-0 z-[60]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#001a33]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className="ml-4 font-black italic text-[#001a33] tracking-[0.15em] uppercase">
            WE<span style={{ color: welaRed }}>L</span>A
          </span>
        </div>

        <div className="flex justify-center p-8">
          <div className="bg-[#001a33]/5 p-1.5 rounded-2xl flex gap-1 w-full max-w-md border border-[#001a33]/10">
            <button
              onClick={() => setActiveTab('perspective')}
              className={`flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'perspective' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-[#001a33]/40 hover:text-[#001a33]'}`}
            >
              PERSPECTIVE
            </button>
            <button
              onClick={() => setActiveTab('roomplan')}
              className={`flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'roomplan' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-[#001a33]/40 hover:text-[#001a33]'}`}
            >
              {projectData.roomTypes.length} ROOM TYPES
            </button>
          </div>
        </div>

        <div className="flex-1 pb-32">
          {activeTab === 'perspective' ? (
            <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {projectData.roomTypes.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setLightbox({ isOpen: true, images: room.images, index: 0 })}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-[3rem] aspect-[16/10] shadow-xl border border-[#001a33]/10 transition-all duration-500 hover:border-red-500/30 hover:shadow-2xl">
                    <img src={room.images[0].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={room.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-10 left-10">
                      <p className="text-[10px] font-black mb-2 uppercase tracking-[0.4em] opacity-80" style={{ color: welaRed }}>{room.size}</p>
                      <h3 className="text-3xl font-black italic text-white tracking-tighter uppercase">{room.name}</h3>
                    </div>
                    <div className="absolute top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 border border-white/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-4xl p-8">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black italic text-[#001a33] tracking-tighter uppercase leading-none">
                    - {activeRoomPlan.size} -
                  </h2>
                  <div className="w-16 h-[3px] mx-auto mt-6" style={{ backgroundColor: welaRed }}></div>
                </div>

                <div
                  className="cursor-zoom-in group active:scale-[0.99] transition-all duration-500"
                  onClick={() => setLightbox({
                    isOpen: true,
                    images: roomPlanList.map(p => ({ url: p.img, title: p.name })),
                    index: activeRoomPlan.id - 1
                  })}
                >
                  <img src={activeRoomPlan.img} className="w-full h-auto max-h-[65vh] object-contain transition-transform duration-1000 group-hover:scale-105" alt={activeRoomPlan.name} />
                </div>
              </div>

              <div className="px-8 w-full max-w-5xl">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {roomPlanList.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setActiveRoomPlan(plan)}
                      className={`py-5 rounded-2xl text-sm font-black transition-all border-2 relative overflow-hidden ${
                        activeRoomPlan.id === plan.id
                          ? 'border-red-600 bg-red-600 text-white shadow-[0_10px_30px_rgba(225,77,67,0.4)] scale-105 z-10'
                          : 'bg-[#001a33]/5 border-[#001a33]/10 text-[#001a33] hover:border-[#001a33]/30'
                      }`}
                    >
                      {plan.size.replace(' sqm.', '')}
                      <span className="block text-[10px] mt-1 font-bold opacity-60">SQ.M.</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {lightbox.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#001a33]">
          <PhotoLightbox
            images={lightbox.images}
            startIndex={lightbox.index}
            onClose={() => setLightbox({ isOpen: false, images: [], index: 0 })}
            showThumbs={false}
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
