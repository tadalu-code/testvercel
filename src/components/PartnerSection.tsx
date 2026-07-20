'use client';

import React, { useEffect, useState } from 'react';

interface PartnerLogo { url: string; name: string; }

const PartnerSection = () => {
  const [title, setTitle] = useState('Đối tác của chúng tôi');
  const [description, setDescription] = useState('Chất lượng uy tín, hợp tác và gắn bó với các đối tác trong quá trình hoạt động kinh doanh.');
  const [logos, setLogos] = useState<PartnerLogo[]>([]);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        if (data.partners_title) setTitle(data.partners_title);
        if (data.partners_description) setDescription(data.partners_description);
        try {
          const parsed = JSON.parse(data.partner_logos || '[]');
          if (Array.isArray(parsed)) setLogos(parsed);
        } catch {}
      })
      .catch(() => {});
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden flex items-center justify-center bg-[#dee2e6] py-12"
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url('https://nongduocmiennam.vn/images/partner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          mixBlendMode: 'multiply',
          opacity: 0.9,
        }}
      ></div>

      <div className="max-w-[1340px] mx-auto px-6 relative z-10 text-center">

        <h2 className="text-[#028046] font-bold text-[26px] sm:text-[44px] md:text-[50px] uppercase mb-[30px] font-oswald-force">
          {title}
        </h2>

        <p className="text-[#212529] text-[16px] md:text-[18px] leading-[24px] max-w-4xl mx-auto font-normal">
          {description}
        </p>

        {/* Logo đối tác */}
        {logos.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {logos.map((logo, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-center hover:shadow-md transition-shadow"
                style={{ minWidth: 120, maxWidth: 180, height: 72 }}
              >
                <img
                  src={logo.url}
                  alt={logo.name || `Đối tác ${idx + 1}`}
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default PartnerSection;