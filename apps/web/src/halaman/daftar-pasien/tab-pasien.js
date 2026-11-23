import { dengarAntreanBerubah } from '../../util/panggilan/peristiwa-antrean.js';
import { CARA_PEMBAYARAN, DAFTAR_PASIEN, JENIS_KUNJUNGAN, PROFIL_PASIEN, RAWAT_INAP, STATUS_IDENTITAS, STATUS_LAYANAN, STATUS_PERAN_DIAGNOSIS, TAHAP_LAYANAN, aksiAntreanTersedia, statusLayananDari, tanggalWib } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { riwayatKunjungan } from '../../api-klien/klinis.js';
import { bukaKonfirmasi } from '../../komponen/modal-1/modal-1.js';
import { aksiAntrean } from '../../api-klien/kunjungan.js';
import { daftarPasien, detailPasien } from '../../api-klien/pasien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { baris, bidang, kartu, lencana, peringatan, sel, tab, tabel, tombol } from '../../komponen/ui/primitif.js';
import { TombolIkonPasien } from '../../komponen/klinis/ikon-pasien.js';
import { bukaEditPasien } from '../../modal/pasien/edit-pasien.js';
import { bukaPanelKeluarga } from '../../modal/pasien/panel-keluarga.js';
import { bukaPendaftaranKunjungan } from '../../modal/pasien/pendaftaran-kunjungan.js';
import { bukaAdmisiRawatInap } from '../../modal/rawat-inap/admisi-rawat-inap.js';
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format.js';
import { TAHAP_PENYARING, lamaMenunggu, tahapBawaan } from '../../util/penyaring/penyaring-pasien.js';
import { tanggalLengkapSah } from '../../util/tanggal-tiga.js';
import { alamatProfil, keadaanAlamat, kepesertaan, saringRiwayat, umurTahun } from './keadaan-profil-pasien.js';
import { PanelKunjungan } from './panel-kunjungan.js';
import { TabelHistoriRawatJalan } from './histori-rawat-jalan.js';

const T = PROFIL_PASIEN, UKURAN = 20, BATAS_RIWAYAT = 200;
const buat = (tag, kelas, teks) => { const el = document.createElement(tag); if (kelas) el.className = kelas; if (teks !== undefined) el.textContent = teks; return el; };
const pesanGalat = (e, bawaan) => (e instanceof GalatApi ? e.message : bawaan);
const picuMasuk = (el) => { if (!el) return; el.classList.remove('profil-masuk'); void el.offsetWidth; el.classList.add('profil-masuk'); };

/**
 * Halaman Pasien di Daftar pasien (tab Pasien di header Daftar pasien): identitas di atas, menu kiri (Riwayat dan Pasien: antrean hari itu, atau semua pasien saat mencari),
 * dan catatan kunjungan terpilih (SOAPIE, Resep, Tindakan, Penunjang, Dokumen) di kanan. Pasien, kunjungan, dan tab
 * pendamping tersimpan di alamat halaman.
 */
