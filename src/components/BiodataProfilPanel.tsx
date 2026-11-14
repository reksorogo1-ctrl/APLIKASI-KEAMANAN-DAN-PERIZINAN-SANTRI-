import React, { useState, useEffect } from 'react';
import {
  User,
  Camera,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Upload,
  Trash2,
  Sparkles,
  Building2
} from 'lucide-react';
import { UserAccount } from '../types';
import { storageService } from '../services/storageService';

interface BiodataProfilPanelProps {
  currentUser: UserAccount;
  onProfileUpdated: (updatedUser: UserAccount) => void;
}

export const BiodataProfilPanel: React.FC<BiodataProfilPanelProps> = ({
  currentUser,
  onProfileUpdated,
}) => {
  const [nama, setNama] = useState(currentUser.nama || '');
  const [jabatan, setJabatan] = useState(currentUser.jabatan || '');
  const [divisi, setDivisi] = useState(currentUser.divisi || '');
  const [noWa, setNoWa] = useState(currentUser.noWa || '');
  const [alamat, setAlamat] = useState(currentUser.alamat || 'Komplek Pondok Pesantren Salaf Al-Maliki');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [nrp, setNrp] = useState(currentUser.nrp || '');
  const [pin, setPin] = useState(currentUser.pin || '111111');
  const [password, setPassword] = useState(currentUser.password || '');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setNama(currentUser.nama || '');
    setJabatan(currentUser.jabatan || '');
    setDivisi(currentUser.divisi || '');
    setNoWa(currentUser.noWa || '');
    setAlamat(currentUser.alamat || 'Komplek Pondok Pesantren Salaf Al-Maliki');
    setAvatar(currentUser.avatar || '');
    setNrp(currentUser.nrp || '');
    setPin(currentUser.pin || '111111');
    setPassword(currentUser.password || '');
  }, [currentUser]);

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      setAvatar(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    const updated: UserAccount = {
      ...currentUser,
      nama: nama.trim() || currentUser.nama,
      jabatan: jabatan.trim() || currentUser.jabatan,
      divisi: divisi.trim() || currentUser.divisi,
      noWa: noWa.trim() || currentUser.noWa,
      alamat: alamat.trim() || 'Komplek Pondok Pesantren Salaf Al-Maliki',
      avatar: avatar.trim(),
      nrp: nrp.trim() || currentUser.nrp,
      pin: cleanPin.length === 6 ? cleanPin : (currentUser.pin || '111111'),
      password: password.trim() || currentUser.password,
    };

    storageService.saveUser(updated);
    onProfileUpdated(updated);
    setSaveMessage('Alhamdulillah, Biodata & Profil berhasil disimpan dan langsung diperbarui pada Sidebar & Database Pusat!');
    setTimeout(() => setSaveMessage(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-[#d4af37]/35 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37] bg-[#031810] flex items-center justify-center shadow-xl shrink-0">
              {avatar ? (
                <img src={avatar} alt={nama} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-9 h-9 text-[#e5c158]" />
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[10px] font-mono font-bold text-[#e5c158] uppercase">
                <Sparkles className="w-3 h-3" />
                Tab Biodata dan Profil Pengurus
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {nama || currentUser.nama}
              </h1>
              <p className="text-xs text-[#e5c158] font-medium">
                {jabatan || currentUser.jabatan} · <span className="text-emerald-200/80">{divisi || currentUser.divisi}</span>
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#03160f]/95 border border-[#d4af37]/30 text-xs font-mono text-emerald-100 shrink-0">
            <div>Role RBAC: <strong className="text-[#e5c158] uppercase">{currentUser.role}</strong></div>
            <div className="text-[11px] text-emerald-300 mt-0.5">PIN Lock Screen: <strong className="text-[#f9e29c]">{pin}</strong></div>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-[#d4af37]/60 text-emerald-100 text-xs flex items-center justify-between shadow-xl font-mono">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#e5c158] shrink-0" />
            <span>{saveMessage}</span>
          </div>
          <button onClick={() => setSaveMessage('')} className="text-[#e5c158] hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photo Upload & Preview */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-[#d4af37]/25 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#e5c158]" />
              Foto Profil & Identitas Sidebar
            </h2>
            <p className="text-xs text-emerald-200/75 leading-relaxed">
              Foto profil, nama lengkap, dan jabatan yang Anda simpan di sini akan langsung tampil pada bagian atas Sidebar dan Header utama aplikasi.
            </p>

            <div className="flex flex-col items-center p-5 rounded-2xl bg-[#02120b]/90 border border-[#d4af37]/30 space-y-3">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#d4af37] bg-[#041d13] flex items-center justify-center shadow-2xl">
                {avatar ? (
                  <img src={avatar} alt="Preview Profil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-12 h-12 text-[#e5c158]" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">{nama || 'Nama Pengurus'}</p>
                <p className="text-xs text-[#e5c158]">{jabatan || 'Jabatan Pengurus'}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 w-full">
                <label className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58e24] text-[#02120a] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Foto</span>
                  <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-600/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase text-emerald-200/80">
                Atau Tempel URL Foto Profil
              </label>
              <input
                type="url"
                value={avatar.startsWith('data:') ? '' : avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://contoh.com/foto-profil.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/30 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#03160f]/90 border border-emerald-800/50 text-[11px] text-emerald-200/80 font-mono">
            Sinkronisasi Real-Time ke Cloud Firestore & Perangkat PWA Aktif.
          </div>
        </div>

        {/* Right 2 Columns: Biodata Fields */}
        <div className="lg:col-span-2 metallic-glass-card rounded-3xl p-6 border border-[#d4af37]/25 space-y-5">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-emerald-800/60 pb-3">
            <Briefcase className="w-4 h-4 text-[#e5c158]" />
            Formulir Perubahan Biodata, Jabatan, Kontak & Alamat
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#e5c158]" />
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/35 text-xs text-white font-semibold focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#e5c158]" />
                Jabatan Kepengurusan
              </label>
              <input
                type="text"
                required
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Ketua Pondok / Sekretaris Pusat..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/35 text-xs text-white font-semibold focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#e5c158]" />
                Divisi / Biro Penugasan
              </label>
              <input
                type="text"
                value={divisi}
                onChange={(e) => setDivisi(e.target.value)}
                placeholder="Contoh: Dewan Pimpinan Pusat"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/35 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#e5c158]" />
                Nomor WhatsApp Aktif
              </label>
              <input
                type="text"
                required
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/35 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#e5c158]" />
                Alamat Lengkap / Domisili Rumah
              </label>
              <textarea
                rows={2}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Masukkan alamat lengkap rumah / asrama..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/35 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#f9e29c] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#e5c158]" />
                PIN 6 Digit (Login Lock Screen)
              </label>
              <input
                type="text"
                maxLength={6}
                pattern="\d{6}"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 digit angka"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/50 text-sm text-[#f9e29c] font-mono font-black tracking-[0.3em] focus:outline-none focus:border-[#f9e29c]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#e5c158]" />
                Nomor Registrasi Pengurus (NRP)
              </label>
              <input
                type="text"
                value={nrp}
                onChange={(e) => setNrp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-[#d4af37]/35 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-emerald-200/75">
              Pastikan data nama dan jabatan sesuai dengan SK Kepengurusan Pondok Pesantren Salaf Al-Maliki.
            </p>
            <button
              type="submit"
              className="tactile-interactive px-6 py-3 rounded-xl luxury-gold-btn font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xl"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Biodata & Profil</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
