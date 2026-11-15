import { token } from '../../gaya/token.js';
import { bersihkanAngka, gabungTanggal, kolomSelesai, lengkapiNol, pecahTanggal, tanggalDariTeks } from '../../util/tanggal-tiga.js';

const KOLOM = [
    { kunci: 'hari', maks: 2, lebar: '56px', tanda: 'TT', nama: 'Tanggal' },
    { kunci: 'bulan', maks: 2, lebar: '56px', tanda: 'BB', nama: 'Bulan' },
    { kunci: 'tahun', maks: 4, lebar: '84px', tanda: 'TTTT', nama: 'Tahun' },
];
/**
 * Isian tanggal diketik manual dalam tiga kolom (tanggal, bulan, tahun), pengganti pemilih tanggal bawaan peramban.
 * Perilaku seperti satu kontrol: `value` (YYYY-MM-DD, kosong, atau "tt/bb/tttt" selama belum lengkap atau tidak sah),
 * peristiwa `input` dan `change` pada elemen pembungkus, serta `focus()`. Fokus pindah otomatis antar kolom, Backspace di kolom
 * kosong kembali ke kolom sebelumnya, dan teks tanggal utuh yang ditempel mengisi ketiganya. Peristiwa `tanggal-selesai` (membuih) dikirim saat
 * pengetikan dianggap selesai: tahun terisi empat digit, Enter, atau fokus keluar dari ketiga kolom; untuk penyaring yang langsung diterapkan,
 * yang tidak boleh bereaksi pada tanggal sah di tengah pengetikan (mis. mengetik 14 setelah 1 sudah sah sebagai 01).
 */
