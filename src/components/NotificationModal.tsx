import React from 'react';
import { NotifikasiApp } from '../types';
import { storageService } from '../services/storageService';
import { X, Bell, CheckCircle, AlertTriangle, Info, Share2, ExternalLink } from 'lucide-react';
import { createWhatsAppUrl } from '../services/waService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotifikasiApp[];
  onNavigate: (menuId: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsRead();
  };

  const getIcon = (tipe: NotifikasiApp['tipe']) => {
    switch (tipe) {
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg metallic-glass-card border border-emerald-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] rainbow-active-border card-3d-floating">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-emerald-800 bg-gradient-to-r from-[#02100a] via-[#041d13] to-[#02100a]">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">
              Notifikasi Sistem &amp; Agenda Pondok
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold font-mono cursor-pointer"
            >
              Tandai Semua Dibaca
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#072c1e]/80 text-emerald-200/75 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-emerald-300/60 text-xs font-mono">
              Tidak ada notifikasi saat ini
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.dibaca) {
                    storageService.markNotificationRead(item.id);
                  }
                  if (item.linkMenu) {
                    onNavigate(item.linkMenu);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all shadow-md cursor-pointer ${
                  item.dibaca
                    ? 'bg-[#02100a]/60 border-emerald-800/80 text-emerald-200/75 hover:border-emerald-600/70'
                    : 'bg-[#041d13]/95 border-amber-400/40 text-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-xl bg-[#02100a] border border-emerald-800 shrink-0">
                    {getIcon(item.tipe)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate font-sans flex items-center gap-2">
                        <span className="truncate">{item.judul}</span>
                        {!item.dibaca && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </p>
                      <span className="text-[10px] text-emerald-400 shrink-0 font-mono">
                        {item.waktu}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/85 mt-1 leading-relaxed font-sans line-clamp-2">
                      {item.pesan}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-emerald-800/60">
                      {item.linkMenu && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka halaman terkait</span>
                        </span>
                      )}
                      {item.noWaTujuan && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = createWhatsAppUrl(
                              item.noWaTujuan!,
                              item.waPesanTemplate || item.pesan
                            );
                            window.open(url, '_blank');
                          }}
                          className="tactile-interactive inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 ml-auto cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
