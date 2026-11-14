import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  GraduationCap, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  DoorOpen, 
  Plus, 
  Filter, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Calendar,
  Send,
  User
} from 'lucide-react';
import { Santri, UserAccount, Perizinan, Pelanggaran, Gender } from '../types';
import { createWhatsAppUrl } from '../services/waService';

interface SantriPerKelasProps {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  currentUser: UserAccount;
  onNavigateToPermitWithSantri: (santri: Santri) => void;
  onNavigateToPelanggaranWithSantri: (santri: Santri) => void;
}

export const SantriPerKelas: React.FC<SantriPerKelasProps> = ({
  santriList,
  perizinanList,
  pelanggaranList,
  currentUser,
  onNavigateToPermitWithSantri,
  onNavigateToPelanggaranWithSantri,
}) => {
  const [selectedGender, setSelectedGender] = useState<'all' | 'putra' | 'putri'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKelas, setExpandedKelas] = useState<string | null>(null);

  // List of all classes
  const classesList = [
    '1 Wustho (Tsanawiyah)',
    '2 Wustho (Tsanawiyah)',
    '3 Wustho (Tsanawiyah)',
    '1 Ulya (Aliyah)',
    '2 Ulya (Aliyah)',
    '3 Ulya (Aliyah)',
    'Tahfidz Al-Qur\'an',
  ];

  // Group santri by class
  const groupedSantri = useMemo(() => {
    const map: Record<string, Santri[]> = {};
    classesList.forEach(cls => {
      map[cls] = [];
    });

    santriList.forEach(s => {
      // Gender filter
      if (selectedGender !== 'all' && s.gender !== selectedGender) return;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.kamar.toLowerCase().includes(q);
        if (!match) return;
      }

      if (!map[s.kelas]) {
        map[s.kelas] = [];
      }
      map[s.kelas].push(s);
    });

    return map;
  }, [santriList, selectedGender, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Officer Security Profile Header Card - 3D International Standard */}
      <div className="p-6 rounded-3xl metallic-glass-card shadow-2xl relative overflow-hidden hover-rainbow-edge">
        {/* Specular top highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-600" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500 via-amber-400 to-emerald-600 opacity-60 blur-xs" />
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.nama}
                  className="relative w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
                />
              ) : (
                <div className="relative w-20 h-20 rounded-2xl border-2 border-amber-400 bg-[#041d13] shadow-xl flex items-center justify-center text-amber-400">
                  <User className="w-10 h-10" />
                </div>
              )}
              <span className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-emerald-600 text-white shadow-md border-2 border-slate-950">
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 glow-gold uppercase tracking-wider">
                  NRP: {currentUser.nrp || 'SECOP-01'}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                  STATUS: SIAGA AKTIF
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase font-sans">
                {currentUser.nama}
              </h2>
              <p className="text-xs text-amber-300 font-medium font-sans">
                {currentUser.jabatan} · <span className="text-emerald-200/75">{currentUser.divisi}</span>
              </p>
              <div className="flex items-center gap-4 text-xs text-emerald-100/90 pt-1 font-mono">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {currentUser.noWa}
                </span>
                <span>·</span>
                <span className="text-emerald-200/75">
                  Akses Wilayah: <strong className="text-white capitalize">{currentUser.genderAccess === 'all' ? 'Banin & Banat' : currentUser.genderAccess}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick sync info with Central Admin Database */}
          <div className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 text-right space-y-1 self-stretch md:self-auto shadow-inner hover-rainbow-edge">
            <div className="flex items-center justify-between md:justify-end gap-2 text-[11px] font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TERHUBUNG KE DATABASE PUSAT</span>
            </div>
            <p className="text-[10px] text-emerald-200/75 font-mono">
              Sinkronisasi real-time otomatis dengan Komando Admin
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Gender Filter */}
      <div className="p-4 metallic-glass-card border border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl hover-rainbow-edge">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-emerald-200/75" />
          <input
            type="text"
            placeholder="Cari santri per kelas berdasarkan nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-[#041d13]/90 border border-emerald-800/80 rounded-xl text-white placeholder-emerald-200/40 focus:outline-none focus:border-emerald-400 font-mono transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-[#041d13]/90 rounded-xl border border-emerald-800">
          <button
            onClick={() => setSelectedGender('all')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'all' ? 'bg-gradient-to-r from-emerald-600 to-emerald-600 text-white shadow-md' : 'text-emerald-200/75 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setSelectedGender('putra')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'putra' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Putra (Banin)
          </button>
          <button
            onClick={() => setSelectedGender('putri')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              selectedGender === 'putri' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            Putri (Banat)
          </button>
        </div>
      </div>

      {/* Classes Accordion / Cards List - 3D Styled */}
      <div className="space-y-4">
        {classesList.map((kelasName) => {
          const list = groupedSantri[kelasName] || [];
          const isExpanded = expandedKelas === null || expandedKelas === kelasName;
          const totalOut = list.filter(s => perizinanList.some(p => p.santriId === s.id && p.status === 'Sedang Keluar')).length;
          const totalLate = list.filter(s => perizinanList.some(p => p.santriId === s.id && p.status === 'Terlambat')).length;

          return (
            <div
              key={kelasName}
              className="rounded-3xl metallic-glass-card border border-emerald-800/80 shadow-2xl overflow-hidden transition-all hover-rainbow-edge"
            >
              {/* Class Header Strip */}
              <div
                onClick={() => setExpandedKelas(expandedKelas === kelasName ? 'none' : kelasName)}
                className="px-6 py-4 bg-gradient-to-r from-[#02100a] via-[#041d13] to-[#02100a] hover:bg-slate-850 cursor-pointer flex items-center justify-between gap-4 border-b border-emerald-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/40 shadow-inner">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans tracking-wide">
                      <span>{kelasName}</span>
                      <span className="text-xs font-mono text-amber-300 font-semibold">
                        ({list.length} Santri)
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-200/75 font-mono">
                      Security audit roster & perizinan kelas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {totalOut > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-gold">
                      {totalOut} Izin di Luar
                    </span>
                  )}
                  {totalLate > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-red-600/20 text-red-400 border border-red-500/40 animate-pulse glow-red">
                      {totalLate} Terlambat
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-emerald-200/75" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-emerald-200/75" />
                  )}
                </div>
              </div>

              {/* Class Body: Santri Grid */}
              {isExpanded && (
                <div className="p-5">
                  {list.length === 0 ? (
                    <p className="text-xs text-emerald-200/75 text-center py-6 font-mono">
                      Tidak ada santri di kelas ini yang sesuai kriteria filter.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map((santri) => {
                        const activePermit = perizinanList.find(p => p.santriId === santri.id && (p.status === 'Sedang Keluar' || p.status === 'Disetujui' || p.status === 'Terlambat'));
                        
                        return (
                          <div
                            key={santri.id}
                            className="p-4 rounded-2xl bg-[#041d13]/90 border border-emerald-800 hover:border-emerald-800 transition-all flex flex-col justify-between space-y-3 shadow-md hover-rainbow-edge"
                          >
                            <div className="flex items-start gap-3">
                              {santri.foto ? (
                                <img
                                  src={santri.foto}
                                  alt={santri.nama}
                                  className="w-12 h-12 rounded-xl object-cover border border-amber-400/40 shrink-0 shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[#072c1e] border border-amber-400/40 shrink-0 shadow-sm flex items-center justify-center text-amber-400">
                                  <User className="w-6 h-6" />
                                </div>
                              )}
                              <div className="truncate flex-1">
                                <h4 className="text-xs font-bold text-white truncate leading-tight">
                                  {santri.nama}
                                </h4>
                                <p className="text-[10px] font-mono text-emerald-200/75">
                                  NIS: {santri.nis} · <span className="capitalize text-emerald-100/90">{santri.gender === 'putra' ? 'Banin' : 'Banat'}</span>
                                </p>
                                <p className="text-[10px] text-emerald-300/60 truncate mt-0.5">
                                  {santri.kamar} · {santri.asrama}
                                </p>
                              </div>
                            </div>

                            {/* Status and Points Strip */}
                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-emerald-800 font-mono">
                              <div>
                                <span className="text-emerald-300/60 text-[10px]">Poin Disiplin: </span>
                                <span className={`font-bold ${
                                  santri.poinPelanggaran > 15
                                    ? 'text-red-400'
                                    : santri.poinPelanggaran > 0
                                    ? 'text-yellow-400'
                                    : 'text-emerald-400'
                                }`}>
                                  {santri.poinPelanggaran} Poin
                                </span>
                              </div>

                              {activePermit ? (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  {activePermit.status}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-300/60">
                                  Di Asrama
                                </span>
                              )}
                            </div>

                            {/* Guardian & Contact */}
                            <div className="text-[10px] text-emerald-200/75 flex items-center justify-between">
                              <span className="truncate">Wali: {santri.namaWali}</span>
                              <button
                                onClick={() => {
                                  const text = `Assalamu'alaikum Wr. Wb. Bpk/Ibu ${santri.namaWali}, terkait ananda ${santri.nama} di Pondok Pesantren Salaf Al-Maliki...`;
                                  window.open(createWhatsAppUrl(santri.noWaWali, text), '_blank');
                                }}
                                className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold cursor-pointer"
                              >
                                {santri.noWaWali}
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-emerald-800 grid grid-cols-2 gap-2">
                              <button
                                onClick={() => onNavigateToPermitWithSantri(santri)}
                                className="py-1 px-2 text-[10px] font-semibold text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-colors cursor-pointer text-center truncate"
                              >
                                Buat Izin
                              </button>
                              <button
                                onClick={() => onNavigateToPelanggaranWithSantri(santri)}
                                className="py-1 px-2 text-[10px] font-semibold text-red-300 bg-red-950/70 hover:bg-red-900 border border-red-800 rounded-lg transition-colors cursor-pointer text-center truncate"
                              >
                                Catat Takzir
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
