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
  
  // CI Colors สำหรับ WELA
  const welaRed = '#E14D43';
  const welaNavy = '#001a33';

  const roomPlanList = [
    { id: 1, name: "22 SQM", img: "/projects/elysium/roomplans/room-22.webp" },
    { id: 2, name: "25 SQM", img: "/projects/elysium/roomplans/room-25.webp" },
    { id: 3, name: "26 SQM", img: "/projects/elysium/roomplans/room-26.webp" },
    { id: 4, name: "28.5 SQM", img: "/projects/elysium/roomplans/room-28.5.webp" },
    { id: 5, name: "31 SQM", img: "/projects/elysium/roomplans/room-31.webp" },
    { id: 6, name: "34 SQM", img: "/projects/elysium/roomplans/room-34.webp" },
    { id: 7, name: "34A SQM", img: "/projects/elysium/roomplans/room-34a.webp" },
    { id: 8, name: "36 SQM", img: "/projects/elysium/roomplans/room-36.webp" },
    { id: 9, name: "36A SQM", img: "/projects/elysium/roomplans/room-36a.webp" },
    { id: 10, name: "39 SQM", img: "/projects/elysium/roomplans/room-39.webp" },
    { id: 11, name: "40 SQM", img: "/projects/elysium/roomplans/room-40.webp" },
    { id: 12, name: "43 SQM", img: "/projects/elysium/roomplans/room-43.webp" },
    { id: 13, name: "63 SQM", img: "/projects/elysium/roomplans/room-63.webp" }
  ];

  const [activeRoomPlan, setActiveRoomPlan] = useState(roomPlanList[0]);
  const [lightbox, setLightbox] = useState({ isOpen: false, images: [], index: 0 });

  return (
    <div className={`h-screen w-full flex overflow-hidden font-sans relative`} style={{ backgroundColor: welaNavy }}>
      
      {/* --- 1. SIDEBAR Section --- */}
      {!lightbox.isOpen && (
        <Sidebar 
          projectId={id} 
          activeMenu="room-selection" 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />
      )}

      {/* --- 2. MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 overflow-y-auto scrollbar-hide" style={{ backgroundColor: welaNavy }}>
        
        {/* Mobile Header: WELA Branding */}
        <div className="md:hidden flex items-center p-4 border-b border-white/5 bg-[#001a33] sticky top-0 z-[60]">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className="ml-4 font-black italic text-white tracking-tighter uppercase">
            WE<span style={{ color: welaRed }}>L</span>A
          </span>
        </div>

        {/* Tab Switcher: Modern Toggle */}
        <div className="flex justify-center p-8">
          <div className="bg-white/5 p-1.5 rounded-2xl flex gap-1 w-full max-w-md border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('perspective')}
              className={`flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'perspective' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/30 hover:text-white/60'}`}
            >
              PERSPECTIVE
            </button>
            <button 
              onClick={() => setActiveTab('roomplan')}
              className={`flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'roomplan' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/30 hover:text-white/60'}`}
            >
              13 ROOM TYPES
            </button>
          </div>
        </div>

        <div className="flex-1 pb-32">
          {activeTab === 'perspective' ? (
            /* MODE A: PERSPECTIVE - การ์ดแบบล้ำสมัย */
            <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {projectData.roomTypes.map((room) => (
                <div 
                  key={room.id} 
                  onClick={() => setLightbox({ isOpen: true, images: room.images, index: 0 })} 
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-[3rem] aspect-[16/10] shadow-2xl border border-white/5 transition-all duration-500 hover:border-red-500/30">
                    <img src={room.images[0].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={room.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001a33] via-[#001a33]/20 to-transparent"></div>
                    <div className="absolute bottom-10 left-10">
                      <p className="text-[10px] font-black mb-2 uppercase tracking-[0.4em] opacity-60" style={{ color: welaRed }}>{room.size}</p>
                      <h3 className="text-3xl font-black italic text-white tracking-tighter uppercase">{room.name}</h3>
                    </div>
                    {/* Zoom Icon Overlay */}
                    <div className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 border border-white/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* MODE B: ROOM PLAN - สะอาดตาแต่ Tech */
            <div className="flex flex-col items-center">
              <div className="w-full max-w-4xl p-8">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none">
                    - {activeRoomPlan.name} -
                  </h2>
                  <div className="w-16 h-[3px] mx-auto mt-6" style={{ backgroundColor: welaRed }}></div>
                </div>
                
                <div 
                  className="bg-white/5 rounded-[4rem] p-10 shadow-2xl border border-white/5 cursor-zoom-in group active:scale-[0.98] transition-all duration-500 hover:bg-white/[0.08]"
                  onClick={() => setLightbox({ 
                    isOpen: true, 
                    images: roomPlanList.map(p => ({ url: p.img, title: p.name })), 
                    index: activeRoomPlan.id - 1 
                  })}
                >
                  <img src={activeRoomPlan.img} className="w-full h-auto max-h-[50vh] object-contain transition-transform duration-1000 group-hover:scale-105" alt={activeRoomPlan.name} />
                  <div className="mt-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">Click to expand details</span>
                  </div>
                </div>
              </div>

              {/* Type Selector Grid: ปรับเป็นสไตล์ Dashboard */}
              <div className="px-8 w-full max-w-5xl">
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
                  {roomPlanList.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setActiveRoomPlan(plan)}
                      className={`py-5 rounded-2xl text-[10px] font-black transition-all border-2 relative overflow-hidden ${
                        activeRoomPlan.id === plan.id
                          ? 'border-red-600 bg-red-600 text-white shadow-[0_10px_30px_rgba(225,77,67,0.4)] scale-105 z-10'
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {plan.name.replace(" SQM", "")}
                      <span className="block opacity-40 text-[8px] mt-1 font-bold">SQ.M.</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- 3. LIGHTBOX Section --- */}
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