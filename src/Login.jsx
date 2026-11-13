import { useState } from 'react';

export default function Login({ onLogin }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  // CI Colors สำหรับ WELA
  const welaRed = '#E14D43';
  const welaNavy = '#001a33';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === 'ask724') { // รหัสผ่านเดิมของคุณ
      onLogin();
    } else {
      setError(true);
      setPass('');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 text-white font-sans overflow-hidden`} style={{ backgroundColor: welaNavy }}>
      
      {/* Background Effect: เพิ่มลูกเล่นแสงฟุ้งๆ ให้ดูมีมิติ */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-sm text-center animate-reveal relative z-10">
        <div className="mb-12">
          <span className="text-[10px] tracking-[0.6em] uppercase text-white/40 font-bold block mb-3">Asakan Development</span>
          {/* ปรับโลโก้เป็น WELA สไตล์ Modern */}
          <h1 className="text-5xl font-black tracking-tighter text-white italic uppercase">
            WE<span style={{ color: welaRed }}>L</span>A
          </h1>
          <div className="w-10 h-[2px] mx-auto mt-6" style={{ backgroundColor: welaRed }}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(false); }}
              placeholder="ENTER PASSCODE"
              className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-2xl py-5 px-8 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-red-500 transition-all placeholder:text-[10px] placeholder:tracking-[0.3em] placeholder:opacity-30`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-[10px] mt-3 tracking-widest uppercase font-bold animate-bounce">
                Incorrect Passcode
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="w-full py-5 rounded-2xl font-black tracking-[0.4em] uppercase transition-all active:scale-95 shadow-2xl"
            style={{ backgroundColor: welaRed }}
          >
            Access Sales Kit
          </button>
        </form>
        
        <p className="mt-16 text-[9px] tracking-[0.4em] text-white/20 uppercase font-medium">
          Authorized Personnel Only
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes reveal { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-reveal { animation: reveal 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
      `}} />
    </div>
  );
}