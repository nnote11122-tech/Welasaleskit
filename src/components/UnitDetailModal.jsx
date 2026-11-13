import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X } from 'lucide-react';
import { notifyBooking } from '../lib/bookingNotifications';

const WELA_NAVY = '#001a33';
const WELA_RED  = '#E14D43';

const STATUS_LABELS = {
  asakan:      'Asakan',
  available:   'ว่าง',
  reserved:    'จองแล้ว',
  contracted:  'ทำสัญญา',
  transferred: 'โอนแล้ว',
  locked:      'ล็อค',
  pending:     'รออนุมัติ',
  hold:        'Hold',
};

const STATUS_STYLE = {
  asakan:      { bg: '#bae6fd', text: '#075985' },
  available:   { bg: '#dcfce7', text: '#166534' },
  reserved:    { bg: '#fef08a', text: '#713f12' },
  contracted:  { bg: '#fecaca', text: '#991b1b' },
  transferred: { bg: '#bbf7d0', text: '#14532d' },
  locked:      { bg: '#e2e8f0', text: '#475569' },
  pending:     { bg: '#fde68a', text: '#92400e' },
  hold:        { bg: '#dbeafe', text: '#1e40af' },
};

const MANAGER_ACTIONS = [
  { status: 'asakan', label: 'Asakan', bg: '#e0f2fe', border: '#7dd3fc', text: '#075985' },
  { status: 'contracted',  label: '→ ทำสัญญา',       bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  { status: 'transferred', label: '→ โอนแล้ว',        bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
  { status: 'available',   label: 'ยกเลิก / คืนสู่ว่าง', bg: '#f8fafc', border: '#cbd5e1', text: '#475569' },
];

export default function UnitDetailModal({ unit, building, isManager, onClose, onRefresh }) {
  const [customerName, setCustomerName] = useState(unit?.customer_name || '');
  const [notes,        setNotes]        = useState(unit?.notes || '');
  const [saving,       setSaving]       = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationError, setNotificationError] = useState(false);

  const resendNotification = async () => {
    setNotifying(true); setNotificationMessage(''); setNotificationError(false);
    try {
      const { data, error } = await supabase.from('bookings').select('id')
        .eq('building', building).eq('unit_no', unit.unit_no).eq('status', 'approved')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('ไม่พบรายการจองที่ยืนยันแล้วของห้องนี้');
      const result = await notifyBooking(data.id);
      setNotificationMessage(result.warning ? 'ส่งรายละเอียดและลิงก์ใบเสนอราคาแล้ว แต่ Telegram โหลดรูปไม่สำเร็จ' : 'ส่งแจ้งเตือน Telegram เรียบร้อย');
    } catch (error) {
      setNotificationError(true); setNotificationMessage(error.message);
    } finally { setNotifying(false); }
  };

  const update = async (fields) => {
    await supabase
      .from('units')
      .update(fields)
      .eq('building', building)
      .eq('unit_no', unit.unit_no);
  };

  const handleSave = async () => {
    setSaving(true);
    await update({ customer_name: customerName, notes });
    onRefresh();
    setSaving(false);
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    const fields = { status: newStatus };
    if (newStatus === 'available') fields.customer_name = null;
    await update(fields);
    onRefresh();
    onClose();
  };

  const statusStyle = STATUS_STYLE[unit?.status] || STATUS_STYLE.available;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div style={{ backgroundColor: WELA_NAVY }} className="px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black tracking-[0.4em] text-white/40 uppercase mb-0.5">Unit</p>
              <h2 className="text-3xl font-black text-white tracking-tighter italic">{unit?.unit_no}</h2>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
              >
                {STATUS_LABELS[unit?.status] || unit?.status}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <X size={14} color="#fff" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Customer name */}
          <div>
            <label className="text-[10px] font-black text-[#001a33]/40 uppercase tracking-widest block mb-1.5">
              ชื่อลูกค้า
            </label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="ยังไม่ระบุ"
              className="w-full border border-[#001a33]/10 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all"
              style={{ fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = WELA_RED + '80'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,26,51,0.1)'}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-black text-[#001a33]/40 uppercase tracking-widest block mb-1.5">
              หมายเหตุ
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="เพิ่ม note..."
              rows={3}
              className="w-full border border-[#001a33]/10 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all resize-none"
              style={{ fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = WELA_RED + '80'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,26,51,0.1)'}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: WELA_NAVY }}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>

          {/* Manager-only status buttons */}
          {unit?.status === 'reserved' && <div className="border-t border-[#001a33]/10 pt-4">
            <button onClick={resendNotification} disabled={notifying} className="min-h-11 w-full rounded-lg border border-[#8fa9bf] px-4 py-2 text-sm font-medium text-[#001a33] hover:bg-[#edf3f8] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001a33]">
              {notifying ? 'กำลังส่งแจ้งเตือน…' : 'ส่งแจ้งเตือน Telegram อีกครั้ง'}
            </button>
            {notificationMessage && <p role={notificationError ? 'alert' : 'status'} className={`mt-3 text-sm leading-6 ${notificationError ? 'text-[#a62920]' : 'text-[#1b5238]'}`}>{notificationMessage}</p>}
          </div>}
          {isManager && (
            <div className="border-t border-[#001a33]/8 pt-4 space-y-2">
              <p className="text-[9px] font-black text-[#001a33]/30 uppercase tracking-widest mb-3">
                เปลี่ยนสถานะ — Manager Only
              </p>
              {MANAGER_ACTIONS.filter(a => a.status !== unit?.status).map(action => (
                <button
                  key={action.status}
                  onClick={() => handleStatusChange(action.status)}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: action.bg, borderColor: action.border, color: action.text }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
