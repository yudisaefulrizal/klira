import { RAWAT_INAP, STATUS_BED, TOMBOL } from '@klira/shared';
import { bidang, kartu, tombol, lencana, peringatan } from '../../komponen/ui/primitif.js';
import { bukaKonfirmasi } from '../../komponen/modal-1/modal-1.js';
import { navigasi } from '../../util/navigasi/navigasi.js';
import { ambilPapan } from '../../api-klien/rawat-inap.js';
import { buatMaster, hapusMaster, ubahAktifMaster, ubahMaster } from '../../api-klien/master.js';
import { pesanGalat } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { token } from '../../gaya/token.js';
import { bukaAdmisiRawatInap } from '../../modal/rawat-inap/admisi-rawat-inap.js';
import { bukaCatatanHarian } from '../../modal/rawat-inap/catatan-harian.js';
import { bukaPemulanganRawatInap } from '../../modal/rawat-inap/pemulangan-rawat-inap.js';
import { bukaUbahPenempatan } from '../../modal/rawat-inap/ubah-penempatan.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

const P = RAWAT_INAP.papan, D = RAWAT_INAP.daftarInap;

function el(tag, teks, gaya) { const n = document.createElement(tag); if (teks !== undefined) n.textContent = teks; if (gaya) Object.assign(n.style, gaya); return n; }
const redup = (teks) => el('span', teks, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });

