import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectData } from '../data/projectData';
import PhotoLightbox from '../components/PhotoLightbox';
import Sidebar from '../components/Sidebar';
import QuickNav from '../components/QuickNav';

export default function RoomPlan() {
  const { id } = useParams();
  const navigate = useNavigate();

  const welaRed = '#E14D43';

  const [selectedType, setSelectedType] = useState(projectData.roomTypes[0]);
  const [viewMode, setViewMode] = useState('plan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lightbox, setLightbox] = useState({ isOpen: false, url: '' });

  const currentImg = viewMode === 'plan' ? selectedType.planImg : selectedType.perspectiveImg;

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans relative bg-white">

      {!lightbox.isOpen && (
        <Sidebar
          projectId={id}
          activeMenu="room-plan"
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      )}

      <main className={`flex-1 flex flex-col h-full relative min-w-0 overflow-hidden bg-white ${lightbox.isOpen ? 'hidden' : 'flex'}`}>

        <div className="p-4 flex items-center bg-white border-b border-[#001a33]/10 sticky top-0 z-50">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-[#001a33]/5 rounded-full mr-2 text-[#001a33]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          <button
            onClick={() => navigate(`/project/${id}`)}
            className="p-2 flex items-center gap-1 hover:bg-[#001a33]/5 rounded-xl transition-colors shrink-0 text-[#001a33]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: welaRed }}><path d="m15 18-6-6 6-6"/></svg>
            <span className="font-black uppercase text-[10px] tracking-widest">Back</span>
          </button>

          <QuickNav />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
          <div className="px-8 pt-8 pb-4 text-center">
            <p className="text-[#001a33]/30 text-[9px] font-black tracking-[0.4em] uppercase mb-1">Unit Specification</p>
            <h1 className="text-4xl font-black italic text-[#001a33] tracking-tighter uppercase">
              {selectedType.name}
            </h1>
            <p className="text-sm font-medium italic mt-1" style={{ color: welaRed }}>{selectedType.size}</p>
            <div className="w-12 h-[2px] mx-auto mt-6" style={{ backgroundColor: welaRed }}></div>
          </div>

          <div className="flex justify-center px-8 py-6">
            <div className="bg-[#001a33]/5 p-1.5 rounded-2xl flex gap-1 w-full max-w-sm border border-[#001a33]/10">
              <button
                onClick={() => setViewMode('plan')}
                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === 'plan' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-[#001a33]/40 hover:text-[#001a33]'}`}
              >
                FLOOR PLAN
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === '3d' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-[#001a33]/40 hover:text-[#001a33]'}`}
              >
                3D VIEW
              </button>
            </div>
          </div>

          <div className="px-6 py-4 flex justify-center items-center min-h-[400px]">
            <div
              onClick={() => setLightbox({ isOpen: true, url: currentImg })}
              className="relative w-full max-w-3xl bg-[#001a33]/5 rounded-[2.5rem] p-6 shadow-md border border-[#001a33]/10 cursor-zoom-in group transition-all duration-500 hover:border-red-500/20 hover:shadow-xl"
            >
              <img
                src={currentImg}
                className="w-full h-auto rounded-2xl transition-all duration-1000 group-hover:scale-[1.02]"
                alt="Room visualization"
                key={`${selectedType.id}-${viewMode}`}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <div className="bg-[#001a33]/10 backdrop-blur-md px-6 py-3 rounded-full border border-[#001a33]/20 text-[10px] font-black tracking-widest text-[#001a33] uppercase">
                    Tap to expand
                 </div>
              </div>
            </div>
          </div>

          <div className="px-8 mt-12 max-w-4xl mx-auto">
            <h3 className="text-[#001a33]/30 text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
              Explore Units <span className="flex-1 h-[1px] bg-[#001a33]/10"></span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {projectData.roomTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => { setSelectedType(type); setViewMode('plan'); }}
                  className={`p-6 rounded-[2rem] text-left transition-all border-2 relative overflow-hidden group ${
                    selectedType.id === type.id
                    ? 'border-red-600 bg-red-600/5 shadow-xl shadow-red-600/10'
                    : 'border-[#001a33]/10 bg-[#001a33]/5 hover:border-[#001a33]/30'
                  }`}
                >
                  <div className={`text-2xl font-black italic tracking-tighter transition-colors ${selectedType.id === type.id ? 'text-[#001a33]' : 'text-[#001a33]/40 group-hover:text-[#001a33]'}`}>
                    {type.id.toUpperCase()}
                  </div>
                  <div className="text-[9px] font-bold text-[#001a33]/40 uppercase tracking-[0.2em] mt-2">{type.size}</div>

                  {selectedType.id === type.id && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-8 left-8 right-8 z-40 md:left-auto md:right-12 md:w-72">
          <button
            className="w-full text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_20px_40px_rgba(225,77,67,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 border border-red-500/20"
            style={{ backgroundColor: welaRed }}
          >
            Create Quotation
          </button>
        </div>
      </main>

      {lightbox.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#001a33]">
          <PhotoLightbox
            images={[{ url: lightbox.url }]}
            startIndex={0}
            onClose={() => setLightbox({ isOpen: false, url: '' })}
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