export function TabPasien({ search, pindah, ganti }) {
    const boleh = izinSaatIni(), bolehRiwayat = boleh('klinis', 'lihat') || boleh('rekam-medis', 'lihat') || boleh('penunjang', 'lihat') || boleh('kasir', 'lihat');
    const el = buat('section', 'halaman-pasien profil-pasien');
    let aktif = true, a = keadaanAlamat(search), versi = 0, timer, modal, panel, ikonAksi = [], ikonChip = [];
    // Profil
    let pasien = null, riwayat = null, galatPasien = null, galatRiwayat = null, cariRiwayat = '', kotakIdentitas, kotakRiwayat, kotakPanel, kotakHistori, historiRj = null, historiKunci = '', subAktif;
    const cachePasien = new Map(), cacheRiwayat = new Map();
    const bolehHistori = boleh('klinis', 'lihat') || boleh('rekam-medis', 'lihat');
    // Menu kiri: Riwayat kunjungan pasien ini, atau Daftar pasien untuk berpindah ke pasien lain tanpa kembali ke pencarian. Pilihan bertahan antar pasien.
    // Yang memeriksa pasien (izin klinis) bekerja dari antrean: menu itu menjadi bawaannya.
    let menuKiri = boleh('klinis', 'input') ? 'pasien' : 'riwayat', cariKiri = '', halamanKiri = 1, hasilKiri = null, galatKiri = null, memuatKiri = false, versiKiri = 0, timerKiri, isiKiri;
    // Menu Antrean: kunjungan pada satu tanggal (bawaan hari ini) dengan penyaring tahap, nomor antrean, dan tombol Panggil; dimuat ulang berkala.
    let antTanggal = tanggalWib(new Date()), antTahap = tahapBawaan(boleh), antHalaman = 1, antHasil = null, antGalat = null, antMemuat = false, antMemuatTambah = false, antMemproses = false, antVersi = 0, antIsi, antInterval, antManual = false, antHabis = false;
    let scrollRiwayat = 0, riwayatBatas = 10, scrollAnt = 0, scrollKiri = 0, memuatKiriTambah = false, kiriHabis = false;

    function pasangInfiniteScroll(daftar, _wadahDaftar, { adaLagi, sedangMemuat, muatLagi, simpanScroll, scrollAwal }) {
        let memulihkan = scrollAwal > 0;
        const pulihkan = () => {
            sesuaikanTinggiPanel();
            requestAnimationFrame(() => {
                if (scrollAwal > 0) daftar.scrollTop = scrollAwal;
                requestAnimationFrame(() => { memulihkan = false; });
            });
        };
        pulihkan();
        daftar.addEventListener('scroll', () => {
            if (memulihkan) return;
            simpanScroll(daftar.scrollTop);
            if (!sedangMemuat() && adaLagi() && daftar.scrollTop + daftar.clientHeight >= daftar.scrollHeight - 48) {
                muatLagi();
            }
        });
        return pulihkan;
    }

    const tutupModal = () => { modal?.tutup(); modal = undefined; };
    /** Pindah alamat. Bila pindah pasien atau kunjungan sementara isian pemeriksaan belum disimpan, tanya dulu: buang draf atau tetap di sini. */
    let konfirmasiPindah;
    function ke(perubahan, cara = pindah) {
        const tujuan = alamatProfil({ ...a, ...perubahan }), baru = keadaanAlamat(tujuan);
        if (!panel?.adaDraf?.() || (baru.pasien === a.pasien && baru.kunjungan === a.kunjungan)) return cara(tujuan);
        const D = PROFIL_PASIEN.pindahDraf;
        konfirmasiPindah?.tutup();
        konfirmasiPindah = bukaKonfirmasi({
            judul: D.judul, pesan: D.pesan, labelYa: D.buang, labelTidak: D.batal,
            onYa() { konfirmasiPindah?.tutup(); konfirmasiPindah = undefined; panel?.buangDraf(); cara(tujuan); },
            onTidak() { konfirmasiPindah?.tutup(); konfirmasiPindah = undefined; }
        });
    }
    // --- Profil pasien ---
    function bangunProfil() {
        pasien = null; riwayat = null; galatPasien = null; galatRiwayat = null; cariRiwayat = ''; panel?.tutup(); panel = undefined;
        if (!a.pasien && menuKiri === 'riwayat') menuKiri = 'pasien';
        kotakIdentitas = kartu({ susun: 'md' }); kotakIdentitas.classList.add('profil-identitas');
        const badan = buat('div', 'profil-badan'); kotakRiwayat = kartu({ susun: 'sm' }); kotakRiwayat.classList.add('profil-riwayat'); kotakPanel = kartu(); kotakPanel.classList.add('profil-kanan');
        // Di bawah panel Riwayat/Pasien dan panel kunjungan: kartu histori pemeriksaan rawat jalan penuh selebar halaman (hanya kunjungan rawat jalan, tab Pemeriksaan).
        kotakHistori = kartu({ susun: 'sm' }); kotakHistori.classList.add('profil-histori'); kotakHistori.style.display = 'none';
        const kolomKanan = buat('div', 'profil-kolom-kanan'); kolomKanan.append(kotakPanel);
        badan.append(kotakRiwayat, kolomKanan);
        el.replaceChildren(kotakIdentitas, badan, kotakHistori);
        pengamatTinggiPanel?.disconnect();
        pengamatTinggiPanel = typeof ResizeObserver === 'function' ? new ResizeObserver(() => sesuaikanTinggiPanel()) : null;
        pengamatTinggiPanel?.observe(kotakPanel);
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
        const ikonRanap = () => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '20');
            svg.setAttribute('height', '20');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '1.8');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            svg.innerHTML = '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>';
            return svg;
        };
        const ringkas = { id: pasien.id, nama: pasien.nama, nomor_rm: pasien.nomor_rm, jkn_nomor_kartu: pasien.jkn_nomor_kartu ?? null };
        const selesai = () => { tutupModal(); void muatProfil(); if (modeAntrean() && !cariKiri) void muatAntrean(true); };
        if (boleh('kunjungan', 'input')) aksi.append(ikon({ ikon: 'kunjungan-baru', label: T.aksi.daftarkan, varian: 'sekunder', onClick() { tutupModal(); modal = bukaPendaftaranKunjungan({ ...ringkas, pasien: ringkas, onTutup: tutupModal, onSelesai: selesai }); } }));
        if (boleh('klinis', 'input')) aksi.append(ikon({ ikonKustom: ikonRanap(), label: RAWAT_INAP.papan.admisi, varian: 'sekunder', onClick() { tutupModal(); modal = bukaAdmisiRawatInap({ pasien: ringkas, onTutup: tutupModal, onSelesai: selesai }); } }));
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
    const modeAntrean = () => menuKiri === 'pasien' || menuKiri === 'pasien_saya';
    function lukisRiwayat() {
        if (!kotakRiwayat) return;
        const R = T.riwayat, fokus = document.activeElement?.id === 'cari-riwayat-pasien', judul = buat('div', 'profil-kotak-kepala');
        const M = T.menuKiri, adalahPraktisi = !!penggunaSaatIni().pengguna?.praktisi;
        const opsiMenu = [
            { id: 'kiri-riwayat', label: M.riwayat },
            { id: 'kiri-pasien', label: M.pasien },
            ...(adalahPraktisi ? [{ id: 'kiri-pasien_saya', label: 'Pasien saya' }] : []),
        ];
        if (menuKiri === 'pasien_saya' && !adalahPraktisi) menuKiri = 'pasien';
        const menu = tab(opsiMenu, `kiri-${menuKiri}`, M.label, (id) => {
            const target = id.replace('kiri-', '');
            if (target !== menuKiri && (target === 'pasien' || target === 'pasien_saya')) {
                antVersi++; antMemuat = false; antMemuatTambah = false; antHasil = null; antHalaman = 1; antHabis = false; antGalat = null; scrollAnt = 0;
            }
            menuKiri = target;
            lukisRiwayat();
        });
        kotakRiwayat.replaceChildren(menu.el);
        if (modeAntrean()) return void lukisPasienKiri();
        kotakRiwayat.append(judul);
        if (!a.pasien) return void kotakRiwayat.append(buat('span', 'profil-redup', T.pilihPasien));
        if (!bolehRiwayat) return void kotakRiwayat.append(peringatan(R.tanpaIzin, 'biru'));
        if (galatRiwayat) return void kotakRiwayat.append(peringatan(galatRiwayat));
        if (!riwayat) return void kotakRiwayat.append(buat('span', 'profil-redup', T.memuat));
        if (!riwayat.length) return void kotakRiwayat.append(buat('span', 'profil-redup', R.kosong));
        const cocok = saringRiwayat(riwayat, cariRiwayat), f = bidang({ id: 'cari-riwayat-pasien', label: R.cari, jenis: 'search', nilai: cariRiwayat, autoComplete: 'off', ubah(v) { cariRiwayat = v; riwayatBatas = 10; scrollRiwayat = 0; lukisRiwayat(); } });
        f.kontrol.placeholder = R.petunjukCari; judul.append(buat('small', 'profil-redup', R.jumlah(cocok.length, riwayat.length)));
        const daftar = buat('ul', 'profil-riwayat-daftar');
        for (const r of cocok.slice(0, riwayatBatas)) {
            const li = buat('li'), b = buat('button', 'profil-riwayat-item'), atas = buat('span', 'profil-riwayat-atas'), utama = r.diagnosis.find((d) => d.peran === 'utama') ?? r.diagnosis[0];
            b.type = 'button'; b.setAttribute('aria-current', String(r.id === a.kunjungan)); b.addEventListener('click', () => ke({ kunjungan: r.id }));
            atas.append(buat('strong', null, tanggalWaktuPendek(r.mulai)), lencana(TAHAP_LAYANAN.label(r.tahap_layanan), TAHAP_LAYANAN.warna(r.tahap_layanan)));
            b.append(atas, ...(r.id_layanan ? [buat('span', 'profil-redup', r.id_layanan)] : []), buat('span', null, r.poli_nama ?? (r.jenis === 'AMB' ? R.tanpaPoli : JENIS_KUNJUNGAN.label(r.jenis))), buat('span', 'profil-redup', r.dpjp_nama ?? R.tanpaDokter));
            if (utama) b.append(buat('span', 'profil-redup', `${utama.kode} ${utama.nama}${utama.peran === 'utama' ? '' : ` (${STATUS_PERAN_DIAGNOSIS.label(utama.peran)})`}`));
            else if (r.keluhan_utama) b.append(buat('span', 'profil-redup', r.keluhan_utama));
            b.append(buat('span', 'profil-redup', CARA_PEMBAYARAN.label(r.cara_pembayaran)));
            li.append(b); daftar.append(li);
        }
        if (riwayatBatas < cocok.length) daftar.append(buat('li', 'profil-redup', T.memuat));
        const pulihkan = pasangInfiniteScroll(daftar, kotakRiwayat, {
            adaLagi: () => riwayatBatas < cocok.length,
            sedangMemuat: () => false,
            muatLagi: () => { riwayatBatas += 10; lukisRiwayat(); },
            simpanScroll: (s) => { scrollRiwayat = s; },
            scrollAwal: scrollRiwayat,
        });
        kotakRiwayat.append(f.el, cocok.length ? daftar : buat('span', 'profil-redup', R.tidakCocok));
        pulihkan();
        if (fokus) { const k = document.getElementById('cari-riwayat-pasien'); k?.focus({ preventScroll: true }); k?.setSelectionRange?.(cariRiwayat.length, cariRiwayat.length); }
    }
    // --- Menu kiri: Pasien (antrean hari itu; mengetik di pencarian mencari semua pasien) ---
    let kontenKiri;
    function lukisPasienKiri() {
        const f = bidang({ id: 'cari-pasien-kiri', label: T.cari, jenis: 'search', nilai: cariKiri, autoComplete: 'off', ubah(v) { clearTimeout(timerKiri); timerKiri = setTimeout(() => { if (!aktif) return; const baru = v.trim(); if (baru === cariKiri || baru.length === 1) return; cariKiri = baru; halamanKiri = 1; hasilKiri = null; lukisKontenKiri(); }, 300); } });
        f.kontrol.placeholder = T.petunjukCari;
        kontenKiri = buat('div', 'profil-kiri-konten');
        kotakRiwayat.append(f.el, kontenKiri);
        lukisKontenKiri();
    }
    /** Pada mode Pasien selalu menampilkan seluruh daftar pasien (dengan atau tanpa pencarian); pada mode Pasien saya menampilkan antrean aktif dokter. */
    function lukisKontenKiri() {
        if (!kontenKiri) return;
        if (menuKiri === 'pasien' || cariKiri) {
            antIsi = null; isiKiri = buat('div', 'profil-kiri-isi');
            kontenKiri.replaceChildren(isiKiri);
            lukisIsiKiri();
            if (!hasilKiri && !memuatKiri) void muatKiri();
            return;
        }
        isiKiri = null;
        antIsi = buat('div', 'profil-kiri-isi');
        kontenKiri.replaceChildren(antIsi);
        lukisIsiAntrean();
        if (!antHasil && !antMemuat) void muatAntrean();
    }
    function lukisIsiAntrean() {
        if (!antIsi || !modeAntrean() || cariKiri) return;
        for (const i of ikonChip) i.tutup?.();
        ikonChip = [];
        const IKON_TAHAP = {
            semua: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
            menunggu_skrining: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 14h2l1.5-3 2 6 1.5-3H17"/>',
            pemeriksaan: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
            resep: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
            kasir: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
            ditutup: '<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>',
            batal: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
            rawat_inap: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
        };
        const svgChip = (isi) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '15');
            svg.setAttribute('height', '15');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '1.9');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            svg.innerHTML = isi;
            return svg;
        };
        const chips = buat('div', 'profil-chip-baris');
        const TAHAP_TOTAL = ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup', 'batal'];
        for (const t of TAHAP_PENYARING) {
            const jumlah = antHasil?.jumlah_tahap ? (t === 'semua' ? TAHAP_TOTAL.reduce((x, k) => x + (antHasil.jumlah_tahap[k] ?? 0), 0) : antHasil.jumlah_tahap[t] ?? 0) : null;
            const angka = jumlah === null ? null : buat('span', null, String(jumlah));
            const b = TombolIkonPasien({
                ikonKustom: svgChip(IKON_TAHAP[t] ?? IKON_TAHAP.semua),
                label: `${DAFTAR_PASIEN.tahap[t]}${jumlah === null ? '' : ` (${jumlah})`}`,
                className: 'profil-chip profil-chip-ikon',
                varian: t === antTahap ? 'utama' : 'sekunder',
                'aria-pressed': String(t === antTahap),
                children: angka,
                onClick: () => { antTahap = t; antHalaman = 1; antHasil = null; antHabis = false; scrollAnt = 0; lukisIsiAntrean(); void muatAntrean(); },
            });
            ikonChip.push(b);
            chips.append(b);
        }
        if (antGalat) return void antIsi.replaceChildren(chips, peringatan(antGalat));
        if (!antHasil) return void antIsi.replaceChildren(chips, buat('span', 'profil-redup', T.memuat));
        const daftar = buat('ul', 'profil-riwayat-daftar'), sekarang = new Date(), bolehPanggil = boleh('kunjungan', 'perbaikan');
        const ikonTombol = (svgIsi, label, disabled, onClick) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'profil-ikon-aksi';
            btn.setAttribute('aria-label', label);
            btn.title = label;
            btn.disabled = disabled;
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgIsi}</svg>`;
            btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
            return btn;
        };
        const IKON_PANGGIL = '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
        const IKON_LEWATI = '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>';
        for (const b of antHasil.data) {
            const kj = b.kunjungan, li = buat('li', 'profil-antrean-baris'), item = buat('div', 'profil-riwayat-item'), atas = buat('span', 'profil-riwayat-atas'), kanan = buat('span', 'profil-riwayat-atas-kanan'), st = kj ? statusLayananDari(kj) : null;
            const bukaItem = () => { if (b.id !== a.pasien || (kj && kj.id !== a.kunjungan)) ke({ pasien: b.id, kunjungan: kj?.id ?? null }); };
            item.setAttribute('role', 'button'); item.tabIndex = 0; item.setAttribute('aria-current', String(!!kj && kj.id === a.kunjungan));
            item.addEventListener('click', bukaItem);
            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bukaItem(); } });
            if (st) kanan.append(lencana(STATUS_LAYANAN.label(st), STATUS_LAYANAN.warna(st)));
            const an = kj?.antrean;
            // Dokter memanggil setelah skrining selesai.
            if (bolehPanggil && an && kj.tahap_layanan !== 'menunggu_skrining' && aksiAntreanTersedia(an.status).includes('panggil')) {
                const labelPanggil = an.status === 'dipanggil' ? DAFTAR_PASIEN.aksi.panggilUlang : an.status === 'dilewati' ? DAFTAR_PASIEN.aksi.panggilLagi : DAFTAR_PASIEN.aksi.panggil;
                kanan.append(ikonTombol(IKON_PANGGIL, labelPanggil, antMemproses || !!kj.poli_sibuk, () => void panggil(an.id)));
            }
            // Pasien yang dipanggil tetapi tidak ada dilewati: poli bebas dan pasien bisa dipanggil lagi.
            if (bolehPanggil && an && aksiAntreanTersedia(an.status).includes('lewati')) {
                kanan.append(ikonTombol(IKON_LEWATI, DAFTAR_PASIEN.aksi.lewati, antMemproses, () => void panggil(an.id, 'lewati')));
            }
            atas.append(buat('strong', null, kj?.antrean?.kode ?? (kj?.jenis === 'IMP' ? T.menuKiri.rawatInap : DAFTAR_PASIEN.tanpaAntrean)), kanan);
            item.append(atas, buat('span', null, b.nama));
            if (kj) {
                const tunggu = kj.tahap_layanan !== 'ditutup' && kj.antrean?.status !== 'batal' ? lamaMenunggu(kj.mulai, sekarang) : null;
                item.append(buat('span', 'profil-redup', [kj.id_layanan, kj.poli_nama ?? kj.jenis_poli, kj.dpjp_nama, tunggu ? (tunggu.jam ? DAFTAR_PASIEN.jamMenit(tunggu.jam, tunggu.menit) : DAFTAR_PASIEN.menit(tunggu.menit)) : null].filter(Boolean).join(' · ') || '-'));
            }
            li.append(item);
            daftar.append(li);
        }
        if (antMemuatTambah) daftar.append(buat('li', 'profil-redup', T.memuat));
        const pulihkan = pasangInfiniteScroll(daftar, antIsi, {
            adaLagi: () => !antHabis && antHasil.data.length < antHasil.total,
            sedangMemuat: () => antMemuat || antMemuatTambah,
            muatLagi: () => void muatAntrean(false, true),
            simpanScroll: (s) => { scrollAnt = s; },
            scrollAwal: scrollAnt,
        });
        antIsi.replaceChildren(chips, ...(antHasil.data.length ? [daftar] : [buat('span', 'profil-redup', T.menuKiri.antreanKosong)]));
        pulihkan();
    }
    async function muatAntrean(diam = false, tambah = false) {
        if (tambah && (antMemuat || antMemuatTambah || antHabis || !antHasil || antHasil.data.length >= antHasil.total)) return;
        const saat = ++antVersi;
        if (tambah) antMemuatTambah = true; else antMemuat = true;
        if (!diam && !tambah) antGalat = null;
        if (tambah) lukisIsiAntrean();
        try {
            const halaman = tambah ? antHalaman + 1 : 1;
            const ukuran = tambah ? UKURAN : Math.min(100, antHalaman * UKURAN);
            const h = await daftarPasien({ tahap: antTahap, pasien_saya: menuKiri === 'pasien_saya' ? 'true' : undefined, halaman, ukuran });
            if (aktif && saat === antVersi) {
                if (tambah && antHasil) {
                    const sudah = new Set(antHasil.data.map((x) => x.id));
                    const baru = h.data.filter((x) => !sudah.has(x.id));
                    antHasil = { ...h, data: [...antHasil.data, ...baru] };
                    antHalaman = halaman;
                    if (!baru.length || h.data.length < UKURAN) antHabis = true;
                } else {
                    antHasil = h;
                    antHabis = h.data.length >= h.total;
                }
                antGalat = null;
            }
        }
        catch (e) { if (aktif && saat === antVersi && !diam && !tambah) antGalat = pesanGalat(e, T.gagalDaftar); }
        finally {
            if (saat === antVersi) { antMemuat = false; antMemuatTambah = false; }
            if (aktif && saat === antVersi) lukisIsiAntrean();
        }
    }
    async function panggil(antreanId, aksi = 'panggil') {
        if (antMemproses) return;
        antMemproses = true; lukisIsiAntrean();
        try { await aksiAntrean(antreanId, aksi); antMemproses = false; await muatAntrean(); }
        catch (e) { antGalat = pesanGalat(e, DAFTAR_PASIEN.aksiGagal); antMemproses = false; lukisIsiAntrean(); }
    }
    function lukisIsiKiri() {
        if (!isiKiri || !modeAntrean()) return;
        if (galatKiri) return void isiKiri.replaceChildren(peringatan(galatKiri));
        if (!hasilKiri) return void isiKiri.replaceChildren(buat('span', 'profil-redup', T.memuat));
        const daftar = buat('ul', 'profil-riwayat-daftar');
        for (const b of hasilKiri.data) {
            const li = buat('li'), tombolPasien = buat('button', 'profil-riwayat-item'), atas = buat('span', 'profil-riwayat-atas'), kj = b.kunjungan;
            const aktifKj = kj && kj.tahap_layanan !== 'ditutup' && kj.antrean?.status !== 'batal' ? kj : null;
            tombolPasien.type = 'button'; tombolPasien.dataset.pasienId = String(b.id); tombolPasien.setAttribute('aria-current', String(b.id === a.pasien));
            tombolPasien.addEventListener('click', () => { if (b.id !== a.pasien) ke({ pasien: b.id, kunjungan: null }); });
            if (aktifKj?.antrean?.kode) {
                const antEl = lencana(aktifKj.antrean.kode, 'biru');
                antEl.style.fontWeight = '700';
                atas.append(antEl, lencana(STATUS_LAYANAN.label(statusLayananDari(aktifKj)), STATUS_LAYANAN.warna(statusLayananDari(aktifKj))));
                tombolPasien.append(atas, buat('strong', null, b.nama));
            }
            else {
                atas.append(buat('strong', null, b.nama), ...(aktifKj ? [lencana(STATUS_LAYANAN.label(statusLayananDari(aktifKj)), STATUS_LAYANAN.warna(statusLayananDari(aktifKj)))] : []));
                tombolPasien.append(atas);
            }
            tombolPasien.append(buat('span', 'profil-redup', `${b.nomor_rm} · ${DAFTAR_PASIEN.jenisKelaminSingkat[b.jenis_kelamin] ?? '-'}, ${T.umur(b.umur_tahun)}`));
            if (aktifKj) tombolPasien.append(buat('span', 'profil-redup', [aktifKj.id_layanan, aktifKj.poli_nama, aktifKj.dpjp_nama].filter(Boolean).join(' · ') || '-'));
            li.append(tombolPasien); daftar.append(li);
        }
        if (memuatKiriTambah) daftar.append(buat('li', 'profil-redup', T.memuat));
        const pulihkan = pasangInfiniteScroll(daftar, isiKiri, {
            adaLagi: () => !kiriHabis && hasilKiri.data.length < hasilKiri.total,
            sedangMemuat: () => memuatKiri || memuatKiriTambah,
            muatLagi: () => void muatKiri(true),
            simpanScroll: (s) => { scrollKiri = s; },
            scrollAwal: scrollKiri,
        });
        isiKiri.replaceChildren(...(hasilKiri.data.length ? [daftar] : [buat('span', 'profil-redup', T.kosong)]));
        pulihkan();
    }
    async function muatKiri(tambah = false) {
        if (tambah && (memuatKiri || memuatKiriTambah || kiriHabis || !hasilKiri || hasilKiri.data.length >= hasilKiri.total)) return;
        const saat = ++versiKiri;
        if (tambah) memuatKiriTambah = true; else memuatKiri = true;
        if (!tambah) { galatKiri = null; kiriHabis = false; }
        if (tambah) lukisIsiKiri();
        try {
            const halaman = tambah ? halamanKiri + 1 : 1;
            const h = await daftarPasien({ cari: cariKiri, halaman, ukuran: UKURAN, semua: true });
            if (aktif && saat === versiKiri) {
                if (tambah && hasilKiri) {
                    const sudah = new Set(hasilKiri.data.map((x) => x.id));
                    const baru = h.data.filter((x) => !sudah.has(x.id));
                    hasilKiri = { ...h, data: [...hasilKiri.data, ...baru] };
                    halamanKiri = halaman;
                    if (!baru.length || h.data.length < UKURAN) kiriHabis = true;
                } else {
                    hasilKiri = h;
                    kiriHabis = h.data.length >= h.total;
                }
            }
        }
        catch (e) { if (aktif && saat === versiKiri && !tambah) galatKiri = pesanGalat(e, T.gagalDaftar); }
        finally {
            if (saat === versiKiri) { memuatKiri = false; memuatKiriTambah = false; }
            if (aktif && saat === versiKiri) lukisIsiKiri();
        }
    }
    let pengamatTinggiPanel;
    const TINGGI_MIN_KIRI = 560;
    function sesuaikanTinggiPanel() {
        if (!aktif || !kotakRiwayat || !kotakPanel) return;
        if (window.innerWidth <= 900) { kotakRiwayat.style.minHeight = ''; kotakRiwayat.style.height = ''; kotakRiwayat.style.maxHeight = ''; return; }
        requestAnimationFrame(() => {
            if (!aktif || !kotakRiwayat || !kotakPanel) return;
            const tinggi = Math.max(TINGGI_MIN_KIRI, kotakPanel.offsetHeight);
            kotakRiwayat.style.minHeight = `${TINGGI_MIN_KIRI}px`;
            kotakRiwayat.style.height = `${tinggi}px`;
            kotakRiwayat.style.maxHeight = `${tinggi}px`;
        });
    }

    function bersihkanHistori() {
        historiRj?.tutup(); historiRj = null; historiKunci = '';
        if (kotakHistori) { kotakHistori.replaceChildren(); kotakHistori.style.display = 'none'; }
    }
    /** Kartu histori tampil hanya untuk kunjungan rawat jalan yang tab aktifnya Pemeriksaan; dimuat sekali per pasien dan kunjungan. */
    function perbaruiHistori(r) {
        if (!kotakHistori) return;
        if (!bolehHistori || !pasien || !r || r.jenis !== 'AMB' || subAktif !== 'pemeriksaan') { kotakHistori.style.display = 'none'; return; }
        const kunci = `${pasien.id}:${r.id}`;
        if (historiKunci !== kunci) { historiRj?.tutup(); historiRj = TabelHistoriRawatJalan({ pasienId: pasien.id, kunjunganId: r.id, onPilih: (id) => { if (id !== a.kunjungan) ke({ kunjungan: id }); } }); historiKunci = kunci; kotakHistori.replaceChildren(historiRj); }
        kotakHistori.style.display = '';
    }
    function pasangPanel() {
        if (!kotakPanel) return;
        panel?.tutup(); panel = undefined;
        const r = riwayat?.find((x) => x.id === a.kunjungan);
        subAktif = a.sub;
        if (historiKunci && historiKunci !== `${pasien?.id}:${r?.id}`) bersihkanHistori();
        if (!a.pasien) { kotakPanel.replaceChildren(buat('p', 'profil-redup', T.pilihPasien)); sesuaikanTinggiPanel(); return; }
        if (!bolehRiwayat || !pasien || !r) { kotakPanel.replaceChildren(buat('p', 'profil-redup', bolehRiwayat ? (riwayat && !riwayat.length ? T.riwayat.kosong : riwayat ? T.riwayat.pilih : T.memuat) : T.riwayat.tanpaIzin)); sesuaikanTinggiPanel(); return; }
        panel = PanelKunjungan({
            kunjunganId: r.id, pasien, ringkas: r, sub: a.sub,
            onAlergi: (alergi) => { if (alergi !== alergiPasien) { alergiPasien = alergi; lukisIdentitas(); } },
            onSub: (sub) => { subAktif = sub; perbaruiHistori(r); ganti(alamatProfil({ ...a, sub })); },
            // Perubahan di panel kanan (resep, telaah, selesai) menggeser tahap kunjungan: riwayat dan daftar antrean di kiri ikut disegarkan.
            onBerubah: () => { void muatRiwayat(); if (menuKiri === 'pasien') void muatKiri(); else if (modeAntrean() && !cariKiri) void muatAntrean(true); },
        });
        kotakPanel.replaceChildren(panel);
        perbaruiHistori(r);
        sesuaikanTinggiPanel();
    }
    /** Menu Antrean mengikuti tanggal kunjungan yang dibuka (kecuali tanggalnya sudah diubah manual), supaya pasien itu dan rekannya pada hari yang sama terlihat. */
    function ikutiTanggalKunjungan() {
        const r = riwayat?.find((x) => x.id === a.kunjungan);
        if (!r || antManual) return;
        const t = tanggalWib(new Date(r.mulai));
        if (t === antTanggal) return;
        antTanggal = t; antHasil = null;
        if (menuKiri === 'pasien_saya' && !cariKiri) { lukisRiwayat(); void muatAntrean(); }
    }
    function perbaruiSorotanKiri() {
        if (!isiKiri) return;
        for (const t of isiKiri.querySelectorAll('.profil-riwayat-item[data-pasien-id]')) {
            t.setAttribute('aria-current', String(Number(t.dataset.pasienId) === a.pasien));
        }
    }
    async function muatRiwayat() {
        if (!bolehRiwayat) return;
        const saat = versi, id = a.pasien;
        try { const d = await riwayatKunjungan(id, null, BATAS_RIWAYAT); if (!aktif || saat !== versi) return false; riwayat = d; cacheRiwayat.set(id, d); galatRiwayat = null; }
        catch (e) { if (!aktif || saat !== versi) return false; galatRiwayat = pesanGalat(e, T.riwayat.gagal); }
        if (menuKiri === 'riwayat') lukisRiwayat();
        lukisIdentitas();
        return true;
    }
    async function muatProfil() {
        const saat = ++versi, id = a.pasien;
        if (!id) return;
        const sudahAdaIdentitas = !!pasien && pasien.id === id;
        const [p, r] = await Promise.all([detailPasien(id).catch((e) => ({ galat: pesanGalat(e, T.gagalPasien) })), muatRiwayat()]);
        if (!aktif || saat !== versi) return;
        if (p.galat) galatPasien = p.galat; else { pasien = p; cachePasien.set(id, p); galatPasien = null; }
        kotakIdentitas?.classList.remove('profil-memuat-halus');
        lukisIdentitas();
        if (!sudahAdaIdentitas) picuMasuk(kotakIdentitas);
        if (r === false) { kotakPanel?.classList.remove('profil-memuat-halus'); return; }
        // Tanpa kunjungan di alamat (atau kunjungan bukan milik pasien ini): buka kunjungan terbaru.
        if (riwayat?.length && !riwayat.some((x) => x.id === a.kunjungan)) return void ganti(alamatProfil({ ...a, kunjungan: riwayat[0].id }));
        ikutiTanggalKunjungan();
        kotakPanel?.classList.remove('profil-memuat-halus');
        if (!panel) { pasangPanel(); picuMasuk(kotakPanel); }
    }
    function gantiPasienHalus() {
        clearTimeout(timer); tutupModal(); panel?.tutup(); panel = undefined; bersihkanHistori();
        versi++;
        galatPasien = null; galatRiwayat = null; cariRiwayat = ''; alergiPasien = undefined;
        perbaruiSorotanKiri();
        if (!a.pasien) {
            pasien = null; riwayat = null;
            kotakIdentitas?.classList.remove('profil-memuat-halus');
            kotakPanel?.classList.remove('profil-memuat-halus');
            lukisIdentitas(); pasangPanel();
            return;
        }
        const pCache = cachePasien.get(a.pasien) ?? null;
        const rCache = cacheRiwayat.get(a.pasien) ?? null;
        pasien = pCache; riwayat = rCache;
        if (pCache) {
            kotakIdentitas?.classList.remove('profil-memuat-halus');
            lukisIdentitas();
            picuMasuk(kotakIdentitas);
        } else if (kotakIdentitas?.childElementCount) {
            kotakIdentitas.classList.add('profil-memuat-halus');
        } else {
            lukisIdentitas();
        }
        if (rCache) {
            kotakPanel?.classList.remove('profil-memuat-halus');
            if (rCache.length && !rCache.some((x) => x.id === a.kunjungan)) {
                void muatProfil();
                return void ganti(alamatProfil({ ...a, kunjungan: rCache[0].id }));
            }
            ikutiTanggalKunjungan();
            pasangPanel();
            picuMasuk(kotakPanel);
        } else if (kotakPanel?.childElementCount) {
            kotakPanel.classList.add('profil-memuat-halus');
        } else {
            pasangPanel();
        }
        void muatProfil();
    }

    function bangun() { clearTimeout(timer); tutupModal(); panel?.tutup(); panel = undefined; bersihkanHistori(); pengamatTinggiPanel?.disconnect(); pengamatTinggiPanel = undefined; kotakIdentitas = kotakRiwayat = kotakPanel = kotakHistori = undefined; versi++; bangunProfil(); }
    el.jenisTab = 'pasien';
    el.perbaruiAlamat = (baru) => {
        const lama = a; a = keadaanAlamat(baru);
        if (a.pasien !== lama.pasien) {
            if (kotakRiwayat && menuKiri !== 'riwayat') return gantiPasienHalus();
            return bangun();
        }
        if (a.kunjungan !== lama.kunjungan) { kotakPanel?.classList.remove('profil-memuat-halus'); ikutiTanggalKunjungan(); if (menuKiri === 'riwayat') lukisRiwayat(); pasangPanel(); picuMasuk(kotakPanel); }
        else if (a.sub !== lama.sub) panel?.pilihSub(a.sub);
    };
    el.tutup = () => { window.removeEventListener('resize', sesuaikanTinggiPanel); pengamatTinggiPanel?.disconnect(); pengamatTinggiPanel = undefined; konfirmasiPindah?.tutup(); aktif = false; versi++; versiKiri++; antVersi++; clearTimeout(timer); clearTimeout(timerKiri); clearInterval(antInterval); lepasSinyal?.(); tutupModal(); panel?.tutup(); for (const i of ikonAksi) i.tutup?.(); for (const i of ikonChip) i.tutup?.(); };
    window.addEventListener('resize', sesuaikanTinggiPanel);
    // Antrean dimuat ulang berkala selama menunya terbuka dan tidak ada modal: pendaftaran dari Mobile JKN masuk tanpa tindakan petugas.
    const bolehMuatAntrean = () => aktif && modeAntrean() && !cariKiri && !modal && !document.hidden;
    // Sinyal WebSocket dari server memuat antrean seketika; pemuatan berkala (60 detik) jaring pengaman bila sambungan putus.
    antInterval = setInterval(() => { if (bolehMuatAntrean()) void muatAntrean(true); }, 60000);
    const lepasSinyal = dengarAntreanBerubah(() => { if (bolehMuatAntrean()) void muatAntrean(true); });
    bangun();
    return el;
}
