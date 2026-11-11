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
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] rainbow-active-border card-3d-floating">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">
              Notifikasi Keamanan & Perizinan
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
              className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs font-mono">
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
                }}
                className={`p-4 rounded-2xl border transition-all hover-rainbow-edge shadow-md cursor-pointer ${
                  item.dibaca
                    ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    : 'bg-slate-900/90 border-amber-400/30 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {getIcon(item.tipe)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate font-sans flex items-center gap-2">
                        <span>{item.judul}</span>
                        {!item.dibaca && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        )}
                      </p>
                      <span className="text-[10px] text-cyan-400 shrink-0 font-mono">
                        {item.waktu}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
                      {item.pesan}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800">
                      {item.linkMenu && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            storageService.markNotificationRead(item.id);
                            onNavigate(item.linkMenu!);
                            onClose();
                          }}
                          className="tactile-interactive inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Menu</span>
                        </button>
                      )}
                      {item.noWaTujuan && (
                        <button
                          onClick={() => {
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
