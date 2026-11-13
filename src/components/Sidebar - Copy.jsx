import { useNavigate, useLocation, useParams } from 'react-router-dom';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sideMenus = [
    { name: "GALLERY", path: "gallery" },
    { name: "FLOOR PLAN", path: "floor-plan" },
    { name: "ROOM PLAN", path: "room-plan" },
    { name: "LOCATION", path: "location" },
    { name: "QUOTATION", path: "quotation" },
  ];

  const handleNavigate = (path) => {
    navigate(`/project/${id}/${path}`);
    setIsOpen(false);
  };

  // CI Colors
  const welaNavy = '#003366';
  const welaRed = '#E14D43';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[105] md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[110] w-72 text-white flex flex-col transition-all duration-500 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-white/10`}
        style={{ backgroundColor: welaNavy }}
      >

        <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-5 right-5 text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="pt-16 pb-12 px-8 flex flex-col items-center">
          <span className="text-[9px] tracking-[0.6em] text-white/40 uppercase mb-2">Asakan Development</span>
          <h1 className="text-4xl font-black tracking-[0.15em] text-white">
            WE<span style={{ color: welaRed }}>L</span>A
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-white/60 mt-1 uppercase">Ramkhamhaeng 186</p>
          <div className="w-8 h-[2px] mt-6" style={{ backgroundColor: welaRed }}></div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          {sideMenus.map((menu) => {
            const isActive = location.pathname.includes(menu.path);
            return (
              <button
                key={menu.name}
                onClick={() => handleNavigate(menu.path)}
                className={`w-full px-10 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative group ${
                  isActive ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 shadow-[0_0_15px_rgba(225,77,67,0.6)]"
                        style={{ backgroundColor: welaRed }}
                    />
                )}
                {menu.name}
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-[10px] font-bold text-white/40 hover:text-white transition-all group"
          >
            <svg
                className="transform group-hover:-translate-x-1 transition-transform"
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: welaRed }}
            >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            BACK TO ALL PROJECTS
          </button>
        </div>
      </aside>
    </>
  );
}
