'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp, Plus, X } from 'lucide-react';

const FloatingContact = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) setIsVisible(true);
      else setIsVisible(false);
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialContacts = [
    { id: 'zalo', icon: 'https://nongduocmiennam.vn/images/icons/zalo-logo.png', url: 'https://zalo.me/0372153982' },
    { id: 'facebook', icon: 'https://nongduocmiennam.vn/images/icons/facebook-new.png', url: '#' },
    { id: 'messenger', icon: 'https://nongduocmiennam.vn/images/icons/messenger.png', url: '#' },
    { id: 'tiktok', icon: 'https://nongduocmiennam.vn/images/icons/tiktok-new.png', url: '#' },
  ];

  return (
    <div className="fixed right-4 bottom-6 z-[9999] flex flex-col gap-3 items-center pointer-events-none">
      
      {/* 1. SOCIAL ICONS */}
      <div className="flex flex-col gap-3">
        {socialContacts.map((item, index) => {
          const openDelay = (socialContacts.length - 1 - index) * 70;
          const closeDelay = index * 50;

          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              // ĐÃ THÊM LẠI: bg-white và shadow-lg ở đây
              className={`relative flex items-center justify-center transition-all duration-500 rounded-full hover:scale-110 bg-white shadow-lg
                md:pointer-events-auto md:opacity-100 md:translate-y-0 md:scale-100
                ${isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-12 scale-50 pointer-events-none'}
              `}
              style={{ 
                width: '45px', 
                height: '45px',
                transitionDelay: isOpen ? `${openDelay}ms` : `${closeDelay}ms`
              }}
            >
              <img
                src={item.icon}
                alt={item.id}
                className="w-full h-full object-contain p-1" // Thêm lại p-1 để icon cách đều viền trắng
              />
            </a>
          );
        })}
      </div>

      {/* 2. NÚT PHONE */}
      <a
        href="tel:02926537595"
        // ĐÃ THÊM LẠI: bg-white và shadow-lg ở đây
        className="pointer-events-auto flex items-center justify-center rounded-full bg-white shadow-lg animate-phonering"
        style={{ width: '45px', height: '45px' }}
      >
        <img
          src="https://nongduocmiennam.vn/images/icons/phone-call-1-300x300.png"
          alt="phone"
          className="w-full h-full object-contain p-1" // Thêm lại p-1
        />
      </a>

      {/* 3. NÚT DẤU + — chỉ mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden pointer-events-auto w-[50px] h-[50px] rounded-full bg-[#028046] text-white flex items-center justify-center shadow-2xl transition-all duration-500 active:scale-90 z-20"
        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        {isOpen ? (
          <X size={28} className="transition-transform" />
        ) : (
          <Plus size={28} className="transition-transform" />
        )}
      </button>

      {/* 4. NÚT QUAY LẠI ĐẦU TRANG */}
      <button
        onClick={scrollToTop}
        className={`pointer-events-auto w-[45px] h-[45px] rounded-full bg-[#666] text-white flex items-center justify-center shadow-lg transition-all duration-700 hover:bg-black ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-8 pointer-events-none'
        }`}
      >
        <ArrowUp size={24} />
      </button>

      <style jsx>{`
        @keyframes phonering {
          0% { transform: rotate(0) scale(1); }
          10% { transform: rotate(-25deg); }
          20% { transform: rotate(25deg); }
          30% { transform: rotate(-25deg); }
          40% { transform: rotate(25deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-phonering {
          animation: phonering 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default FloatingContact;