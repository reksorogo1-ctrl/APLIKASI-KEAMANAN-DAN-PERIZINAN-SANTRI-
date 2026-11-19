import React, { useEffect } from 'react';

interface SplitDoorTransitionOverlayProps {
  logoUrl?: string;
  namaPondok?: string;
  onComplete: () => void;
}

export const SplitDoorTransitionOverlay: React.FC<SplitDoorTransitionOverlayProps> = ({
  logoUrl,
  namaPondok,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const resolvedLogoUrl =
    !logoUrl ||
    logoUrl.includes('2026-11-11-7ffd46ad') ||
    logoUrl.includes('2026-11-14-03361e24') ||
    logoUrl.includes('logo_pesantren_almaliki')
      ? '/logo-fit.png'
      : logoUrl;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none"
    >
      {/* Pintu Atas: Terangkat ke atas (-100%) selama 1,1 detik */}
      <div className="split-door-top absolute top-0 left-0 right-0 h-1/2 w-full bg-[#041A13] border-b border-amber-400/50 shadow-[0_6px_28px_rgba(212,175,55,0.28)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.14) 0%, rgba(4, 26, 19, 0) 65%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/75 to-transparent" />
      </div>

      {/* Pintu Bawah: Turun ke bawah (+100%) selama 1,1 detik */}
      <div className="split-door-bottom absolute bottom-0 left-0 right-0 h-1/2 w-full bg-[#041A13] border-t border-amber-400/50 shadow-[0_-6px_28px_rgba(212,175,55,0.28)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.14) 0%, rgba(4, 26, 19, 0) 65%)',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/75 to-transparent" />
      </div>

      {/* Logo Pondok di Tengah Titik Pertemuan Pintu */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="split-door-logo flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-3 rounded-full bg-amber-400/20 blur-xl" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#041A13] border-2 border-amber-400/85 shadow-[0_0_38px_rgba(212,175,55,0.65),0_0_72px_rgba(16,185,129,0.3)] p-1.5 flex items-center justify-center overflow-hidden">
              <img
                src={resolvedLogoUrl}
                alt={namaPondok || 'Logo Pondok Pesantren Salaf Al-Maliki'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = '/logo-fit.png';
                  }
                }}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
