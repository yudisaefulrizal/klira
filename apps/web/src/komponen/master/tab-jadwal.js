import { JADWAL_PRAKTIK as J, MASTER, teksSelMaster } from '@klira/shared';
import { daftarMaster, daftarShift, hapusJadwal, opsiMaster } from '../../api-klien/master.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModalMasterProfil } from '../../modal/akun-pengaturan/master-profil.js';
import { izinSaatIni } from '../izin/izin-saja.js';
import { bidang, kartu, lencana, peringatan, tab, tombol } from '../ui/primitif.js';
import { bukaKonfirmasi } from '../modal-1/modal-1.js';
import { HARI, petaDokter, petaPoli, saringDokter, saringPoli, TAMPILAN_JADWAL } from './keadaan-jadwal.js';

const KUNCI_SIMPAN = 'klira.jadwal.tampilan', UKURAN = 100;
const bacaTampilan = () => { try { const v = localStorage.getItem(KUNCI_SIMPAN); return TAMPILAN_JADWAL.includes(v) ? v : 'poli'; } catch { return 'poli'; } };
const simpanTampilan = (v) => { try { localStorage.setItem(KUNCI_SIMPAN, v); } catch { /* diabaikan */ } };
const buat = (tag, gaya, teks) => { const e = document.createElement(tag); if (gaya) Object.assign(e.style, gaya); if (teks !== undefined) e.textContent = teks; return e; };

/** Semua halaman satu jenis master dimuat (maksimal 100 per halaman) supaya bisa dipetakan di sisi klien. */
async function muatSemua(jenis) {
    const hasil = []; let halaman = 1, total = 0;
    do { const h = await daftarMaster(jenis, { halaman, ukuran: UKURAN }); hasil.push(...h.data); total = h.total; halaman += 1; } while (hasil.length < total && halaman < 50);
    return hasil;
}

