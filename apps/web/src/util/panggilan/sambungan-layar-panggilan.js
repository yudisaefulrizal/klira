import { sambungkanKanalWs } from '../ws/kanal-ws.js';

/** WebSocket memberi sinyal; HTTP berkursor memulihkan event yang tertinggal secara berurutan. */
export function sambungkanLayarPanggilan(id, opsi) {
    const ambil = opsi.ambil ?? fetch;
    let aktif = true, siap = false, memuat = false, ulang = false;
    let kursor;
    let gagalMuat = false;
    let pengontrol;
    let timerMuat;
    function jadwalkanMuat() {
        clearTimeout(timerMuat);
        if (aktif)
            timerMuat = setTimeout(() => void muat(), siap && !gagalMuat ? 60000 : 3000);
    }
    async function muat() {
        if (!aktif)
            return;
        if (memuat) {
            ulang = true;
            return;
        }
        memuat = true;
        clearTimeout(timerMuat);
        pengontrol = new AbortController();
        const batas = setTimeout(() => pengontrol?.abort(), 10000);
        try {
            const respons = await ambil(`/api/publik/layar-panggilan/${id}${kursor === undefined ? '' : `?setelah=${kursor}`}`, { signal: pengontrol.signal, credentials: 'omit', cache: 'no-store' });
            const isi = await respons.json();
            if (!respons.ok)
                throw new Error(isi.galat?.pesan ?? 'Tidak dapat memuat antrean.');
            const data = isi.data;
            if (!Number.isSafeInteger(data.kursor) || data.kursor < (kursor ?? 0) || !Array.isArray(data.event_panggilan) || (data.ada_lanjutan && data.kursor <= (kursor ?? 0)))
                throw new Error('Data panggilan tidak valid. Muat ulang layar.');
            if (aktif) {
                opsi.data(data);
                kursor = data.kursor;
                gagalMuat = false;
                opsi.galat('');
                if (data.ada_lanjutan)
                    ulang = true;
            }
        }
        catch (e) {
            gagalMuat = true;
            if (aktif)
                opsi.galat(e instanceof Error && e.name !== 'AbortError' ? e.message : 'Koneksi terputus. Mencoba menghubungkan kembali…');
        }
        finally {
            clearTimeout(batas);
            memuat = false;
            if (aktif) {
                if (ulang) {
                    ulang = false;
                    void muat();
                }
                else
                    jadwalkanMuat();
            }
        }
    }
    const sambungan = () => sambungkanKanalWs({
        path: `/api/publik/layar-panggilan/${id}/ws`,
        asal: opsi.asal,
        buatSocket: opsi.buatSocket,
        putusSaatGalat: true,
        saatSiap() {
            siap = true;
            opsi.mode('websocket');
            void muat();
        },
        saatPutus() {
            siap = false;
            opsi.mode('polling');
            void muat();
        },
        saatGagalBuat() {
            siap = false;
            opsi.mode('polling');
        },
        saatPesan(pesan, awasi) {
            if (pesan.tipe !== 'perubahan')
                return;
            awasi();
            void muat();
        },
    });
    opsi.mode('menghubungkan');
    const kanal = sambungan();
    void muat();
    return () => {
        aktif = false;
        clearTimeout(timerMuat);
        pengontrol?.abort();
        kanal.tutup();
    };
}