export function buatTanggalTiga({ id, nilai = '', label = '', galat = false, disabled = false } = {}) {
    const el = document.createElement('div');
    if (id) el.id = id;
    el.setAttribute('role', 'group');
    if (label) el.setAttribute('aria-label', label);
    el.dataset.tanggalTiga = '';
    Object.assign(el.style, { display: 'flex', alignItems: 'center', gap: token.jarak.xs, flexWrap: 'nowrap' });
    const isian = {}, urut = [];
    let terakhir = '', terakhirSelesai = '', galatLuar = !!galat;
    const gayaGaris = (merah) => `${token.ukuran.garis} solid ${merah ? token.warna.status.merah.teks : token.warna.garis}`;
    function tandaiGalat() {
        const nilaiSekarang = nilaiKini(), salah = galatLuar || (!!nilaiSekarang && !/^\d{4}-\d{2}-\d{2}$/.test(nilaiSekarang));
        for (const i of urut) { i.style.border = gayaGaris(salah); if (salah) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); }
    }
    const nilaiKini = () => gabungTanggal({ hari: isian.hari.value, bulan: isian.bulan.value, tahun: isian.tahun.value });
    function isiKolom(bagian) { for (const k of KOLOM) isian[k.kunci].value = bagian[k.kunci]; }
    // Hanya bila nilainya berubah sejak terakhir selesai (atau sejak diisi dari luar): fokus keluar setelah tahun lengkap tidak mengirim dua kali.
    const selesai = () => { const n = nilaiKini(); if (n === terakhirSelesai) return; terakhirSelesai = n; el.dispatchEvent(new CustomEvent('tanggal-selesai', { bubbles: true })); };
    function kabarkan() {
        const baru = nilaiKini();
        tandaiGalat();
        if (baru === terakhir) return;
        terakhir = baru;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    KOLOM.forEach((k, n) => {
        if (n) { const pemisah = document.createElement('span'); pemisah.textContent = '/'; pemisah.setAttribute('aria-hidden', 'true'); pemisah.style.color = token.warna.teksRedup; el.append(pemisah); }
        const i = document.createElement('input');
        Object.assign(i, { type: 'text', inputMode: 'numeric', autocomplete: 'off', maxLength: k.maks, placeholder: k.tanda });
        // Tiap kolom ber-id turunan (`<id>-hari`, `-bulan`, `-tahun`): formulir yang dilukis ulang memulihkan fokus dan kursor lewat id.
        if (id) i.id = `${id}-${k.kunci}`;
        i.setAttribute('aria-label', k.nama); i.disabled = !!disabled; i.dataset.kolom = k.kunci;
        Object.assign(i.style, { width: k.lebar, height: token.ukuran.isian, padding: `0 ${token.jarak.sm}`, boxSizing: 'border-box', textAlign: 'center', border: gayaGaris(false), borderRadius: token.radius.sedang, background: token.warna.permukaan, color: token.warna.teks, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar, fontVariantNumeric: 'tabular-nums' });
        isian[k.kunci] = i; urut.push(i); el.append(i);
        i.addEventListener('input', (e) => {
            e.stopPropagation();
            const bersih = bersihkanAngka(i.value, k.maks);
            if (bersih !== i.value) i.value = bersih;
            if (kolomSelesai(k.kunci, bersih) && urut[n + 1]) { i.value = k.kunci === 'tahun' ? bersih : lengkapiNol(bersih); urut[n + 1].focus(); urut[n + 1].select(); }
            kabarkan();
            if (k.kunci === 'tahun' && bersih.length === 4) selesai();
        });
        i.addEventListener('change', (e) => e.stopPropagation());
        i.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'Enter') { for (const x of ['hari', 'bulan']) isian[x].value = lengkapiNol(isian[x].value); kabarkan(); selesai(); return; }
            if (['/', '-', '.', ' '].includes(e.key) && urut[n + 1]) { e.preventDefault(); if (i.value) { i.value = lengkapiNol(i.value); kabarkan(); urut[n + 1].focus(); urut[n + 1].select(); } return; }
            if (e.key === 'Backspace' && !i.value && n) { e.preventDefault(); urut[n - 1].focus(); return; }
            if (e.key === 'ArrowLeft' && i.selectionStart === 0 && i.selectionEnd === 0 && n) { e.preventDefault(); urut[n - 1].focus(); urut[n - 1].setSelectionRange(urut[n - 1].value.length, urut[n - 1].value.length); }
            if (e.key === 'ArrowRight' && i.selectionStart === i.value.length && urut[n + 1]) { e.preventDefault(); urut[n + 1].focus(); urut[n + 1].setSelectionRange(0, 0); }
        });
        i.addEventListener('paste', (e) => {
            const t = tanggalDariTeks(e.clipboardData?.getData('text'));
            if (!t) return;
            e.preventDefault(); isiKolom({ hari: lengkapiNol(t.hari), bulan: lengkapiNol(t.bulan), tahun: t.tahun }); kabarkan(); selesai();
        });
        i.addEventListener('focus', () => i.select());
    });
    // Meninggalkan isian (fokus keluar dari ketiga kolom): angka satu digit dilengkapi nol di depan.
    // Ditunda satu putaran: bila formulir induk sedang dilukis ulang, elemen ini dicabut (dan memicu focusout) di tengah prosesnya; saat itu tidak boleh
    // mengirim peristiwa lagi, karena itu memicu pelukisan ulang bersarang yang menghilangkan fokus.
    el.addEventListener('focusout', (e) => {
        if (e.relatedTarget && el.contains(e.relatedTarget)) return;
        setTimeout(() => {
            if (!el.isConnected || el.contains(document.activeElement)) return;
            for (const k of ['hari', 'bulan']) isian[k].value = lengkapiNol(isian[k].value);
            kabarkan(); selesai();
        }, 0);
    });
    Object.defineProperty(el, 'value', {
        get: nilaiKini,
        set(v) { isiKolom(pecahTanggal(v)); terakhir = terakhirSelesai = nilaiKini(); tandaiGalat(); },
    });
    Object.defineProperty(el, 'disabled', { get: () => isian.hari.disabled, set(v) { for (const i of urut) i.disabled = !!v; } });
    el.focus = () => isian.hari.focus();
    /** Tanda galat dari luar (pesan galat bidang); galat bawaan tanggal tidak lengkap atau tidak sah menyala sendiri. */
    el.tandaiGalat = (nyala) => { galatLuar = !!nyala; tandaiGalat(); };
    el.value = nilai;
    return el;
}
/** Mengganti semua `<input type="date">` di bawah akar (markup HTML mentah) dengan isian tiga kolom; id, name, kelas, dan nilai dibawa. */
export function gantiInputTanggal(akar) {
    for (const lama of akar.querySelectorAll('input[type="date"]')) {
        const baru = buatTanggalTiga({ id: lama.id || undefined, nilai: lama.value, label: lama.getAttribute('aria-label') ?? '', disabled: lama.disabled });
        if (lama.name) { baru.name = lama.name; baru.setAttribute('name', lama.name); }
        if (lama.className) baru.className = lama.className;
        lama.replaceWith(baru);
    }
}
