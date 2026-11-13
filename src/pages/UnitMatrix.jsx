import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import UnitDetailModal from '../components/UnitDetailModal';
import { ArrowLeft, LogOut } from 'lucide-react';

const WELA_RED  = '#E14D43';
const WELA_NAVY = '#001a33';

// 28 column labels (skips 13, uses 12A)
const COL_LABELS = [
  '1','2','3','4','5','6','7','8','9','10','11','12',
  '12A',
  '14','15','16','17','18','19','20','21','22','23','24','25','26','27','28',
];

// Correct type per col_sort (index 0 = col_sort 1)
const COL_TYPES = [
  'A','C','D','C','D','C','D','D','C','D','C','D','C',   // col 1-13
  'A','B','E',                                             // col 14-16
  'C','D','C','D','C','D','D','C','D','C','E','B',        // col 17-28
];

const FLOORS = [2, 3, 4, 5, 6, 7, 8];

const TYPE_INFO = {
  A: { label: 'Exclusive A', sqm: '46',    bg: '#bfdbfe', text: '#1e40af', border: '#93c5fd' },
  B: { label: 'Exclusive B', sqm: '47',    bg: '#fed7aa', text: '#7c2d12', border: '#fdba74' },
  C: { label: 'Studio',      sqm: '22.90',    bg: '#e0f2fe', text: '#0c4a6e', border: '#7dd3fc' },
  D: { label: '1 Bed Plus',    sqm: '36', bg: '#ede9fe', text: '#3b0764', border: '#c4b5fd' },
  E: { label: '1 Bedroom',   sqm: '29',    bg: '#fce7f3', text: '#831843', border: '#f9a8d4' },
};

const STATUS_CONFIG = {
  asakan:      { bg: '#bae6fd', text: '#075985', label: 'Asakan' },
  available:   { bg: '#ffffff', text: '#001a33', label: 'ว่าง' },
  reserved:    { bg: '#fef08a', text: '#713f12', label: 'จอง' },
  contracted:  { bg: '#fecaca', text: '#991b1b', label: 'สัญญา' },
  transferred: { bg: '#bbf7d0', text: '#14532d', label: 'โอนแล้ว' },
  locked:      { bg: '#e2e8f0', text: '#475569', label: 'ล็อค' },
  pending:     { bg: '#fde68a', text: '#92400e', label: 'รออนุมัติ' },
  hold:        { bg: '#dbeafe', text: '#1e40af', label: 'Hold' },
};

