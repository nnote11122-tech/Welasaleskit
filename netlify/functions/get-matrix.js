const axios = require('axios');

exports.handler = async (event, context) => {
  // 1. กำหนดค่าการเชื่อมต่อ (อ้างอิงจากรูปภาพ URL Airtable ของคุณ)
  const BASE_ID = "app5IBVrTvsBIoF5"; 
  const TABLE_ID = "tblfPrF5DbsXoPjcv"; // รหัสตาราง Property Units
  
  // 2. ดึง Token จาก Environment Variable (ที่ต้องไปกรอกใน Netlify)
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  // ตรวจสอบว่ามี Token หรือไม่
  if (!AIRTABLE_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing AIRTABLE_TOKEN in Environment Variables" }),
    };
  }

  try {
    // 3. ยิงไปหา Airtable API เพื่อเอาข้อมูลทั้งหมด
    // เราใส่ query parameter ?view=Grid%20view เพื่อให้เรียงลำดับเหมือนในหน้าเว็บ
    const response = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 4. ส่งข้อมูลกลับไปให้ Frontend (React)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // อนุญาตให้เรียกจากโดเมนอื่นได้ (ถ้าจำเป็น)
      },
      body: JSON.stringify(response.data.records),
    };

  } catch (error) {
    console.error("Airtable Error:", error.response ? error.response.data : error.message);
    
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ 
        error: "Failed to fetch data from Airtable",
        details: error.message 
      }),
    };
  }
};