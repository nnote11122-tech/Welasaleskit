import { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function ProjectLocation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const googleMapsUrl = "https://maps.app.goo.gl/L3beZi9zNzYx4zLv6";

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden font-sans relative">

      {/* Sidebar */}
      <Sidebar
        activeMenu="location"
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col h-full bg-white relative min-w-0 overflow-hidden">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-[#001a33]/10 bg-white sticky top-0 z-[60]">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-[#001a33]/70 hover:text-[#001a33] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className="ml-4 font-black italic text-[#001a33] tracking-[0.15em] uppercase">
            WE<span style={{ color: '#E14D43' }}>L</span>A
          </span>
        </div>

        {/* Map */}
        <div className="flex-1 flex items-center justify-center bg-slate-50 relative overflow-hidden">

          <img
            src="/projects/elysium/gallery/location/location.webp"
            alt="Project Location Map"
            className="max-w-full max-h-full object-contain select-none"
            draggable="false"
          />

          {/* Get Directions */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center px-6">

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1a2b3c] hover:bg-[#c5a059] text-white px-10 py-4 rounded-xl text-[11px] font-black tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 flex items-center gap-3 uppercase"
            >

              <svg xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>

              Get Directions

            </a>

          </div>

        </div>

      </main>
    </div>
  );
}