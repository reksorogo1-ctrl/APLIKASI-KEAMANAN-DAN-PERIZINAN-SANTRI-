import { Perizinan, Pelanggaran, Sanksi } from '../types';

export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 5) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function createWhatsAppUrl(phone: string, text: string): string {
  const normalizedPhone = normalizePhoneNumber(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

export const WhatsAppTemplates = {
  // Notifikasi Izin Disetujui ke Wali
  izinDisetujui: (izin: Perizinan): string => {
    return `*PONDOK PESANTREN SALAF AL-MALIKI*
*Pemberitahuan Resmi Dewan Keamanan*
───────────────────────────
Assalamu'alaikum Warahmatullahi Wabarakatuh.

Yth. Wali dari ananda *${izin.santriNama}* (${izin.santriKelas}),

Kami informasikan bahwa pengajuan perizinan berikut:
📋 *Nomor Surat*: ${izin.nomorIzin}
🏷️ *Jenis Izin*: ${izin.jenisIzin}
📅 *Waktu Keluar*: ${izin.tglKeluar} jam ${izin.jamKeluar} WIB
📅 *Batas Kembali*: ${izin.tglKembali} jam ${izin.jamKembali} WIB
🎯 *Tujuan*: ${izin.tujuan}
🚗 *Penjemput*: ${izin.namaPenjemput} (${izin.hubunganPenjemput})

Status: *DISETUJUI & SURAT DIGITAL DITERBITKAN* ✅

Mohon ananda senantiasa menjaga adab, marwah santri, shalat fardhu, dan kembali ke pondok tepat waktu sesuai batas jam yang telah ditetapkan.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
_Biro Keamanan & Ketertiban Santri Al-Maliki_`;
  },

  // Notifikasi Santri Telah Keluar Gerbang (Check-Out)
  santriCheckOut: (izin: Perizinan, waktuActual: string, petugas: string): string => {
    return `*PONDOK PESANTREN SALAF AL-MALIKI*
*Laporan Pos Gerbang Keamanan*
───────────────────────────
Assalamu'alaikum Wr. Wb.

Yth. Bpk/Ibu Wali Santri *${izin.santriNama}*,

Mengabarkan bahwa ananda telah resmi *CHECK-OUT / KELUAR GERBANG*:
⏰ *Waktu Keluar*: ${waktuActual} WIB
🚪 *Petugas Jaga*: ${petugas}
🚗 *Penjemput*: ${izin.namaPenjemput}
⏰ *Batas Waktu Kembali*: ${izin.tglKembali} jam ${izin.jamKembali} WIB

Mohon kerjasamanya agar santri kembali sebelum batas waktu berakhir. Terima kasih.
_Pos Gerbang Utama Al-Maliki_`;
  },

  // Notifikasi Santri Telah Kembali Masuk Pondok (Check-In)
  santriCheckIn: (izin: Perizinan, waktuActual: string, statusKembali: string): string => {
    return `*PONDOK PESANTREN SALAF AL-MALIKI*
*Laporan Pos Gerbang Keamanan*
───────────────────────────
Assalamu'alaikum Wr. Wb.

Alhamdulillah, mengabarkan bahwa ananda *${izin.santriNama}* (${izin.santriKelas}) telah resmi *KEMBALI KE ASRAMA PONDOK*:
⏰ *Waktu Tiba*: ${waktuActual} WIB
📌 *Status Kepulangan*: ${statusKembali}

Terima kasih atas bimbingan dan kerjasama wali santri selama ananda di luar pondok. Semoga berkah selalu.
_Pos Keamanan Pondok Pesantren Salaf Al-Maliki_`;
  },

  // Peringatan Santri Terlambat
  peringatanKeterlambatan: (izin: Perizinan, menitLate: number): string => {
    return `*PERINGATAN KETERLAMBATAN SANTRI*
*PONDOK PESANTREN SALAF AL-MALIKI*
───────────────────────────
Assalamu'alaikum Wr. Wb.

Yth. Bpk/Ibu Wali Santri dari ananda *${izin.santriNama}*,

Menginformasikan bahwa sampai saat ini ananda *BELUM KEMBALI* ke pondok dan telah melewati batas waktu izin:
📋 *Nomor Izin*: ${izin.nomorIzin}
⏰ *Batas Waktu*: ${izin.tglKembali} pukul ${izin.jamKembali} WIB
⚠️ *Durasi Keterlambatan*: ±${menitLate} Menit

Mohon segera menghubungi Bagian Keamanan Pondok atau memastikan keselamatan ananda di jalan.
Hotline Keamanan: 0812-3456-7800

Wassalamu'alaikum Wr. Wb.`;
  },

  // Notifikasi Pelanggaran dan Sanksi Edukatif
  pelanggaranSanksi: (pelanggaran: Pelanggaran, sanksi?: Sanksi): string => {
    return `*PEMBERITAHUAN KEDISIPLINAN SANTRI*
*PONDOK PESANTREN SALAF AL-MALIKI*
───────────────────────────
Assalamu'alaikum Wr. Wb.

Yth. Orang Tua / Wali dari ananda *${pelanggaran.santriNama}* (${pelanggaran.santriNis}),

Kami menyampaikan rekap pendampingan kedisiplinan santri:
📌 *Pelanggaran*: ${pelanggaran.jenisPelanggaran}
⚖️ *Kategori*: ${pelanggaran.kategori} (${pelanggaran.poin} Poin)
📅 *Waktu Kejadian*: ${pelanggaran.tanggal}
${sanksi ? `📖 *Bentuk Pembinaan Edukatif*: ${sanksi.bentukSanksi}\n👤 *Ustadz Pembina*: ${sanksi.ustadzPembina}` : ''}

Tindakan kedisiplinan ini semata-mata bersifat tarbiyyah (mendidik dan membina karakter) agar ananda semakin giat dalam menuntut ilmu.

Wassalamu'alaikum Wr. Wb.
_Biro Kedisiplinan & Ketertiban Santri Al-Maliki_`;
  }
};
