import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode, Keyboard, Zoom } from 'swiper/modules';

// Import Swiper Styles ครบชุด
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/keyboard';
import 'swiper/css/zoom';

export default function PhotoLightbox({ images, startIndex, onClose, showThumbs = true }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [isMobile, setIsMobile] = useState(false);
  
  // จัดการรูปที่โหลดไม่ขึ้น
  const [validImages, setValidImages] = useState(images);

  const handleImageError = (failedUrl) => {
    setValidImages((prev) => prev.filter((img) => img.url !== failedUrl));
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isVideoMode = validImages.some(img => img.type === "video");

  // กำหนดความสูงของ Swiper ตัวหลักแบบ Dynamic
  const getSwiperHeight = () => {
    if (!showThumbs) return "w-full h-[95vh]"; 
    if (isVideoMode) return "w-full h-[80vh]";
    return isMobile ? "w-full h-[85vh]" : "w-full h-[65vh]";
  };

  // CI Colors สำหรับ WELA
  const welaRed = '#E14D43'; // สีแดงจากปุ่ม Smooth Life
  const welaNavy = '#001a33'; // สีน้ำเงินเข้มจัดสำหรับพื้นหลัง Lightbox

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col`} style={{ backgroundColor: `${welaNavy}f2` }}>
      <style>{`
        .swiper-zoom-container { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        
        /* ปรับสีปุ่ม Navigation เป็นสีแดง Coral ของ WELA */
        .swiper-button-next, .swiper-button-prev { 
            color: ${welaRed} !important; 
            transition: all 0.3s ease; 
        }
        .swiper-button-next:after, .swiper-button-prev:after {
            font-size: 24px !important;
            font-weight: bold;
        }
        .swiper-button-next:hover, .swiper-button-prev:hover { 
            transform: scale(1.2); 
            filter: drop-shadow(0 0 8px ${welaRed}80);
        }
        
        /* ซ่อน Thumb ที่เสีย */
        .broken-thumb { display: none !important; }

        /* ปรับแต่ง Scrollbar ของ Thumbs (ถ้ามี) */
        .swiper-free-mode > .swiper-wrapper { transition-timing-function: ease-out; }
      `}</style>

      {/* ปุ่มปิด - ปรับให้ดู Clean ขึ้น */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] text-white text-2xl bg-black/20 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
      >
        ✕
      </button>

      {/* MAIN VIEW */}
      <div className={`flex-1 flex items-center justify-center ${showThumbs ? 'mt-6' : 'mt-0'}`}>
        <Swiper
          key={isMobile ? `mobile-${validImages.length}` : `desktop-${validImages.length}`}
          style={{ 
            '--swiper-navigation-color': welaRed, 
            '--swiper-pagination-color': '#fff' 
          }}
          initialSlide={startIndex}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          spaceBetween={10}
          navigation={true}
          zoom={true}
          keyboard={{ enabled: true, onlyInViewport: false }}
          thumbs={{ 
            swiper: (showThumbs && !isMobile && thumbsSwiper && !thumbsSwiper.destroyed) ? thumbsSwiper : null 
          }}
          modules={[Navigation, Thumbs, Keyboard, Zoom]}
          className={getSwiperHeight()}
        >
          {validImages.map((img, index) => (
            <SwiperSlide key={`${img.url}-${index}`} className="flex items-center justify-center overflow-hidden">
              {img.type === "video" ? (
                activeIndex === index ? (
                  <video src={img.url} controls autoPlay className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-black/40 flex items-center justify-center text-white/20">Loading...</div>
                )
              ) : (
                <div className="swiper-zoom-container">
                  <img 
                    src={img.url} 
                    className="max-w-full max-h-full object-contain select-none" 
                    alt=""
                    onError={() => handleImageError(img.url)}
                  />
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* THUMBNAILS - ปรับขอบสีเป็นสีแดง WELA */}
      {showThumbs && !isVideoMode && validImages.length > 1 && (
        <div className="hidden md:block w-full px-4 mb-8 shrink-0">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={12}
            slidesPerView={Math.min(validImages.length, 7)}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[FreeMode, Navigation, Thumbs]}
            className="h-24 mt-4 max-w-4xl mx-auto"
          >
            {validImages.map((img, index) => (
              <SwiperSlide 
                key={`thumb-${img.url}-${index}`} 
                className="cursor-pointer opacity-40 [.swiper-slide-thumb-active&]:opacity-100 transition-all duration-300"
              >
                <img 
                  src={img.url} 
                  className={`w-full h-full object-cover rounded-md border-2 border-transparent [.swiper-slide-thumb-active&]:border-[${welaRed}] shadow-lg`} 
                  alt=""
                  onError={(e) => e.target.closest('.swiper-slide').classList.add('broken-thumb')}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}