import { PemilihPanggilanSuara, teksPanggilan } from './panggilan-suara.js';
import { bacaPreferensiSuara, simpanPreferensiSuara } from './preferensi-suara.js';
/** Suara Indonesia; utamakan suara neural/online yang lebih natural, lalu suara berkesan perempuan. */
export function pilihSuara(daftar) {
    const id = daftar.filter(v => /^id(?:-|$)/i.test(v.lang));
    const skor = v => (/natural|neural|online|google/i.test(v.name) ? 2 : 0) + (/female|perempuan|gadis|damayanti|andika|indah/i.test(v.name) && !/\bmale\b/i.test(v.name) ? 1 : 0);
    return id.sort((a, b) => skor(b) - skor(a))[0];
}
export function buatSuaraPanggilan(fasilitas, berubah) {
    let data = null, hariIni;
    let ditutup = false;
    const didukung = typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
    const status = { aktif: didukung && bacaPreferensiSuara(fasilitas), siap: false,
        perluInteraksi: false, didukung, galatSuara: '' };
    const keadaan = { aktif: false, versi: 0, pemilih: new PemilihPanggilanSuara(), ucapan: new Set(), batasMulai: undefined };
    // Cleanup dan galat hanya menghentikan pemutaran; pilihan tersimpan tetap mengikuti keputusan pengguna.
    function hentikan() {
        const k = keadaan;
        k.aktif = false;
        k.versi++;
        clearTimeout(k.batasMulai);
        if (didukung)
            window.speechSynthesis.cancel();
        k.ucapan.clear();
    }
    function gagal(versi, diblokir = false) {
        if (versi !== keadaan.versi)
            return;
        hentikan();
        status.aktif = false;
        status.siap = false;
        status.perluInteraksi = diblokir;
        status.galatSuara = diblokir ? 'Peramban belum mengizinkan suara otomatis. Ketuk layar sekali untuk mengaktifkan.' : 'Suara gagal diputar. Periksa suara perangkat, lalu aktifkan kembali.';
        berubah(status);
    }
    function ucap(teks) {
        const k = keadaan;
        const versi = k.versi;
        try {
            const ucapan = new SpeechSynthesisUtterance(teks);
            ucapan.lang = 'id-ID';
            // Nada sedikit tinggi dan tempo agak cepat agar terdengar ramah dan bersemangat, tetap jelas untuk nomor.
            ucapan.rate = 1.02;
            ucapan.pitch = 1.25;
            ucapan.volume = 1;
            const suara = pilihSuara(window.speechSynthesis.getVoices());
            if (suara)
                ucapan.voice = suara;
            ucapan.onstart = () => {
                if (versi !== k.versi || !k.aktif)
                    return;
                clearTimeout(k.batasMulai);
                status.siap = true;
                status.perluInteraksi = false;
                status.galatSuara = '';
                berubah(status);
            };
            ucapan.onend = () => { k.ucapan.delete(ucapan); };
            ucapan.onerror = e => {
                k.ucapan.delete(ucapan);
                if (e.error !== 'canceled' && e.error !== 'interrupted')
                    gagal(versi, e.error === 'not-allowed');
            };
            k.ucapan.add(ucapan);
            window.speechSynthesis.speak(ucapan);
        }
        catch (e) {
            gagal(versi, e instanceof Error && e.name === 'NotAllowedError');
        }
    }
    function bacakan(bawaan = false) {
        const k = keadaan;
        if (!k.aktif || !data)
            return 0;
        const daftar = bawaan || !data.event_panggilan.length
            ? data.panggilan_aktif ?? (data.panggilan ? [data.panggilan] : []) : data.event_panggilan;
        const baru = k.pemilih.baru(data.tanggal, hariIni, daftar);
        for (const p of baru) {
            if (k.aktif)
                ucap(teksPanggilan(p));
        }
        return baru.length;
    }
    function mulai(otomatis = false) {
        if (!didukung)
            return;
        const k = keadaan;
        hentikan();
        k.aktif = true;
        k.pemilih.reset();
        k.pemilih.lewatiSampai(data?.kursor ?? 0);
        status.aktif = true;
        status.siap = false;
        status.perluInteraksi = false;
        status.galatSuara = '';
        const versi = k.versi;
        // Beberapa mesin tidak mengirim galat saat autoplay diblokir; jangan tampilkan status aktif palsu.
        k.batasMulai = setTimeout(() => gagal(versi, true), 8000);
        if (!bacakan(true))
            ucap(otomatis ? 'Suara panggilan siap.' : 'Suara panggilan diaktifkan. Silakan menunggu nomor antrean Anda.');
        berubah(status);
    }
    function ubahSuara() {
        if (!didukung)
            return;
        if (keadaan.aktif) {
            simpanPreferensiSuara(fasilitas, false);
            hentikan();
            status.aktif = false;
            status.siap = false;
            status.perluInteraksi = false;
            status.galatSuara = '';
            berubah(status);
        }
        else {
            simpanPreferensiSuara(fasilitas, true);
            mulai();
        }
    }
    function pulihkan(e) {
        if (!status.perluInteraksi || !e.isTrusted || (e.target instanceof Element && e.target.closest('.lp-tombol-suara'))) return;
        if (e instanceof PointerEvent && e.button !== 0) return;
        if (e instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key)) return;
        if (bacaPreferensiSuara(fasilitas)) mulai(true);
    }
    document.addEventListener('pointerdown', pulihkan, true);
    document.addEventListener('keydown', pulihkan, true);
    queueMicrotask(() => { if (!ditutup && didukung && bacaPreferensiSuara(fasilitas)) mulai(true); });
    return {
        status, ubahSuara,
        perbarui(baru, tanggal) {
            if (baru === data && tanggal === hariIni) return;
            data = baru;
            hariIni = tanggal;
            bacakan();
        },
        tutup() {
            if (ditutup) return;
            ditutup = true;
            hentikan();
            document.removeEventListener('pointerdown', pulihkan, true);
            document.removeEventListener('keydown', pulihkan, true);
        },
    };
}
