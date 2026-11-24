import { DEFINISI_MASTER, MASTER, STATUS_FILTER_MASTER, teksSelMaster } from '@klira/shared';
import { daftarMaster, hapusMaster, ubahAktifMaster } from '../../api-klien/master.js';
import { pesanGalat } from '../../api-klien/klien.js';
import { izinSaatIni } from '../izin/izin-saja.js';
import { bukaKonfirmasi } from '../modal-1/modal-1.js';
import { buatSakelar } from '../ui/sakelar.js';
import { bidang, kartu, tombol, tabel, baris, sel, peringatan, tab, paginasi } from '../ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bukaModalMasterProfil } from '../../modal/akun-pengaturan/master-profil.js';
import { BAWAAN_MASTER, bacaPenyaring, queryPenyaring, saringanMaster, ubahPenyaring } from '../../util/tab/penyaring-tab.js';
import { jenisMasterDiHalaman } from '../../util/lokasi-master.js';
import { kolomFleks } from '../../gaya/tata-letak.js';

export function DaftarMaster({ search, ubahAlamat, jenisDaftar }) {
  const bawaan = { ...BAWAAN_MASTER, jenis: jenisDaftar[0] ?? 'poli' }, boleh = izinSaatIni(), el = document.createElement('section');
  kolomFleks(el, 'md');
  let aktif = true, versi = 0, timer, modal;
  function terapkan(perubahan, ganti = false) { const lu = bacaPenyaring(search, bawaan), k = { ...lu, nilai: { ...lu.nilai, jenis: jenisMasterDiHalaman(search, jenisDaftar) } }; ubahAlamat(queryPenyaring('master', ubahPenyaring(ganti ? { ...k, nilai: { ...bawaan } } : k, perubahan), bawaan)); }
  function afficher() {
    clearTimeout(timer); const saat = ++versi, keadaan = bacaPenyaring(search, bawaan), jenis = jenisMasterDiHalaman(search, jenisDaftar), def = DEFINISI_MASTER[jenis]; el.replaceChildren(); el.setAttribute('aria-label', `Pengelolaan ${MASTER.jenis[jenis].toLowerCase()}`);
    if (jenisDaftar.length > 1) el.append(tab(jenisDaftar.map(j => ({ id: j, label: MASTER.jenis[j] })), jenis, MASTER.pilihJenis, j => terapkan({ jenis: j }, true)).el);
    const box = kartu({ style: { padding: '0', overflow: 'hidden' } }), toolbar = document.createElement('div'), status = document.createElement('div'), pages = document.createElement('div'), vide = document.createElement('div'); box.id = `panel-${jenis}`; if (jenisDaftar.length > 1) { box.setAttribute('role', 'tabpanel'); box.setAttribute('aria-labelledby', `tab-${jenis}`); }
    Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, padding: token.jarak.md, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'flex-end' });
    // bukaModalMasterProfil mengembalikan fungsi penutup; X, Batal, dan Simpan berhasil harus memanggilnya (sebelumnya hanya `modal` yang dikosongkan, dialognya tetap terbuka).
    function ouvre(b) { const fermer = () => { const tutup = modal; modal = undefined; tutup?.(); }; modal = bukaModalMasterProfil({ jenis, baris: b, onTutup: fermer, onSelesai() { fermer(); afficher(); } }); }
    toolbar.append(bidang({ id: 'cari-master', label: MASTER.cari, jenis: 'search', nilai: keadaan.nilai.cari, ubah(v) { clearTimeout(timer); timer = setTimeout(() => { if (aktif && saat === versi) terapkan({ cari: v.trim() }); }, 300); } }).el);
    if (def.punyaStatus) toolbar.append(bidang({ id: 'status-master', label: MASTER.status, nilai: keadaan.nilai.status, opsi: STATUS_FILTER_MASTER.map(s => ({ nilai: s, label: s === 'semua' ? MASTER.semuaStatus : s === 'aktif' ? MASTER.statusAktif : MASTER.statusNonaktif })), ubah(v) { terapkan({ status: v }); } }).el);
    if (jenis === 'wilayah') toolbar.append(bidang({ id: 'tingkat-master', label: MASTER.filterTingkat, nilai: keadaan.nilai.tingkat, opsi: [{ nilai: '', label: MASTER.semuaTingkat }, ...Object.entries(MASTER.tingkat).map(([nilai, label]) => ({ nilai, label }))], ubah(v) { terapkan({ tingkat: v }); } }).el);
    if (jenis !== 'wilayah' && boleh('master', 'input')) toolbar.append(tombol(MASTER.tambah, () => ouvre()));
    const table = tabel([...def.kolom.map(k => ({ judul: k.label })), ...(def.punyaStatus ? [{ judul: MASTER.status }, { judul: MASTER.tindakan, rataKanan: true }] : [])], MASTER.jenis[jenis]); box.append(toolbar, status, table.el, vide, pages); el.append(box);
    if (jenis === 'praktisi') el.append(peringatan(MASTER.catatanPraktisi, 'biru')); if (jenis === 'wilayah') el.append(peringatan(MASTER.catatanWilayah, 'kuning'));
    function hapusBaris(b) {
      const nama = String(b.nama ?? b.kode ?? b.id);
      const konf = bukaKonfirmasi({
        judul: `Hapus ${MASTER.jenis[jenis]}`,
        pesan: `Hapus "${nama}"? Riwayat kunjungan pasien yang pernah menempati tetap tersimpan.`,
        labelYa: 'Hapus',
        onTidak() { konf.tutup(); },
        async onYa() {
          konf.perbarui({ memproses: true });
          try { await hapusMaster(jenis, b.id); konf.tutup(); status.replaceChildren(); afficher(); }
          catch (e) { konf.tutup(); status.replaceChildren(peringatan(pesanGalat(e, MASTER.gagalMuat))); }
        },
      });
    }
    daftarMaster(jenis, saringanMaster({ nilai: { jenis, cari: keadaan.nilai.cari, status: keadaan.nilai.status, tingkat: keadaan.nilai.tingkat }, halaman: keadaan.halaman }, 20)).then(h => { if (!aktif || saat !== versi) return; for (const b of h.data) { const row = baris(...def.kolom.map((k, i) => { const td = sel(teksSelMaster(k.kunci, b)); if (!i) td.style.fontWeight = token.huruf.berat.tebal; return td; })); if (def.punyaStatus) { const bisaUbah = boleh('master', 'perbaikan'), nama = String(b.nama ?? b.pengguna_nama ?? b.kode ?? b.id); const sak = buatSakelar({ nilai: b.aktif, teks: v => v ? MASTER.statusAktif : MASTER.statusNonaktif, label: MASTER.statusUntuk(nama), disabled: !bisaUbah, async onUbah(v) { sak.setMemproses(true); try { await ubahAktifMaster(jenis, b.id, v); b.aktif = v; sak.setNilai(v); status.replaceChildren(); } catch (e) { sak.setNilai(b.aktif); status.replaceChildren(peringatan(pesanGalat(e, MASTER.gagalUbahStatus))); } finally { sak.setMemproses(false); } } }); const actions = sel(); actions.style.textAlign = 'right'; actions.style.whiteSpace = 'nowrap'; if (bisaUbah) { actions.append(tombol(MASTER.ubah, () => ouvre(b), 'teks')); if (jenis === 'ruang' || jenis === 'bed') actions.append(' ', tombol('Hapus', () => hapusBaris(b), 'teks')); } row.append(sel(sak.el), actions); } table.tbody.append(row); } if (!h.data.length) { vide.textContent = MASTER.kosong; vide.style.padding = token.jarak.md; vide.style.color = token.warna.teksRedup; } const p = paginasi(keadaan.halaman, h.total, h.ukuran, n => ubahAlamat(queryPenyaring('master', { nilai: { ...keadaan.nilai, jenis }, halaman: n }, bawaan))); if (p) pages.append(p); }).catch(e => { if (aktif && saat === versi) status.replaceChildren(peringatan(pesanGalat(e, MASTER.gagalMuat))); });
  }
  el.perbaruiAlamat = alamat => { search = alamat; afficher(); }; el.tutup = () => { aktif = false; versi++; clearTimeout(timer); modal?.(); }; afficher(); return el;
}
