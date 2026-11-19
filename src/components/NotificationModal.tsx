import React from 'react';
import { motion } from 'motion/react';
import { NotifikasiApp } from '../types';
import { storageService } from '../services/storageService';
import { X, Bell, CheckCircle, AlertTriangle, Info, Share2, ExternalLink } from 'lucide-react';
import { createWhatsAppUrl } from '../services/waService';
import { METALLIC_EASE } from './MotionPrimitives';

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
        return <CheckCircle className="w-4 h-4 text-[#10B981]" />;
      default:
        return <Info className="w-4 h-4 text-[#10B981]" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: METALLIC_EASE }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: METALLIC_EASE }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-emerald-500/25 bg-[#041A13]/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bell className="w-5 h-5 text-[#D4AF37] shrink-0 drop-shadow-[0_0_8px_rgba(212,175,55,0.45)]" />
            <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide truncate">
              Notifikasi Sistem &amp; Agenda Pondok
            </h3>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleMarkAllRead}
              className="text-xs text-[#D4AF37] hover:text-[#f3d266] font-bold font-mono cursor-pointer"
            >
              Tandai Semua Dibaca
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-emerald-950/80 text-[#D1FAE5] hover:text-white border border-emerald-500/25 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-[#D1FAE5] text-xs font-mono">
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
                    ? 'bg-emerald-950/60 border-emerald-500/20 text-[#D1FAE5] hover:border-emerald-400/40'
                    : 'bg-emerald-950/85 border-[#D4AF37]/50 text-white hover:border-[#D4AF37]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-xl bg-[#041A13] border border-emerald-500/25 shrink-0">
                    {getIcon(item.tipe)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate font-sans flex items-center gap-2">
                        <span className="truncate">{item.judul}</span>
                        {!item.dibaca && (
                          <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                        )}
                      </p>
                      <span className="text-[10px] text-[#10B981] shrink-0 font-mono">
                        {item.waktu}
                      </span>
                    </div>
                    <p className="text-xs text-[#D1FAE5] mt-1 leading-relaxed font-sans line-clamp-2">
                      {item.pesan}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-emerald-500/20">
                      {item.linkMenu && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37]">
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka halaman terkait</span>
                        </span>
                      )}
                      {item.noWaTujuan && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = createWhatsAppUrl(
                              item.noWaTujuan!,
                              item.waPesanTemplate || item.pesan
                            );
                            window.open(url, '_blank');
                          }}
                          className="tactile-interactive inline-flex items-center gap-1.5 text-[11px] font-bold text-[#10B981] hover:text-emerald-300 ml-auto cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
