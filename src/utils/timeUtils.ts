/**
 * Utility Sinkronisasi Waktu Indonesia Barat (WIB, UTC+7 / Asia/Jakarta) Real-Time
 * Digunakan untuk seluruh sistem perizinan, mutasi gerbang, audit keterlambatan, dan sanksi penangguhan izin.
 */

export interface WIBTimeInfo {
  nowWIB: Date;
  dateStr: string; // Format: YYYY-MM-DD
  timeStr: string; // Format: HH:mm
  timeWithSeconds: string; // Format: HH:mm:ss
  formattedFull: string; // Contoh: 10 November 2026, 14:30:15 WIB
  formattedShort: string; // Contoh: 10/11/2026 14:30 WIB
  timestamp: number;
}

/**
 * Mendapatkan informasi waktu real-time dalam zona waktu Indonesia Barat (WIB)
 */
export function getWIBDateTime(date: Date = new Date()): WIBTimeInfo {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  parts.forEach(p => {
    partMap[p.type] = p.value;
  });

  const year = partMap.year || '2026';
  const month = partMap.month || '01';
  const day = partMap.day || '01';
  const hour = partMap.hour || '00';
  const minute = partMap.minute || '00';
  const second = partMap.second || '00';

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;
  const timeWithSeconds = `${hour}:${minute}:${second}`;

  const bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const mIndex = parseInt(month, 10) - 1;
  const formattedFull = `${parseInt(day, 10)} ${bulanIndo[mIndex] || month} ${year}, ${timeWithSeconds} WIB`;
  const formattedShort = `${day}/${month}/${year} ${timeStr} WIB`;

  return {
    nowWIB: date,
    dateStr,
    timeStr,
    timeWithSeconds,
    formattedFull,
    formattedShort,
    timestamp: date.getTime(),
  };
}

/**
 * Menghitung selisih keterlambatan dalam menit antara batas waktu kembali dengan waktu kepulangan aktual (WIB).
 * Return isTerlambat = true jika waktu kepulangan melewati deadline.
 */
export function hitungKeterlambatanWIB(
  tglKembali: string, // YYYY-MM-DD
  jamKembali: string, // HH:mm
  tglAktualKembali?: string, // YYYY-MM-DD (opsional, jika kosong pakai WIB saat ini)
  jamAktualKembali?: string  // HH:mm (opsional, jika kosong pakai WIB saat ini)
): { isTerlambat: boolean; menitKeterlambatan: number; jamKeterlambatan: number } {
  const currentWIB = getWIBDateTime();
  const actualDate = tglAktualKembali || currentWIB.dateStr;
  const actualTime = jamAktualKembali || currentWIB.timeStr;

  const targetDeadline = new Date(`${tglKembali}T${jamKembali}:00+07:00`).getTime();
  const actualArrival = new Date(`${actualDate}T${actualTime}:00+07:00`).getTime();

  if (isNaN(targetDeadline) || isNaN(actualArrival)) {
    return { isTerlambat: false, menitKeterlambatan: 0, jamKeterlambatan: 0 };
  }

  const diffMs = actualArrival - targetDeadline;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes > 0) {
    return {
      isTerlambat: true,
      menitKeterlambatan: diffMinutes,
      jamKeterlambatan: Math.round((diffMinutes / 60) * 10) / 10,
    };
  }

  return {
    isTerlambat: false,
    menitKeterlambatan: 0,
    jamKeterlambatan: 0,
  };
}

/**
 * Menghitung batas tanggal penangguhan izin santri ke depan (default 7 hari dari hari ini di zona waktu WIB)
 */
export function getTanggalPenangguhanWIB(durasiHari: number = 7): string {
  const currentWIB = getWIBDateTime();
  const future = new Date(currentWIB.nowWIB);
  future.setDate(future.getDate() + durasiHari);
  const wibFuture = getWIBDateTime(future);
  return wibFuture.dateStr;
}

/**
 * Memeriksa apakah santri saat ini sedang berada dalam masa suspensi / penangguhan izin keluar
 */
export function isSantriSuspended(suspendIzinHingga?: string): boolean {
  if (!suspendIzinHingga) return false;
  const currentWIB = getWIBDateTime();
  return currentWIB.dateStr <= suspendIzinHingga;
}
