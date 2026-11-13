import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const UnitMatrix = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({ 
    unit: '', 
    areas: [], 
    floors: [], 
    statuses: [] 
  });

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .order("unit_no", { ascending: true });

        if (error) throw error;

        const formatted = data
          .sort((a, b) => Number(a.unit_no) - Number(b.unit_no))
          .map(row => {
            let statusThai = "ล็อค";
            if (row.status === "available") statusThai = "ยังไม่จอง";
            if (row.status === "reserved") statusThai = "จองแล้ว";
            if (row.status === "contracted") statusThai = "สัญญาครบแล้ว";

            return {
              id: row.id,
              fields: {
                "Unit No": row.unit_no,
                "Floor": row.floor,
                "Area": row.area,
                "Status": statusThai
              }
            };
          });

        setUnits(formatted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatrix();

    const channel = supabase
      .channel("rooms-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          fetchMatrix();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const currentValues = prev[key];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [key]: newValues };
    });
  };

  const filteredUnits = units.filter(record => {
    const f = record?.fields || {};
    const matchUnit = !filters.unit || f["Unit No"]?.toString().includes(filters.unit);
    const matchArea = filters.areas.length === 0 || filters.areas.includes(f["Area"]?.toString());
    const matchFloor = filters.floors.length === 0 || filters.floors.includes(f["Floor"]?.toString());
    const matchStatus = filters.statuses.length === 0 || filters.statuses.includes(f["Status"]);
    return matchUnit && matchArea && matchFloor && matchStatus;
  });

  const areaOptions = [...new Set(units.map(u => u.fields["Area"]))].filter(Boolean).sort();
  const floorOptions = [...new Set(units.map(u => u.fields["Floor"]))].filter(Boolean).sort((a, b) => a - b);
  const statusOptions = ["ยังไม่จอง", "จองแล้ว", "สัญญาครบแล้ว", "ล็อค"];

  const handleSelectUnit = (unitNo) => {
    if (!unitNo) return;
    navigate(`/project/${id}/quotation?unit=${encodeURIComponent(unitNo)}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-serif text-amber-500 tracking-[0.3em] animate-pulse">
      LOADING...
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono p-4 text-center">
      ERROR: {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      {/* Header - ปรับ Font size ตามจอ */}
      <div className="max-w-7xl mx-auto text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-serif italic tracking-[0.1em] md:tracking-[0.2em] uppercase text-white">Unit Matrix</h1>
        <div className="h-px w-16 md:w-24 bg-amber-500 mx-auto mt-4"></div>
      </div>

      {/* Filter Section - ปรับ Grid และ Padding */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-10 space-y-6 bg-white/5 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div>
            <label className="text-[10px] md:text-[11px] uppercase text-amber-500 font-bold mb-3 block tracking-widest">Unit Number</label>
            <input 
              type="text"
              placeholder="Ex. 201..."
              value={filters.unit}
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm focus:border-amber-500/50 outline-none transition-all"
              onChange={(e) => setFilters({...filters, unit: e.target.value})}
            />
          </div>

          <FilterGroup label="Areas / Sizes" options={areaOptions} activeValues={filters.areas} onToggle={(v) => toggleFilter('areas', v)} />
          <FilterGroup label="Floors" options={floorOptions} activeValues={filters.floors} onToggle={(v) => toggleFilter('floors', v)} />
          <FilterGroup label="Status" options={statusOptions} activeValues={filters.statuses} onToggle={(v) => toggleFilter('statuses', v)} />
        </div>
        
        {(filters.areas.length > 0 || filters.floors.length > 0 || filters.statuses.length > 0 || filters.unit) && (
          <button 
            onClick={() => setFilters({ unit: '', areas: [], floors: [], statuses: [] })}
            className="text-[10px] text-slate-500 hover:text-white uppercase tracking-tighter transition-colors"
          >
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* ข้อมูลยูนิต (Hybrid View) */}
      <div className="max-w-7xl mx-auto">
        
        {/* Mobile View: Card List (แสดงเฉพาะจอ < 768px) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredUnits.map((unit) => (
            <div key={unit.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] text-amber-500 font-bold tracking-widest uppercase mb-1">Unit Number</div>
                  <div className="text-2xl font-bold">{unit.fields?.["Unit No"] || 'N/A'}</div>
                </div>
                <StatusBadge status={unit.fields?.["Status"]} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 border-y border-white/5 py-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Floor</span>
                  <span className="text-white font-medium">{unit.fields?.["Floor"] || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Area (sq.m.)</span>
                  <span className="text-white font-mono">{unit.fields?.["Area"] || '-'}</span>
                </div>
              </div>

              <button 
                disabled={unit.fields?.["Status"] !== "ยังไม่จอง"}
                onClick={() => handleSelectUnit(unit.fields?.["Unit No"])}
                className={`w-full py-3 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase transition-all border ${
                  unit.fields?.["Status"] === "ยังไม่จอง" 
                  ? "bg-white text-black border-white active:bg-amber-500" 
                  : "bg-transparent border-white/5 text-slate-700 cursor-not-allowed opacity-40"
                }`}
              >
                {unit.fields?.["Status"] === "ยังไม่จอง" ? "Select Unit →" : "Sold Out"}
              </button>
            </div>
          ))}
        </div>

        {/* Tablet & Desktop View: Table (แสดงเฉพาะจอ >= 768px) */}
        <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/10 text-[11px] uppercase tracking-[0.2em] text-amber-500/80">
              <tr>
                <th className="p-6 border-b border-white/10">Unit No</th>
                <th className="p-6 border-b border-white/10 text-center">Floor</th>
                <th className="p-6 border-b border-white/10 text-center">Area (sq.m.)</th>
                <th className="p-6 border-b border-white/10">Status</th>
                <th className="p-6 border-b border-white/10 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUnits.map((unit) => {
                const isAvailable = unit.fields?.["Status"] === "ยังไม่จอง";
                return (
                  <tr key={unit.id} className="hover:bg-white/5 transition-all group">
                    <td className="p-6 font-bold text-lg group-hover:text-amber-500 transition-colors">
                      {unit.fields?.["Unit No"] || 'N/A'}
                    </td>
                    <td className="p-6 text-center text-slate-400">
                      {unit.fields?.["Floor"] || '-'}
                    </td>
                    <td className="p-6 text-center font-mono text-slate-300">
                      {unit.fields?.["Area"] || '-'}
                    </td>
                    <td className="p-6">
                      <StatusBadge status={unit.fields?.["Status"]} />
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        disabled={!isAvailable}
                        onClick={() => handleSelectUnit(unit.fields?.["Unit No"])}
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all border ${
                          isAvailable 
                          ? "bg-white/5 border-white/10 text-white hover:bg-amber-500 hover:border-amber-500 hover:text-black" 
                          : "bg-transparent border-white/5 text-slate-700 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isAvailable ? "Select →" : "Sold Out"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUnits.length === 0 && (
          <div className="p-20 text-center text-slate-500 tracking-widest uppercase text-sm">
            No Units Found
          </div>
        )}
      </div>
    </div>
  );
};

// FilterGroup: เพิ่ม overflow-x-auto สำหรับมือถือ
const FilterGroup = ({ label, options, activeValues, onToggle }) => (
  <div>
    <label className="text-[10px] md:text-[11px] uppercase text-amber-500 font-bold mb-3 block tracking-widest">{label}</label>
    <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onToggle(opt.toString())}
          className={`px-3 py-1.5 rounded-lg text-[10px] border transition-all whitespace-nowrap ${
            activeValues.includes(opt.toString()) 
            ? 'bg-amber-500 border-amber-500 text-black font-bold' 
            : 'bg-transparent border-white/10 text-slate-400 hover:border-white/30'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    "ยังไม่จอง": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "จองแล้ว": "bg-amber-500/10 text-amber-500 border-amber-500/30",
    "สัญญาครบแล้ว": "bg-slate-500/10 text-slate-400 border-slate-500/30",
    "ล็อค": "bg-red-500/10 text-red-500 border-red-500/30"
  };

  const currentStyle = styles[status] || "bg-white/5 text-white/50 border-white/10";

  return (
    <span className={`px-3 md:px-4 py-1 rounded-full border text-[9px] md:text-[11px] font-bold tracking-wider whitespace-nowrap ${currentStyle}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default UnitMatrix;