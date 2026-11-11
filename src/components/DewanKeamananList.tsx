import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Calendar, 
  Phone, 
  MapPin, 
  Edit3, 
  Trash2, 
  X, 
  Send,
  ShieldCheck,
  Users,
  User
} from 'lucide-react';
import { DewanKeamanan } from '../types';
import { storageService } from '../services/storageService';
import { createWhatsAppUrl } from '../services/waService';

interface DewanKeamananListProps {
  dewanList: DewanKeamanan[];
}

export const DewanKeamananList: React.FC<DewanKeamananListProps> = ({ dewanList }) => {
  const [selectedDivisi, setSelectedDivisi] = useState<string>('all');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPengurus, setEditingPengurus] = useState<DewanKeamanan | null>(null);

  const [formData, setFormData] = useState<Partial<DewanKeamanan>>({
    nama: '',
    foto: '',
    jabatan: 'Anggota Keamanan',
    divisi: 'Pos Gerbang Utama',
    noWa: '0812',
    alamat: 'Komplek Asatidz Al-Maliki',
    statusKeaktifan: 'Aktif',
    jadwalPiket: [
      { hari: 'Senin', shift: 'Pagi (06.00 - 14.00)', pos: 'Pos Gerbang Utama' }
    ]
  });

  const filtered = dewanList.filter(d => {
    if (selectedDivisi !== 'all' && d.divisi !== selectedDivisi) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingPengurus(null);
    setFormData({
      nama: '',
      foto: '',
      jabatan: 'Anggota Keamanan',
      divisi: 'Pos Gerbang Utama',
      noWa: '0812',
      alamat: 'Komplek Asatidz Al-Maliki',
      statusKeaktifan: 'Aktif',
      jadwalPiket: [
        { hari: 'Senin', shift: 'Pagi (06.00 - 14.00)', pos: 'Pos Gerbang Utama' }
      ]
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (pengurus: DewanKeamanan) => {
    setEditingPengurus(pengurus);
    setFormData({ ...pengurus });
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;

    const saved: DewanKeamanan = {
      id: editingPengurus ? editingPengurus.id : `dk_${Date.now()}`,
      nrp: formData.nrp || `KAMTIB-${Math.floor(100 + Math.random() * 900)}`,
      nama: formData.nama || '',
      foto: formData.foto || '',
      jabatan: formData.jabatan || 'Anggota Keamanan',
      divisi: (formData.divisi as any) || 'Pos Gerbang Utama',
      noWa: formData.noWa || '08123456789',
      alamat: formData.alamat || 'Karawang',
      statusKeaktifan: (formData.statusKeaktifan as any) || 'Aktif',
      jadwalPiket: formData.jadwalPiket || []
    };

    storageService.saveDewanKeamanan(saved);
    setIsAddEditOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data pengurus keamanan ini?')) {
      storageService.deleteDewanKeamanan(id);
    }
  };

  const handleHubungiWA = (pengurus: DewanKeamanan) => {
    const text = `Assalamu'alaikum Wr. Wb. Ustadz/Kang ${pengurus.nama}, terkait koordinasi pos keamanan Pondok Pesantren Salaf Al-Maliki...`;
    window.open(createWhatsAppUrl(pengurus.noWa, text), '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 glow-cyan">
                Security Personnel Corps
              </span>
              <span className="text-[10px] font-mono text-slate-500">· Guard Roster & Deployment</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <ShieldAlert className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              Data Dewan Keamanan & Jadwal Piket Sentry
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Susunan personil dewan keamanan, divisi satgas banin/banat, dan jadwal pos gerbang
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="tactile-interactive inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl transition-all shadow-xl cursor-pointer self-start sm:self-auto border border-amber-300/60 hover-rainbow-edge"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Personil</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs - 3D Styled */}
      <div className="metallic-glass-card border border-slate-800/80 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs shadow-lg font-mono">
        <button
          onClick={() => setSelectedDivisi('all')}
          className={`tactile-interactive px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedDivisi === 'all'
              ? 'bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 border border-amber-400/40 rainbow-active-border glow-gold'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Semua Divisi ({dewanList.length})</span>
        </button>
        {['Biro Administrasi', 'Pos Gerbang Utama', 'Patroli & Pengawasan', 'Keamanan Banat (Putri)'].map((div) => (
          <button
            key={div}
            onClick={() => setSelectedDivisi(div)}
            className={`tactile-interactive px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedDivisi === div
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 rainbow-active-border glow-cyan'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {div}
          </button>
        ))}
      </div>

      {/* Grid of Security Officers - 3D Floating & Rainbow Edge */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((pengurus) => (
          <div
            key={pengurus.id}
            className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 hover-rainbow-edge card-3d-floating shadow-xl flex flex-col justify-between group transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {pengurus.foto ? (
                      <img
                        src={pengurus.foto}
                        alt={pengurus.nama}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-400/40 shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-slate-800 border-2 border-amber-400/40 shrink-0 shadow-md flex items-center justify-center text-amber-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <ShieldCheck className="w-2.5 h-2.5 text-slate-950" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight font-sans">
                      {pengurus.nama}
                    </h3>
                    <p className="text-xs text-amber-300 font-mono font-bold mt-0.5">
                      {pengurus.jabatan}
                    </p>
                    <p className="text-[11px] text-cyan-400/80 font-mono">
                      {pengurus.divisi}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                  pengurus.statusKeaktifan === 'Aktif'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 glow-cyan'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {pengurus.statusKeaktifan}
                </span>
              </div>

              {/* Contact info */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 font-bold">{pengurus.noWa}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate text-slate-400 font-sans">{pengurus.alamat}</span>
                </div>
              </div>

              {/* Roster & Shift */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  Jadwal Piket Sentry & Pos:
                </p>
                <div className="space-y-2 font-mono">
                  {pengurus.jadwalPiket && pengurus.jadwalPiket.length > 0 ? (
                    pengurus.jadwalPiket.map((piket, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] flex items-center justify-between shadow-inner"
                      >
                        <div className="font-bold text-slate-200">
                          {piket.hari}
                        </div>
                        <div className="text-right">
                          <p className="text-amber-300 font-bold text-[10px]">{piket.shift}</p>
                          <p className="text-slate-400 text-[10px]">{piket.pos}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">Belum diatur jadwal piket</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => handleHubungiWA(pengurus)}
                className="tactile-interactive inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-emerald-500/10 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Hubungi WA</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(pengurus)}
                  className="tactile-interactive p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-xl cursor-pointer border border-transparent hover:border-amber-400/30 transition-all"
                  title="Ubah Pengurus"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(pengurus.id)}
                  className="tactile-interactive p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl cursor-pointer border border-transparent hover:border-rose-500/30 transition-all"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add / Edit Modal - 3D Styled */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 rainbow-active-border card-3d-floating">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
              <h3 className="text-sm font-black text-white flex items-center gap-2 font-sans tracking-wide uppercase">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                {editingPengurus ? 'Perbarui Data Pengurus' : 'Tambah Pengurus Keamanan'}
              </h3>
              <button 
                onClick={() => setIsAddEditOpen(false)} 
                className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Ustadz Hasan Basri, S.H."
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Jabatan Keamanan</label>
                  <input
                    type="text"
                    required
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Contoh: Koordinator Pos Gerbang"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Divisi Penugasan</label>
                  <select
                    value={formData.divisi}
                    onChange={(e) => setFormData({ ...formData, divisi: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="Biro Administrasi">Biro Administrasi</option>
                    <option value="Pos Gerbang Utama">Pos Gerbang Utama</option>
                    <option value="Patroli & Pengawasan">Patroli & Pengawasan</option>
                    <option value="Keamanan Banin (Putra)">Keamanan Banin (Putra)</option>
                    <option value="Keamanan Banat (Putri)">Keamanan Banat (Putri)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={formData.noWa}
                    onChange={(e) => setFormData({ ...formData, noWa: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Status Keaktifan</label>
                  <select
                    value={formData.statusKeaktifan}
                    onChange={(e) => setFormData({ ...formData, statusKeaktifan: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Izin">Izin / Cuti</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">Alamat / Asrama Tinggal</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="tactile-interactive px-5 py-2.5 font-mono font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-lg border border-amber-300/60"
                >
                  Simpan Pengurus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
