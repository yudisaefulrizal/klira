import { CARA_PEMBAYARAN, KUNJUNGAN, RAWAT_INAP, TOMBOL } from '@klira/shared';
import { admisiRawatInap, ambilAsalAdmisi, ambilOpsiRawatInap } from '../../api-klien/rawat-inap.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { PemilihPasien } from '../../komponen/pencarian/pemilih-pasien.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { awalAdmisi, bentukAdmisi, galatAdmisi, isiSpriAsal } from './keadaan-rawat-inap.js';
import { KeteranganAsuransi } from '../pasien/keterangan-asuransi.js';

export function bukaAdmisiRawatInap({ bedId, ruangNama, tarifId, onTutup, onSelesai }) {
  const A = RAWAT_INAP.admisi;
  const awal = { ...awalAdmisi(), ...(bedId ? { bed_id: String(bedId) } : {}), ...(tarifId ? { tarif_id: String(tarifId) } : {}) };
  let k = { ...awal }, pasienLabel = '', opsi = null, asal = null, dicoba = false, proses = false, hasil = false, aktif = true, versiAsal = 0, enfants = [], ruangPilih = ruangNama ?? '';
  const controls = new Map();

  function bersihAnak() { for (const el of enfants) el.tutup?.(); enfants = []; }
  function tutup() { aktif = false; versiAsal++; bersihAnak(); modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  const modal = bukaModal1({
    judul: A.judul,
    lebar: 'modalBesar',
    onTutup: tutup,
    lindungiTutup: () => !hasil && k.pasien_id !== null && adaPerubahan(awal, k),
  });

  const status = document.createElement('div'), form = document.createElement('form');
  form.noValidate = true;
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const simpan = tombol(A.simpan, kirim);
  simpan.disabled = true;
  modal.isi.append(status, form);
  modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan);

  function erreurs() {
    const g = galatAdmisi(k);
    if (asal?.rawat_inap_id) g.pasien_id = A.sudahInap;
    else if (asal?.ada_pembayaran) g.pasien_id = A.adaPembayaran;
    return g;
  }
  function caraBayar() { return asal?.asal?.cara_pembayaran ?? k.cara_pembayaran; }
  function petit(teks) { const el = document.createElement('small'); el.textContent = teks; el.style.color = token.warna.teksRedup; return el; }
  function perbarui() {
    const g = erreurs();
    for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined);
    simpan.disabled = proses || !opsi;
    simpan.textContent = proses ? A.menyimpan : A.simpan;
  }
  function champ(wadah, nama, label, choix, jenis = 'text', maxLength, redessiner = false) {
    const f = bidang({
      id: `adm-${nama}`, label, opsi: choix, jenis, maxLength, nilai: k[nama], autoComplete: 'off',
      ubah(v) { k = { ...k, [nama]: v }; if (redessiner) lukis(); else perbarui(); },
    });
    controls.set(nama, f);
    f.setGalat(dicoba ? erreurs()[nama] : undefined);
    wadah.append(f.el);
  }
    async function pasienDipilih(id, p) {
      const saat = ++versiAsal;
      pasienLabel = p ? `${p.nama} (${p.nomor_rm})` : '';
      k = { ...k, pasien_id: id }; asal = null; lukis();
      if (id === null) return;
      try {
        const a = await ambilAsalAdmisi(id);
        if (!aktif || saat !== versiAsal) return;
        asal = a; k = isiSpriAsal(k, a.asal?.spri ?? null); lukis();
      } catch { if (aktif && saat === versiAsal) { asal = null; lukis(); } }
    }

    function lukis() {
      if (!aktif || hasil) return;
      bersihAnak(); controls.clear(); form.replaceChildren();

      const pemilih = PemilihPasien({ id: 'adm-pasien', pasienId: k.pasien_id, pasienLabel, onPilih: pasienDipilih, galat: dicoba ? erreurs().pasien_id : undefined });
      enfants.push(pemilih); form.append(pemilih);
      if (k.pasien_id !== null && !asal) form.append(petit(A.cekAsal));
      if (asal?.asal) form.append(peringatan(A.asalInfo(asal.asal.poli_nama), 'biru'));
      if (asal && !asal.asal && !asal.rawat_inap_id) form.append(petit(A.tanpaAsal));
      if (!asal?.asal && k.pasien_id !== null) champ(form, 'cara_pembayaran', KUNJUNGAN.caraBayar, CARA_PEMBAYARAN.opsi, 'text', undefined, true);
      if (k.pasien_id !== null && caraBayar() === 'asuransi') {
        const ket = KeteranganAsuransi({ pasienId: k.pasien_id });
        enfants.push(ket); form.append(ket);
      }

      const barisRuang = document.createElement('div');
      Object.assign(barisRuang.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: token.jarak.md });
      const semuaBed = opsi?.bed_kosong ?? [];
      const ruangOpsi = [...new Set(semuaBed.map((b) => b.ruang_nama).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      const bedTersaring = semuaBed.filter((b) => !ruangPilih || b.ruang_nama === ruangPilih);
      if (ruangOpsi.length) {
        barisRuang.append(bidang({
          id: 'adm-ruang', label: 'Kamar / Ruang', nilai: ruangPilih,
          opsi: [{ nilai: '', label: 'Semua kamar' }, ...ruangOpsi.map((r) => ({ nilai: r, label: r }))],
          ubah(v) {
            ruangPilih = v;
            const cocok = semuaBed.filter((b) => !v || b.ruang_nama === v);
            const bedBaru = v && cocok.length ? (cocok.some((b) => String(b.id) === k.bed_id) ? k.bed_id : String(cocok[0].id)) : (cocok.some((b) => String(b.id) === k.bed_id) ? k.bed_id : '');
            const objBed = semuaBed.find((b) => String(b.id) === bedBaru) ?? (v ? cocok[0] : null);
            k = { ...k, bed_id: bedBaru, ...(objBed?.ruang_tarif_id ? { tarif_id: String(objBed.ruang_tarif_id) } : !bedBaru ? { tarif_id: '' } : {}) };
            lukis();
          },
        }).el);
      }
      const opsiBed = [
        ...(!bedId && !ruangPilih ? [{ nilai: '', label: semuaBed.length ? A.bedMenunggu : 'Belum ada bed kosong (masuk daftar tunggu)' }] : []),
        ...bedTersaring.map((b) => ({ nilai: String(b.id), label: ruangPilih || !b.ruang_nama ? b.nama : `${b.ruang_nama} · ${b.nama}` })),
      ];
      const fBed = bidang({
        id: 'adm-bed_id', label: A.bed,
        opsi: opsiBed,
        nilai: k.bed_id,
        ubah(v) {
          const objBed = semuaBed.find((b) => String(b.id) === v);
          k = { ...k, bed_id: v, ...(objBed?.ruang_tarif_id ? { tarif_id: String(objBed.ruang_tarif_id) } : !v ? { tarif_id: '' } : {}) };
          lukis();
        },
      });
      controls.set('bed_id', fBed); fBed.setGalat(dicoba ? erreurs().bed_id : undefined); barisRuang.append(fBed.el);
      form.append(barisRuang);
      const bedTerpilih = semuaBed.find((b) => String(b.id) === k.bed_id);
      if (bedTerpilih) {
        form.append(petit(bedTerpilih.ruang_harga_umum != null
          ? `Harga kamar: Rp ${Number(bedTerpilih.ruang_harga_umum).toLocaleString('id-ID')} / hari`
          : 'Kamar ini belum memiliki harga bawaan.'));
      }

      champ(form, 'dpjp_id', A.dpjpUtama, [{ nilai: '', label: A.pilihDpjp }, ...(opsi?.dpjp ?? []).map((d) => ({ nilai: String(d.id), label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}` }))], 'text', undefined, true);
      const rekanOpsi = (opsi?.dpjp ?? []).filter((d) => String(d.id) !== k.dpjp_id);
      if (rekanOpsi.length) {
        const group = document.createElement('div'), h = document.createElement('strong');
        group.setAttribute('role', 'group'); group.setAttribute('aria-label', A.dpjpBersama);
        Object.assign(group.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs });
        h.textContent = A.dpjpBersama; group.append(h);
        for (const d of rekanOpsi) {
          group.append(KotakCentang({
            id: `adm-bersama-${d.id}`, label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}`, checked: k.dpjp_bersama.includes(String(d.id)),
            onChange(e) { k = { ...k, dpjp_bersama: e.target.checked ? [...k.dpjp_bersama, String(d.id)] : k.dpjp_bersama.filter((x) => x !== String(d.id)) }; lukis(); },
          }));
        }
        if (dicoba && erreurs().dpjp_bersama) group.append(peringatan(erreurs().dpjp_bersama));
        form.append(group);
      }

      const barisCatatan = document.createElement('div');
      Object.assign(barisCatatan.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: token.jarak.md });
      champ(barisCatatan, 'spri', `${A.spri} (opsional)`);
      champ(barisCatatan, 'keluhan_singkat', `${A.keluhan} (opsional)`, undefined, 'text', 500);
      form.append(barisCatatan);

      perbarui();
    }

    async function kirim() {
      dicoba = true; perbarui();
      if (proses || !opsi || Object.keys(erreurs()).length) return;
      proses = true; status.replaceChildren(); perbarui();
      try {
        const h = await admisiRawatInap(bentukAdmisi(k));
        if (!aktif) return;
        hasil = true; bersihAnak();
        modal.isi.replaceChildren(peringatan(A.hasilPesan(h.menunggu_ruangan), 'hijau'));
        modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup));
        modal.setLebar('modalKecil');
      } catch (e) {
        if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : A.gagal));
      } finally {
        proses = false;
        if (aktif && !hasil) perbarui();
      }
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); void kirim(); });
    lukis(); modal.fokus();
    ambilOpsiRawatInap().then((o) => {
      if (!aktif) return;
      opsi = o;
      if (bedId && !k.tarif_id) {
        const b = o.bed_kosong?.find((x) => String(x.id) === String(bedId));
        if (b?.ruang_tarif_id) { k = { ...k, tarif_id: String(b.ruang_tarif_id) }; awal.tarif_id = k.tarif_id; }
      }
      lukis();
    }).catch((e) => { if (aktif) { status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : A.gagal)); perbarui(); } });

    return { tutup() { aktif = false; versiAsal++; bersihAnak(); modal.tutup(); } };
  }
