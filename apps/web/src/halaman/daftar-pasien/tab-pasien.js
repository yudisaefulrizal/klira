import { dengarAntreanBerubah } from '../../util/panggilan/peristiwa-antrean.js';
import { CARA_PEMBAYARAN, DAFTAR_PASIEN, JENIS_KUNJUNGAN, PROFIL_PASIEN, STATUS_IDENTITAS, STATUS_LAYANAN, STATUS_PERAN_DIAGNOSIS, TAHAP_LAYANAN, aksiAntreanTersedia, statusLayananDari, tanggalWib } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { riwayatKunjungan } from '../../api-klien/klinis.js';
import { bukaKonfirmasi } from '../../komponen/modal-1/modal-1.js';
import { aksiAntrean } from '../../api-klien/kunjungan.js';
import { daftarPasien, detailPasien } from '../../api-klien/pasien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { baris, bidang, kartu, lencana, paginasi, peringatan, sel, tab, tabel, tombol } from '../../komponen/ui/primitif.js';
import { TombolIkonPasien } from '../../komponen/klinis/ikon-pasien.js';
import { bukaEditPasien } from '../../modal/pasien/edit-pasien.js';
import { bukaPanelKeluarga } from '../../modal/pasien/panel-keluarga.js';
import { bukaPendaftaranKunjungan } from '../../modal/pasien/pendaftaran-kunjungan.js';
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format.js';
import { TAHAP_PENYARING, lamaMenunggu, tahapBawaan } from '../../util/penyaring/penyaring-pasien.js';
import { tanggalLengkapSah } from '../../util/tanggal-tiga.js';
import { alamatProfil, keadaanAlamat, kepesertaan, saringRiwayat, umurTahun } from './keadaan-profil-pasien.js';
import { PanelKunjungan } from './panel-kunjungan.js';

const T = PROFIL_PASIEN, UKURAN = 20, BATAS_RIWAYAT = 200;
const buat = (tag, kelas, teks) => { const el = document.createElement(tag); if (kelas) el.className = kelas; if (teks !== undefined) el.textContent = teks; return el; };
const pesanGalat = (e, bawaan) => (e instanceof GalatApi ? e.message : bawaan);

/**
 * Halaman Pasien di Daftar pasien (tab Pasien di header Daftar pasien): identitas di atas, menu kiri (Riwayat dan Pasien: antrean hari itu, atau semua pasien saat mencari),
 * dan catatan kunjungan terpilih (SOAPIE, Resep, Tindakan, Penunjang, Dokumen) di kanan. Pasien, kunjungan, dan tab
 * pendamping tersimpan di alamat halaman.
 */