/** Tab Jadwal praktik: peta poli (siapa dokternya) dan peta dokter (di poli mana), tiap sel = shift x hari. */
export function TabJadwal() {
    const boleh = izinSaatIni(), el = document.createElement('section');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    let aktif = true, versi = 0, modal, tampilan = bacaTampilan(), dokter = '', poliPilih = '', poli = null, praktisi = null, shift = null, data = null, galat = null, pesan = null;
    const tutupModal = () => { const t = modal; modal = undefined; t?.(); };
    /** `tetap` = bidang yang sudah ditentukan sel peta (disembunyikan di modal; hanya sisanya yang diisi). */
    const buka = (b, awalan, ringkasan, tetap) => { modal = bukaModalMasterProfil({ jenis: 'jadwal', baris: b, awalan, ringkasan, tetap: ringkasan ? tetap : [], hapus: b ? { label: J.hapus, onKlik: () => mintaHapus(b) } : undefined, onTutup: tutupModal, onSelesai() { tutupModal(); void muat(); } }); };
    /** Jadwal tidak punya status aktif: yang tidak dipakai dihapus (setelah konfirmasi). */
    function mintaHapus(b) {
        let k; const tutupK = () => { k?.tutup(); k = undefined; };
        k = bukaKonfirmasi({ judul: J.hapusJudul, pesan: J.hapusPesan(b), labelYa: J.hapusYa, labelTidak: MASTER.batal, onTidak: tutupK,
            async onYa() { k?.perbarui({ memproses: true }); try { await hapusJadwal(b.id); tutupK(); tutupModal(); pesan = null; await muat(); } catch (e) { tutupK(); pesan = e instanceof GalatApi ? e.message : J.gagalHapus; lukisIsi(); } } });
    }

    async function muat() {
        const saat = ++versi; galat = null;
        try {
            if (!shift) {
                const [sh, po, pr] = await Promise.all([daftarShift(), opsiMaster('poli'), muatSemua('praktisi')]);
                shift = sh; poli = po.map((o) => ({ id: Number(o.nilai), nama: o.label }));
                praktisi = pr.filter((x) => x.aktif).map((x) => ({ id: x.pengguna_id, nama: x.pengguna_nama })).sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
                lukisPilihan();
            }
            const d = await muatSemua('jadwal'); if (!aktif || saat !== versi) return; data = d;
        }
        catch (e) { if (!aktif || saat !== versi) return; galat = e instanceof GalatApi ? e.message : MASTER.gagalMuat; }
        lukisIsi();
    }

    const bar = buat('div', { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end' });
    const pilih = tab(TAMPILAN_JADWAL.map((id) => ({ id: `jadwal-${id}`, label: J[id] })), `jadwal-${tampilan}`, J.tampilan, (id) => { tampilan = id.replace('jadwal-', ''); simpanTampilan(tampilan); pilih.pilih(id); lukisIsi(); });
    const alat = buat('div', { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' });
    const wadahPilihan = buat('div', { display: 'contents' });
    alat.append(wadahPilihan);
    if (boleh('master', 'input')) alat.append(tombol(MASTER.tambah, () => buka()));
    bar.append(pilih.el, alat);
    function lukisPilihan() {
        wadahPilihan.replaceChildren(
            bidang({ id: 'poli-jadwal', label: J.poliPilih, nilai: poliPilih, opsi: [{ nilai: '', label: J.semuaPoli }, ...(poli ?? []).map((p) => ({ nilai: String(p.id), label: p.nama }))], ubah(v) { poliPilih = v; lukisIsi(); } }).el,
            bidang({ id: 'dokter-jadwal', label: J.dokterPilih, nilai: dokter, opsi: [{ nilai: '', label: J.semuaDokter }, ...(praktisi ?? []).map((d) => ({ nilai: String(d.id), label: d.nama }))], ubah(v) { dokter = v; lukisIsi(); } }).el,
        );
    }
    const isi = buat('div', { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    el.append(bar, isi);

    const ringkasanSlot = (nama, hari, s) => `${nama} · ${MASTER.hari[Number(hari)]} · ${s.nama ?? s.shift_nama} (${s.jam_mulai}-${s.jam_selesai})`;
    /**
     * Peta: satu kartu per poli (sel = dokter) atau per dokter (sel = poli); baris Pagi/Siang/Malam, kolom Senin-Minggu.
     * Sel kosong berisi "+" untuk mengisi; klik kotak yang ada untuk mengubah atau menghapus.
     */
    function lukisPeta(tampil) {
        const perPoli = tampilan === 'poli';
        const item = perPoli ? (poli ?? []).filter((p) => !poliPilih || String(p.id) === poliPilih) : (praktisi ?? []).filter((d) => !dokter || String(d.id) === dokter);
        if (!shift?.length || !item.length) { isi.append(buat('div', { color: token.warna.teksRedup, padding: token.jarak.md }, perPoli ? J.tanpaPoli : J.tanpaDokter)); return; }
        const bolehInput = boleh('master', 'input'), bolehUbah = boleh('master', 'perbaikan'), kolom = 'minmax(120px, 0.8fr) repeat(7, minmax(120px, 1fr))';
        for (const p of (perPoli ? petaPoli : petaDokter)(tampil, item, shift)) {
            const kotak = kartu({ style: { padding: '0', overflowX: 'auto' } }), kepala = buat('div', { display: 'flex', alignItems: 'center', gap: token.jarak.sm, padding: `${token.jarak.sm} ${token.jarak.md}`, background: token.warna.kepalaTabel });
            const jumlah = shift.reduce((n, s) => n + HARI.filter((h) => p.sel[s.id][h].length).length, 0);
            kepala.append(buat('strong', { fontSize: token.huruf.ukuran.besar }, p.nama), lencana(J.slotTerisi(jumlah, shift.length * HARI.length), jumlah ? 'hijau' : 'abu'));
            const kisi = buat('div', { display: 'grid', gridTemplateColumns: kolom, minWidth: '980px', fontSize: token.huruf.ukuran.dasar });
            const sel_ = (teks, gaya) => buat('div', { padding: token.jarak.sm, borderTop: `${token.ukuran.garis} solid ${token.warna.garisHalus}`, ...gaya }, teks);
            kisi.append(sel_('', { borderTop: '0' }), ...HARI.map((h) => sel_(MASTER.hari[h], { fontWeight: token.huruf.berat.tebal, borderTop: '0', color: token.warna.teksRedup })));
            for (const s of shift) {
                const label = sel_('', { display: 'flex', flexDirection: 'column' }); label.append(buat('strong', null, s.nama), buat('span', { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }, `${s.jam_mulai}-${s.jam_selesai}`)); kisi.append(label);
                for (const h of HARI) {
                    const c = sel_('', { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, alignItems: 'stretch' }), isiSel = p.sel[s.id][h];
                    for (const b of isiSel) {
                        const w = token.warna.status.hijau, nama = perPoli ? b.pengguna_nama : b.lokasi_nama, chip = buat('button', { textAlign: 'left', border: '0', borderRadius: token.radius.sedang, padding: `${token.jarak.xs} ${token.jarak.sm}`, background: w.latar, color: w.teks, cursor: bolehUbah ? 'pointer' : 'default', fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.kecil });
                        chip.type = 'button'; chip.disabled = !bolehUbah; chip.title = `${nama} · ${MASTER.kolom.kuota}: ${teksSelMaster('kuota', b)}`;
                        chip.append(buat('div', { fontWeight: token.huruf.berat.tebal }, nama ?? '-'), buat('div', null, `${MASTER.kolom.kuota}: ${teksSelMaster('kuota', b)}`));
                        chip.addEventListener('click', () => buka(b, undefined, ringkasanSlot(p.nama, h, s), perPoli ? ['lokasi_id', 'hari', 'shift_id'] : ['pengguna_id', 'hari', 'shift_id'])); c.append(chip);
                    }
                    // Peta dokter: satu dokter hanya satu poli per slot, jadi sel yang sudah terisi tidak menawarkan "+".
                    if (bolehInput && (perPoli || !isiSel.length)) {
                        const tambah = buat('button', { border: `${token.ukuran.garis} dashed ${token.warna.garisIsian}`, background: 'transparent', color: token.warna.teksRedup, borderRadius: token.radius.sedang, cursor: 'pointer', fontFamily: token.huruf.keluarga, padding: isiSel.length ? '0' : token.jarak.sm, minHeight: isiSel.length ? '' : '44px' }, '+');
                        tambah.type = 'button'; tambah.setAttribute('aria-label', J.tambahDi(p.nama, MASTER.hari[h], s.nama));
                        const awalan = perPoli ? { lokasi_id: String(p.id), hari: String(h), shift_id: String(s.id), ...(dokter ? { pengguna_id: dokter } : {}) } : { pengguna_id: String(p.id), hari: String(h), shift_id: String(s.id), ...(poliPilih ? { lokasi_id: poliPilih } : {}) };
                        tambah.addEventListener('click', () => buka(undefined, awalan, ringkasanSlot(p.nama, h, s), perPoli ? ['lokasi_id', 'hari', 'shift_id'] : ['pengguna_id', 'hari', 'shift_id'])); c.append(tambah);
                    }
                    else if (!isiSel.length) c.append(buat('span', { color: token.warna.teksRedup }, '-'));
                    kisi.append(c);
                }
            }
            kotak.append(kepala, kisi); isi.append(kotak);
        }
    }
    function lukisIsi() {
        isi.replaceChildren();
        if (galat) isi.append(peringatan(galat));
        if (pesan) isi.append(peringatan(pesan));
        if (!data) { if (!galat) isi.append(buat('div', { color: token.warna.teksRedup, padding: token.jarak.md }, MASTER.memuat ?? 'Memuat…')); return; }
        lukisPeta(saringDokter(saringPoli(data, poliPilih), dokter));
    }
    lukisIsi(); void muat();
    el.perbaruiAlamat = () => {}; el.tutup = () => { aktif = false; versi++; tutupModal(); };
    return el;
}
