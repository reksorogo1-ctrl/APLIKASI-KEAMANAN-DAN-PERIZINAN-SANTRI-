import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Search,
  DoorOpen,
  Eye,
  Camera,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  QrCode,
  History,
  X,
} from 'lucide-react';
import { Perizinan, Santri, UserAccount, Pelanggaran } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { RadarMonitoringPerizinan } from './RadarMonitoringPerizinan';

interface RadarPosGerbangProps {
  perizinanList: Perizinan[];
  santriList: Santri[];
  currentUser: UserAccount;
  onViewSuratIzin: (izin: Perizinan) => void;
  onOpenQRScanner?: () => void;
  initialView?: 'diluar' | 'keluar' | 'radar';
}

export const RadarPosGerbang: React.FC<RadarPosGerbangProps> = ({
  perizinanList,
  santriList,
  currentUser,
  onViewSuratIzin,
  onOpenQRScanner,
  initialView = 'diluar',
}) => {
  const [activeView, setActiveView] = useState<'diluar' | 'keluar' | 'radar'>(initialView);
  const [filterDiLuar, setFilterDiLuar] = useState<'all' | 'terlambat' | 'aman'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [gateOfficerName, setGateOfficerName] = useState<string>(currentUser.nama || 'Petugas Gerbang');
  const [selectedAction, setSelectedAction] = useState<{
    mode: 'checkout' | 'checkin';
    izin: Perizinan;
  } | null>(null);
  const [documentationPhoto, setDocumentationPhoto] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const approvedPermits = perizinanList.filter((p) => p.status === 'Disetujui');
  const outsidePermits = perizinanList.filter(
    (p) => p.status === 'Sedang Keluar' || p.status === 'Terlambat'
  );
  const returnedPermits = perizinanList.filter((p) => p.status === 'Sudah Kembali').slice(0, 15);

  const getTimingData = (izin: Perizinan) => {
    const deadlineDate = new Date(`${izin.tglKembali}T${izin.jamKembali}:00`);
    const diffMinutes = Math.floor((deadlineDate.getTime() - currentTime.getTime()) / 60000);

    if (diffMinutes < 0) {
      const overdue = Math.abs(diffMinutes);
      const h = Math.floor(overdue / 60);
      const m = overdue % 60;
      return {
        isOverdue: true,
        text: h > 0 ? `Terlambat ${h}j ${m}m` : `Terlambat ${m}m`,
        minutesLeft: diffMinutes,
        badgeClass: 'bg-red-950/85 text-red-300 border-red-500/45',
      };
    }
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    const urgent = diffMinutes <= 60;
    return {
      isOverdue: false,
      text: h > 0 ? `Sisa ${h}j ${m}m` : `Sisa ${m}m`,
      minutesLeft: diffMinutes,
      badgeClass: urgent
        ? 'bg-amber-950/80 text-amber-300 border-amber-500/45'
        : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/35',
    };
  };

  const processedOutside = outsidePermits.map((item) => ({
    ...item,
    timing: getTimingData(item),
  }));

  const overdueCount = processedOutside.filter((p) => p.timing.isOverdue).length;
  const safeCount = processedOutside.filter((p) => !p.timing.isOverdue).length;

  const filteredOutside = processedOutside.filter((item) => {
    if (filterDiLuar === 'terlambat' && !item.timing.isOverdue) return false;
    if (filterDiLuar === 'aman' && item.timing.isOverdue) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.santriNama.toLowerCase().includes(q) ||
        item.santriNis.toLowerCase().includes(q) ||
        item.tujuan.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredApproved = approvedPermits.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.santriNama.toLowerCase().includes(q) ||
      item.santriNis.toLowerCase().includes(q) ||
      item.tujuan.toLowerCase().includes(q) ||
      item.nomorIzin.toLowerCase().includes(q)
    );
  });

  const searchedSantri = santriList.filter((s) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setDocumentationPhoto(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCheckout = (izin: Perizinan) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    const actualDeparture = `${dateStr} ${timeStr}`;

    const updated: Perizinan = {
      ...izin,
      status: 'Sedang Keluar',
      actualKeluar: actualDeparture,
      petugasKeluar: gateOfficerName,
      fotoKeluar: documentationPhoto || undefined,
    };

    storageService.savePerizinan(updated);
    storageService.addLog(
      'Check-Out Pos Gerbang',
      `Santri ${izin.santriNama} (${izin.santriNis}) keluar gerbang. Petugas: ${gateOfficerName}`,
      'gerbang'
    );
    storageService.addNotification({
      judul: `Santri Keluar Gerbang: ${izin.santriNama}`,
      pesan: `Keluar pukul ${timeStr} WIB menuju ${izin.tujuan}. Batas kembali: ${izin.tglKembali} ${izin.jamKembali} WIB.`,
      tipe: 'info',
      linkMenu: 'monitoring',
      noWaTujuan: izin.noWaPenjemput,
      waPesanTemplate: WhatsAppTemplates.santriCheckOut(izin, actualDeparture, gateOfficerName),
    });

    setActionMsg(`Check-out dicatat: ${izin.santriNama} keluar pukul ${timeStr} WIB.`);
    setSelectedAction(null);
    setDocumentationPhoto('');
  };

  const handleConfirmCheckin = (izin: Perizinan) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    const actualArrival = `${dateStr} ${timeStr}`;

    const deadlineDate = new Date(`${izin.tglKembali}T${izin.jamKembali}:00`);
    const diffMinutes = Math.floor((now.getTime() - deadlineDate.getTime()) / 60000);
    const isLate = diffMinutes > 0;

    const updated: Perizinan = {
      ...izin,
      status: isLate ? 'Terlambat' : 'Sudah Kembali',
      actualKembali: actualArrival,
      petugasKembali: gateOfficerName,
      fotoKembali: documentationPhoto || undefined,
      menitKeterlambatan: isLate ? diffMinutes : 0,
    };

    storageService.savePerizinan(updated);
    storageService.addLog(
      'Check-In Pos Gerbang',
      `Santri ${izin.santriNama} kembali pukul ${timeStr} WIB (${
        isLate ? `Terlambat ${diffMinutes} menit` : 'Tepat Waktu'
      })`,
      'gerbang'
    );

    if (isLate) {
      const pel: Pelanggaran = {
        id: `pel_late_${Date.now()}`,
        kodePelanggaran: `PEL-LATE-${Date.now().toString().slice(-4)}`,
        santriId: izin.santriId,
        santriNama: izin.santriNama,
        santriNis: izin.santriNis,
        santriGender: izin.santriGender,
        tanggal: dateStr,
        waktu: timeStr,
        tataTertibId: 'tt_004',
        jenisPelanggaran: `Terlambat kembali ke pondok ${diffMinutes} menit dari batas izin (${izin.jamKembali} WIB).`,
        kategori: 'Ringan',
        poin: 5,
        kronologi: `Izin ${izin.jenisIzin} tujuan ${izin.tujuan}. Batas kembali ${izin.jamKembali} WIB, tiba di pos gerbang pukul ${timeStr} WIB.`,
        lokasi: 'Pos Gerbang Utama Al-Maliki',
        namaPetugasPelapor: gateOfficerName,
        statusVerifikasi: 'Terverifikasi',
      };
      storageService.savePelanggaran(pel);
      storageService.addNotification({
        judul: `Santri Kembali TERLAMBAT: ${izin.santriNama}`,
        pesan: `Tiba pukul ${timeStr} WIB (Terlambat ${diffMinutes} menit). Otomatis tercatat di Pelanggaran & Sanksi.`,
        tipe: 'danger',
        linkMenu: 'pelanggaran',
        noWaTujuan: izin.noWaPenjemput,
        waPesanTemplate: WhatsAppTemplates.santriCheckIn(
          izin,
          actualArrival,
          `Terlambat ${diffMinutes} Menit`
        ),
      });
      setActionMsg(
        `Check-in dicatat: ${izin.santriNama} TERLAMBAT ${diffMinutes} menit (otomatis masuk Pelanggaran).`
      );
    } else {
      storageService.addNotification({
        judul: `Santri Kembali Tepat Waktu: ${izin.santriNama}`,
        pesan: `Santri telah kembali ke pondok pukul ${timeStr} WIB.`,
        tipe: 'success',
        linkMenu: 'monitoring',
        noWaTujuan: izin.noWaPenjemput,
        waPesanTemplate: WhatsAppTemplates.santriCheckIn(
          izin,
          actualArrival,
          'Tepat Waktu (Disiplin)'
        ),
      });
      setActionMsg(`Check-in berhasil: ${izin.santriNama} kembali tepat waktu pukul ${timeStr} WIB.`);
    }

    setSelectedAction(null);
    setDocumentationPhoto('');
  };

  const handleSendWaWarning = (izin: Perizinan, minutesLate: number) => {
    const text = WhatsAppTemplates.peringatanKeterlambatan(izin, Math.max(1, Math.abs(minutesLate)));
    window.open(createWhatsAppUrl(izin.noWaPenjemput, text), '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header Ringkas & Tombol Scan QR */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-emerald-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>RADAR MONITORING &amp; POS GERBANG TERPADU</span>
            <span className="text-emerald-600">·</span>
            <span className="text-amber-300 font-bold">
              {currentTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}{' '}
              WIB
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white mt-1">
            Pemantauan Santri di Luar &amp; Keluar-Masuk Pos Gerbang
          </h1>
          <p className="text-xs text-emerald-200/75">
            Pantau sisa waktu izin, catat keberangkatan (Check-Out), dan catat kepulangan (Check-In / Scan QR) dalam satu halaman ringkas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#03160f] border border-emerald-800 px-3 py-2 rounded-xl text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-200/75 text-[11px]">Petugas:</span>
            <input
              type="text"
              value={gateOfficerName}
              onChange={(e) => setGateOfficerName(e.target.value)}
              className="bg-transparent text-amber-300 font-bold focus:outline-none border-b border-emerald-700 w-32 text-xs"
            />
          </div>

          {onOpenQRScanner && (
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f3d266] hover:brightness-105 text-[#02120a] font-bold text-xs cursor-pointer shadow-lg"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Surat Izin</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifikasi Aksi */}
      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button
            onClick={() => setActionMsg('')}
            className="text-emerald-300 hover:text-white font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 3 Ringkasan Status Cepat (Klik untuk langsung buka tab/filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveView('diluar');
            setFilterDiLuar('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            activeView === 'diluar' && filterDiLuar !== 'terlambat'
              ? 'bg-[#06281c] border-[#d4af37]'
              : 'bg-[#041d14] border-emerald-800/70 hover:border-emerald-600'
          }`}
        >
          <div>
            <p className="text-[11px] font-mono uppercase text-emerald-300">Sedang di Luar (Check-In)</p>
            <p className="text-2xl font-black font-mono text-white mt-0.5">{outsidePermits.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => {
            setActiveView('diluar');
            setFilterDiLuar('terlambat');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            activeView === 'diluar' && filterDiLuar === 'terlambat'
              ? 'bg-red-950/50 border-red-400'
              : 'bg-[#041d14] border-red-900/50 hover:border-red-500/50'
          }`}
        >
          <div>
            <p className="text-[11px] font-mono uppercase text-red-300">Terlambat Kembali</p>
            <p className="text-2xl font-black font-mono text-red-400 mt-0.5">{overdueCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setActiveView('keluar')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            activeView === 'keluar'
              ? 'bg-[#06281c] border-[#d4af37]'
              : 'bg-[#041d14] border-emerald-800/70 hover:border-amber-400/50'
          }`}
        >
          <div>
            <p className="text-[11px] font-mono uppercase text-amber-300">Siap Keluar (Check-Out)</p>
            <p className="text-2xl font-black font-mono text-amber-300 mt-0.5">{approvedPermits.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
            <ArrowRight className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Bar Navigasi & Pencarian Sederhana */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-800/70 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveView('diluar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
              activeView === 'diluar'
                ? 'bg-[#d4af37] text-[#02120a]'
                : 'bg-[#03160f] text-emerald-200 border border-emerald-800 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pantau di Luar &amp; Check-In ({outsidePermits.length})</span>
          </button>

          <button
            onClick={() => setActiveView('keluar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
              activeView === 'keluar'
                ? 'bg-[#d4af37] text-[#02120a]'
                : 'bg-[#03160f] text-emerald-200 border border-emerald-800 hover:text-white'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Check-Out Keluar ({approvedPermits.length})</span>
          </button>

          <button
            onClick={() => setActiveView('radar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
              activeView === 'radar'
                ? 'bg-[#d4af37] text-[#02120a]'
                : 'bg-[#03160f] text-emerald-200 border border-emerald-800 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Radar Visual &amp; Riwayat Kembali</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, atau tujuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#03160f] border border-emerald-800 rounded-xl text-white placeholder-emerald-200/45 focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {/* VIEW 1: PANTAU SANTRI DI LUAR & CATAT KEMBALI (CHECK-IN) */}
      {activeView === 'diluar' && (
        <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-800/80 overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-emerald-800/70 bg-[#03160f] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              Daftar Santri Sedang di Luar Pondok
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                onClick={() => setFilterDiLuar('all')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  filterDiLuar === 'all' ? 'bg-emerald-600 text-white' : 'text-emerald-200/75 hover:text-white'
                }`}
              >
                Semua ({outsidePermits.length})
              </button>
              <button
                onClick={() => setFilterDiLuar('terlambat')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  filterDiLuar === 'terlambat' ? 'bg-red-600 text-white' : 'text-red-300 hover:text-red-200'
                }`}
              >
                Terlambat ({overdueCount})
              </button>
              <button
                onClick={() => setFilterDiLuar('aman')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  filterDiLuar === 'aman' ? 'bg-emerald-700 text-white' : 'text-emerald-300 hover:text-white'
                }`}
              >
                Tepat Waktu ({safeCount})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-[#02120a] text-[#f3d266] uppercase text-[10px] font-mono border-b border-emerald-800/70">
                <tr>
                  <th className="px-4 py-3">Santri &amp; Kelas</th>
                  <th className="px-4 py-3">Tujuan &amp; Penjemput</th>
                  <th className="px-4 py-3">Batas Kembali</th>
                  <th className="px-4 py-3">Status Waktu</th>
                  <th className="px-4 py-3 text-right">Aksi Cepat Gerbang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/60">
                {filteredOutside.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-emerald-200/70">
                      Tidak ada santri pada kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredOutside.map((item) => (
                    <tr key={item.id} className="hover:bg-[#06281c]/55">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{item.santriNama}</p>
                        <p className="text-[11px] font-mono text-emerald-300/80">
                          {item.santriNis} · {item.santriKelas}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-emerald-100 font-medium">{item.tujuan}</p>
                        <p className="text-[11px] text-emerald-300/75">
                          Penjemput: {item.namaPenjemput} ({item.noWaPenjemput})
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-amber-300 font-bold">{item.jamKembali} WIB</span>
                        <span className="block text-[10px] text-emerald-200/70">{item.tglKembali}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${item.timing.badgeClass}`}
                        >
                          {item.timing.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setSelectedAction({ mode: 'checkin', izin: item })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#02120a] font-bold text-xs cursor-pointer"
                        >
                          Catat Kembali
                        </button>
                        <button
                          onClick={() => handleSendWaWarning(item, item.timing.minutesLeft)}
                          className="p-1.5 rounded-lg bg-[#03160f] border border-emerald-700 text-emerald-300 hover:text-white cursor-pointer"
                          title="Kirim Pengingat WA"
                        >
                          <Send className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => onViewSuratIzin(item)}
                          className="p-1.5 rounded-lg bg-[#03160f] border border-emerald-700 text-amber-300 hover:text-white cursor-pointer"
                          title="Lihat Surat Izin"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CHECK-OUT (SANTRI SIAP KELUAR GERBANG) */}
      {activeView === 'keluar' && (
        <div className="space-y-4">
          {/* Cek Cepat Santri dari Pencarian */}
          {searchQuery.trim() && (
            <div className="rounded-2xl bg-[#03160f] border border-[#d4af37]/40 p-4 space-y-2">
              <p className="text-[11px] font-mono font-bold text-[#f3d266] uppercase">
                Hasil Cek Izin Santri ({searchedSantri.length} ditemukan)
              </p>
              {searchedSantri.length === 0 ? (
                <p className="text-xs text-emerald-200/70">Santri tidak ditemukan.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {searchedSantri.slice(0, 6).map((s) => {
                    const permit = approvedPermits.find((p) => p.santriId === s.id);
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-[#041d14] border border-emerald-800 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{s.nama}</p>
                          <p className="text-[10px] font-mono text-emerald-300/80">
                            {s.nis} · {s.kelas}
                          </p>
                        </div>
                        {permit ? (
                          <button
                            onClick={() => setSelectedAction({ mode: 'checkout', izin: permit })}
                            className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] font-bold text-[11px] cursor-pointer"
                          >
                            Izin Sah · Keluar
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 text-red-300 border border-red-700/60 text-[10px] font-bold">
                            <ShieldX className="w-3 h-3" /> Tidak Ada Izin
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-800/80 overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-emerald-800/70 bg-[#03160f] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                Surat Izin Disetujui — Siap Keluar Gerbang (Check-Out)
              </span>
              <span className="text-[11px] font-mono text-amber-300 font-bold">
                {filteredApproved.length} Siap Berangkat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-[#02120a] text-[#f3d266] uppercase text-[10px] font-mono border-b border-emerald-800/70">
                  <tr>
                    <th className="px-4 py-3">Santri</th>
                    <th className="px-4 py-3">Jenis &amp; Tujuan</th>
                    <th className="px-4 py-3">Batas Kembali</th>
                    <th className="px-4 py-3">Penjemput</th>
                    <th className="px-4 py-3 text-right">Tindakan Gerbang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/60">
                  {filteredApproved.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-emerald-200/70">
                        Tidak ada surat izin berstatus Disetujui saat ini.
                      </td>
                    </tr>
                  ) : (
                    filteredApproved.map((izin) => (
                      <tr key={izin.id} className="hover:bg-[#06281c]/55">
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{izin.santriNama}</p>
                          <p className="text-[11px] font-mono text-emerald-300/80">
                            {izin.santriNis} · {izin.santriKelas}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 text-[10px] font-bold">
                            {izin.jenisIzin}
                          </span>
                          <p className="text-emerald-100 mt-1">{izin.tujuan}</p>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className="text-amber-300 font-bold">{izin.jamKembali} WIB</span>
                          <span className="block text-[10px] text-emerald-200/70">{izin.tglKembali}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-emerald-100">{izin.namaPenjemput}</p>
                          <p className="text-[10px] font-mono text-emerald-400">{izin.noWaPenjemput}</p>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => onViewSuratIzin(izin)}
                            className="p-1.5 rounded-lg bg-[#03160f] border border-emerald-700 text-emerald-300 hover:text-white cursor-pointer"
                            title="Lihat Surat Izin"
                          >
                            <Eye className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => setSelectedAction({ mode: 'checkout', izin })}
                            className="px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#f3d266] text-[#02120a] font-bold text-xs cursor-pointer"
                          >
                            Proses Keluar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: RADAR VISUAL & RIWAYAT KEPULANGAN */}
      {activeView === 'radar' && (
        <div className="space-y-4">
          <RadarMonitoringPerizinan
            perizinanList={perizinanList}
            currentUser={currentUser}
            onViewSuratIzin={onViewSuratIzin}
            size="medium"
          />

          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-800/80 overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-emerald-800/70 bg-[#03160f] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                Riwayat Kepulangan Terbaru (Sudah Kembali)
              </span>
              <span className="text-[11px] font-mono text-emerald-300">
                {returnedPermits.length} terbaru
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-[#02120a] text-[#f3d266] uppercase text-[10px] font-mono border-b border-emerald-800/70">
                  <tr>
                    <th className="px-4 py-2.5">Santri</th>
                    <th className="px-4 py-2.5">Keluar</th>
                    <th className="px-4 py-2.5">Kembali</th>
                    <th className="px-4 py-2.5">Petugas Gerbang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/60">
                  {returnedPermits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-emerald-200/70">
                        Belum ada riwayat kepulangan tercatat.
                      </td>
                    </tr>
                  ) : (
                    returnedPermits.map((p) => (
                      <tr key={p.id} className="hover:bg-[#06281c]/50">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-white">{p.santriNama}</span>
                          <span className="block text-[10px] text-emerald-300/75">{p.santriKelas}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px]">{p.actualKeluar || '-'}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-emerald-300">
                          {p.actualKembali || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-[11px]">{p.petugasKembali || p.petugasKeluar || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI CHECK-OUT / CHECK-IN RINGKAS */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="cyber-modal-card w-full max-w-md rounded-2xl bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/30 shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-emerald-500/25 bg-[#041A13]/65 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-[#f3d266]" />
                {selectedAction.mode === 'checkout'
                  ? 'Konfirmasi Keluar Gerbang'
                  : 'Konfirmasi Santri Kembali'}
              </h3>
              <button
                onClick={() => {
                  setSelectedAction(null);
                  setDocumentationPhoto('');
                }}
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800 space-y-1">
                <p className="text-sm font-bold text-white">{selectedAction.izin.santriNama}</p>
                <p className="text-[11px] font-mono text-emerald-300">
                  NIS: {selectedAction.izin.santriNis} · {selectedAction.izin.santriKelas}
                </p>
                <p className="text-[11px] text-emerald-100/90">
                  Tujuan: {selectedAction.izin.tujuan} ({selectedAction.izin.jenisIzin})
                </p>
                <p className="text-[11px] font-mono text-amber-300">
                  Batas Kembali: {selectedAction.izin.tglKembali} {selectedAction.izin.jamKembali} WIB
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-emerald-200">
                  Foto Dokumentasi (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-700 text-emerald-200 hover:text-white cursor-pointer text-xs font-semibold">
                    <Camera className="w-4 h-4 text-[#f3d266]" />
                    <span>Pilih / Ambil Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {documentationPhoto && (
                    <img
                      src={documentationPhoto}
                      alt="Dokumentasi"
                      className="w-10 h-10 rounded-lg object-cover border border-emerald-400"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAction(null);
                    setDocumentationPhoto('');
                  }}
                  className="px-4 py-2 rounded-xl text-emerald-200 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                {selectedAction.mode === 'checkout' ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmCheckout(selectedAction.izin)}
                    className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#f3d266] text-[#02120a] font-bold cursor-pointer"
                  >
                    Simpan Check-Out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmCheckin(selectedAction.izin)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#02120a] font-bold cursor-pointer"
                  >
                    Simpan Check-In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
