import { useNavigate, useLocation, useParams } from 'react-router-dom';

export default function QuickNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const menus = [
    { name: 'Gallery', path: `/project/${id}/gallery` },
    { name: 'Floor Plan', path: `/project/${id}/floor-plan` },
    { name: 'Room Plan', path: `/project/${id}/room-plan` },
    { name: 'Quotation', path: `/project/${id}/quotation` },
  ];

  return (
    <div className="flex-1 flex overflow-x-auto scrollbar-hide ml-4 border-l border-gray-100 pl-4 gap-2">
      {menus.map((menu) => {
        // เงื่อนไข: ถ้าเป็นหน้าปัจจุบัน จะไม่แสดงปุ่มนั้น
        if (location.pathname === menu.path) return null;

        return (
          <button
            key={menu.path}
            onClick={() => navigate(menu.path)}
            className="px-4 py-1.5 rounded-full bg-gray-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-gray-100 active:bg-gold-50 active:text-gold-600 transition-all whitespace-nowrap"
          >
            {menu.name}
          </button>
        );
      })}
    </div>
  );
}