export function TabPasien({ search, pindah, ganti }) {
    const boleh = izinSaatIni(), bolehRiwayat = boleh('klinis', 'lihat') || boleh('rekam-medis', 'lihat') || boleh('penunjang', 'lihat') || boleh('kasir', 'lihat');
    const el = buat('section', 'halaman-pasien profil-pasien');
    let aktif = true, a = keadaanAlamat(search), versi = 0, timer, modal, panel, ikonAksi = [];
    // Profil
    let pasien = null, riwayat = null, galatPasien = null, galatRiwayat = null, cariRiwayat = '', kotakIdentitas, kotakRiwayat, kotakPanel;
    // Menu kiri: Riwayat kunjungan pasien ini, atau Daftar pasien untuk berpindah ke pasien lain tanpa kembali ke pencarian. Pilihan bertahan antar pasien.
    // Yang memeriksa pasien (izin klinis) bekerja dari antrean: menu itu menjadi bawaannya.
    let menuKiri = boleh('klinis', 'input') ? 'pasien' : 'riwayat', cariKiri = '', halamanKiri = 1, hasilKiri = null, galatKiri = null, memuatKiri = false, versiKiri = 0, timerKiri, isiKiri;
    // Menu Antrean: kunjungan pada satu tanggal (bawaan hari ini) dengan penyaring tahap, nomor antrean, dan tombol Panggil; dimuat ulang berkala.
    let antTanggal = tanggalWib(new Date()), antTahap = tahapBawaan(boleh), antHalaman = 1, antHasil = null, antGalat = null, antMemuat = false, antMemproses = false, antVersi = 0, antIsi, antInterval, antManual = false;

    const tutupModal = () => { modal?.tutup(); modal = undefined; };
    /** Pindah alamat. Bila pindah pasien atau kunjungan sementara isian pemeriksaan belum disimpan, tanya dulu: buang draf atau tetap di sini. */
    let konfirmasiPindah;
    function ke(perubahan, cara = pindah) {
        const tujuan = alamatProfil({ ...a, ...perubahan }), baru = keadaanAlamat(tujuan);
        if (!panel?.adaDraf?.() || (baru.pasien === a.pasien && baru.kunjungan === a.kunjungan)) return cara(tujuan);
        const D = PROFIL_PASIEN.pindahDraf;
        konfirmasiPindah?.tutup();
        konfirmasiPindah = bukaKonfirmasi({ judul: D.judul, pesan: D.pesan, labelYa: D.buang, labelTidak: D.batal,
            onYa() { konfirmasiPindah?.tutup(); konfirmasiPindah = undefined; panel?.buangDraf(); cara(tujuan); },
            onTidak() { konfirmasiPindah?.tutup(); konfirmasiPindah = undefined; } });
    }
    // --- Profil pasien ---
    function bangunProfil() {
        pasien = null; riwayat = null; galatPasien = null; galatRiwayat = null; cariRiwayat = ''; panel?.tutup(); panel = undefined;
        if (!a.pasien) menuKiri = 'pasien';
        kotakIdentitas = kartu({ susun: 'md' }); kotakIdentitas.classList.add('profil-identitas');
        const badan = buat('div', 'profil-badan'); kotakRiwayat = kartu({ susun: 'sm' }); kotakRiwayat.classList.add('profil-riwayat'); kotakPanel = kartu(); kotakPanel.classList.add('profil-kanan');
        badan.append(kotakRiwayat, kotakPanel);
        el.replaceChildren(kotakIdentitas, badan);
        lukisIdentitas(); lukisRiwayat(); pasangPanel(); void muatProfil();
    }
    // Alergi pasien pada kunjungan terpilih (undefined = belum diketahui), dilaporkan panel kunjungan untuk kepala pasien.
    let alergiPasien;
    function lukisIdentitas() {
        if (!kotakIdentitas) return;
        for (const i of ikonAksi) i.tutup?.();
        ikonAksi = [];
        if (!a.pasien) return void kotakIdentitas.replaceChildren(buat('span', 'profil-redup', T.pilihPasien));
        if (galatPasien) return void kotakIdentitas.replaceChildren(peringatan(galatPasien));
        if (!pasien) return void kotakIdentitas.replaceChildren(buat('span', 'profil-redup', T.memuat));
        const I = T.identitas, baris = buat('div', 'profil-identitas-baris'), nama = buat('h2', null, pasien.nama), aksi = buat('div', 'profil-identitas-aksi'), peserta = kepesertaan(pasien), umur = umurTahun(pasien.tanggal_lahir);
        // Satu baris di dalam kartu: tombol kembali, nama, data identitas, lalu tombol aksi berupa ikon di kanan (seperti Registrasi pasien baru dan Daftarkan kunjungan di antrean).
        const ikon = (p) => { const b = TombolIkonPasien(p); ikonAksi.push(b); return b; };
        const ringkas = { id: pasien.id, nama: pasien.nama, nomor_rm: pasien.nomor_rm, jkn_nomor_kartu: pasien.jkn_nomor_kartu ?? null };
        const selesai = () => { tutupModal(); void muatProfil(); };
        if (boleh('kunjungan', 'input')) aksi.append(ikon({ ikon: 'kunjungan-baru', label: T.aksi.daftarkan, varian: 'sekunder', onClick() { tutupModal(); modal = bukaPendaftaranKunjungan({ ...ringkas, pasien: ringkas, onTutup: tutupModal, onSelesai: selesai }); } }));
        if (boleh('pasien', 'perbaikan')) aksi.append(ikon({ ikon: 'edit', label: T.aksi.ubahData, onClick() { tutupModal(); modal = bukaEditPasien({ ...ringkas, pasien: ringkas, onTutup: tutupModal, onSelesai: selesai }); } }));
        aksi.append(ikon({ ikon: 'keluarga', label: T.aksi.keluarga, varian: 'sekunder', onClick() { tutupModal(); modal = bukaPanelKeluarga({ pasienId: pasien.id, nama: pasien.nama, onTutup: tutupModal }); } }));
        const kisi = buat('dl', 'profil-identitas-kisi');
        for (const [label, nilai, kelas] of [
            [I.nomorRm, pasien.nomor_rm], [I.nik, pasien.nik || '-'],
            [I.tanggalLahir, `${tanggalPendek(pasien.tanggal_lahir)}${umur === null ? '' : ` (${T.umur(umur)})`}`],
            [I.telepon, pasien.nomor_hp || '-'], [I.kepesertaan, peserta.rincian ? `${peserta.label} · ${peserta.rincian}` : peserta.label],
            // Alergi dari panel kunjungan (skrining); merah bila ada alergi tercatat.
            ...(alergiPasien === undefined ? [] : [[I.alergi, alergiPasien ?? I.tanpaAlergi, alergiPasien ? 'profil-alergi-ada' : null]]),
        ]) { const item = buat('div'); item.append(buat('dt', null, label), buat('dd', kelas ?? null, nilai)); kisi.append(item); }
        baris.append(nama, ...(pasien.status_identitas === 'sementara' ? [lencana(STATUS_IDENTITAS.label('sementara'), STATUS_IDENTITAS.warna('sementara'))] : []), kisi, aksi);
        kotakIdentitas.replaceChildren(baris);
    }
    function lukisRiwayat() {
        if (!kotakRiwayat) return;
        const R = T.riwayat, fokus = document.activeElement?.id === 'cari-riwayat-pasien', judul = buat('div', 'profil-kotak-kepala');
        const M = T.menuKiri, menu = tab([{ id: 'kiri-riwayat', label: M.riwayat }, { id: 'kiri-pasien', label: M.pasien }], `kiri-${menuKiri}`, M.label, (id) => { menuKiri = a.pasien ? id.replace('kiri-', '') : 'pasien'; lukisRiwayat(); });
        kotakRiwayat.replaceChildren(menu.el);
        if (menuKiri === 'pasien') return void lukisPasienKiri();
        kotakRiwayat.append(judul);
        if (!bolehRiwayat) return void kotakRiwayat.append(peringatan(R.tanpaIzin, 'biru'));
        if (galatRiwayat) return void kotakRiwayat.append(peringatan(galatRiwayat));
        if (!riwayat) return void kotakRiwayat.append(buat('span', 'profil-redup', T.memuat));
        if (!riwayat.length) return void kotakRiwayat.append(buat('span', 'profil-redup', R.kosong));
        const cocok = saringRiwayat(riwayat, cariRiwayat), f = bidang({ id: 'cari-riwayat-pasien', label: R.cari, jenis: 'search', nilai: cariRiwayat, autoComplete: 'off', ubah(v) { cariRiwayat = v; lukisRiwayat(); } });
        f.kontrol.placeholder = R.petunjukCari; judul.append(buat('small', 'profil-redup', R.jumlah(cocok.length, riwayat.length)));
        const daftar = buat('ul', 'profil-riwayat-daftar');
        for (const r of cocok) {
            const li = buat('li'), b = buat('button', 'profil-riwayat-item'), atas = buat('span', 'profil-riwayat-atas'), utama = r.diagnosis.find((d) => d.peran === 'utama') ?? r.diagnosis[0];
            b.type = 'button'; b.setAttribute('aria-current', String(r.id === a.kunjungan)); b.addEventListener('click', () => ke({ kunjungan: r.id }));
            atas.append(buat('strong', null, tanggalWaktuPendek(r.mulai)), lencana(TAHAP_LAYANAN.label(r.tahap_layanan), TAHAP_LAYANAN.warna(r.tahap_layanan)));
            b.append(atas, buat('span', null, r.poli_nama ?? (r.jenis === 'AMB' ? R.tanpaPoli : JENIS_KUNJUNGAN.label(r.jenis))), buat('span', 'profil-redup', r.dpjp_nama ?? R.tanpaDokter));
            if (utama) b.append(buat('span', 'profil-redup', `${utama.kode} ${utama.nama}${utama.peran === 'utama' ? '' : ` (${STATUS_PERAN_DIAGNOSIS.label(utama.peran)})`}`));
            else if (r.keluhan_utama) b.append(buat('span', 'profil-redup', r.keluhan_utama));
            b.append(buat('span', 'profil-redup', CARA_PEMBAYARAN.label(r.cara_pembayaran)));
            li.append(b); daftar.append(li);
        }
        kotakRiwayat.append(f.el, cocok.length ? daftar : buat('span', 'profil-redup', R.tidakCocok));
        if (fokus) { const k = document.getElementById('cari-riwayat-pasien'); k?.focus({ preventScroll: true }); k?.setSelectionRange?.(cariRiwayat.length, cariRiwayat.length); }
    }
    // --- Menu kiri: Pasien (antrean hari itu; mengetik di pencarian mencari semua pasien) ---
    let kontenKiri;
    function lukisPasienKiri() {
        const f = bidang({ id: 'cari-pasien-kiri', label: T.cari, jenis: 'search', nilai: cariKiri, autoComplete: 'off', ubah(v) { clearTimeout(timerKiri); timerKiri = setTimeout(() => { if (!aktif) return; const baru = v.trim(); if (baru === cariKiri) return; cariKiri = baru; halamanKiri = 1; hasilKiri = null; lukisKontenKiri(); }, 300); } });
        f.kontrol.placeholder = T.petunjukCari;
        kontenKiri = buat('div', 'profil-kiri-konten');
        kotakRiwayat.append(f.el, kontenKiri);
        lukisKontenKiri();
    }
    /** Pencarian kosong menampilkan antrean pada tanggal terpilih; pencarian berisi menampilkan hasil dari semua pasien. */
    function lukisKontenKiri() {
        if (!kontenKiri) return;
        if (cariKiri) {
            antIsi = null; isiKiri = buat('div', 'profil-kiri-isi');
            kontenKiri.replaceChildren(isiKiri);
            lukisIsiKiri();
            if (!hasilKiri && !memuatKiri) void muatKiri();
            return;
        }
        isiKiri = null;
        const tgl = bidang({ id: 'antrean-tanggal', label: T.menuKiri.tanggal, jenis: 'date', nilai: antTanggal });
        tgl.kontrol.addEventListener('tanggal-selesai', () => { const v = tgl.kontrol.value; if (!aktif || !tanggalLengkapSah(v) || v === antTanggal) return; antManual = true; antTanggal = v; antHalaman = 1; antHasil = null; lukisIsiAntrean(); void muatAntrean(); });
        antIsi = buat('div', 'profil-kiri-isi');
        kontenKiri.replaceChildren(tgl.el, antIsi);
        lukisIsiAntrean();
        if (!antHasil && !antMemuat) void muatAntrean();
    }
    function lukisIsiAntrean() {
        if (!antIsi || menuKiri !== 'pasien' || cariKiri) return;
        const chips = buat('div', 'profil-chip-baris');
        for (const t of TAHAP_PENYARING) {
            const jumlah = antHasil?.jumlah_tahap ? (t === 'semua' ? Object.values(antHasil.jumlah_tahap).reduce((x, y) => x + y, 0) : antHasil.jumlah_tahap[t] ?? 0) : null;
            const b = tombol(`${DAFTAR_PASIEN.tahap[t]}${jumlah === null ? '' : ` ${jumlah}`}`, () => { antTahap = t; antHalaman = 1; antHasil = null; lukisIsiAntrean(); void muatAntrean(); }, t === antTahap ? 'utama' : 'sekunder');
            b.classList.add('profil-chip'); b.setAttribute('aria-pressed', String(t === antTahap)); chips.append(b);
        }
        if (antGalat) return void antIsi.replaceChildren(chips, peringatan(antGalat));
        if (!antHasil) return void antIsi.replaceChildren(chips, buat('span', 'profil-redup', T.memuat));
        const daftar = buat('ul', 'profil-riwayat-daftar'), sekarang = new Date(), bolehPanggil = boleh('kunjungan', 'perbaikan');
        for (const b of antHasil.data) {
            const kj = b.kunjungan, li = buat('li', 'profil-antrean-baris'), item = buat('button', 'profil-riwayat-item'), atas = buat('span', 'profil-riwayat-atas'), st = kj ? statusLayananDari(kj) : null;
            item.type = 'button'; item.setAttribute('aria-current', String(!!kj && kj.id === a.kunjungan));
            item.addEventListener('click', () => { if (b.id !== a.pasien || (kj && kj.id !== a.kunjungan)) ke({ pasien: b.id, kunjungan: kj?.id ?? null }); });
            atas.append(buat('strong', null, kj?.antrean?.kode ?? DAFTAR_PASIEN.tanpaAntrean), ...(st ? [lencana(STATUS_LAYANAN.label(st), STATUS_LAYANAN.warna(st))] : []));
            item.append(atas, buat('span', null, b.nama));
            if (kj) {
                const tunggu = kj.tahap_layanan !== 'ditutup' && kj.antrean?.status !== 'batal' ? lamaMenunggu(kj.mulai, sekarang) : null;
                item.append(buat('span', 'profil-redup', [kj.poli_nama ?? kj.jenis_poli, kj.dpjp_nama, tunggu ? (tunggu.jam ? DAFTAR_PASIEN.jamMenit(tunggu.jam, tunggu.menit) : DAFTAR_PASIEN.menit(tunggu.menit)) : null].filter(Boolean).join(' · ') || '-'));
            }
            li.append(item);
            const an = kj?.antrean;
            // Dokter memanggil setelah skrining selesai.
            if (bolehPanggil && an && kj.tahap_layanan !== 'menunggu_skrining' && aksiAntreanTersedia(an.status).includes('panggil')) {
                const p = tombol(an.status === 'dipanggil' ? DAFTAR_PASIEN.aksi.panggilUlang : an.status === 'dilewati' ? DAFTAR_PASIEN.aksi.panggilLagi : DAFTAR_PASIEN.aksi.panggil, () => void panggil(an.id), 'sekunder');
                p.classList.add('profil-chip'); p.disabled = antMemproses || !!kj.poli_sibuk; li.append(p);
            }
            // Pasien yang dipanggil tetapi tidak ada dilewati: poli bebas dan pasien bisa dipanggil lagi.
            if (bolehPanggil && an && aksiAntreanTersedia(an.status).includes('lewati')) {
                const l = tombol(DAFTAR_PASIEN.aksi.lewati, () => void panggil(an.id, 'lewati'), 'sekunder');
                l.classList.add('profil-chip'); l.disabled = antMemproses; li.append(l);
            }
            daftar.append(li);
        }
        const p = paginasi(antHalaman, antHasil.total, antHasil.ukuran, (h) => { antHalaman = h; antHasil = null; lukisIsiAntrean(); void muatAntrean(); });
        antIsi.replaceChildren(chips, ...(antHasil.data.length ? [daftar] : [buat('span', 'profil-redup', T.menuKiri.antreanKosong)]), ...(p ? [p] : []));
    }
    async function muatAntrean(diam = false) {
        const saat = ++antVersi; antMemuat = true; if (!diam) antGalat = null;
        try { const h = await daftarPasien({ tanggal: antTanggal, tahap: antTahap, halaman: antHalaman, ukuran: UKURAN }); if (aktif && saat === antVersi) { antHasil = h; antGalat = null; } }
        catch (e) { if (aktif && saat === antVersi && !diam) antGalat = pesanGalat(e, T.gagalDaftar); }
        finally { if (saat === antVersi) antMemuat = false; if (aktif && saat === antVersi) lukisIsiAntrean(); }
    }
    async function panggil(antreanId, aksi = 'panggil') {
        if (antMemproses) return;
        antMemproses = true; lukisIsiAntrean();
        try { await aksiAntrean(antreanId, aksi); antMemproses = false; await muatAntrean(); }
        catch (e) { antGalat = pesanGalat(e, DAFTAR_PASIEN.aksiGagal); antMemproses = false; lukisIsiAntrean(); }
    }
    function lukisIsiKiri() {
        if (!isiKiri || menuKiri !== 'pasien' || !cariKiri) return;
        if (galatKiri) return void isiKiri.replaceChildren(peringatan(galatKiri));
        if (!hasilKiri) return void isiKiri.replaceChildren(buat('span', 'profil-redup', T.memuat));
        const daftar = buat('ul', 'profil-riwayat-daftar');
        for (const b of hasilKiri.data) {
            const li = buat('li'), tombolPasien = buat('button', 'profil-riwayat-item'), atas = buat('span', 'profil-riwayat-atas'), kj = b.kunjungan;
            tombolPasien.type = 'button'; tombolPasien.setAttribute('aria-current', String(b.id === a.pasien));
            tombolPasien.addEventListener('click', () => { if (b.id !== a.pasien) ke({ pasien: b.id, kunjungan: null }); });
            atas.append(buat('strong', null, b.nama), ...(kj ? [lencana(STATUS_LAYANAN.label(statusLayananDari(kj)), STATUS_LAYANAN.warna(statusLayananDari(kj)))] : []));
            tombolPasien.append(atas, buat('span', 'profil-redup', `${b.nomor_rm} · ${DAFTAR_PASIEN.jenisKelaminSingkat[b.jenis_kelamin] ?? '-'}, ${T.umur(b.umur_tahun)}`));
            if (kj) tombolPasien.append(buat('span', 'profil-redup', [kj.poli_nama, kj.dpjp_nama].filter(Boolean).join(' · ') || '-'));
            li.append(tombolPasien); daftar.append(li);
        }
        const p = paginasi(halamanKiri, hasilKiri.total, hasilKiri.ukuran, (h) => { halamanKiri = h; void muatKiri(); });
        isiKiri.replaceChildren(...(hasilKiri.data.length ? [daftar] : [buat('span', 'profil-redup', T.kosong)]), ...(p ? [p] : []));
    }
    async function muatKiri() {
        const saat = ++versiKiri; memuatKiri = true; galatKiri = null;
        try { const h = await daftarPasien({ cari: cariKiri, halaman: halamanKiri, ukuran: UKURAN, semua: true }); if (aktif && saat === versiKiri) hasilKiri = h; }
        catch (e) { if (aktif && saat === versiKiri) galatKiri = pesanGalat(e, T.gagalDaftar); }
        finally { if (saat === versiKiri) memuatKiri = false; if (aktif && saat === versiKiri) lukisIsiKiri(); }
    }
    function pasangPanel() {
        if (!kotakPanel) return;
        panel?.tutup(); panel = undefined;
        const r = riwayat?.find((x) => x.id === a.kunjungan);
        if (!a.pasien) return void kotakPanel.replaceChildren(buat('p', 'profil-redup', T.pilihPasien));
        if (!bolehRiwayat || !pasien || !r) return void kotakPanel.replaceChildren(buat('p', 'profil-redup', bolehRiwayat ? (riwayat && !riwayat.length ? T.riwayat.kosong : riwayat ? T.riwayat.pilih : T.memuat) : T.riwayat.tanpaIzin));
        panel = PanelKunjungan({
            kunjunganId: r.id, pasien, ringkas: r, sub: a.sub,
            onAlergi: (alergi) => { if (alergi !== alergiPasien) { alergiPasien = alergi; lukisIdentitas(); } },
            onSub: (sub) => ganti(alamatProfil({ ...a, sub })),
            // Perubahan di panel kanan (resep, telaah, selesai) menggeser tahap kunjungan: riwayat dan daftar antrean di kiri ikut disegarkan.
            onBerubah: () => { void muatRiwayat(); if (menuKiri === 'pasien' && !cariKiri) void muatAntrean(true); },
        });
        kotakPanel.replaceChildren(panel);
    }
    /** Menu Antrean mengikuti tanggal kunjungan yang dibuka (kecuali tanggalnya sudah diubah manual), supaya pasien itu dan rekannya pada hari yang sama terlihat. */
    function ikutiTanggalKunjungan() {
        const r = riwayat?.find((x) => x.id === a.kunjungan);
        if (!r || antManual) return;
        const t = tanggalWib(new Date(r.mulai));
        if (t === antTanggal) return;
        antTanggal = t; antHasil = null;
        if (menuKiri === 'pasien' && !cariKiri) { lukisRiwayat(); void muatAntrean(); }
    }
    async function muatRiwayat() {
        if (!bolehRiwayat) return;
        const saat = versi, id = a.pasien;
        try { const d = await riwayatKunjungan(id, null, BATAS_RIWAYAT); if (!aktif || saat !== versi) return false; riwayat = d; galatRiwayat = null; }
        catch (e) { if (!aktif || saat !== versi) return false; galatRiwayat = pesanGalat(e, T.riwayat.gagal); }
        lukisRiwayat(); lukisIdentitas();
        return true;
    }
    async function muatProfil() {
        const saat = ++versi, id = a.pasien;
        if (!id) return;
        const [p, r] = await Promise.all([detailPasien(id).catch((e) => ({ galat: pesanGalat(e, T.gagalPasien) })), muatRiwayat()]);
        if (!aktif || saat !== versi) return;
        if (p.galat) galatPasien = p.galat; else { pasien = p; galatPasien = null; }
        lukisIdentitas();
        if (r === false) return;
        // Tanpa kunjungan di alamat (atau kunjungan bukan milik pasien ini): buka kunjungan terbaru.
        if (riwayat?.length && !riwayat.some((x) => x.id === a.kunjungan)) return void ganti(alamatProfil({ ...a, kunjungan: riwayat[0].id }));
        ikutiTanggalKunjungan();
        if (!panel) pasangPanel();
    }

    function bangun() { clearTimeout(timer); tutupModal(); panel?.tutup(); panel = undefined; kotakIdentitas = kotakRiwayat = kotakPanel = undefined; versi++; bangunProfil(); }
    el.jenisTab = 'pasien';
    el.perbaruiAlamat = (baru) => {
        const lama = a; a = keadaanAlamat(baru);
        if (a.pasien !== lama.pasien) return bangun();
        if (a.kunjungan !== lama.kunjungan) { ikutiTanggalKunjungan(); lukisRiwayat(); pasangPanel(); }
        else if (a.sub !== lama.sub) panel?.pilihSub(a.sub);
    };
    el.tutup = () => { konfirmasiPindah?.tutup(); aktif = false; versi++; versiKiri++; antVersi++; clearTimeout(timer); clearTimeout(timerKiri); clearInterval(antInterval); lepasSinyal?.(); tutupModal(); panel?.tutup(); for (const i of ikonAksi) i.tutup?.(); };
    // Antrean dimuat ulang berkala selama menunya terbuka dan tidak ada modal: pendaftaran dari Mobile JKN masuk tanpa tindakan petugas.
    const bolehMuatAntrean = () => aktif && menuKiri === 'pasien' && !cariKiri && !modal && !document.hidden;
    // Sinyal WebSocket dari server memuat antrean seketika; pemuatan berkala (60 detik) jaring pengaman bila sambungan putus.
    antInterval = setInterval(() => { if (bolehMuatAntrean()) void muatAntrean(true); }, 60000);
    const lepasSinyal = dengarAntreanBerubah(() => { if (bolehMuatAntrean()) void muatAntrean(true); });
    bangun();
    return el;
}