function susunKamar(papan) {
  const peta = new Map();
  for (const r of papan.ruang_tanpa_bed ?? []) {
    peta.set(String(r.id), { id: r.id, nama: r.nama, tarif_id: r.tarif_id ?? null, tarif_nama: r.tarif_nama ?? null, harga_umum: r.harga_umum ?? null, beds: [] });
  }
  for (const b of papan.bed ?? []) {
    const key = b.ruang_id != null ? String(b.ruang_id) : '__tanpa__';
    const kamar = peta.get(key) ?? { id: b.ruang_id, nama: b.ruang_nama ?? P.ruangTanpa, tarif_id: b.ruang_tarif_id ?? null, tarif_nama: b.ruang_tarif_nama ?? null, harga_umum: b.ruang_harga_umum ?? null, beds: [] };
    const p = b.penghuni;
    kamar.beds.push({
      id: b.id,
      jenis: p ? 'terisi' : 'bed',
      status: b.status,
      ruang: kamar.nama,
      bed: b.nama,
      pasien: p && { pasien_id: p.pasien_id, kunjungan_id: p.kunjungan_id, nama: p.pasien_nama, nomor_rm: p.pasien_nomor_rm },
      dpjp: p?.dpjp_nama,
      mulai: p?.mulai,
    });
    peta.set(key, kamar);
  }
  return [...peta.values()]
    .map((k) => ({ ...k, beds: k.beds.sort((a, b) => a.bed.localeCompare(b.bed, undefined, { numeric: true })) }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

export function HalamanRawatInap() {
  const boleh = izinSaatIni(), halaman = el('div', undefined, { display: 'contents' }), header = el('header', undefined, { display: 'flex', alignItems: 'center', gap: token.jarak.md, flexWrap: 'wrap' }), ringkas = redup(''), status = el('div'), isi = el('div');
  const judul = el('h1', RAWAT_INAP.judul, { margin: '0', fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: '1' });
  header.append(judul, ringkas); isi.style.display = 'contents'; halaman.append(header, status, isi);
  let aktif = true, versi = 0, modal, papanTerakhir = null, cari = '', filterRuang = '', filterStatus = '';
  let formTambahKamar = false, editKamarId = null, tambahBedDiKamarId = null, editBedId = null;
  const tutupModal = () => { modal = undefined; }, selesai = () => { modal = undefined; void muat(); };
  function buka(jenis, pasien) {
    const props = { kunjunganId: pasien?.kunjungan_id, pasien, onTutup: tutupModal, onSelesai: selesai };
    modal = jenis === 'admisi'
      ? bukaAdmisiRawatInap({ ...pasien, onTutup: tutupModal, onSelesai: selesai })
      : jenis === 'cppt' ? bukaCatatanHarian({ ...props, onTutup: selesai })
        : jenis === 'penempatan' ? bukaUbahPenempatan(props)
          : bukaPemulanganRawatInap(props);
  }
  if (boleh('klinis', 'input')) header.append(tombol(P.admisi, () => buka('admisi')));
  function hapusItem(jenis, id, nama) {
    const konf = bukaKonfirmasi({
      judul: `Hapus ${jenis === 'ruang' ? 'Kamar' : 'Bed'}`,
      pesan: `Hapus "${nama}"? Riwayat kunjungan pasien yang pernah menempati tetap tersimpan.`,
      labelYa: 'Hapus',
      onTidak() { konf.tutup(); },
      async onYa() {
        konf.perbarui({ memproses: true });
        try { await hapusMaster(jenis, id); konf.tutup(); status.replaceChildren(); void muat(); }
        catch (e) { konf.tutup(); status.replaceChildren(peringatan(pesanGalat(e, RAWAT_INAP.gagalMuat))); }
      },
    });
  }

  function aksi(r, kamar) {
    const baris = el('div', undefined, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', alignItems: 'center' }), menunggu = r.jenis === 'menunggu';
    if (r.pasien) {
      if (!menunggu && boleh('klinis', 'lihat')) baris.append(tombol(P.cppt, () => buka('cppt', r.pasien), 'teks'));
      if (boleh('klinis', 'input')) baris.append(tombol(menunggu ? P.tempatkan : P.penempatan, () => buka('penempatan', r.pasien), 'teks'), tombol(P.pemulangan, () => buka('pulang', r.pasien), 'teks'));
      if (r.pasien.pasien_id) baris.append(tombol('Buka profil', () => navigasi.pindah(`/pasien?tab=pasien&pasien=${r.pasien.pasien_id}&kunjungan=${r.pasien.kunjungan_id}`), 'teks'));
      return baris;
    }
    if (r.status === 'kosong' && boleh('klinis', 'input')) {
      baris.append(tombol('Admisi', () => buka('admisi', { bedId: r.id, ruangNama: kamar.nama, tarifId: kamar.tarif_id }), 'sekunder'));
    }
    if (boleh('master', 'perbaikan')) {
      baris.append(tombol('Ubah', () => { editBedId = editBedId === r.id ? null : r.id; lukisPapan(); }, 'teks'));
      baris.append(tombol(r.status === 'tidak_operasional' ? 'Aktifkan' : 'Nonaktifkan', async () => {
        try { await ubahAktifMaster('bed', r.id, r.status === 'tidak_operasional'); status.replaceChildren(); void muat(); }
        catch (e) { status.replaceChildren(peringatan(pesanGalat(e, RAWAT_INAP.gagalMuat))); }
      }, 'teks'));
      baris.append(tombol('Hapus', () => hapusItem('bed', r.id, r.bed), 'teks'));
    }
    return baris;
  }
  function cocokFilter(r) {
    if (filterRuang && r.ruang !== filterRuang) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    const q = cari.trim().toLowerCase();
    if (!q) return true;
    return [r.ruang, r.bed, r.pasien?.nama, r.pasien?.nomor_rm, r.dpjp].some((v) => String(v ?? '').toLowerCase().includes(q));
  }
  function buatInputRingkas({ id, nilai = '', placeholder = '', tipe = 'text', lebar = '180px' }) {
    const inp = el('input', undefined, {
      padding: '5px 8px',
      borderRadius: token.radius.kecil,
      border: '1px solid rgba(148, 163, 184, 0.45)',
      fontSize: token.huruf.ukuran.kecil,
      width: lebar,
      maxWidth: '100%',
      background: 'var(--warna-permukaan, #fff)',
      color: 'inherit',
    });
    inp.id = id;
    inp.type = tipe;
    inp.value = nilai;
    inp.placeholder = placeholder;
    if (tipe === 'number') { inp.min = '0'; inp.step = '1'; inp.inputMode = 'numeric'; }
    return inp;
  }
  function buatFormKamarInline({ awalNama = '', awalHarga = null, idKamar = null, sebaris = false, onBatal }) {
    const form = el('form', undefined, sebaris
      ? { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', alignItems: 'center', width: '100%' }
      : { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', background: 'rgba(148, 163, 184, 0.08)', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' });
    let proses = false;
    const fNama = buatInputRingkas({ id: `kamar-nama-${idKamar ?? 'baru'}`, nilai: awalNama, placeholder: 'Nama kamar', lebar: '200px' });
    fNama.maxLength = 200;
    const fHarga = buatInputRingkas({ id: `kamar-harga-${idKamar ?? 'baru'}`, nilai: awalHarga != null ? String(awalHarga) : '', placeholder: 'Harga / hari (Rp)', tipe: 'number', lebar: '150px' });
    const btnSimpan = tombol(TOMBOL.simpan); btnSimpan.type = 'submit';
    const btnBatal = tombol(TOMBOL.batal, onBatal, 'teks');
    form.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); onBatal(); } });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama = fNama.value.trim();
      if (proses || !nama) return;
      const hargaAngka = fHarga.value.trim() === '' ? null : Number(fHarga.value);
      if (hargaAngka !== null && (!Number.isInteger(hargaAngka) || hargaAngka < 0)) {
        status.replaceChildren(peringatan('Harga kamar harus berupa angka bulat >= 0.'));
        return;
      }
      proses = true; btnSimpan.disabled = true;
      try {
        const beban = { nama, harga_umum: hargaAngka, status_operasional: 'O' };
        if (idKamar) await ubahMaster('ruang', idKamar, beban);
        else await buatMaster('ruang', beban);
        formTambahKamar = false; editKamarId = null; status.replaceChildren(); void muat();
      } catch (err) {
        status.replaceChildren(peringatan(pesanGalat(err, RAWAT_INAP.gagalMuat)));
      } finally { proses = false; btnSimpan.disabled = false; }
    });
    form.append(fNama, fHarga, btnSimpan, btnBatal);
    requestAnimationFrame(() => fNama.focus());
    return form;
  }
  function buatFormBedInline({ ruangId, awalNama = '', onBatal }) {
    const form = el('form', undefined, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', alignItems: 'center', padding: '8px 14px', background: 'rgba(13, 148, 136, 0.06)', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' });
    let proses = false;
    const fNama = buatInputRingkas({ id: `bed-nama-${ruangId}`, nilai: awalNama, placeholder: 'Nama bed baru', lebar: '200px' });
    fNama.maxLength = 200;
    const btnSimpan = tombol(TOMBOL.simpan); btnSimpan.type = 'submit';
    const btnBatal = tombol(TOMBOL.batal, onBatal, 'teks');
    form.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); onBatal(); } });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama = fNama.value.trim();
      if (proses || !nama) return;
      proses = true; btnSimpan.disabled = true;
      try {
        await buatMaster('bed', { nama, induk_id: Number(ruangId), status_operasional: 'O' });
        tambahBedDiKamarId = null; status.replaceChildren(); void muat();
      } catch (err) {
        status.replaceChildren(peringatan(pesanGalat(err, RAWAT_INAP.gagalMuat)));
      } finally { proses = false; btnSimpan.disabled = false; }
    });
    form.append(fNama, btnSimpan, btnBatal);
    requestAnimationFrame(() => fNama.focus());
    return form;
  }
  function tabelBed(baris, kamar = null, kolomPertama = 'Bed') {
    const K = D.kolom, bungkus = el('div', undefined, { overflowX: 'auto' }), t = el('table', undefined, { width: '100%', borderCollapse: 'collapse', minWidth: '780px' }), kepala = el('tr');
    const sel = (tag, isi2) => { const n = el(tag, undefined, { padding: '8px 10px', textAlign: 'left', verticalAlign: 'middle', borderBottom: '1px solid rgba(148, 163, 184, 0.25)', fontSize: token.huruf.ukuran.kecil }); if (isi2 instanceof Node) n.append(isi2); else if (isi2 !== undefined) n.textContent = isi2; return n; };
    for (const k of [kolomPertama, K.status, K.pasien, K.dpjp, K.sejak, K.tindakan]) { const th = sel('th', k); th.scope = 'col'; kepala.append(th); }
    const badan2 = el('tbody'); t.append(el('thead'), badan2); t.firstChild.append(kepala);
    for (const r of baris) {
      const sedangEdit = Boolean(kamar && editBedId === r.id);
      const tr = el('tr'), pasien = el('span');
      if (r.pasien) pasien.append(el('strong', r.pasien.nama), ' ', redup(r.pasien.nomor_rm)); else pasien.append(redup(P.kosongBed));
      const lencanaStatus = r.jenis === 'menunggu' ? lencana(D.menungguBed, 'kuning') : lencana(STATUS_BED.label(r.status), STATUS_BED.warna(r.status));
      if (sedangEdit) {
        const fNama = buatInputRingkas({ id: `bed-edit-${r.id}`, nilai: r.bed, placeholder: 'Nama bed', lebar: '150px' });
        fNama.maxLength = 200;
        let proses = false;
        const simpanBed = async () => {
          const nama = fNama.value.trim();
          if (proses || !nama) return;
          proses = true;
          try {
            await ubahMaster('bed', r.id, { nama, induk_id: Number(kamar.id), status_operasional: r.status === 'tidak_operasional' ? 'U' : 'O' });
            editBedId = null; status.replaceChildren(); void muat();
          } catch (err) {
            status.replaceChildren(peringatan(pesanGalat(err, RAWAT_INAP.gagalMuat)));
          } finally { proses = false; }
        };
        const batalBed = () => { editBedId = null; lukisPapan(); };
        fNama.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); void simpanBed(); }
          if (e.key === 'Escape') { e.preventDefault(); batalBed(); }
        });
        const aksiEdit = el('div', undefined, { display: 'flex', gap: token.jarak.sm, alignItems: 'center' });
        aksiEdit.append(tombol(TOMBOL.simpan, () => void simpanBed()), tombol(TOMBOL.batal, batalBed, 'teks'));
        tr.append(sel('td', fNama), sel('td', lencanaStatus), sel('td', pasien), sel('td', r.dpjp ?? '-'), sel('td', r.mulai ? formatWaktu(r.mulai) : '-'), sel('td', aksiEdit));
        badan2.append(tr);
        requestAnimationFrame(() => fNama.focus());
        continue;
      }
      tr.append(sel('td', el('strong', r.bed === '-' ? r.ruang : r.bed)), sel('td', lencanaStatus), sel('td', pasien), sel('td', r.dpjp ?? '-'), sel('td', r.mulai ? formatWaktu(r.mulai) : '-'), sel('td', aksi(r, kamar)));
      badan2.append(tr);
    }
    bungkus.append(t); return bungkus;
  }
  function lukisDaftarKamar(wadah) {
    wadah.replaceChildren();
    const papan = papanTerakhir, q = cari.trim().toLowerCase();
    const menunggu = papan.menunggu
      .map((m) => ({ jenis: 'menunggu', status: 'menunggu', ruang: D.menunggu, bed: '-', pasien: { pasien_id: m.pasien_id, kunjungan_id: m.kunjungan_id, nama: m.pasien_nama, nomor_rm: m.pasien_nomor_rm }, dpjp: m.dpjp_nama, mulai: m.mulai }))
      .filter((r) => (!filterRuang) && cocokFilter(r));

    if (menunggu.length) {
      const kartuTunggu = kartu({ style: { padding: '0', overflow: 'hidden' } });
      const kep = el('div', undefined, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(245, 158, 11, 0.08)' });
      kep.append(el('strong', D.menunggu), lencana(`${menunggu.length} pasien`, 'kuning'));
      kartuTunggu.append(kep, tabelBed(menunggu, null, 'Antrean'));
      wadah.append(kartuTunggu);
    }

    const kamarList = susunKamar(papan);
    let adaKamarTampil = false;
    for (const kamar of kamarList) {
      if (filterRuang && kamar.nama !== filterRuang) continue;
      const bedsTampil = kamar.beds.filter(cocokFilter);
      const kamarKosongCocok = !kamar.beds.length && !filterStatus && (!q || kamar.nama.toLowerCase().includes(q));
      if (!bedsTampil.length && !kamarKosongCocok) continue;
      adaKamarTampil = true;

      const terisi = kamar.beds.filter((b) => b.status === 'terisi').length;
      const kosong = kamar.beds.filter((b) => b.status === 'kosong').length;
      const kotakKamar = kartu({ style: { padding: '0', overflow: 'hidden' } });
      const kep = el('div', undefined, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.sm, flexWrap: 'wrap', padding: '10px 14px', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(148, 163, 184, 0.06)' });
      const info = el('div', undefined, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, flexWrap: 'wrap' });
      const infoTarif = kamar.harga_umum != null ? `Rp ${Number(kamar.harga_umum).toLocaleString('id-ID')} / hari` : 'Belum ada harga';
      info.append(
        el('strong', kamar.nama),
        redup(kamar.beds.length ? `${kamar.beds.length} bed · ${terisi} terisi · ${kosong} kosong` : 'Belum ada bed'),
        lencana(infoTarif, kamar.harga_umum != null ? 'hijau' : 'abu'),
      );
      const aksiKamar = el('div', undefined, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, flexWrap: 'wrap' });
      if (kamar.id && boleh('master', 'perbaikan')) {
        aksiKamar.append(tombol('Ubah', () => { editKamarId = editKamarId === kamar.id ? null : kamar.id; lukisPapan(); }, 'teks'));
        aksiKamar.append(tombol('Hapus', () => hapusItem('ruang', kamar.id, kamar.nama), 'teks'));
      }
      if (kamar.id && boleh('master', 'input')) {
        aksiKamar.append(tombol(D.tambahBed, () => { tambahBedDiKamarId = tambahBedDiKamarId === kamar.id ? null : kamar.id; lukisPapan(); }, 'teks'));
      }
      if (editKamarId === kamar.id) {
        kep.append(buatFormKamarInline({ awalNama: kamar.nama, awalHarga: kamar.harga_umum, idKamar: kamar.id, sebaris: true, onBatal: () => { editKamarId = null; lukisPapan(); } }));
      } else {
        kep.append(info, aksiKamar);
      }
      kotakKamar.append(kep);
      if (tambahBedDiKamarId === kamar.id) {
        kotakKamar.append(buatFormBedInline({ ruangId: kamar.id, onBatal: () => { tambahBedDiKamarId = null; lukisPapan(); } }));
      }
      if (bedsTampil.length) kotakKamar.append(tabelBed(bedsTampil, kamar));
      else if (tambahBedDiKamarId !== kamar.id) {
        const p = el('p', 'Belum ada bed di kamar ini.', { margin: '0', padding: '12px 14px', color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
        kotakKamar.append(p);
      }
      wadah.append(kotakKamar);
    }

    if (!menunggu.length && !adaKamarTampil) {
      const kosong = kartu({ susun: 'sm' });
      kosong.append(redup('Tidak ada kamar, bed, atau pasien yang sesuai filter.'));
      wadah.append(kosong);
    }
  }
  function lukisPapan() {
    if (!papanTerakhir) return;
    isi.replaceChildren();
    const papan = papanTerakhir;
    ringkas.textContent = `${P.ringkasan(papan.ringkasan.total, papan.ringkasan.terisi, papan.ringkasan.kosong)}${papan.menunggu.length ? `, ${papan.menunggu.length} ${D.menunggu.toLowerCase()}` : ''}`;
    if (formTambahKamar) {
      const kBaru = kartu({ style: { padding: '0', overflow: 'hidden' } });
      kBaru.append(buatFormKamarInline({ onBatal: () => { formTambahKamar = false; lukisPapan(); } }));
      isi.append(kBaru);
    }
    if (!papan.bed.length && !papan.menunggu.length && !papan.ruang_tanpa_bed?.length) { const pesan = peringatan(P.kosong, 'biru'); if (boleh('master', 'input')) pesan.append(tombol(P.tambahRuang, () => { formTambahKamar = true; lukisPapan(); }, 'teks')); isi.append(pesan); return; }
    const kamarOpsi = susunKamar(papan).map((k) => k.nama);
    const toolbar = el('div', undefined, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' });
    const wadahKamar = el('div', undefined, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    const fCari = bidang({ id: 'ri-cari', label: 'Cari pasien / kamar / bed', jenis: 'search', nilai: cari, ubah(v) { cari = v; lukisDaftarKamar(wadahKamar); } });
    const fRuang = bidang({ id: 'ri-ruang', label: 'Kamar', nilai: filterRuang, opsi: [{ nilai: '', label: 'Semua kamar' }, ...kamarOpsi.map((r) => ({ nilai: r, label: r }))], ubah(v) { filterRuang = v; lukisDaftarKamar(wadahKamar); } });
    const fStatus = bidang({ id: 'ri-status', label: 'Status', nilai: filterStatus, opsi: [{ nilai: '', label: 'Semua status' }, { nilai: 'menunggu', label: D.menunggu }, { nilai: 'terisi', label: STATUS_BED.label('terisi') }, { nilai: 'kosong', label: STATUS_BED.label('kosong') }, { nilai: 'tidak_operasional', label: STATUS_BED.label('tidak_operasional') }], ubah(v) { filterStatus = v; lukisDaftarKamar(wadahKamar); } });
    toolbar.append(fCari.el, fRuang.el, fStatus.el);
    if (boleh('master', 'input')) toolbar.append(tombol('+ Tambah kamar', () => { formTambahKamar = !formTambahKamar; lukisPapan(); }, 'sekunder'));
    lukisDaftarKamar(wadahKamar);
    isi.append(toolbar, wadahKamar);
  }
  async function muat() {
    if (!boleh('klinis', 'lihat')) return; const saat = ++versi;
    try {
      const papan = await ambilPapan(); if (!aktif || saat !== versi) return; status.replaceChildren(); papanTerakhir = papan; lukisPapan();
    } catch (e) { if (aktif && saat === versi) status.replaceChildren(peringatan(pesanGalat(e, RAWAT_INAP.gagalMuat))); }
  }
  void muat();
  // Halaman ini tidak memakai query; perubahan alamat (mis. kembali dari lapisan modal) tidak membangun ulang halaman dan menutup modalnya.
  halaman.perbaruiAlamat = () => { };
  halaman.tutup = () => { aktif = false; versi++; modal?.tutup?.(); halaman.replaceChildren(); }; return halaman;
}
