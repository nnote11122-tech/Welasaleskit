import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // อย่าลืมสร้างไฟล์นี้หรือใช้ไฟล์ที่ Vite สร้างมาให้เพื่อรัน Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)