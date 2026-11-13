const digit = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
export function teksPanggilan(panggilan) {
    const nomor = panggilan.kode.replace(/-/g, ' ').replace(/\d/g, n => ` ${digit[Number(n)]} `).replace(/\s+/g, ' ').trim();
    return `Perhatian! Nomor antrean ${nomor}! Silakan menuju ${panggilan.poli_nama}. Terima kasih!`;
}
/** ID event mencegah replay saat reconnect; waktu menjadi pembanding untuk tampilan awal tanpa event. */
export class PemilihPanggilanSuara {
    tanggal = '';
    eventTerakhir = 0;
    terakhir = new Map();
    reset() { this.tanggal = ''; this.eventTerakhir = 0; this.terakhir.clear(); }
    lewatiSampai(id) { this.eventTerakhir = id; }
    baru(tanggal, hariIni, daftar) {
        if (tanggal !== hariIni)
            return [];
        if (this.tanggal !== tanggal) {
            this.terakhir.clear();
            this.tanggal = tanggal;
        }
        return [...daftar].sort((a, b) => a.event_id !== undefined && b.event_id !== undefined ? a.event_id - b.event_id : a.event_id !== undefined ? -1 : b.event_id !== undefined ? 1 : Date.parse(a.waktu_panggil) - Date.parse(b.waktu_panggil)).filter(p => {
            const waktu = Date.parse(p.waktu_panggil);
            if (!Number.isFinite(waktu))
                return false;
            if (p.event_id !== undefined) {
                if (p.event_id <= this.eventTerakhir)
                    return false;
                this.eventTerakhir = p.event_id;
            }
            else if (waktu <= (this.terakhir.get(p.poli_id) ?? -Infinity))
                return false;
            this.terakhir.set(p.poli_id, Math.max(waktu, this.terakhir.get(p.poli_id) ?? -Infinity));
            return true;
        });
    }
}
