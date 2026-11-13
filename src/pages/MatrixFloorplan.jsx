import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const MatrixFloorplan = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFloor = searchParams.get("floor") || "3";

  const [roomsData, setRoomsData] = useState([]);
  const [dbStatuses, setDbStatuses] = useState({});
  const [roomDetails, setRoomDetails] = useState({});
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredRoom, setHoveredRoom] = useState(null); 
  const imgRef = useRef(null);

  const isTouchDevice = () => (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

  // ==========================================
  // 🟢 1. ระบบจูนพิกัดแบบแยกชั้น (จูนตรงนี้!)
  // ==========================================
  // ให้คุณปรับค่า Left, Top, Width, Height ของ "กรอบแปลน"
  // เป็นเปอร์เซ็นต์ (0 - 1.0) เทียบกับขนาดรูปภาพของแต่ละชั้น
  const perFloorAdjustments = {
    // ชั้น 3 (ค่าที่คุณจูนไว้เดิม)
    "3": { 
      left: 0.155, 
      top: 0.18, 
      width: 0.685, 
      height: 0.7 
    },
	// ชั้น 2 (ชั้นพิเศษที่คุณบอกว่าไม่ตรง - ลองปรับค่าตรงนี้)
    "2": { 
      left: 0.144, // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ซ้าย/ขวา
      top: 0.165,  // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ขึ้น/ลง
      width: 0.695, // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดหน้ากว้าง
      height: 0.705 // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดความสูง
    },
    // ชั้น 5 (ชั้นพิเศษที่คุณบอกว่าไม่ตรง - ลองปรับค่าตรงนี้)
    "5": { 
      left: 0.145, // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ซ้าย/ขวา
      top: 0.16,  // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ขึ้น/ลง
      width: 0.72, // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดหน้ากว้าง
      height: 0.732 // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดความสูง
    },
	// ชั้น 8 (ชั้นพิเศษที่คุณบอกว่าไม่ตรง - ลองปรับค่าตรงนี้)
    "8": { 
      left: 0.145, // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ซ้าย/ขวา
      top: 0.161,  // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ขึ้น/ลง
      width: 0.71, // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดหน้ากว้าง
      height: 0.7295 // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดความสูง
    },
	// ชั้น 11 (ชั้นพิเศษที่คุณบอกว่าไม่ตรง - ลองปรับค่าตรงนี้)
    "11": { 
      left: 0.14, // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ซ้าย/ขวา
      top: 0.161,  // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ขึ้น/ลง
      width: 0.72, // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดหน้ากว้าง
      height: 0.7295 // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดความสูง
    },

	// ชั้น 12 (ชั้นพิเศษที่คุณบอกว่าไม่ตรง - ลองปรับค่าตรงนี้)
    "12": { 
      left: 0.15, // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ซ้าย/ขวา
      top: 0.161,  // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ขึ้น/ลง
      width: 0.715, // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดหน้ากว้าง
      height: 0.731 // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดความสูง
    },

// ชั้น 14 (ชั้นพิเศษที่คุณบอกว่าไม่ตรง - ลองปรับค่าตรงนี้)
    "14": { 
      left: 0.15, // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ซ้าย/ขวา
      top: 0.161,  // <-- ลองเพิ่ม/ลดค่านี้เพื่อเลื่อน ขึ้น/ลง
      width: 0.715, // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดหน้ากว้าง
      height: 0.731 // <-- ลองเพิ่ม/ลดค่านี้เพื่อยืด/หดความสูง
    },
    // ชั้นอื่นๆ ก็เพิ่มเข้ามาที่นี่
  };

  // ดึงค่าจูนของชั้นปัจจุบัน (ถ้าไม่มีให้ใช้ค่า Default ของชั้น 3)
  const adjustments = perFloorAdjustments[currentFloor] || perFloorAdjustments["3"];

  // ระบบ Global Click เพื่อปิด Tooltip
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (hoveredRoom && !e.target.closest('polygon') && !e.target.closest('.luxury-tooltip')) {
        setHoveredRoom(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [hoveredRoom]);

  // ดึงข้อมูลสถานะและราคา
  useEffect(() => {
    const fetchData = async () => {
	// 🔴 จุดที่ 1: ล้างค่าเก่าทิ้งทันที เพื่อป้องกันพิกัดชั้นเก่าค้างบนรูปใหม่
      setDbStatuses({});
      setRoomDetails({});
      setRoomsData([]); // ล้าง polygon เดิมออกก่อน
      setHoveredRoom(null); // ปิด tooltip ที่อาจจะค้างอยู่
      const { data: statusData } = await supabase.from("rooms").select("unit_no, status").eq("floor", currentFloor);
      const { data: priceData } = await supabase
        .from("price")
        .select("unit_no, area_sqm, base_price, net_price_ontop")
        .eq("floor", currentFloor);

      if (statusData) {
        const sMap = {};
        statusData.forEach(item => sMap[item.unit_no] = item.status);
        setDbStatuses(sMap);
      }
      if (priceData) {
        const pMap = {};
        priceData.forEach(item => {
          const displayPrice = item.base_price || item.net_price_ontop || 0;
          pMap[item.unit_no] = { ...item, final_price: displayPrice };
        });
        setRoomDetails(pMap);
      }
    };
    fetchData();

	// 🔴 จุดที่ 2: ปรับ Realtime ให้ดักจับเฉพาะชั้นปัจจุบัน (ช่วยให้ไม่กระตุก)
    const channel = supabase
      .channel(`floor-${currentFloor}`)
      .on(
        "postgres_changes", 
        { 
          event: "*", 
          schema: "public", 
          table: "rooms", 
          filter: `floor=eq.${currentFloor}` // ดักเฉพาะชั้นนี้
        }, 
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentFloor]);
    // Realtime subscription


  useEffect(() => {
    fetch(`/projects/elysium/floor/floor${currentFloor}/rooms.json`)
      .then(res => res.json())
      .then(data => setRoomsData(data));
  }, [currentFloor]);

  const handleImgLoad = () => {
    if (imgRef.current) {
      setDimensions({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight });
    }
  };

  const renderPolygons = () => {
    if (roomsData.length === 0 || dimensions.width === 0) return null;

    let allX = [], allY = [];
    roomsData.forEach(room => room.points.forEach(p => { allX.push(p[0]); allY.push(p[1]); }));
    const minX = Math.min(...allX), maxX = Math.max(...allX), minY = Math.min(...allY), maxY = Math.max(...allY);
    const cadWidth = maxX - minX, cadHeight = maxY - minY;

    // ==========================================
    // 🟠 2. ใช้ค่าจากการจูนแบบแยกชั้น
    // ==========================================
    const imgWidth = dimensions.width;
    const imgHeight = dimensions.height;

    // ใช้ค่า Left, Top, Width, Height ที่ดึงมาจาก adjustments
    const targetX = imgWidth * adjustments.left;
    const targetY = imgHeight * adjustments.top;
    const targetWidth = imgWidth * adjustments.width;
    const targetHeight = imgHeight * adjustments.height;

    const scaleX = targetWidth / cadWidth;
    const scaleY = targetHeight / cadHeight;
    // ------------------------------------------

    return roomsData.map((room) => {
      const points = room.points.map(p => {
        // สูตรคำนวณพิกัด (เหมือนเดิม)
        const x = targetX + (p[0] - minX) * scaleX;
        const y = targetY + (maxY - p[1]) * scaleY;
        return `${x},${y}`;
      }).join(" ");

      const status = dbStatuses[room.id] || "lock";
      const isAvailable = status === "available";
      const detail = roomDetails[room.id];
      const isSelected = hoveredRoom?.id === room.id;

      const fillColor = isAvailable 
        ? (isSelected ? "rgba(251, 191, 36, 0.4)" : "rgba(255, 255, 255, 0.05)")
        : "rgba(15, 15, 15, 0.6)";

      return (
        <polygon
          key={room.id}
          points={points}
          fill={fillColor}
          stroke={isSelected ? "#fbbf24" : (isAvailable ? "rgba(255, 215, 0, 0.3)" : "rgba(255,255,255,0.1)")}
          strokeWidth={isSelected ? "2.5" : "1.2"}
          className="transition-all duration-300 ease-out cursor-pointer outline-none"
          // Mouse events (for PC)
          onMouseEnter={(e) => !isTouchDevice() && isAvailable && setHoveredRoom({ ...detail, x: e.pageX, y: e.pageY, id: room.id })}
          onMouseMove={(e) => !isTouchDevice() && isAvailable && setHoveredRoom(prev => prev ? { ...prev, x: e.pageX, y: e.pageY } : null)}
          onMouseLeave={() => !isTouchDevice() && setHoveredRoom(null)}
          // Click/Tap event (for both)
          onClick={(e) => {
            e.stopPropagation();
            if (!isAvailable) return;
            if (isTouchDevice()) {
              if (hoveredRoom?.id === room.id) {
                navigate(`/project/${id}/quotation?unit=${room.id}`);
              } else {
                setHoveredRoom({ ...detail, x: e.pageX, y: e.pageY, id: room.id });
              }
            } else {
              navigate(`/project/${id}/quotation?unit=${room.id}`);
            }
          }}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans overflow-x-hidden select-none">
      
      {/* 🟢 Tooltip (เหมือนเดิม) */}
      {hoveredRoom && (
        <div 
          className="luxury-tooltip fixed z-50 bg-zinc-950/95 border-l-4 border-amber-500 p-5 rounded-r-2xl backdrop-blur-xl shadow-2xl flex flex-col gap-1 transition-all duration-300 pointer-events-auto"
          style={{ left: Math.min(hoveredRoom.x + 20, window.innerWidth - 240), top: hoveredRoom.y - 80 }}
	onClick={() => navigate(`/project/${id}/quotation?unit=${hoveredRoom.id}`)}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-[9px] text-amber-500 font-black tracking-[0.2em] uppercase">Unit Details</span>
          </div>
          <h3 className="text-3xl font-serif italic text-white tracking-tighter">{hoveredRoom.id}</h3>
          <div className="h-[1px] w-full bg-white/10 my-1" />
          <div className="grid grid-cols-2 gap-6 mt-1 pr-4">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Space</p>
              <p className="text-sm font-medium">{hoveredRoom.area_sqm} <span className="text-[10px] text-slate-400">SQ.M.</span></p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Base Price</p>
              <p className="text-sm font-serif text-amber-200 uppercase">
                ฿{Number(hoveredRoom.final_price || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[8px] text-amber-500 font-bold tracking-[0.1em] border-t border-white/5 pt-2 italic underline underline-offset-4 animate-pulse">
            {isTouchDevice() ? "TAP AGAIN TO OPEN →" : "CLICK TO OPEN →"}
          </p>
        </div>
      )}

      {/* Header & Floor Switcher (เหมือนเดิม) */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <span className="text-[10px] tracking-[0.5em] text-amber-500 font-black uppercase block mb-1">Interactive</span>
          <h1 className="text-4xl font-serif italic tracking-widest uppercase text-white">Floor Plan View</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
          {["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14"].map(f => (
            <button key={f} onClick={() => setSearchParams({ floor: f })} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 ${currentFloor === f ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105' : 'hover:bg-white/10 text-slate-500'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* 🖼️ Sharp Floorplan */}
      <div className="max-w-6xl mx-auto relative bg-zinc-900/30 rounded-[40px] p-4 md:p-12 border border-white/5 shadow-2xl backdrop-blur-sm flex justify-center">
        <div className="relative inline-block w-full" style={{ maxWidth: '1000px' }}>
          <img 
            ref={imgRef}
            src={`/projects/elysium/floor/floor${currentFloor}/floor.png`} 
            alt={`Floor ${currentFloor}`} 
            className="w-full block opacity-90 contrast-[1.05] brightness-[1.1]"
            style={{ 
              filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' 
            }}
            onLoad={handleImgLoad}
          />
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
            <g className="pointer-events-auto">{renderPolygons()}</g>
          </svg>
        </div>
      </div>

      <div className="mt-12 text-center pb-10">
        <button onClick={() => navigate(`/project/${id}/matrix`)} className="group flex items-center gap-3 mx-auto text-[10px] uppercase tracking-[0.4em] text-slate-500 hover:text-amber-500 transition-all duration-300">
          <span className="w-8 h-[1px] bg-slate-800 group-hover:bg-amber-500 transition-all"></span> Back to Unit Matrix <span className="w-8 h-[1px] bg-slate-800 group-hover:bg-amber-500 transition-all"></span>
        </button>
      </div>
    </div>
  );
};

export default MatrixFloorplan;