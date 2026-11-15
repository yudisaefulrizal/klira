import { KLINIS } from '@klira/shared';
import { cariTerminologi } from '../../api-klien/klinis.js';
import { token } from '../../gaya/token.js';
import { bidang, tombol } from '../../komponen/ui/primitif.js';
import { hapusDiagnosis, jadikanUtama, tambahDiagnosis } from '../pemeriksaan/keadaan-pemeriksaan.js';

const D = KLINIS.diagnosis;

/** Pencarian ICD-10: mengetik kode atau nama, memilih menambah satu diagnosis; isian dikosongkan sesudah memilih. */
function PencarianDiagnosis({ id, disabled, onPilih }) {
    let kata = '', terbuka = false, aktif = -1, hasil = [], versi = 0, timer, memuat = false;
    const el = document.createElement('div'), daftarEl = document.createElement('div'); el.className = 'resep-pencarian';
    const f = bidang({ id, label: D.cari, autoComplete: 'off', ubah(v) { kata = v; terbuka = true; aktif = -1; jadwalkan(); tampil(); } });
    f.kontrol.placeholder = D.tambahPetunjuk; f.kontrol.disabled = !!disabled;
    f.kontrol.setAttribute('role', 'combobox'); f.kontrol.setAttribute('aria-autocomplete', 'list'); f.kontrol.setAttribute('aria-controls', `${id}-hasil`);
    el.append(f.el, daftarEl);
    function jadwalkan() {
        clearTimeout(timer); const saat = ++versi; const q = kata.trim();
        if (!q) { hasil = []; memuat = false; return; }
        memuat = true;
        timer = setTimeout(async () => {
            let h = []; try { h = await cariTerminologi('icd10', q, 15); } catch { /* hasil kosong */ }
            if (saat !== versi) return;
            memuat = false; hasil = h; aktif = -1; tampil();
        }, 200);
    }
    function pilih(p) { kata = ''; terbuka = false; aktif = -1; hasil = []; versi++; clearTimeout(timer); tampil(); onPilih(p); }
    function tampil() {
        f.kontrol.value = kata; f.kontrol.setAttribute('aria-expanded', String(terbuka && hasil.length > 0));
        if (aktif >= 0) f.kontrol.setAttribute('aria-activedescendant', `${id}-opsi-${aktif}`); else f.kontrol.removeAttribute('aria-activedescendant');
        daftarEl.replaceChildren();
        if (!terbuka || !kata.trim()) return;
        if (!hasil.length) { const s = document.createElement('small'); s.setAttribute('role', 'status'); s.textContent = memuat ? KLINIS.detail.memuat : D.tidakAda; daftarEl.append(s); return; }
        const ul = document.createElement('ul'); ul.id = `${id}-hasil`; ul.className = 'resep-hasil'; ul.setAttribute('role', 'listbox'); ul.setAttribute('aria-label', D.hasil);
        hasil.forEach((p, n) => {
            const li = document.createElement('li'), judul = document.createElement('strong'), ket = document.createElement('small');
            li.id = `${id}-opsi-${n}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(n === aktif)); if (n === aktif) li.className = 'aktif';
            judul.textContent = p.nama; ket.textContent = p.kode; li.append(judul, ket);
            li.addEventListener('mousedown', (e) => { e.preventDefault(); pilih(p); });
            ul.append(li);
        });
        daftarEl.append(ul);
    }
    f.kontrol.addEventListener('focus', () => { terbuka = true; tampil(); });
    f.kontrol.addEventListener('blur', () => { terbuka = false; tampil(); });
    f.kontrol.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && terbuka) { e.preventDefault(); e.stopPropagation(); terbuka = false; tampil(); }
        if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); terbuka = true; aktif = hasil.length ? Math.max(0, Math.min(hasil.length - 1, aktif + (e.key === 'ArrowDown' ? 1 : -1))) : -1; tampil(); }
        if (e.key === 'Enter') { e.preventDefault(); if (terbuka && hasil[aktif]) pilih(hasil[aktif]); }
    });
    tampil();
    return el;
}

/**
 * Daftar diagnosis ICD-10 pada baris Asesmen: satu baris per diagnosis (nama, kode, peran, hapus) tanpa judul kolom, lalu kolom pencarian
 * untuk menambah. Tepat satu diagnosis berperan Utama (yang pertama otomatis utama). `onUbah(daftar)` dipanggil tiap perubahan.
 */
export function EditorDiagnosis({ idAwal = 'diagnosis', diagnosis, onUbah, galat, disabled }) {
    const el = document.createElement('div'); el.className = 'diagnosis-editor resep-berkepala';
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, minWidth: '0' });
    if (!document.querySelector('link[data-resep-css]')) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('../farmasi/langkah-resep.css', import.meta.url).href; link.dataset.resepCss = ''; document.head.append(link); }
    if (diagnosis.length) {
        const daftar = document.createElement('div'); daftar.className = 'resep-baris-daftar';
        diagnosis.forEach((d) => {
            const baris = document.createElement('div'); baris.className = 'diagnosis-baris diagnosis-isi';
            const nama = document.createElement('span'); nama.className = 'diagnosis-nama'; nama.textContent = d.nama;
            const kode = document.createElement('span'); kode.className = 'diagnosis-kode'; kode.textContent = d.kode;
            const peran = document.createElement('select'); peran.className = 'profil-form-isian'; peran.id = `${idAwal}-peran-${d.kode}`; peran.setAttribute('aria-label', `${D.kolomPeran} ${d.kode}`); peran.disabled = !!disabled;
            for (const [nilai, label] of [['utama', D.peran.utama], ['penyerta', D.peran.penyerta]]) { const o = document.createElement('option'); o.value = nilai; o.textContent = label; peran.append(o); }
            peran.value = d.peran;
            peran.addEventListener('change', () => {
                // Tepat satu utama: memilih Utama menjadikan yang lain penyerta; menurunkan satu-satunya utama digantikan diagnosis lain bila ada.
                if (peran.value === 'utama') return onUbah(jadikanUtama(diagnosis, d.kode));
                const lain = diagnosis.find((x) => x.kode !== d.kode);
                if (lain) return onUbah(jadikanUtama(diagnosis, lain.kode));
                peran.value = 'utama';
            });
            const hapus = tombol('×', () => onUbah(hapusDiagnosis(diagnosis, d.kode)), 'teks'); hapus.classList.add('resep-hapus'); hapus.setAttribute('aria-label', D.hapusBaris(d.kode)); hapus.title = D.hapusBaris(d.kode); hapus.disabled = !!disabled;
            baris.append(nama, kode, peran, hapus); daftar.append(baris);
        });
        el.append(daftar);
    }
    el.append(PencarianDiagnosis({ id: `${idAwal}-cari`, disabled, onPilih(p) { onUbah(tambahDiagnosis(diagnosis, p)); } }));
    if (galat) { const s = document.createElement('small'); s.setAttribute('role', 'alert'); s.style.color = token.warna.status.merah.teks; s.textContent = galat; el.append(s); }
    return el;
}
