import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import html2canvas from "html2canvas";
import QuotationFullPage from "./Quotation"; // สำหรับแอบแคปหน้าจริง
import { notifyBooking } from '../lib/bookingNotifications';

export default function Booking() {
  const quotationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. ดึงข้อมูลจาก State
  const { quotation, netPrice, originalFreebies, selectedFreebies, salesOntop, inst, building } = location.state || {};
  const buildingKey = building || "wela1";
  
  const normalize = (s) => s?.trim().toLowerCase();

  const removedFreebies = originalFreebies?.filter(
    f => !selectedFreebies?.map(normalize).includes(normalize(f))
  ) || [];

  const addedFreebies = selectedFreebies?.filter(
    f => !originalFreebies?.map(normalize).includes(normalize(f))
  ) || [];
    
  const belowFloor = quotation?.floorPrice ? quotation.floorPrice - netPrice : 0;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No quotation data
      </div>
    );
  }

  const handleBooking = async () => {
    if (!customerName || !customerPhone) {
      alert("กรุณากรอกชื่อและเบอร์โทร");
      return;
    }

    setLoading(true);

    try {
      // --- 📸 STEP 0: CAPTURE & UPLOAD (ปรับให้ชัดระดับ 3.0) ---
      let publicImageUrl = "";
      if (quotationRef.current) {
        const canvas = await html2canvas(quotationRef.current, {
  	scale: 1.5,             // ปรับเป็น 1.5 เพื่อกันปัญหา HTTP 413 (ไฟล์ใหญ่เกิน)
  	useCORS: true,
  	backgroundColor: "#ffffff",
  	width: 1200,            // 🚩 บังคับแคปความกว้างที่ 1200px
  	windowWidth: 1200,      // 🚩 หลอกว่าหน้าจอที่แคปกว้าง 1200px (ป้องกัน Responsive ตัดรูป)
  	scrollX: 0,
  	scrollY: 0,
  	x: 0,                   // เริ่มแคปจากจุด 0 ด้านซ้าย
	});

        // แปลงเป็น Blob เพื่ออัปโหลด
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
        const fileName = `booking_${quotation.unit}_${Date.now()}.jpg`;

        // อัปโหลดเข้า Storage Bucket 'quotations'
        const { data: storageData, error: storageError } = await supabase.storage
          .from("quotations")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (storageError) throw new Error("Upload Storage Error: " + storageError.message);

        // ดึง Public URL เพื่อส่งให้ Pipedream
        const { data: urlData } = supabase.storage.from("quotations").getPublicUrl(fileName);
        publicImageUrl = urlData.publicUrl;
      }

      // จองทันที: อัปเดตห้องและบันทึกการจองใน transaction เดียว
      const { data: bookingResult, error: dbError } = await supabase
        .rpc("reserve_unit_booking", { payload: {
          building: buildingKey,
          unit_no: quotation.unit,
          customer_name: customerName,
          customer_phone: customerPhone,
          offer_price: netPrice,
          floor_price: quotation.floorPrice,
          priv_removed: removedFreebies.join(", "),
          priv_added: addedFreebies.join(", "),
          quote_snapshot: { quotation, netPrice, selectedFreebies },
          snapshot_url: publicImageUrl,
        } })
        .single();

      if (dbError) throw dbError;

      // 3. แจ้ง Telegram ผ่าน Supabase Edge Function
      try {
        await notifyBooking(bookingResult.id);
        alert("จองห้องสำเร็จ");
      } catch (notifyError) {
        alert(`จองห้องสำเร็จแล้ว แต่แจ้ง Telegram ไม่สำเร็จ: ${notifyError.message}\nไม่ต้องจองซ้ำ สามารถส่งแจ้งเตือนอีกครั้งได้จากรายละเอียดห้องใน Matrix`);
      }
      navigate("/");

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
      
      {/* 🕵️‍♂️ HIDDEN RENDER: บังคับให้กว้าง 1200px ตั้งแต่ต้นทาง */}
<div
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: "none",
    zIndex: -1,
    width: "1200px",      // 🚩 บังคับเลเยอร์ซ่อนให้กว้าง 1200
    overflow: "visible"
  }}
>
  {/* 🚩 สำคัญ: ตัวที่มี ref ต้องกว้าง 1200px เท่ากัน และห้ามมี overflow: hidden */}
  <div 
    ref={quotationRef} 
    style={{ 
      width: "1200px",    // แก้จาก 794px เป็น 1200px ครับพี่
      background: "white",
      padding: "40px",    // เพิ่มพื้นที่ขอบเผื่อไว้นิดนึงครับ
      display: "block" 
    }}
  >
      <QuotationFullPage 
         isAutoRender={true} 
         passedData={quotation} 
         passedFreebies={selectedFreebies}
         passedSalesOntop={salesOntop}
         passedInst={inst}
      />
  </div>
</div>

      {/* UI เดิมของพี่ 100% */}
      <div className="bg-white p-10 rounded-2xl shadow-xl w-[420px]">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Booking Unit {quotation.unit}
        </h1>

        <div className="mb-6 space-y-2 text-sm">
          <p>Floor: {quotation.floor}</p>
          <p>Area: {quotation.area} sqm</p>
          <p>Net Price: {netPrice.toLocaleString()}</p>
          <p>Floor Price: {quotation.floorPrice?.toLocaleString()}</p>

          {belowFloor > 0 && (
            <p className="text-red-600 font-bold">ต่ำกว่า Floor Price {belowFloor.toLocaleString()} บาท</p>
          )}
          {belowFloor < 0 && (
            <p className="text-green-600 font-bold">สูงกว่า Floor Price {Math.abs(belowFloor).toLocaleString()} บาท</p>
          )}
        </div>

        {selectedFreebies && (
          <div className="mb-6 text-sm">
            <p className="font-bold mb-2">Freebies</p>
            {selectedFreebies.map((f, i) => <div key={i}>• {f}</div>)}
          </div>
        )}
 
        {removedFreebies.length > 0 && (
          <div className="text-red-500 text-sm mb-4">
            <p className="font-bold">Removed Privileges</p>
            {removedFreebies.map((f, i) => <div key={i}>- {f}</div>)}
          </div>
        )}

        {addedFreebies.length > 0 && (
          <div className="text-green-600 text-sm mb-4">
            <p className="font-bold">Added Privileges</p>
            {addedFreebies.map((f, i) => <div key={i}>+ {f}</div>)}
          </div>
        )}

        <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border p-3 rounded mb-3" />
        <input type="text" placeholder="Customer Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border p-3 rounded mb-6" />

        <button onClick={handleBooking} disabled={loading} className="w-full bg-black text-white py-3 rounded font-bold hover:bg-slate-800 transition-colors">
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}
