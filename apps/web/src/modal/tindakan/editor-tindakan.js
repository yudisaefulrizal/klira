import { KLINIS, rupiahTeks } from '@klira/shared';
import { cariTerminologi, cariTindakanKlinik } from '../../api-klien/klinis.js';
import { token } from '../../gaya/token.js';
import { bidang, tombol } from '../../komponen/ui/primitif.js';
import { barisTindakanKosong, gabungHasil, hapusBarisTindakan, isiDariPilihan, labelSumber, ubahBarisTindakan } from './keadaan-tindakan.js';

const I = KLINIS.tindakan;

/**
 * Kolom pencarian satu tindakan: tindakan klinik (berharga) dan kamus ICD-9 CM dicari bersamaan; fokus tanpa ketikan menampilkan daftar tindakan klinik.
 * `onPilih(pilihan)` saat memilih; `onPilih(null)` saat pilihan sebelumnya dihapus dengan mengetik (induk tidak perlu menggambar ulang).
 */
function PencarianTindakan(awal) {
    let props = awal, kata = '', terbuka = false, aktif = -1, hasil = [], versi = 0, timer, memuat = false;
    const el = document.createElement('div'), daftarEl = document.createElement('div'); el.className = 'resep-pencarian';
    const f = bidang({ id: props.id, label: I.nama, autoComplete: 'off', ubah(v) {
        const adaPilihan = !!props.kode; kata = v; props = { ...props, kode: '', nama: '' }; terbuka = true; aktif = -1;
        if (adaPilihan) props.onPilih(null);
        jadwalkan(); tampil();
    } });
    f.kontrol.placeholder = I.petunjukCari; f.kontrol.setAttribute('role', 'combobox'); f.kontrol.setAttribute('aria-autocomplete', 'list'); f.kontrol.setAttribute('aria-controls', `${props.id}-hasil`);
    el.append(f.el, daftarEl);
    function jadwalkan() {
        clearTimeout(timer); const saat = ++versi; memuat = true;
        timer = setTimeout(async () => {
            const q = kata.trim();
            const [k, m] = await Promise.allSettled([cariTindakanKlinik(q, 20), q ? cariTerminologi('icd9cm', q, 20) : Promise.resolve([])]);
            if (saat !== versi) return;
            memuat = false; hasil = gabungHasil(k.status === 'fulfilled' ? k.value : [], m.status === 'fulfilled' ? m.value : []); aktif = -1; tampil();
        }, 200);
    }
    function pilih(p) { props = { ...props, kode: p.kode, nama: p.nama }; kata = ''; terbuka = false; aktif = -1; clearTimeout(timer); versi++; tampil(); props.onPilih(p); }
    function tampil() {
        const terpilih = !!props.kode, buka = terbuka && !terpilih;
        f.kontrol.value = terpilih ? props.nama : kata; f.kontrol.disabled = !!props.disabled; f.setGalat(props.galat);
        f.kontrol.setAttribute('aria-expanded', String(buka)); if (buka && aktif >= 0) f.kontrol.setAttribute('aria-activedescendant', `${props.id}-opsi-${aktif}`); else f.kontrol.removeAttribute('aria-activedescendant');
        daftarEl.replaceChildren();
        if (!buka) return;
        if (!hasil.length) { const s = document.createElement('small'); s.setAttribute('role', 'status'); s.textContent = memuat ? KLINIS.detail.memuat : I.tidakAda; daftarEl.append(s); return; }
        const ul = document.createElement('ul'); ul.id = `${props.id}-hasil`; ul.className = 'resep-hasil'; ul.setAttribute('role', 'listbox'); ul.setAttribute('aria-label', I.cari);
        hasil.forEach((p, n) => {
            const li = document.createElement('li'), judul = document.createElement('strong'), ket = document.createElement('small');
            li.id = `${props.id}-opsi-${n}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(n === aktif)); if (n === aktif) li.className = 'aktif';
            judul.textContent = p.nama;
            const harga = p.sumber === 'klinik' ? (p.harga_umum != null ? rupiahTeks(p.harga_umum) : I.tanpaHarga) : null;
            ket.textContent = [p.kode, labelSumber(p.sumber), harga].filter(Boolean).join(' · ');
            li.append(judul, ket);
            // mousedown (bukan click) supaya terpilih sebelum isian kehilangan fokus.
            li.addEventListener('mousedown', (e) => { e.preventDefault(); pilih(p); });
            ul.append(li);
        });
        daftarEl.append(ul);
    }
    f.kontrol.addEventListener('focus', () => { if (props.kode) return; terbuka = true; if (!hasil.length) jadwalkan(); tampil(); });
    f.kontrol.addEventListener('blur', () => { terbuka = false; tampil(); });
    f.kontrol.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && terbuka) { e.preventDefault(); e.stopPropagation(); terbuka = false; tampil(); }
        if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); terbuka = true; aktif = hasil.length ? Math.max(0, Math.min(hasil.length - 1, aktif + (e.key === 'ArrowDown' ? 1 : -1))) : -1; tampil(); }
        if (e.key === 'Enter' && !props.kode) { e.preventDefault(); if (terbuka && hasil[aktif]) pilih(hasil[aktif]); }
    });
    el.perbarui = (p) => { props = { ...props, ...p }; tampil(); };
    el.tutup = () => { clearTimeout(timer); versi++; };
    tampil();
    return el;
}

/**
 * Editor tindakan kunjungan seperti editor obat resep: judul kolom sekali di atas (Tindakan, Kode ICD-9 CM, Jumlah), satu baris per tindakan,
 * tombol tambah. `onUbah(baris)` dipanggil tiap perubahan; induk hanya mencatat isian.
 */
export function EditorTindakan(awal) {
    let props = awal, anak = [];
    const el = document.createElement('fieldset');
    Object.assign(el.style, { margin: '0', padding: '0', border: '0', minWidth: '0' }); el.setAttribute('aria-label', I.kunjunganIni); el.classList.add('resep-berkepala', 'tindakan-editor');
    if (!document.querySelector('link[data-resep-css]')) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('../farmasi/langkah-resep.css', import.meta.url).href; link.dataset.resepCss = ''; document.head.append(link); }
    const ganti = (baris, fokus) => { props = { ...props, baris }; lukis(); props.onUbah(baris); if (fokus !== undefined) document.getElementById(`${props.idAwal}-tindakan-${fokus}`)?.focus(); };
    // Mengetik di pencarian menghapus pilihan lama tanpa menggambar ulang (ketikan tidak boleh hilang).
    const ubahTanpaLukis = (n, p) => { props = { ...props, baris: ubahBarisTindakan(props.baris, n, p) }; props.onUbah(props.baris); };
    function lukis() {
        const fokus = document.activeElement, id = fokus?.id, mulai = fokus?.selectionStart, akhir = fokus?.selectionEnd;
        for (const a of anak) a.tutup(); anak = []; el.replaceChildren(); el.disabled = !!props.disabled;
        const aide = document.createElement('small'); aide.style.color = token.warna.teksRedup; aide.style.display = 'block'; aide.style.marginBottom = token.jarak.xs; aide.textContent = props.petunjuk ?? I.petunjukIsi; el.append(aide);
        if (!props.baris.length) el.append(I.kosong);
        if (props.baris.length) {
            const kepala = document.createElement('div'); kepala.className = 'resep-baris-kepala'; kepala.setAttribute('aria-hidden', 'true');
            for (const t of [I.kolomTindakan, I.kode, I.jumlah]) { const c = document.createElement('span'); c.textContent = t; kepala.append(c); }
            kepala.append(document.createElement('span')); el.append(kepala);
        }
        const daftar = document.createElement('div'); daftar.className = 'resep-baris-daftar';
        props.baris.forEach((b, n) => {
            const baris = document.createElement('div'), utama = document.createElement('div'); baris.className = 'resep-baris'; utama.className = 'resep-baris-utama';
            const g = (nom) => (props.tampilGalat ? props.galat[`item.${n}.${nom}`] : undefined);
            const cari = PencarianTindakan({ id: `${props.idAwal}-tindakan-${n}`, kode: b.kode, nama: b.nama, galat: g('kode') ?? g('nama'), disabled: props.disabled,
                onPilih(p) { if (p) ganti(ubahBarisTindakan(props.baris, n, isiDariPilihan(p))); else ubahTanpaLukis(n, isiDariPilihan(null)); } });
            anak.push(cari);
            const kode = document.createElement('small'); kode.className = 'tindakan-kode'; kode.textContent = b.kode; kode.style.color = token.warna.teksRedup;
            const jumlah = bidang({ id: `${props.idAwal}-jumlah-${n}`, label: I.jumlah, nilai: b.jumlah, autoComplete: 'off', ubah(v) { ganti(ubahBarisTindakan(props.baris, n, { jumlah: v })); } });
            jumlah.kontrol.inputMode = 'numeric'; jumlah.setGalat(g('jumlah'));
            const hapus = tombol('×', () => ganti(hapusBarisTindakan(props.baris, n)), 'teks'); hapus.classList.add('resep-hapus'); hapus.setAttribute('aria-label', I.hapusBaris(n + 1)); hapus.title = I.hapusBaris(n + 1);
            utama.append(cari, kode, jumlah.el, hapus); baris.append(utama); daftar.append(baris);
        });
        el.append(daftar);
        if (props.tampilGalat && props.galat.item) { const s = document.createElement('small'); s.setAttribute('role', 'alert'); s.style.color = token.warna.status.merah.teks; s.textContent = props.galat.item; el.append(s); }
        const tambah = tombol(`＋ ${I.tambahTindakan}`, () => ganti([...props.baris, barisTindakanKosong()], props.baris.length), 'sekunder'); tambah.style.marginTop = token.jarak.sm; el.append(tambah);
        if (id) { const f = document.getElementById(id); f?.focus(); if (mulai != null && f?.setSelectionRange) { try { f.setSelectionRange(mulai, akhir); } catch { /* tipe isian tanpa seleksi */ } } }
    }
    el.perbarui = (p) => { props = { ...props, ...p }; lukis(); };
    el.tutup = () => { for (const a of anak) a.tutup(); };
    lukis();
    return el;
}