export default function UnitMatrix() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const { isManager, user, signOut } = useAuth();
  const [building,      setBuilding]      = useState('wela1');
  const [units,         setUnits]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedUnit,  setSelectedUnit]  = useState(null);

  const fetchUnits = useCallback(async () => {
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('building', building);
    if (data) setUnits(data);
    setLoading(false);
  }, [building]);

  useEffect(() => {
    setLoading(true);
    fetchUnits();
    const ch = supabase
      .channel(`matrix-${building}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units', filter: `building=eq.${building}` }, fetchUnits)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [building, fetchUnits]);

  const unitMap = {};
  units.forEach(u => { unitMap[u.unit_no] = u; });

  const counts = { available: 0, reserved: 0, contracted: 0, transferred: 0, locked: 0, pending: 0, hold: 0, asakan: 0 };
  units.forEach(u => { if (counts[u.status] !== undefined) counts[u.status]++; });

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#001a33]/20 border-t-[#001a33] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#001a33] font-sans">

      {/* ── Header bar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#001a33]/10 px-4 md:px-8 py-3 flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#001a33]/40 hover:text-[#001a33] transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>

        {/* Building Toggle */}
        <div className="flex bg-[#001a33]/5 p-1 rounded-xl border border-[#001a33]/10 ml-auto">
          {[{ key: 'wela1', label: 'WELA 1' }, { key: 'wela2', label: 'WELA 2' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setBuilding(key)}
              className="px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              style={building === key
                ? { backgroundColor: WELA_RED, color: '#fff' }
                : { color: `${WELA_NAVY}66` }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* User + Logout */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-[10px] font-bold text-[#001a33]/40 uppercase tracking-wider">
            {isManager ? '👑 Manager' : '🧑 Sales'} · {user?.email}
          </span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#001a33]/40 hover:text-[#E14D43] transition-colors"
          >
            <LogOut size={13} /> ออกจากระบบ
          </button>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-black/10" style={{ backgroundColor: cfg.bg }} />
              <span className="text-[10px] font-bold text-[#001a33]/50 uppercase">{cfg.label} {counts[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Title ── */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-8 h-[2px]" style={{ backgroundColor: WELA_RED }} />
          <span className="text-[10px] font-black tracking-[0.4em] text-[#001a33]/40 uppercase">Unit Status</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
          {building === 'wela1' ? 'WELA 1' : 'WELA 2'}{' '}
          <span style={{ color: WELA_RED }}>Matrix</span>
        </h2>
      </div>

      {/* ── Type Legend ── */}
      <div className="px-4 md:px-8 pb-4 flex flex-wrap gap-2">
        {Object.entries(TYPE_INFO).map(([type, info]) => (
          <div
            key={type}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold"
            style={{ backgroundColor: info.bg, borderColor: info.border, color: info.text }}
          >
            <span className="font-black">{type}</span>
            <span className="opacity-70">{info.label} · {info.sqm} sqm</span>
          </div>
        ))}
      </div>

      {/* ── Matrix Table ── */}
      <div className="overflow-x-auto px-4 md:px-8 pb-8">
        <table className="border-collapse">
          <thead>
            {/* Row 1: Column numbers (colored per type) */}
            <tr>
              <th style={{ backgroundColor: WELA_NAVY, color: '#fff', minWidth: 56, padding: '10px 12px', fontSize: 11, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)', textTransform: 'uppercase', letterSpacing: '0.1em', position: 'sticky', left: 0, zIndex: 2 }}>
                FL
              </th>
              {COL_LABELS.map((label, i) => {
                const info = TYPE_INFO[COL_TYPES[i]] || {};
                return (
                  <th key={i} style={{ backgroundColor: info.bg || '#f8fafc', color: info.text || `${WELA_NAVY}99`, minWidth: 72, padding: '10px 6px', fontSize: 12, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)' }}>
                    {label}
                  </th>
                );
              })}
            </tr>

            {/* Row 2: Type letters (color-coded per type) */}
            <tr>
              <th style={{ backgroundColor: WELA_NAVY, color: '#fff', padding: '7px 12px', fontSize: 11, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)', textTransform: 'uppercase', position: 'sticky', left: 0, zIndex: 2 }}>
                TYPE
              </th>
              {COL_TYPES.map((type, i) => {
                const info = TYPE_INFO[type] || {};
                return (
                  <th key={i} style={{ backgroundColor: info.bg || '#f1f5f9', color: info.text || WELA_RED, padding: '7px 4px', fontSize: 13, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)' }}>
                    {type}
                  </th>
                );
              })}
            </tr>

            {/* Row 3: Unit type name */}
            <tr>
              <th style={{ backgroundColor: WELA_NAVY, color: '#fff', padding: '6px 12px', fontSize: 10, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)', textTransform: 'uppercase', position: 'sticky', left: 0, zIndex: 2 }}>
                UNIT
              </th>
              {COL_TYPES.map((type, i) => {
                const info = TYPE_INFO[type] || {};
                return (
                  <th key={i} style={{ backgroundColor: info.bg ? `${info.bg}99` : '#f8fafc', color: info.text || `${WELA_NAVY}66`, padding: '5px 3px', fontSize: 10, fontWeight: 700, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)', whiteSpace: 'nowrap' }}>
                    {info.label || '-'}
                  </th>
                );
              })}
            </tr>

            {/* Row 4: sqm */}
            <tr>
              <th style={{ backgroundColor: WELA_NAVY, color: '#fff', padding: '6px 12px', fontSize: 10, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)', textTransform: 'uppercase', position: 'sticky', left: 0, zIndex: 2 }}>
                SQM
              </th>
              {COL_TYPES.map((type, i) => {
                const info = TYPE_INFO[type] || {};
                return (
                  <th key={i} style={{ backgroundColor: info.bg || '#f8fafc', color: info.text || WELA_NAVY, padding: '5px 3px', fontSize: 11, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)' }}>
                    {info.sqm || '-'}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {FLOORS.map(floor => (
              <tr key={floor}>
                <td style={{ backgroundColor: WELA_NAVY, color: '#fff', padding: '10px 12px', fontSize: 14, fontWeight: 900, textAlign: 'center', border: '1px solid rgba(0,26,51,0.1)', position: 'sticky', left: 0, zIndex: 1 }}>
                  {floor}F
                </td>
                {COL_TYPES.map((type, colIdx) => {
                  const unitNo  = String(floor * 100 + (colIdx + 1));
                  const unit    = unitMap[unitNo];
                  const status  = unit?.status || 'available';
                  const cfg     = STATUS_CONFIG[status] || STATUS_CONFIG.available;
                  const isAvail = status === 'available';

                  return (
                    <td
                      key={colIdx}
                      onClick={() => {
                        if (isAvail) navigate(`/project/${id}/quotation?unit=${unitNo}&building=${building}`);
                        else setSelectedUnit(unit || { unit_no: unitNo, status });
                      }}
                      style={{
                        backgroundColor: cfg.bg,
                        color: cfg.text,
                        cursor: 'pointer',
                        padding: '12px 4px',
                        border: '1px solid rgba(0,26,51,0.08)',
                        textAlign: 'center',
                        minWidth: 72,
                        height: 64,
                        verticalAlign: 'middle',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.4 }}>{unitNo}</div>
                      {(status === 'asakan' || unit?.customer_name) && (
                        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }}>
                          {status === 'asakan' ? 'Asakan' : unit.customer_name}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile status summary ── */}
      <div className="lg:hidden px-4 pb-8 grid grid-cols-2 gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 p-3 rounded-xl border border-black/10" style={{ backgroundColor: cfg.bg }}>
            <span className="text-[10px] font-black uppercase" style={{ color: cfg.text }}>{cfg.label}</span>
            <span className="ml-auto text-lg font-black" style={{ color: cfg.text }}>{counts[key]}</span>
          </div>
        ))}
      </div>

      <style>{`
        td:hover { filter: brightness(0.93); }
      `}</style>

      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          building={building}
          isManager={isManager}
          onClose={() => setSelectedUnit(null)}
          onRefresh={fetchUnits}
        />
      )}
    </div>
  );
}
