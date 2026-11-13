import { useState, useEffect, forwardRef } from "react";
import { useSearchParams, useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const AsakanElysiumFullVersion = forwardRef((props, ref) => {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const unitFromUrl = searchParams.get("unit") || "";
  const buildingFromUrl = searchParams.get("building") || "wela1";
  const navigate = useNavigate();
  const [building, setBuilding] = useState(buildingFromUrl);
  const [data, setData] = useState(null);
  const [room, setRoom] = useState(unitFromUrl);

  const [isHolding, setIsHolding] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  
  const [errorModal, setErrorModal] = useState({ isVisible: false, message: "" });
  
  const [salesOntop, setSalesOntop] = useState(0);
  const [salesOntopLabel, setSalesOntopLabel] = useState("Sales Ontop"); 
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [extraDiscountLabel, setExtraDiscountLabel] = useState("Other Discount");
  const [bookingFee, setBookingFee] = useState(0);
  const [freebies, setFreebies] = useState([]);
  const [selectedFreebies, setSelectedFreebies] = useState([]);
  const [customGift, setCustomGift] = useState("");
  const [customFreebies, setCustomFreebies] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("general");

  const validateRoomStatus = async (targetRoom) => {
    setLoadingStatus(true);
    try {
      const { data, error } = await supabase
        .from("units")
        .select("status")
        .eq("building", building)
        .eq("unit_no", targetRoom.trim())
        .single();

      if (error) {
        console.error(error);
        return true;
      }

      if (!data) {
        showError("ไม่พบเลขห้องในฐานข้อมูล");
        return false;
      }

      if (
        data.status === "pending" ||
        data.status === "reserved" ||
        data.status === "contracted"
      ) {
        let statusThai = "ล็อค";
        if (data.status === "reserved") statusThai = "จองแล้ว";
        if (data.status === "contracted") statusThai = "สัญญาครบแล้ว";
        if (data.status === "pending") statusThai = "รออนุมัติจากผู้จัดการ";

        showError(`ขออภัย ห้องเลขที่ ${targetRoom} สถานะคือ "${statusThai}" ไม่สามารถทำใบเสนอราคาได้`);
        setData(null);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Supabase Error", err);
      return true;
    } finally {
      setLoadingStatus(false);
    }
  };

  const showError = (msg) => {
    setErrorModal({ isVisible: true, message: msg });
  };

  const fetchRoom = async () => {
    if (!room) return;
    try {
      const isValid = await validateRoomStatus(room);
      if (!isValid) return;

      const { data: unitStatus } = await supabase
        .from("units")
        .select("status")
        .eq("building", building)
        .eq("unit_no", room.trim())
        .single();

      setIsHolding(unitStatus?.status === "hold");

      const { data: priceRow, error } = await supabase
        .from("price")
        .select("*")
        .eq("building", building)
        .eq("unit_no", room.trim())
        .single();

      if (!priceRow || error) { showError("ไม่พบเลขห้องในฐานข้อมูล"); return; }

      // Col T-AB: Promotion items (freebie1-9)
      const gifts = [
        priceRow.freebie1, priceRow.freebie2, priceRow.freebie3,
        priceRow.freebie4, priceRow.freebie5, priceRow.freebie6,
        priceRow.freebie7, priceRow.freebie8, priceRow.freebie9,
      ].filter(Boolean);
      setFreebies([...gifts]);
      setSelectedFreebies([...gifts]);

      const rawData = {
        unit:             priceRow.unit_no,
        floor:            priceRow.floor,
        type:             priceRow.unit_type,
        area:             priceRow.area_sqm,
        price:            priceRow.base_price,
        registrationDisc: priceRow.registration_disc || 0,
        specialDisc:      priceRow.special_disc      || 0,
        voucherDisc:      priceRow.voucher_disc      || 0,
        netPriceFromDB:   priceRow.net_price         || 0,
        furnitureDisc:    priceRow.furniture_disc,
        freeTransfer:     priceRow.free_transfer,
        balloon3:         priceRow.balloon_3,
        bookingFee:       priceRow.booking_fee,
        downTotal:        priceRow.down_total,
        inst11:           priceRow.inst_11,
        notes: [
          priceRow.note1, priceRow.note2, priceRow.note3, priceRow.note4,
          priceRow.note5, priceRow.note6, priceRow.note7, priceRow.note8,
        ].filter(Boolean),
      };

      setData(rawData);
      setBookingFee(priceRow.booking_fee || 0);

    } catch (err) {
      showError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
    }
  };

  useEffect(() => {
    if (props.isAutoRender && props.passedData) {
      setData(props.passedData);
      setSelectedFreebies(props.passedFreebies || []);
      setSalesOntop(props.passedSalesOntop || 0);
    }
  }, [props.isAutoRender]);

  useEffect(() => {
    if (unitFromUrl) fetchRoom();
  }, [unitFromUrl]);

  const handlePrint = () => { 
    if (data && !isHolding) {
      window.print(); 
    }
  };
    
  const handleHolding = async () => {
    if (!data) return;
    const newHold = !isHolding;
    await supabase
      .from("units")
      .update({
        status: newHold ? "reserved" : "available",
        customer_name: newHold ? (data.customerName || null) : null,
      })
      .eq("building", building)
      .eq("unit_no", data.unit);
    setIsHolding(newHold);
  };
    
  const handleBooking = () => {
    if (!data) return;
    navigate(`/project/${id}/booking`, {
      state: {
        quotation: data,
        netPrice: netPrice,
        originalFreebies: freebies,
        selectedFreebies: selectedFreebies,
        customFreebies: customFreebies,
        salesOntop: salesOntop,
        salesOntopLabel: salesOntopLabel,
        building: building,
      }
    });
  };
  
  const addCustomGift = () => {
    const newGift = customGift.trim();
    if (!newGift) return;
    setCustomFreebies(prev => [...prev, newGift]);
    setSelectedFreebies(prev => [...prev, newGift]);
    setCustomGift("");
  };

  const pricePerSqm = data ? Math.round(data.price / data.area) : 0;
  const vipPrice = data ? data.price - data.registrationDisc : 0;
  const transferDisc = data
    ? (data.specialDisc + data.voucherDisc + salesOntop + extraDiscount)
    : 0;
  const netPrice = vipPrice - transferDisc;
  const netPricePerSqm = data ? Math.round(netPrice / data.area) : 0;

  // Transfer day calculations
  const transferDayPrice = data ? Math.round(netPrice - bookingFee) : 0;
  const commonAreaFee    = data ? Math.round(data.area * 35 * 12) : 0;
  const sinkingFund      = data ? Math.round(data.area * 400) : 0;
  const electricMeter    = 4550;
  const transferFee      = data ? Math.round(transferDayPrice * 0.02) : 0;
  const mortgageFee      = data ? Math.round(transferDayPrice * 0.01) : 0;
  const stampDuty        = 800;
  const totalTransferDay = commonAreaFee + sinkingFund + electricMeter + transferFee + mortgageFee + stampDuty;

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-900 overflow-x-hidden">
      {/* Modern Modal Notification */}
      {errorModal.isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setErrorModal({ ...errorModal, isVisible: false })}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 p-6 flex justify-center text-white">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div className="p-8 text-center">
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic">Attention Required</h3>
              <p className="text-slate-500 font-bold leading-relaxed">{errorModal.message}</p>
              <button onClick={() => setErrorModal({ ...errorModal, isVisible: false })} className="mt-6 w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Controller Buttons */}
      <div className="print:hidden fixed top-4 left-4 z-[110] flex gap-2">
        <Link to="/" className="bg-slate-500 text-white px-4 py-2 rounded-lg shadow-xl font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-600 transition-all uppercase">← Back</Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-xl font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all">
          {isSidebarOpen ? "✕ CLOSE MENU" : "☰ SETTINGS"}
        </button>
      </div>

      {/* SIDEBAR */}
      <div className={`print:hidden fixed left-0 top-0 bottom-0 w-[300px] bg-white border-r shadow-2xl p-6 pt-20 z-[100] overflow-y-auto transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="space-y-6">
          {/* Building Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[{ key: 'wela1', label: 'WELA 1' }, { key: 'wela2', label: 'WELA 2' }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setBuilding(key); setData(null); setRoom(""); }}
                className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${building === key ? 'bg-[#E14D43] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl relative overflow-hidden">
            {loadingStatus && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-tighter">Enter Unit No.</label>
            <input 
              className="w-full bg-slate-800 border-none p-3 rounded-lg font-bold text-white text-center text-xl mb-3 outline-none focus:ring-2 ring-slate-700" 
              placeholder="e.g. A101" 
              value={room} 
              onChange={(e) => setRoom(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && fetchRoom()}
            />
            <div className="flex gap-2">
              <button onClick={() => navigate(`/project/${id}/matrix`)} className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-black text-[10px] uppercase hover:bg-slate-600 active:scale-95 transition-all tracking-widest">Matrix</button>
              <button onClick={fetchRoom} className="flex-1 bg-white text-slate-900 py-3 rounded-lg font-black text-[10px] uppercase hover:bg-slate-100 active:scale-95 transition-all tracking-widest">Load</button>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab("general")} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === "general" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}>GENERAL</button>
            <button onClick={() => setActiveTab("privileges")} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === "privileges" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}>PRIVILEGES</button>
          </div>

          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Discount Label</label>
                <input type="text" value={salesOntopLabel} onChange={(e) => setSalesOntopLabel(e.target.value.toUpperCase())} className="w-full border p-2 rounded mb-2 font-bold outline-none text-sm" />
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Amount</label>
                <input type="number" value={salesOntop} onChange={(e) => setSalesOntop(Number(e.target.value))} className="text-2xl font-bold w-full border-b-2 py-1 outline-none border-slate-900" />
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Extra Discount Label</label>
                  <input type="text" value={extraDiscountLabel} onChange={(e) => setExtraDiscountLabel(e.target.value.toUpperCase())} className="w-full border p-2 rounded mb-2 font-bold outline-none text-sm" />
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Extra Amount</label>
                  <input type="number" value={extraDiscount} onChange={(e) => setExtraDiscount(Number(e.target.value))} className="text-xl font-bold w-full border-b-2 py-1 outline-none border-slate-900" />
                </div>
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">เงินจอง (Booking Fee)</label>
                  <input type="number" value={bookingFee} onChange={(e) => setBookingFee(Number(e.target.value))} className="text-xl font-bold w-full border-b-2 py-1 outline-none border-slate-900" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "privileges" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input className="flex-1 bg-slate-50 border p-2 rounded-lg text-xs outline-none" placeholder="Add items..." value={customGift} onChange={(e) => setCustomGift(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCustomGift()} />
                <button onClick={addCustomGift} className="bg-slate-900 text-white px-3 rounded-lg font-bold">+</button>
              </div>
              <div className="space-y-1 bg-slate-50 p-2 rounded-xl border max-h-[340px] overflow-y-auto">
                {[...freebies, ...customFreebies].map((g, i) => (
                  <label key={i} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-slate-900" checked={selectedFreebies.includes(g)} onChange={() => {
                      if (selectedFreebies.includes(g)) setSelectedFreebies(selectedFreebies.filter(x => x !== g));
                      else setSelectedFreebies([...selectedFreebies, g]);
                    }} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{g}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={handlePrint} disabled={!data || isHolding} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] tracking-widest shadow-xl disabled:opacity-20 uppercase hover:bg-slate-800 transition-all">Print (A4 Format)</button>
          <button onClick={handleHolding} disabled={!data} className="w-full bg-amber-500 text-black py-4 rounded-xl font-black text-[10px] tracking-widest shadow-xl disabled:opacity-20 uppercase hover:bg-amber-400 transition-all mt-2">{isHolding ? "Cancel Holding" : "Holding"}</button>
          <button onClick={handleBooking} disabled={!data} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] tracking-widest shadow-xl disabled:opacity-20 uppercase hover:bg-emerald-700 transition-all mt-2">Booking</button>
        </div>
      </div>

      {/* PREVIEW AREA */}
      <div id="quotation-preview" className={`${isSidebarOpen ? "lg:ml-[300px]" : "ml-0"} print:ml-0 flex justify-center p-6 print:p-0 transition-all duration-300 min-h-screen overflow-hidden`}>
        {!data ? (
          <div className="w-[794px] h-[800px] border-4 border-dashed border-slate-200 rounded-[40px] flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest mt-12">Search to Preview</div>
        ) : (
          <div className="preview-container w-full flex justify-center items-start">
            <div id="quotation-wrapper" className="m-0 shadow-2xl print:shadow-none bg-white">
              {/* Fix A4 Dimension strictly with overflow hidden */}
              <div id="quotation" ref={ref} className="bg-white w-[794px] h-[1123px] relative flex flex-col box-border overflow-hidden">

                {/* ── HEADER BLOCK ─────────────────────────────── */}
                <div className="relative flex overflow-hidden" style={{ backgroundColor: '#0f172a', minHeight: '68px' }}>
                  {/* Left red bar */}
                  <div className="w-[6px] shrink-0" style={{ backgroundColor: '#E14D43' }}></div>
                  {/* Faint WELA watermark */}
                  <div className="absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden" style={{ left: '6px' }}>
                    <span className="text-[110px] font-black uppercase text-white leading-none" style={{ opacity: 0.03, letterSpacing: '-0.02em', marginLeft: '40px' }}>WELA</span>
                  </div>
                  {/* Content */}
                  <div className="relative flex-1 flex justify-between items-center pl-9 pr-10 py-2">
                    <div>
                      <p className="text-[8px] font-black tracking-[0.7em] uppercase text-white/30 mb-1">Price Quotation</p>
                      <h1 className="text-[24px] font-black uppercase leading-none text-white tracking-tight">Wela Keha–Ram Station</h1>
                      <p className="text-[9px] tracking-[0.35em] uppercase mt-1.5 text-white/30 font-medium">Smooth Life @ Station</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-[8px] font-black tracking-[0.6em] uppercase text-white/30 mb-1">Date</p>
                        <p className="text-[15px] font-black text-white leading-none">{new Date().toLocaleDateString("th-TH", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="px-5 py-1.5 rounded-lg text-[9px] font-black tracking-[0.3em] uppercase text-white" style={{ backgroundColor: '#E14D43' }}>
                        {building === 'wela2' ? 'WELA 2' : 'WELA 1'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── UNIT INFO ─────────────────────────────────── */}
                <div className="grid grid-cols-4" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {[
                    { label: 'Unit No.', value: data.unit },
                    { label: 'ชั้น / Floor', value: data.floor },
                    { label: 'ประเภท / Type', value: data.type },
                    { label: 'พื้นที่ / Area', value: `${data.area} ตร.ม.` },
                  ].map((item, i) => (
                    <div key={i} className="px-6 py-1 text-center" style={{ borderRight: i < 3 ? '1px solid #e2e8f0' : 'none' }}>
                      <p className="text-[8px] font-black tracking-[0.2em] uppercase text-slate-400 mb-0.5">{item.label}</p>
                      <p className="text-[14px] font-black leading-none" style={{ color: '#001a33' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── PRICE BREAKDOWN ───────────────────────────── */}
                <div className="px-10 pt-2 pb-1">
                  <p className="text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 mb-1">Price Breakdown</p>

                  <QPriceRow label="ราคาขาย (Base Price)" value={Math.round(data.price).toLocaleString()} />
                  <QPriceRow label="ราคาต่อตารางเมตร" value={pricePerSqm.toLocaleString()} sub />
                  <div style={{ borderTop: '1px dashed #e2e8f0', margin: '1px 0' }} />
                  <QPriceRow label="ส่วนลดลงทะเบียน" value={`−${Math.round(data.registrationDisc).toLocaleString()}`} red />
                  <div style={{ borderTop: '1px dashed #e2e8f0', margin: '1px 0' }} />
                  <QPriceRow label="ราคา VIP" value={Math.round(vipPrice).toLocaleString()} />
                  {data.specialDisc > 0 && <QPriceRow label="ส่วนลดพิเศษ" value={`−${Math.round(data.specialDisc).toLocaleString()}`} red />}
                  {data.voucherDisc > 0 && <QPriceRow label="ส่วนลด Voucher" value={`−${Math.round(data.voucherDisc).toLocaleString()}`} red />}
                  {salesOntop > 0 && <QPriceRow label={salesOntopLabel} value={`−${Math.round(salesOntop).toLocaleString()}`} red />}
                  {extraDiscount > 0 && <QPriceRow label={extraDiscountLabel} value={`−${Math.round(extraDiscount).toLocaleString()}`} red />}
                  <div style={{ borderTop: '2px solid #001a33', margin: '2px 0' }} />
                  <QPriceRow label="ราคาขายสุทธิ (Net Price)" value={Math.round(netPrice).toLocaleString()} bold />
                  <QPriceRow label="ราคาสุทธิต่อตารางเมตร" value={netPricePerSqm.toLocaleString()} sub />
                  <div style={{ borderTop: '1px dashed #e2e8f0', margin: '3px 0' }} />
                  <QPriceRow label="เงินจอง" value={`−${Math.round(bookingFee).toLocaleString()}`} red />
                  <div style={{ borderTop: '2px solid #001a33', margin: '2px 0' }} />
                  <QPriceRow label="ยอดชำระวันโอนกรรมสิทธิ์" value={Math.round(transferDayPrice).toLocaleString()} bold />
                </div>

                {/* ── TRANSFER DAY COSTS ───────────────────────── */}
                <div className="mx-20 mt-2 mb-2 rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="px-5 py-1.5 flex justify-between items-baseline" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-slate-400">สรุปค่าใช้จ่ายวันโอนกรรมสิทธิ์</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[12px] font-black" style={{ color: '#001a33' }}>{totalTransferDay.toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-slate-400">THB</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 bg-white" style={{ borderBottom: 'none' }}>
                    {[
                      { label: 'ค่าส่วนกลาง 1 ปี',             sub: `${data.area} ตร.ม. × 35 × 12 เดือน`, value: commonAreaFee },
                      { label: 'ค่าธรรมเนียมโอนกรรมสิทธิ์ 2%', sub: 'ประมาณการ',                           value: transferFee   },
                      { label: 'เงินกองทุนแรกเข้า',             sub: `${data.area} ตร.ม. × 400 บาท`,        value: sinkingFund   },
                      { label: 'ค่าจดจำนอง 1%',                 sub: 'ประมาณการ',                           value: mortgageFee   },
                      { label: 'ค่ามิเตอร์ไฟฟ้า',               sub: 'ไม่รวมเงินประกัน',                    value: electricMeter },
                      { label: 'อากร',                           sub: '',                                     value: stampDuty     },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-start px-4 py-1" style={{
                        borderBottom: '1px dashed #f1f5f9',
                        borderRight: i % 2 === 0 ? '1px solid #f1f5f9' : 'none',
                      }}>
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">{item.label}</p>
                          {item.sub && <p className="text-[8px] font-medium text-slate-400 mt-0.5">{item.sub}</p>}
                        </div>
                        <div className="flex items-baseline gap-0.5 ml-2 shrink-0">
                          <span className="text-[11px] font-black text-slate-600">{item.value.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-slate-400">฿</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── PRIVILEGES ────────────────────────────────── */}
                <div className="mx-10 mt-2 mb-2">
                  <p className="text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 mb-2">Exclusive Privileges</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Special items */}
                    <div className="rounded-xl p-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#E14D43' }}></div>
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: '#E14D43' }}>Special Items</p>
                      </div>
                      <div className="space-y-1">
                        {selectedFreebies.length > 0 ? selectedFreebies.map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="mt-[5px] shrink-0 w-[3px] h-[3px] rounded-full" style={{ backgroundColor: '#E14D43', opacity: 0.4 }}></div>
                            <p className="text-[10px] font-bold uppercase leading-snug" style={{ color: '#001a33' }}>{f}</p>
                          </div>
                        )) : (
                          <p className="text-[10px] text-slate-300 italic">ไม่มีรายการพิเศษ</p>
                        )}
                      </div>
                    </div>
                    {/* Premium inclusions */}
                    <div className="rounded-xl p-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-600">Premium Inclusions</p>
                      </div>
                      <div className="space-y-1">
                        {['Digital Doorlock 3 ระบบ', 'ชุดครัว Built-In จาก SB', 'เตาไฟฟ้าและ Hood ดูดควัน Hafele', 'ฉากกั้นส่วนเปียก/แห้งในห้องน้ำ'].map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="mt-[5px] shrink-0 w-[3px] h-[3px] rounded-full bg-slate-300"></div>
                            <p className="text-[10px] font-bold uppercase leading-snug text-slate-600">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── NOTES ─────────────────────────────────────── */}
                {data.notes.length > 0 && (
                  <div className="mx-10 mb-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-slate-500 mb-1">หมายเหตุ</p>
                    <div className="grid grid-cols-2 gap-x-8 text-[9px] leading-tight font-medium text-slate-600">
                      <div className="space-y-1">
                        {data.notes.slice(0, Math.ceil(data.notes.length / 2)).map((note, i) => (
                          <p key={i}>{i + 1}. {note}</p>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {data.notes.slice(Math.ceil(data.notes.length / 2)).map((note, i) => (
                          <p key={i}>{Math.ceil(data.notes.length / 2) + i + 1}. {note}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SIGNATURES ────────────────────────────────── */}
                <div className="quotation-footer mt-auto shrink-0">
                  <div className="mx-10 pb-3">
                  <div className="grid grid-cols-3 gap-8">
                    {['ผู้ซื้อ / Client', 'ผู้จัดการ / Manager', 'ที่ปรึกษาการขาย / Sales'].map((label, i) => (
                      <div key={i} className="text-center">
                        <div className="h-6" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '6px' }}></div>
                        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── BOTTOM BAR ────────────────────────────────── */}
                <div className="flex h-[5px]">
                  <div className="flex-1" style={{ backgroundColor: '#001a33' }}></div>
                  <div className="w-20" style={{ backgroundColor: '#E14D43' }}></div>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* iPad & Mobile Fix */
        .preview-container {
          perspective: 1000px;
        }

        #quotation-wrapper {
          transform-origin: top center;
          transition: transform 0.3s ease;
        }

        /* Desktop */
        @media (min-width: 1025px) {
          #quotation-wrapper { transform: scale(0.9); }
        }

        /* Tablet (iPad) */
        @media (max-width: 1024px) {
          #quotation-wrapper { 
            transform: scale(0.75); 
            margin-bottom: -280px; 
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          #quotation-wrapper { 
            transform: scale(0.45); 
            margin-bottom: -600px; 
            margin-top: 20px;
          }
          .preview-container { padding-top: 40px; }
        }

        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          #quotation-preview,
          .preview-container,
          #quotation-wrapper {
            transform: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #quotation {
            width: 210mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }

          /* Keep the signature and color bar together when the print engine
             distributes the remaining A4 space via mt-auto. */
          .quotation-footer {
            margin-top: auto !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

        }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-in { animation-duration: 250ms; animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .zoom-in-95 { animation-name: zoom-in; }
      `}</style>
    </div>
  );
});

export default AsakanElysiumFullVersion;

// Helper Components
function QPriceRow({ label, value, red, sub, bold }) {
  return (
    <div className={`flex justify-between items-baseline py-0.5 ${sub ? 'opacity-60' : ''}`}>
      <span className={`uppercase tracking-wide ${bold ? 'text-[12px] font-black text-slate-800' : sub ? 'text-[10px] font-bold text-slate-600' : red ? 'text-[11px] font-bold' : 'text-[11px] font-bold text-slate-600'}`}
        style={red ? { color: '#E14D43' } : {}}>
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`font-black ${bold ? 'text-[15px] text-slate-800' : sub ? 'text-[11px] text-slate-600' : 'text-[13px]'}`}
          style={red ? { color: '#E14D43' } : {}}>
          {value}
        </span>
        <span className="text-[8px] font-bold text-slate-500">THB</span>
      </div>
    </div>
  );
}
