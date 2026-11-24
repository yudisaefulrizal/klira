import { SHIFT as S } from '@klira/shared';
import { pesanGalat } from '../../api-klien/klien.js';
import { daftarShift, ubahShift } from '../../api-klien/master.js';
import { token } from '../../gaya/token.js';
import { izinSaatIni } from '../izin/izin-saja.js';
import { baris, kartu, peringatan, sel, tabel, tombol } from '../ui/primitif.js';
import { kolomFleks } from '../../gaya/tata-letak.js';

const JAM = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Halaman Shift: tiga shift tetap (Pagi, Siang, Malam); hanya jam mulai dan selesai yang bisa diubah. */
export function TabShift() {
    const boleh = izinSaatIni(), el = document.createElement('section'), bisaUbah = boleh('master', 'perbaikan');
    kolomFleks(el, 'md');
    let aktif = true, pesan = null, galat = null;
    const info = document.createElement('div'), isi = document.createElement('div'), kotak = kartu({ style: { padding: '0', overflow: 'hidden' } });
    info.textContent = S.petunjuk; info.style.color = token.warna.teksRedup;
    const kabar = document.createElement('div'); kabar.setAttribute('aria-live', 'polite');
    const t = tabel([{ judul: S.kolom.shift }, { judul: S.kolom.mulai }, { judul: S.kolom.selesai }, ...(bisaUbah ? [{ judul: S.kolom.tindakan, rataKanan: true }] : [])], S.judul);
    kotak.append(t.el); isi.append(kotak); el.append(info, kabar, isi);
    function tampilkan() { kabar.replaceChildren(...(galat ? [peringatan(galat)] : pesan ? [peringatan(pesan, 'hijau')] : [])); }
    function inputJam(nilai, label) {
        const i = document.createElement('input'); i.type = 'time'; i.value = nilai; i.disabled = !bisaUbah; i.setAttribute('aria-label', label); i.step = '60';
        Object.assign(i.style, { padding: token.jarak.sm, borderRadius: token.radius.sedang, border: `${token.ukuran.garis} solid ${token.warna.garisIsian}`, background: token.warna.permukaan, color: 'inherit', fontFamily: token.huruf.keluarga });
        return i;
    }
    function barisShift(s) {
        const mulai = inputJam(s.jam_mulai, `${S.kolom.mulai} ${s.nama}`), selesai = inputJam(s.jam_selesai, `${S.kolom.selesai} ${s.nama}`);
        const nama = sel(s.nama); nama.style.fontWeight = token.huruf.berat.tebal;
        const r = baris(nama, sel(mulai), sel(selesai));
        if (bisaUbah) {
            const simpan = tombol(S.simpan, async () => {
                galat = pesan = null;
                if (!JAM.test(mulai.value) || !JAM.test(selesai.value) || selesai.value === mulai.value) { galat = `${s.nama}: jam selesai tidak boleh sama dengan jam mulai.`; return tampilkan(); }
                simpan.disabled = true;
                try { await ubahShift(s.id, { jam_mulai: mulai.value, jam_selesai: selesai.value }); if (!aktif) return; pesan = `${S.tersimpan} (${s.nama})`; }
                catch (e) { if (!aktif) return; galat = pesanGalat(e, S.gagal); }
                finally { simpan.disabled = false; }
                tampilkan();
            });
            const aksi = sel(simpan); aksi.style.textAlign = 'right'; r.append(aksi);
        }
        return r;
    }
    daftarShift().then((d) => { if (!aktif) return; for (const s of d) t.tbody.append(barisShift(s)); })
        .catch((e) => { if (!aktif) return; galat = pesanGalat(e, S.gagalMuat); tampilkan(); });
    el.perbaruiAlamat = () => {}; el.tutup = () => { aktif = false; };
    return el;
}
