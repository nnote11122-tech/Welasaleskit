import { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function ProjectLocation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ลิงก์สำหรับปุ่ม Get Directions ไปยัง Google Maps
  const googleMapsUrl = "https://maps.app.goo.gl/L3beZi9zNzYx4zLv6"; 

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden font-sans">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Toggle */}
        <div className="md:hidden absolute top-4 left-4 z-[100]">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2.5 bg-[#1a2b3c] text-white rounded-xl shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>

        <main className="flex-1 relative w-full h-full bg-slate-50 overflow-hidden">
          {/* --- ภาพแผนที่เต็มหน้าจอ --- */}
          <img 
            src="/projects/elysium/gallery/location/location.webp" 
            className="w-full h-full object-cover md:object-contain" 
            alt="Project Location Map"
          />

          {/* --- ปุ่ม Get Directions แบบ Floating --- */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center px-6">
            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1a2b3c] hover:bg-[#c5a059] text-white px-10 py-4 rounded-xl text-[11px] font-black tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 flex items-center gap-3 uppercase backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
              Get Directions
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}