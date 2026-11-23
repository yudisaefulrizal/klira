import { BAGIAN_SOAPIE, alergiTercatat, FARMASI, GALAT, KESADARAN, KLINIS, LABEL_NARASI, MAKS_NARASI, PENUNJANG, PROFIL_PASIEN, RAWAT_INAP, REKAM_MEDIS, STATUS_PENGESAHAN, STATUS_RESEP, TANDA_VITAL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { ambilKlinis, ambilKonteksKlinis, selesaikanPemeriksaan, simpanBagian } from '../../api-klien/klinis.js';
import { tambahCatatanHarian } from '../../api-klien/rawat-inap.js';
import { aksiAntrean, opsiKunjungan, ubahDpjpKunjungan } from '../../api-klien/kunjungan.js';
import { resepKunjungan, semuaMasterObatAktif, siapkanResep, simpanResep, telaahResep } from '../../api-klien/farmasi.js';
import { kasirKunjungan } from '../../api-klien/kasir.js';
import { ordersKunjungan } from '../../api-klien/penunjang.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bukaKonfirmasi, bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { bidang, lencana, peringatan, tab, tabel, baris, sel, tombol, bantuanKecil } from '../../komponen/ui/primitif.js';
import { adaIsianResep, awalResep, awalTelaah, barisDariItem, bentukResep, galatResep, perbaruiPlan, resepDariServer, teksPlanResep } from '../../modal/farmasi/keadaan-farmasi.js';
import { FormTelaah } from '../../modal/farmasi/form-telaah.js';
import { galatIsianTelaah, resepTerkunci, simpanSeluruhTelaah } from '../../modal/farmasi/simpan-telaah.js';
import { LangkahResep } from '../../modal/farmasi/langkah-resep.js';
import { PanelPenutup } from './panel-penutup.js';
import { EditorDiagnosis } from '../../modal/diagnosis/editor-diagnosis.js';
import { EditorTindakan } from '../../modal/tindakan/editor-tindakan.js';
import { barisDariTindakan, bentukIsiTindakan, galatTindakan } from '../../modal/tindakan/keadaan-tindakan.js';
import { TampilanResep } from '../../modal/farmasi/tampilan-resep.js';
import { disahkanDari, isiBagian, keadaanDariServer, rencanaSimpanBagian } from '../../modal/pemeriksaan/keadaan-pemeriksaan.js';
import { bukaModalKia, sisipkanBlokKia } from '../../modal/pemeriksaan/form-kia.js';
import { bukaModalGigi, sisipkanBlokGigi } from '../../modal/pemeriksaan/form-gigi.js';
import { bukaModalUgd, sisipkanBlokUgd } from '../../modal/pemeriksaan/form-ugd.js';
import { bukaModalFisikUmum, sisipkanBlokFisik } from '../../modal/pemeriksaan/form-fisik-umum.js';
import { bukaModalAnamnesisSkrining, sisipkanBlokAnamnesis } from '../../modal/pemeriksaan/form-anamnesis-skrining.js';
import { bukaModalTulisResep } from '../../modal/farmasi/modal-tulis-resep.js';
import { DaftarOrderLab } from '../../modal/penunjang/daftar-order-lab.js';
import { bukaOrderLab } from '../../modal/penunjang/order-lab.js';
import { bukaAmbilSpesimen } from '../../modal/penunjang/ambil-spesimen.js';
import { bukaHasilLab } from '../../modal/penunjang/hasil-lab.js';
import { menungguSpesimen } from '../../modal/penunjang/keadaan-spesimen.js';
import { menungguHasil } from '../../modal/penunjang/keadaan-hasil-lab.js';
import { bukaCetakBayar } from '../../modal/kasir-klaim/cetak-bayar.js';
import { bukaCetakHasilLab } from '../../modal/penunjang/cetak-hasil-lab.js';
import { bukaCetakRekamMedis } from '../../modal/rekam-medis/cetak-rekam-medis.js';
import { bukaCetakCppt } from '../../modal/rawat-inap/cetak-cppt.js';
import { tanggalWaktuPendek } from '../../util/format.js';
import { SUB_TAB, SUB_TAB_IMP, bentukDraf, modeCatatan, opsiCetakPanel, parseTensi, pelaksana, tandaKepalaPanel, teksTensi, terapkanDraf } from './keadaan-profil-pasien.js';
import { PanelBangsal } from './panel-rawat-inap.js';
import { adaptorDrafServer } from '../../api-klien/draf-klinis.js';
import { buatDrafOtomatis } from '../../util/draf/draf-otomatis.js';

const T = PROFIL_PASIEN;
const buat = (tag, kelas, teks) => { const el = document.createElement(tag); if (kelas) el.className = kelas; if (teks !== undefined) el.textContent = teks; return el; };
const redup = (teks) => { const el = buat('p', 'profil-redup', teks); return el; };
const pesanGalat = (e, bawaan) => (e instanceof GalatApi ? e.message : bawaan);

/**
 * Panel kanan halaman Pasien untuk satu kunjungan: catatan pemeriksaan SOAPIE (isi dan sahkan selama pemeriksaan berjalan, baca saja
 * sesudahnya), serta tab Resep, Tindakan, Penunjang, dan Dokumen. Catatan dimuat sekali dan dipakai semua tab; isian yang belum
 * disimpan bertahan saat berpindah tab pendamping.
 */
export function PanelKunjungan({ kunjunganId, pasien, ringkas, sub: subAwal, onSub, onBerubah, onSelesai, onAlergi }) {
    const boleh = izinSaatIni();
    const el = buat('section', 'profil-panel'), kepala = buat('header', 'profil-panel-kepala'), navTab = buat('div'), isi = buat('div', 'profil-panel-isi');
    isi.setAttribute('role', 'tabpanel');
    // Satu baris: tab di kiri; status, cara bayar, dan Cetak rekam medis di kanan.
    const bar = buat('div', 'profil-panel-bar'); bar.append(navTab, kepala);
    el.append(bar, isi);
    // Akun tanpa izin klinis atau rekam medis (analis lab, kasir) hanya mengerjakan tab kerjanya (Penunjang, Penutup); catatan klinis tidak dimuat.
    const terbatas = !(boleh('klinis', 'lihat') || boleh('rekam-medis', 'lihat'));
    const subTerbatas = [...(boleh('penunjang', 'lihat') ? ['penunjang'] : []), ...(boleh('kasir', 'lihat') ? ['penutup'] : [])];
    const isImp = ringkas?.jenis === 'IMP';
    const subSah = terbatas ? subTerbatas : (isImp ? SUB_TAB_IMP : SUB_TAB);
    let aktif = true, sub = subSah.includes(subAwal) ? subAwal : subSah[0], klinis = null, konteks = null, galatMuat = null, k = null, awal = null, tensiTeks = '', modal;
    let bangsalPanel = null;
    let tampilGalat = false, tampilWajib = false, galat = null, pesan = null, memproses = false, alasan = '', konfirmasiUbahTutup = false, konfirmasiMulaiPemeriksaan = false, konfirmasiBukanDpjp = false;
    let resep = awalResep(), resepGalat = null, resepPesan = null, resepProses = false, resepTampilGalat = false, obatMaster = null, obatGalat = null, obatMemuat = false, resepSinkron = false;
    let penutup = null;
    let modeResep = 'telaah';
    let telaah = {}, telaahSinkron = false, telaahGalat = null, telaahInfo = null, telaahKekurangan = [], telaahProses = false, telaahDicoba = false;
    let tindakan = [], tindakanSinkron = false, tindakanGalat = null, tindakanPesan = null, tindakanProses = false, tindakanTampilGalat = false;
    // Data tab pendamping dan opsi cetak dimuat saat dibutuhkan lalu dipakai ulang sampai ada perubahan.
    const data = { resep: null, penunjang: null };
    let kasirKepala = null, menuCetakTerbuka = false, cetakSiap = false, cetakMemuat = false, bungkusCetak = null;

    const tabs = tab(subSah.map((id) => ({ id: `kunjungan-${id}`, label: T.tab[id] })), `kunjungan-${sub}`, T.riwayat.judul, (id) => onSub(id.replace('kunjungan-', '')));
    navTab.append(tabs.el);

    const mode = () => modeCatatan(klinis.kunjungan, boleh);
    const server = () => keadaanDariServer(klinis.bagian);
    function setelKeadaan() {
        const s = server();
        awal = s;
        // Isi otomatis alergi di awal pemeriksaan bila riwayat sebelumnya mencatat alergi dan kunjungan ini belum punya catatan keperawatan.
        const alergiSebelumnya = konteks?.alergi;
        k = mode().ubahVital && klinis.bagian.keperawatan?.verifikasi !== 'sah' && !s.keperawatan.alergi.trim() && alergiSebelumnya
            ? { ...s, keperawatan: { ...s.keperawatan, alergi: alergiSebelumnya } }
            : s;
        alasan = ''; tampilGalat = false; konfirmasiUbahTutup = false; konfirmasiMulaiPemeriksaan = false; tensiTeks = teksTensi(k.tanda_vital); awalDraf = bentukDraf(k, tensiTeks);
    }
    // Draf otomatis di server (bukan penyimpanan peramban): isian yang belum disimpan bertahan saat berpindah pasien atau menutup halaman.
    const adaptorDraf = adaptorDrafServer(kunjunganId, 'pemeriksaan-klinis');
    let draf, awalDraf = null;
    const bisaDraf = () => !!klinis && (mode().ubah || mode().ubahVital);
    const catatDraf = () => draf?.perbarui({ adaptor: adaptorDraf, nilai: bentukDraf(k, tensiTeks), awal: awalDraf, langkah: 0, aktif: bisaDraf() });
    function mulaiDraf() {
        draf?.tutup();
        draf = buatDrafOtomatis({ adaptor: adaptorDraf, nilai: bentukDraf(k, tensiTeks), awal: awalDraf, langkah: 0, aktif: false }, ({ pulihan }) => {
            // Dipulihkan hanya bila belum ada isian yang diketik selama draf dibaca.
            if (!aktif || !bisaDraf() || JSON.stringify(bentukDraf(k, tensiTeks)) !== JSON.stringify(awalDraf)) return;
            const h = terapkanDraf(k, tensiTeks, pulihan?.nilai);
            if (!h) return;
            k = h.k; tensiTeks = h.tensi; pesan = S.drafDipulihkan; catatDraf(); lukis();
        });
    }
    async function mulaiAntreanOtomatis(antrean, fokusId) {
        try {
            if (antrean.status !== 'dipanggil')
                await aksiAntrean(antrean.id, 'panggil');
            await aksiAntrean(antrean.id, 'mulai');
            const baru = await ambilKlinis(kunjunganId);
            if (!aktif) return;
            klinis = { ...klinis, kunjungan: baru.kunjungan };
            onBerubah();
            lukis();
            lukisKepala();
            if (fokusId) document.getElementById(fokusId)?.focus({ preventScroll: true });
        } catch (e) {
            if (aktif) {
                konfirmasiMulaiPemeriksaan = false;
                galat = pesanGalat(e, 'Gagal memulai pemeriksaan.');
                lukis();
            }
        }
    }
    const terapkanUbah = (p) => { k = { ...k, ...p }; pesan = null; catatDraf(); lukis(); };
    const ubah = (p) => {
        const antrean = klinis?.kunjungan.antrean;
        const perluMulai = mode().ubah && klinis?.kunjungan.tahap_layanan === 'pemeriksaan' && antrean && antrean.status !== 'dilayani' && !konfirmasiMulaiPemeriksaan;
        if (perluMulai) {
            const fokusId = document.activeElement?.id ?? '';
            const tensiBaru = tensiTeks;
            tensiTeks = teksTensi(k.tanda_vital);
            lukis();
            tutupModal();
            modal = bukaKonfirmasi({
                judul: 'Mulai pemeriksaan?',
                pesan: 'Status antrean pasien belum dimulai. Apakah Anda ingin memulai pemeriksaan sekarang agar status berubah menjadi Pemeriksaan?',
                onYa() {
                    tutupModal();
                    konfirmasiMulaiPemeriksaan = true;
                    tensiTeks = tensiBaru;
                    terapkanUbah(p);
                    if (fokusId) document.getElementById(fokusId)?.focus({ preventScroll: true });
                    void mulaiAntreanOtomatis(antrean, fokusId);
                },
                onTidak() {
                    tutupModal();
                    tensiTeks = teksTensi(k.tanda_vital);
                    lukis();
                },
            });
            return;
        }
        const pengguna = penggunaSaatIni().pengguna;
        const bukanDpjp = mode().ubah && klinis.kunjungan.tahap_layanan === 'pemeriksaan' && klinis.kunjungan.dpjp_id && pengguna?.id && klinis.kunjungan.dpjp_id !== pengguna.id;
        if (bukanDpjp && !konfirmasiBukanDpjp) {
            const fokusId = document.activeElement?.id ?? '';
            const tensiBaru = tensiTeks;
            tensiTeks = teksTensi(k.tanda_vital);
            lukis();
            tutupModal();
            modal = bukaKonfirmasi({
                judul: 'Anda bukan dokter (DPJP) terpilih',
                pesan: T.bukanDpjp(dpjpNama() ?? '-'),
                labelYa: 'Lanjutkan mengedit',
                onYa() {
                    tutupModal();
                    konfirmasiBukanDpjp = true;
                    tensiTeks = tensiBaru;
                    terapkanUbah(p);
                    if (fokusId) document.getElementById(fokusId)?.focus({ preventScroll: true });
                },
                onTidak() {
                    tutupModal();
                    tensiTeks = teksTensi(k.tanda_vital);
                    lukis();
                },
            });
            return;
        }
        if (mode().tutup && !konfirmasiUbahTutup) {
            const fokusId = document.activeElement?.id ?? '';
            const tensiBaru = tensiTeks;
            tensiTeks = teksTensi(k.tanda_vital);
            lukis();
            tutupModal();
            modal = bukaKonfirmasi({
                judul: S.konfirmasiTutupJudul,
                pesan: S.konfirmasiTutupPesan,
                onYa() {
                    tutupModal();
                    konfirmasiUbahTutup = true;
                    tensiTeks = tensiBaru;
                    terapkanUbah(p);
                    if (fokusId) document.getElementById(fokusId)?.focus({ preventScroll: true });
                },
                onTidak() {
                    tutupModal();
                    tensiTeks = teksTensi(k.tanda_vital);
                    lukis();
                },
            });
            return;
        }
        terapkanUbah(p);
    };
    /** Bagian yang bisa disimpan dari halaman ini menurut tahap kunjungan: tanda vital dan/atau enam catatan SOAPIE. */
    const bagianUbah = () => [...(mode().ubahVital ? ['tanda_vital', 'keperawatan'] : []), ...(mode().ubah ? [...BAGIAN_SOAPIE, 'diagnosis'] : [])];
    const rencana = () => rencanaSimpanBagian(bagianUbah(), k, server(), disahkanDari(klinis.bagian));
    const idKolom = (bagian) => (bagian === 'tanda_vital' ? 'tv-suhu' : bagian === 'keperawatan' ? 'profil-alergi' : bagian === 'diagnosis' ? 'diagnosis-cari' : `narasi-${bagian}`);
    const tutupModal = () => { modal?.tutup(); modal = undefined; };
    const pasienRingkas = { id: pasien.id, nama: pasien.nama, nomor_rm: pasien.nomor_rm };
    const tutupMenuCetak = () => {
        if (!menuCetakTerbuka) return;
        menuCetakTerbuka = false;
        document.removeEventListener('pointerdown', luarMenuCetak, true);
        document.removeEventListener('keydown', tekanMenuCetak);
        lukisKepala();
    };
    const luarMenuCetak = (e) => { if (bungkusCetak && !bungkusCetak.contains(e.target)) tutupMenuCetak(); };
    const tekanMenuCetak = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tutupMenuCetak(); bungkusCetak?.querySelector('button')?.focus(); } };

    function ikonPrinterSvg() {
        const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
        s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
        s.setAttribute('stroke-width', '1.9'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
        s.setAttribute('aria-hidden', 'true');
        for (const d of ['M6 9V3h12v6', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v7H6z']) {
            const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.append(p);
        }
        return s;
    }

    async function muatOpsiCetak() {
        if (cetakSiap || cetakMemuat) return;
        cetakMemuat = true;
        if (menuCetakTerbuka) lukisKepala();
        const kj = klinis.kunjungan, tugas = [];
        if (boleh('penunjang', 'lihat') && !data.penunjang) {
            tugas.push(ordersKunjungan(kunjunganId).then((nilai) => { data.penunjang = { nilai }; }).catch(() => { }));
        }
        if (boleh('kasir', 'lihat') && !penutup?.keadaanKepala().kasir && !kasirKepala && !['menunggu_skrining', 'pemeriksaan'].includes(kj.tahap_layanan)) {
            tugas.push(kasirKunjungan(kunjunganId).then((h) => { kasirKepala = h; }).catch(() => { }));
        }
        await Promise.all(tugas);
        cetakMemuat = false; cetakSiap = true;
        if (aktif && menuCetakTerbuka) lukisKepala();
    }

    function pilihCetak(id) {
        const kj = klinis.kunjungan, kp = penutup?.keadaanKepala();
        const kjRingkas = { ...ringkas, ...kj, poli_nama: kj.poli_nama ?? konteks?.kunjungan?.poli_nama ?? ringkas?.poli_nama ?? null, dpjp_nama: dpjpNama() };
        tutupMenuCetak();
        tutupModal();
        if (id === 'rekam-medis') modal = bukaCetakRekamMedis({ kunjunganId, onTutup: tutupModal });
        else if (id === 'cppt') modal = bukaCetakCppt({ kunjunganId, onTutup: tutupModal });
        else if (id === 'hasil-lab') modal = bukaCetakHasilLab({ kunjunganId, orders: data.penunjang?.nilai, pasien, kunjungan: kjRingkas, onTutup: tutupModal });
        else if (id === 'bayar') modal = bukaCetakBayar({ gambaran: kp?.kasir ?? kasirKepala, onTutup: tutupModal });
    }

    function tombolMenuCetak() {
        const kp = penutup?.keadaanKepala(), kasir = kp?.kasir ?? kasirKepala;
        const opsi = opsiCetakPanel({
            terbatas,
            bolehKlinis: boleh('klinis', 'lihat'),
            bolehRekamMedis: boleh('rekam-medis', 'lihat'),
            bolehPenunjang: boleh('penunjang', 'lihat'),
            bolehKasir: boleh('kasir', 'lihat'),
            isImp,
            orders: data.penunjang?.nilai ?? null,
            kasir,
        });
        if (!opsi.length && !cetakMemuat) return null;
        const wrap = buat('div', 'profil-cetak-bungkus');
        bungkusCetak = wrap;
        const btn = tombol('', () => {
            if (menuCetakTerbuka) { tutupMenuCetak(); return; }
            menuCetakTerbuka = true;
            document.addEventListener('pointerdown', luarMenuCetak, true);
            document.addEventListener('keydown', tekanMenuCetak);
            lukisKepala();
            void muatOpsiCetak();
        }, 'sekunder');
        btn.classList.add('profil-cetak-tombol');
        btn.setAttribute('aria-label', T.soapie.cetakMenu);
        btn.title = T.soapie.cetakMenu;
        btn.setAttribute('aria-haspopup', 'menu');
        btn.setAttribute('aria-expanded', String(menuCetakTerbuka));
        btn.append(ikonPrinterSvg());
        wrap.append(btn);
        if (menuCetakTerbuka) {
            const menu = buat('div', 'profil-cetak-menu');
            menu.setAttribute('role', 'menu');
            for (const o of opsi) {
                const item = buat('button', 'profil-cetak-item', o.label);
                item.type = 'button';
                item.setAttribute('role', 'menuitem');
                item.addEventListener('click', () => pilihCetak(o.id));
                menu.append(item);
            }
            if (cetakMemuat) {
                const info = buat('span', 'profil-redup', T.memuat);
                info.style.padding = '6px 12px';
                menu.append(info);
            }
            wrap.append(menu);
        }
        return wrap;
    }

    function aksiKepala() {
        const kj = klinis.kunjungan, tahap = kj.tahap_layanan, daftar = [];
        if (sub === 'resep') {
            const nilai = data.resep?.nilai ?? [], ada = nilai[0] ?? null;
            const bolehUbah = mode().ubah && boleh('resep', 'input') && ['menunggu_skrining', 'pemeriksaan', 'resep'].includes(tahap) && (!ada || (ada.status === 'diajukan' && !ada.telaah));
            const bolehTelaah = boleh('farmasi', 'input') && tahap === 'resep' && nilai.some((r) => !resepTerkunci(r));
            if (bolehUbah && bolehTelaah) {
                for (const [nilaiMode, label] of [['ubah', T.resep.modeUbah], ['telaah', T.resep.modeTelaah]]) {
                    daftar.push(tombol(label, () => { modeResep = nilaiMode; lukisKepala(); lukis(); }, modeResep === nilaiMode ? 'utama' : 'sekunder'));
                }
            }
        }
        else if (sub === 'penunjang') {
            if (boleh('klinis', 'input') && !['menunggu_skrining', 'ditutup'].includes(tahap))
                daftar.push(tombol(T.penunjang.order, () => { tutupModal(); modal = bukaOrderLab({ kunjunganId, pasien: pasienRingkas, cara: kj.cara_pembayaran === 'jkn' ? 'jkn' : 'umum', onTutup: tutupModal, onSelesai() { tutupModal(); data.penunjang = null; cetakSiap = false; lukis(); lukisKepala(); onBerubah(); } }); }, 'sekunder'));
            const dm = data.penunjang;
            if (boleh('penunjang', 'input') && dm?.nilai && (kj.jenis === 'LAB' || tahap !== 'menunggu_skrining')) {
                const sesudah = () => { tutupModal(); data.penunjang = null; cetakSiap = false; lukis(); lukisKepala(); onBerubah(); };
                const buka = (fungsi) => () => { tutupModal(); modal = fungsi({ kunjunganId, pasien: pasienRingkas, onTutup: tutupModal, onSelesai: sesudah }); };
                if (menungguSpesimen(dm.nilai).length) daftar.push(tombol(PENUNJANG.aksi.spesimen, buka(bukaAmbilSpesimen), 'sekunder'));
                if (menungguHasil(dm.nilai).length) daftar.push(tombol(PENUNJANG.aksi.hasil, buka(bukaHasilLab), 'sekunder'));
            }
        }
        else if (sub === 'penutup' && penutup) {
            daftar.push(...penutup.keadaanKepala().aksi);
        }
        const cetak = tombolMenuCetak();
        if (cetak) daftar.push(cetak);
        return daftar;
    }

    function lukisKepala() {
        kepala.replaceChildren();
        if (!klinis) return;
        // Alergi tampil di kepala pasien (sejajar dengan identitas): isian skrining kunjungan ini, atau yang tercatat sebelumnya.
        const sini = klinis.bagian.keperawatan?.isi?.alergi;
        onAlergi?.(sini?.trim() ? alergiTercatat(sini) : (konteks?.alergi ?? null));
        const kp = sub === 'penutup' && penutup ? penutup.keadaanKepala() : { kasir: null, resepSerah: [] };
        const tanda = buat('div', 'profil-panel-tanda');
        for (const x of tandaKepalaPanel({ sub, klinis, data, kasir: kp.kasir, resepSerah: kp.resepSerah })) {
            const l = lencana(x.label, x.warna);
            if (x.title) l.title = x.title;
            tanda.append(l);
        }
        kepala.append(tanda, ...aksiKepala(), bantuanKecil('Panduan Pemeriksaan', [
            'Saat status Menunggu skrining, bagian non-skrining diredupkan agar fokus ke Subjek, Tanda Vital, dan Alergi.',
            'Gunakan tombol Diagnosis (ICD-10) dan Tulis resep → di pojok kolom untuk mempercepat pengisian.',
            'Klik Selesaikan pemeriksaan agar data disahkan dan siap lanjut ke tahap berikutnya.',
        ]));
    }

    // --- Tab Pemeriksaan (formulir SOAPIE dua kolom) ---
    const S = T.soapie;
    const BANTUAN_BIDANG = {
        subjek: ['Isian Subjek (S)', 'Keluhan utama pasien, sejak kapan dirasakan, riwayat penyakit sekarang/dahulu, dan faktor pemicu. Contoh: "Demam sejak 3 hari lalu disertai batuk kering."'],
        objek: ['Isian Objek (O)', 'Hasil pemeriksaan fisik dokter (keadaan umum, kepala/leher, toraks, abdomen, ekstremitas) serta temuan khusus poli (Odontogram/KIA/UGD).'],
        alergi: ['Isian Alergi', 'Riwayat alergi obat, makanan, atau bahan medis (mis. "Amoksisilin", "Debu", atau "Tidak ada").'],
        asesmen: ['Isian Asesmen (A)', 'Kesimpulan diagnosis kerja atau diagnosis banding dokter. Gunakan tombol Diagnosis (ICD-10) di pojok kanan bawah untuk memilih kode ICD-10 resmi.'],
        plan: ['Isian Plan (P)', 'Rencana terapi obat, tindakan medis, edukasi pasien, dan rencana kontrol. Gunakan tombol Tulis resep → untuk meresepkan obat.'],
        instruksi: ['Isian Instruksi', 'Instruksi lanjutan untuk perawat atau pasien (mis. observasi tanda vital tiap 15 menit, rawat luka, diet khusus).'],
        evaluasi: ['Isian Evaluasi', 'Catatan respons pasien setelah tindakan/terapi awal di klinik atau kondisi pasien sebelum pulang.'],
    };
    const barisForm = (label, kontrol, ...tambahan) => {
        const bisaLabel = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'METER', 'OUTPUT', 'PROGRESS'].includes(kontrol.tagName);
        const b = buat('div', 'profil-form-baris'), l = buat(bisaLabel ? 'label' : 'span', null, label), sisi = buat('div', 'profil-form-sisi');
        if (bisaLabel && kontrol.id) l.htmlFor = kontrol.id;
        sisi.append(kontrol, ...tambahan.filter(Boolean)); b.append(l, sisi); return b;
    };
    const pasangBantuan = (baris, kunci) => {
        const info = BANTUAN_BIDANG[kunci];
        const l = baris?.firstElementChild;
        if (info && l) l.append(bantuanKecil(info[0], info[1], { arah: 'kanan', mini: true }));
        return baris;
    };
    function isian(id, nilai, { boleh: dapat, onInput, tipe = 'text', baris: rows, maxLength }) {
        const c = buat(rows ? 'textarea' : 'input', 'profil-form-isian'); c.id = id; c.value = nilai; c.readOnly = !dapat; c.autocomplete = 'off';
        if (rows) c.rows = rows; else c.type = tipe;
        if (maxLength) c.maxLength = maxLength;
        if (dapat) c.addEventListener('input', (e) => onInput(e.target.value));
        return c;
    }
    /** Penanda pengesahan hanya bila ada yang perlu diperhatikan (isi berubah setelah disahkan); yang sah dan terbaru tidak diberi penanda supaya formulir tidak ramai. */
    const penandaSah = (b) => {
        if (!b?.pengesahan || b.verifikasi === 'sah') return null;
        const p = b.pengesahan, el = buat('span', 'profil-penanda-sah');
        el.title = KLINIS.status.disahkanOleh(p.pengguna_nama, p.jenis_akun);
        el.append(lencana(STATUS_PENGESAHAN.label(b.verifikasi), STATUS_PENGESAHAN.warna(b.verifikasi)), buat('small', 'profil-redup', KLINIS.status.versi(p.versi)));
        return el;
    };
    const galatDi = (bagian) => {
        if (!tampilGalat) return null;
        const g = rencana().find((r) => r.bagian === bagian)?.galat;
        if (g) return g;
        if (tampilWajib && (bagian === 'subjek' || bagian === 'diagnosis') && klinis.bagian[bagian].verifikasi !== 'sah' && !rencana().some((x) => x.bagian === bagian))
            return `${bagian === 'subjek' ? 'Subjek' : 'Diagnosis (ICD-10)'} wajib diisi sebelum pemeriksaan diselesaikan.`;
        return null;
    };
    const kecil = (teks, kelas = 'profil-redup') => buat('small', kelas, teks);
    const blokDiagnosis = (daftar) => (daftar?.length
        ? `Diagnosis:\n${daftar.map((d) => `${d.kode} ${d.nama}${d.peran === 'utama' ? ' (Utama)' : ''}`).join('\n')}`
        : '');
    function bukaModalDiagnosis(m) {
        modal?.tutup();
        let mDx;
        const tutupModalDx = () => {
            const target = mDx;
            mDx = undefined;
            modal = undefined;
            target?.tutup();
            lukis();
        };
        mDx = bukaModal1({
            judul: 'Diagnosis (ICD-10)',
            lebar: 'modalSedang',
            onTutup: tutupModalDx,
        });
        modal = mDx;
        mDx.isi.style.minHeight = '320px';
        const info = document.createElement('small');
        info.style.color = 'var(--warna-teks-redup)';
        mDx.konteks.append(info);
        const lukisModalDx = (fokusCari = false) => {
            info.textContent = k.diagnosis.length ? `${k.diagnosis.length} diagnosis dipilih` : 'Belum ada diagnosis';
            mDx.isi.replaceChildren(EditorDiagnosis({
                diagnosis: k.diagnosis,
                disabled: !m.ubah,
                galat: galatDi('diagnosis'),
                onUbah(diagnosis) {
                    const lama = blokDiagnosis(k.diagnosis), baru = blokDiagnosis(diagnosis);
                    const asesmen = baru
                        ? (perbaruiPlan(k.asesmen, lama, baru, MAKS_NARASI.asesmen) ?? k.asesmen)
                        : (lama && k.asesmen.includes(lama) ? k.asesmen.replace(lama, '').replace(/\n{3,}/g, '\n\n').trim() : k.asesmen);
                    ubah({ diagnosis, asesmen });
                    lukisModalDx(true);
                },
            }));
            if (fokusCari) document.getElementById('diagnosis-cari')?.focus();
        };
        lukisModalDx(false);
        mDx.aksi.append(tombol('Selesai', tutupModalDx));
        document.getElementById('diagnosis-cari')?.focus();
    }
    function teksSoapie(bagian, m, rows) {
        const g = galatDi(bagian) ?? (bagian === 'asesmen' ? galatDi('diagnosis') : null), sah = penandaSah(klinis.bagian[bagian]);
        const galatEl = g ? kecil(g, 'profil-galat') : null;
        const c = isian(`narasi-${bagian}`, k[bagian], {
            boleh: m.ubah, baris: rows, maxLength: MAKS_NARASI[bagian],
            onInput(v) {
                ubah({ [bagian]: v });
                if (tampilWajib && v.trim()) {
                    c.removeAttribute('aria-invalid');
                    galatEl?.remove();
                }
            },
        });
        if (g) c.setAttribute('aria-invalid', 'true');
        const baris = pasangBantuan(barisForm(LABEL_NARASI[bagian], c, galatEl, sah), bagian);
        if (bagian === 'asesmen') {
            const sisiDx = baris.querySelector('.profil-form-sisi');
            if (sisiDx) {
                sisiDx.style.position = 'relative';
                c.style.paddingBottom = '34px';
                const btnDx = tombol(k.diagnosis.length ? `Diagnosis (${k.diagnosis.length}) →` : 'Diagnosis (ICD-10) →', () => bukaModalDiagnosis(m), 'teks');
                btnDx.style.cssText = 'position:absolute;right:8px;min-height:24px;padding:3px 8px;font-size:12px;background:var(--warna-permukaan);border-radius:6px;';
                // Posisi mengikuti dasar textarea (di atas ringkasDx/galatEl jika ada).
                btnDx.style.top = 'auto';
                const bungkusArea = document.createElement('div');
                bungkusArea.style.position = 'relative';
                c.replaceWith(bungkusArea);
                bungkusArea.append(c, btnDx);
                btnDx.style.bottom = '8px';
            }
        }
        // Plan mengisi sisa tinggi kolom kanan (sampai sejajar dengan bagian terbawah kolom kiri).
        if (bagian === 'plan') baris.classList.add('profil-form-tumbuh');
        return baris;
    }
    function selVital(kunci, m) {
        const tv = k.tanda_vital, id = `tv-${kunci}`, kotak = buat('div', 'profil-vital-sel'), l = buat('label', null, S.vital[kunci]); l.htmlFor = id;
        let c;
        if (kunci === 'kesadaran') {
            c = buat('select', 'profil-form-isian'); c.id = id; c.disabled = !m.ubahVital;
            for (const [nilai, label] of [['', KLINIS.tandaVital.pilihKesadaran], ...KESADARAN.map((n) => [n, KLINIS.tandaVital.kesadaranOpsi[n]])]) { const o = buat('option', null, label); o.value = nilai; c.append(o); }
            c.value = tv.kesadaran; c.addEventListener('change', (e) => ubah({ tanda_vital: { ...k.tanda_vital, kesadaran: e.target.value } }));
        }
        else if (kunci === 'tensi') {
            c = isian(id, tensiTeks, { boleh: m.ubahVital, onInput(v) { tensiTeks = v; const t = parseTensi(v); ubah({ tanda_vital: { ...k.tanda_vital, sistolik: t.sistolik, diastolik: t.diastolik } }); } });
            c.placeholder = '120/80';
        }
        else c = isian(id, tv[kunci], { boleh: m.ubahVital, tipe: 'text', onInput: (v) => ubah({ tanda_vital: { ...k.tanda_vital, [kunci]: v } }) });
        if (kunci !== 'kesadaran') c.inputMode = 'decimal';
        if (kunci === 'tensi') c.inputMode = 'numeric';
        kotak.append(l, c); return kotak;
    }
    /** Tanda vital terpisah dari enam teks SOAPIE: suhu, tinggi, berat, tensi, respirasi, nadi, SpO2, GCS, kesadaran (tiga kolom). */
    function tandaVital(m) {
        const kotak = buat('div', 'profil-vital'), grid = buat('div', 'profil-vital-grid');
        grid.append(...['suhu', 'tinggi_badan', 'berat_badan', 'lingkar_perut', 'tensi', 'respirasi', 'nadi', 'spo2', 'gcs', 'kesadaran'].map((x) => selVital(x, m)));
        const g = !parseTensi(tensiTeks).sah ? S.vital.galatTensi : galatDi('tanda_vital'), sah = penandaSah(klinis.bagian.tanda_vital);
        kotak.append(...[grid, g && kecil(g, 'profil-galat'), sah].filter(Boolean));
        return kotak;
    }
    const dpjpNama = () => klinis.kunjungan.dpjp_nama ?? konteks?.kunjungan?.dpjp_nama ?? ringkas?.dpjp_nama ?? null;
    function isiPemeriksaan() {
        const m = mode(), bungkus = buat('div', 'profil-soapie'), pengguna = penggunaSaatIni().pengguna;
        if (!m.ubah) bungkus.append(peringatan(S.bacaSaja[m.alasan], 'biru'));
        if (m.alasan !== 'lab') {
            const form = buat('div', 'profil-form'), kiri = buat('div', 'profil-form-kolom'), kanan = buat('div', 'profil-form-kolom profil-form-kanan');
            const p = pelaksana(klinis.bagian, ['tanda_vital', ...BAGIAN_SOAPIE]);
            const bisaUbahDokter = boleh('kunjungan', 'input') && klinis.kunjungan.jenis === 'AMB' && ['menunggu_skrining', 'pemeriksaan'].includes(klinis.kunjungan.tahap_layanan) && !['dilayani', 'selesai', 'batal'].includes(klinis.kunjungan.antrean?.status);
            const dokter = document.createElement('select');
            dokter.id = 'profil-dilakukan'; dokter.className = 'profil-form-isian';
            const isiOpsiDokter = (daftar) => {
                const saatIni = klinis.kunjungan.dpjp_id ? String(klinis.kunjungan.dpjp_id) : '';
                const namaSaatIni = dpjpNama() ?? p?.nama ?? (m.ubah || m.ubahVital ? pengguna?.nama ?? '' : '-');
                const poli = klinis.kunjungan.poli_nama?.toLowerCase();
                const cocokPoli = poli ? daftar.filter((d) => !d.jenis_poli?.length || d.jenis_poli.some((j) => j.toLowerCase() === poli)) : daftar;
                const opsi = [...cocokPoli];
                if (saatIni && !opsi.some((d) => String(d.id) === saatIni))
                    opsi.unshift({ id: saatIni, nama: namaSaatIni || '-' });
                dokter.replaceChildren();
                const optKosong = document.createElement('option');
                optKosong.value = ''; optKosong.textContent = saatIni || !namaSaatIni || namaSaatIni === '-' ? 'Belum ditentukan' : namaSaatIni;
                dokter.append(optKosong);
                for (const d of opsi) {
                    const opt = document.createElement('option');
                    opt.value = String(d.id); opt.textContent = d.nama;
                    dokter.append(opt);
                }
                dokter.value = saatIni;
            };
            isiOpsiDokter([]);
            dokter.disabled = !bisaUbahDokter;
            if (bisaUbahDokter) {
                opsiKunjungan().then((o) => { if (aktif && o?.dpjp) isiOpsiDokter(o.dpjp); }).catch(() => { });
                dokter.addEventListener('change', async () => {
                    dokter.disabled = true;
                    try {
                        await ubahDpjpKunjungan(kunjunganId, dokter.value ? Number(dokter.value) : null);
                        if (!aktif) return;
                        await muat(true);
                        onBerubah?.();
                    }
                    catch (e) {
                        if (aktif) { galat = pesanGalat(e, 'Gagal mengubah dokter.'); lukis(); }
                    }
                    finally { if (aktif) dokter.disabled = !bisaUbahDokter; }
                });
            }
            const alergi = isian('profil-alergi', k.keperawatan.alergi, { boleh: m.ubahVital, maxLength: 500, onInput: (v) => ubah({ keperawatan: { ...k.keperawatan, alergi: v } }) });
            alergi.placeholder = konteks?.alergi ? S.alergiTercatat(konteks.alergi) : S.tanpaAlergi;
            const idLayanan = buat('span', 'profil-form-teks', klinis.kunjungan.id_layanan ?? '-');
            idLayanan.id = 'profil-nomor-dokumen';
            Object.assign(idLayanan.style, { fontWeight: '600', padding: '6px 0', display: 'inline-block', userSelect: 'all' });
            const galatAlergi = galatDi('keperawatan');
            const planEl = teksSoapie('plan', m, 3);
            if (m.ubah && subSah.includes('resep')) {
                const sisiPlan = planEl.querySelector('.profil-form-sisi');
                const areaPlan = sisiPlan?.querySelector('textarea');
                if (sisiPlan && areaPlan) {
                    sisiPlan.style.position = 'relative';
                    areaPlan.style.paddingBottom = '34px';
                    const btnResep = tombol('Tulis resep', () => {
                        tutupModal();
                        modal = bukaModalTulisResep({
                            kunjunganId,
                            onBukaTab: () => { el.pilihSub('resep'); onSub?.('resep'); },
                            onSelesai: ({ lama, baru, obat }) => {
                                if (obat?.length && !obatMaster?.length) obatMaster = obat;
                                const plan = perbaruiPlan(k.plan, lama ? blokPlan(lama) : null, blokPlan(baru), MAKS_NARASI.plan);
                                if (plan !== null) {
                                    k = { ...k, plan };
                                    catatDraf();
                                }
                                data.resep = null;
                                resepSinkron = false;
                                pesan = lama ? T.resep.diperbarui : T.resep.diajukan;
                                lukis();
                                onBerubah();
                            },
                        });
                    }, 'teks');
                    btnResep.style.cssText = 'position:absolute;right:8px;bottom:8px;min-height:24px;padding:3px 8px;font-size:12px;background:var(--warna-permukaan);border-radius:6px;';
                    sisiPlan.append(btnResep);
                }
            }
            const objekEl = teksSoapie('objek', m, 3);
            const terapkanObjek = (baru) => {
                ubah({ objek: baru });
                const area = document.getElementById('narasi-objek');
                if (area && area.value !== baru) area.value = baru;
            };
            const tombolObjek = [
                ['Pemeriksaan Fisik', () => bukaModalFisikUmum({ onTerapkan: (blok) => terapkanObjek(sisipkanBlokFisik(k.objek, blok)) })],
            ];
            const tombolKhususPoli = {
                kia: ['Input KIA', () => bukaModalKia({ kunjunganId, nilaiAwal: k.objek, onTerapkan: (blok) => terapkanObjek(sisipkanBlokKia(k.objek, blok)) })],
                gigi: ['Input Odontogram', () => bukaModalGigi({ pasienId: pasien.id, kunjunganId, onTerapkan: (blok) => terapkanObjek(sisipkanBlokGigi(k.objek, blok)) })],
                ugd: ['Input Triase UGD', () => bukaModalUgd({ kunjunganId, onTerapkan: (blok) => terapkanObjek(sisipkanBlokUgd(k.objek, blok)) })],
            }[konteks?.kunjungan?.poli_kategori];
            if (tombolKhususPoli) tombolObjek.push(tombolKhususPoli);
            if (m.ubah) {
                const sisiObjek = objekEl.querySelector('.profil-form-sisi');
                const areaObjek = sisiObjek?.querySelector('textarea');
                if (sisiObjek && areaObjek) {
                    sisiObjek.style.position = 'relative';
                    areaObjek.style.paddingBottom = '36px';
                    const barisTombol = document.createElement('div');
                    barisTombol.style.cssText = 'position:absolute;right:8px;bottom:8px;display:flex;gap:6px;flex-wrap:wrap;';
                    for (const [labelT, aksiT] of tombolObjek) {
                        const btn = tombol(labelT, aksiT, 'teks');
                        btn.style.cssText = 'min-height:24px;padding:3px 8px;font-size:12px;background:var(--warna-permukaan);border-radius:6px;';
                        barisTombol.append(btn);
                    }
                    sisiObjek.append(barisTombol);
                }
            }
            const sedangSkrining = klinis.kunjungan.tahap_layanan === 'menunggu_skrining';
            const subjekEl = teksSoapie('subjek', m, 3);
            if (m.ubah || m.ubahVital) {
                const sisiSubjek = subjekEl.querySelector('.profil-form-sisi');
                const areaSubjek = sisiSubjek?.querySelector('textarea');
                if (sisiSubjek && areaSubjek) {
                    sisiSubjek.style.position = 'relative';
                    areaSubjek.style.paddingBottom = '36px';
                    const btnAnm = tombol('Anamnesis & Skrining', () => bukaModalAnamnesisSkrining({
                        kunjunganId,
                        anamnesisAwal: klinis.bagian.anamnesis?.isi,
                        keperawatanAwal: k.keperawatan,
                        onTerapkan: ({ blok, keperawatan: kpBaru }) => {
                            const baru = sisipkanBlokAnamnesis(k.subjek, blok);
                            ubah({ subjek: baru, keperawatan: { ...k.keperawatan, ...kpBaru } });
                            const area = document.getElementById('narasi-subjek');
                            if (area && area.value !== baru) area.value = baru;
                            void muat(true);
                        },
                    }), 'teks');
                    btnAnm.style.cssText = 'position:absolute;right:8px;bottom:8px;min-height:24px;padding:3px 8px;font-size:12px;background:var(--warna-permukaan);border-radius:6px;';
                    sisiSubjek.append(btnAnm);
                }
            }
            const vitalEl = tandaVital(m);
            const alergiEl = pasangBantuan(barisForm(S.alergi, alergi, galatAlergi && kecil(galatAlergi, 'profil-galat')), 'alergi');
            const asesmenEl = teksSoapie('asesmen', m, 3);
            const instruksiEl = teksSoapie('instruksi', m, 3);
            const evaluasiEl = teksSoapie('evaluasi', m, 3);
            if (sedangSkrining) {
                for (const elNonSkrining of [objekEl, asesmenEl, planEl, instruksiEl, evaluasiEl]) {
                    elNonSkrining.classList.add('profil-bagian-redup');
                }
            }
            kiri.append(barisForm('ID Layanan', idLayanan), barisForm('Dokter (DPJP)', dokter), subjekEl, objekEl, vitalEl, alergiEl);
            kanan.append(asesmenEl, planEl, instruksiEl, evaluasiEl);
            form.append(kiri, kanan); bungkus.append(form);
        }
        bungkus.append(aksiPemeriksaan(m));
        return bungkus;
    }
    function aksiPemeriksaan(m) {
        const kaki = buat('footer', 'profil-soapie-aksi');
        if (galat) kaki.append(peringatan(galat));
        if (pesan) kaki.append(peringatan(pesan, 'hijau'));
        if (m.ubah || m.ubahVital) {
            const r = rencana(), tahap = klinis.kunjungan.tahap_layanan, tahapKerja = m.ubah && ['menunggu_skrining', 'pemeriksaan'].includes(tahap);
            const antrean = klinis.kunjungan.antrean;
            // Sebelum status antrean menjadi `dilayani`, dokter harus memanggil lalu menekan `Mulai pemeriksaan` terlebih dahulu.
            if (m.ubah && tahap === 'pemeriksaan' && antrean && antrean.status !== 'dilayani') {
                const dipanggil = antrean.status === 'dipanggil';
                const btn = tombol(
                    memproses ? S.menyimpan : dipanggil ? 'Mulai pemeriksaan' : 'Panggil pasien',
                    () => void jalankanAksiAntrean(antrean.id, dipanggil ? 'mulai' : 'panggil'),
                );
                btn.disabled = memproses;
                const baris = buat('div', 'profil-soapie-tombol');
                baris.append(btn);
                kaki.append(baris);
                return kaki;
            }
            if (isImp && m.ubah && tahap === 'pemeriksaan') {
                const simpanImp = tombol(memproses ? S.menyimpan : 'Simpan pemeriksaan', () => void simpanPemeriksaanImp());
                simpanImp.disabled = memproses;
                const baris = buat('div', 'profil-soapie-tombol');
                baris.append(simpanImp);
                kaki.append(baris);
                return kaki;
            }
            // Selama kunjungan belum ditutup tidak ada alasan yang diminta; sesudah ditutup setiap perubahan wajib beralasan.
            if (m.tutup && r.length) {
                const f = bidang({ id: 'soapie-alasan', label: S.alasan, jenis: 'textarea', nilai: alasan, maxLength: 500, ubah(v) { alasan = v; } });
                f.kontrol.style.height = '56px'; // pendek: kolom ini menempel di bawah dan tidak boleh menutupi formulir
                kaki.append(f.el, redup(S.alasanKet));
                if (tampilGalat && !alasan.trim()) f.setGalat(S.alasanWajib);
            }
            const labelUtama = memproses
                ? S.menyimpan
                : tahap === 'menunggu_skrining'
                    ? 'Selesai skrining'
                    : tahap === 'pemeriksaan'
                        ? 'Selesaikan pemeriksaan'
                        : S.simpanPerubahan;
            const selesai = tombol(labelUtama, () => void selesaikan({ akhiri: true }));
            selesai.disabled = memproses || (!(m.ubah && tahap === 'pemeriksaan') && !r.length);
            // Di luar tahap kerja (setelah pemeriksaan selesai) tombol Simpan perubahan hanya muncul bila ada perubahan.
            if (!tahapKerja && !r.length) return kaki;
            const baris = buat('div', 'profil-soapie-tombol');
            if (m.ubah && tahap === 'pemeriksaan' && r.length > 0) {
                const simpanSaja = tombol(memproses ? S.menyimpan : 'Simpan', () => void selesaikan({ akhiri: false }), 'sekunder');
                simpanSaja.disabled = memproses;
                baris.append(simpanSaja);
            }
            baris.append(selesai); kaki.append(baris);
        }
        return kaki;
    }
    async function jalankanAksiAntrean(antreanId, aksi) {
        if (memproses) return;
        memproses = true; galat = null; pesan = null; lukis();
        try {
            await aksiAntrean(antreanId, aksi);
            const baru = await ambilKlinis(kunjunganId);
            if (!aktif) return;
            klinis = baru;
            pesan = aksi === 'mulai' ? 'Pemeriksaan dimulai.' : 'Pasien dipanggil.';
            onBerubah();
        } catch (e) {
            if (aktif) galat = pesanGalat(e, 'Gagal memproses antrean.');
        } finally {
            if (aktif) { memproses = false; lukis(); lukisKepala(); }
        }
    }
    async function simpanPemeriksaanImp() {
        if (memproses) return;
        const sebut = (teks) => { tampilGalat = true; galat = teks; pesan = null; lukis(); };
        if (!parseTensi(tensiTeks).sah) return sebut(S.vital.galatTensi);
        if (!k.subjek.trim() || !k.objek.trim() || !k.asesmen.trim() || !k.plan.trim()) {
            return sebut('Subjek, Objek, Asesmen, dan Plan wajib diisi untuk menyimpan pemeriksaan rawat inap.');
        }
        const tvObj = { kesadaran: k.tanda_vital.kesadaran || null };
        let adaVital = !!tvObj.kesadaran;
        for (const t of TANDA_VITAL) {
            const raw = String(k.tanda_vital[t.kunci] ?? '').trim().replace(',', '.');
            if (raw === '') {
                tvObj[t.kunci] = null;
                continue;
            }
            const num = Number(raw);
            if (!Number.isFinite(num) || num < t.min || num > t.max) {
                return sebut(`${S.vital[t.kunci] ?? t.kunci}: nilai harus antara ${t.min} dan ${t.max}.`);
            }
            tvObj[t.kunci] = num;
            adaVital = true;
        }
        memproses = true; galat = null; pesan = null; lukis();
        try {
            await tambahCatatanHarian(kunjunganId, {
                subjektif: k.subjek.trim(),
                objektif: k.objek.trim(),
                asesmen: k.asesmen.trim(),
                rencana: k.plan.trim(),
                instruksi: k.instruksi.trim(),
                tanda_vital: adaVital ? tvObj : null,
            });
            for (const item of rencana()) {
                if (item.bagian === 'keperawatan' || item.bagian === 'diagnosis') {
                    await simpanBagian(kunjunganId, item.bagian, isiBagian(item.bagian, k));
                }
            }
            if (!aktif) return;
            const alergi = k.keperawatan.alergi, diagnosis = k.diagnosis;
            k = { ...server(), subjek: '', objek: '', asesmen: '', plan: '', instruksi: '', evaluasi: '', keperawatan: { ...server().keperawatan, alergi }, diagnosis };
            tensiTeks = '';
            awal = { ...k };
            awalDraf = bentukDraf(k, tensiTeks);
            draf?.hapus();
            tampilGalat = false;
            pesan = RAWAT_INAP.cppt.tersimpan;
            bangsalPanel?.muatUlangHistori?.();
            onBerubah();
        } catch (e) {
            if (aktif) {
                const rincian = e instanceof GalatApi && Array.isArray(e.rincian) && e.rincian.length
                    ? e.rincian.map((x) => ((x.jalur ?? x.kolom) ? `${x.jalur ?? x.kolom}: ${x.pesan}` : x.pesan)).join(' · ')
                    : null;
                galat = rincian ?? pesanGalat(e, S.gagal);
            }
        } finally {
            if (aktif) { memproses = false; lukis(); lukisKepala(); }
        }
    }
    /** Simpan dan sahkan isian yang berubah; bila `akhiri` dan tahap `pemeriksaan`, akhiri pemeriksaan ke Resep/Kasir. */
    async function selesaikan({ akhiri = true } = {}) {
        if (memproses) return;
        const sebut = (teks, kolom) => { tampilGalat = true; galat = teks; pesan = null; lukis(); if (kolom) document.getElementById(kolom)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); };
        if (!parseTensi(tensiTeks).sah) return void (sebut(S.vital.galatTensi), document.getElementById('tv-tensi')?.focus());
        const r = rencana(), masalah = r.find((x) => x.galat);
        if (masalah) return void sebut(masalah.galat, idKolom(masalah.bagian));
        if (mode().tutup && r.length && !alasan.trim()) return void sebut(S.alasanWajib);
        const tahap = klinis.kunjungan.tahap_layanan;
        const kurangSemua = ['subjek', 'diagnosis'].filter((b) => klinis.bagian[b].verifikasi !== 'sah' && !r.some((x) => x.bagian === b));
        // Di tahap pemeriksaan Selesaikan pemeriksaan menuntut Subjek dan Diagnosis ICD-10; tombol Simpan menyimpan sebagian tanpa mengakhiri pemeriksaan.
        const akanSelesai = akhiri && mode().ubah && tahap === 'pemeriksaan';
        if (akanSelesai && kurangSemua.length) {
            tampilWajib = true;
            return void sebut(null, idKolom(kurangSemua[0]));
        }
        tampilWajib = false;
        memproses = true; galat = null; pesan = null; lukis();
        let disimpan = 0, pesanTagihan = null, berjalan = null, berhasil = false;
        try {
            for (const x of r) {
                berjalan = x.bagian;
                const h = await simpanBagian(kunjunganId, x.bagian, isiBagian(x.bagian, k), mode().tutup ? alasan : undefined);
                // Bagian yang sudah tersimpan langsung menjadi dasar, supaya tidak dikirim ulang bila bagian berikutnya gagal.
                klinis = { kunjungan: h.kunjungan, bagian: { ...klinis.bagian, [x.bagian]: h.bagian } };
                if (h.tersimpan) disimpan += 1;
                if (h.pesan_tagihan) pesanTagihan = h.pesan_tagihan;
            }
            berjalan = null;
            if (akanSelesai) {
                const perluFarmasi = (await resepKunjungan(kunjunganId)).some((x) => x.status === 'diajukan' || x.status === 'ditelaah');
                klinis = { ...klinis, kunjungan: await selesaikanPemeriksaan(kunjunganId, perluFarmasi ? 'resep' : 'kasir') };
            }
            if (!aktif) return;
            setelKeadaan(); berhasil = true;
            // Isian sudah tersimpan: draf dibuang setelah simpan yang tertunda selesai, lalu draf baru dimulai untuk perubahan berikutnya.
            draf?.tutup(); draf = undefined; void adaptorDraf.hapus().then(() => { if (aktif) mulaiDraf(); });
            pesan = akanSelesai ? S.selesai : [disimpan ? S.tersimpan(disimpan) : S.tanpaPerubahan, pesanTagihan].filter(Boolean).join(' ');
        }
        catch (e) {
            if (!aktif) return;
            tampilGalat = true;
            galat = `${berjalan ? `${KLINIS.gagalSebagian(REKAM_MEDIS.perbaikan.bagianLabel[berjalan])} ` : ''}${pesanGalat(e, GALAT.umum)}`;
        }
        finally {
            memproses = false;
            if (aktif) { lukisKepala(); lukis(); if (disimpan || berhasil) onBerubah(); }
        }
        if (berhasil && akanSelesai) onSelesai?.();
    }

    // --- Tab pendamping ---
    function muatData(nama, ambil) {
        if (data[nama]) return;
        data[nama] = { memuat: true };
        ambil().then((nilai) => { data[nama] = { nilai }; }).catch((e) => { data[nama] = { galat: pesanGalat(e, T[nama].gagal) }; }).finally(() => { if (aktif && sub === nama) { lukis(); lukisKepala(); } });
    }
    const judulSeksi = (teks) => buat('h3', 'profil-judul-seksi', teks);
    /** Pesan hasil telaah terakhir (disimpan, stok kurang) yang tetap terlihat setelah resep siap dan kunjungan maju. */
    const infoTelaah = () => [
        ...(telaahInfo ? [peringatan(telaahInfo, 'biru')] : []),
        ...(telaahKekurangan.length ? [(() => { const p = peringatan(FARMASI.telaah.stokKurangJudul); for (const x of telaahKekurangan) { const b = buat('div', null, FARMASI.telaah.stokKurang(x.nama, x.butuh, x.tersedia)); p.append(b); } return p; })()] : []),
    ];
    function isiTelaah(bungkus, daftar) {
        muatObat();
        if (obatGalat) return bungkus.append(peringatan(obatGalat)), bungkus;
        if (!obatMaster) return bungkus.append(redup(T.memuat)), bungkus;
        // Isian telaah diambil dari resep tersimpan sekali (dan lagi setelah disimpan); selanjutnya isian apoteker yang dipakai.
        if (!telaahSinkron) { telaah = Object.fromEntries(daftar.map((r) => [r.id, { ...awalTelaah(r.telaah), catatan: r.telaah?.catatan ?? r.catatan ?? '', siap: resepTerkunci(r), item: barisDariItem(r.item) }])); telaahSinkron = true; }
        bungkus.append(FormTelaah({
            daftar, isian: telaah, obat: obatMaster, konteks, galatKonteks: !konteks, kekurangan: telaahKekurangan, dicoba: telaahDicoba, memproses: telaahProses, galat: telaahGalat, info: telaahInfo,
            onUbah(id, p) { telaah = { ...telaah, [id]: { ...telaah[id], ...p } }; telaahInfo = null; },
            onSimpan: () => void kirimTelaah(),
        }));
        return bungkus;
    }
    async function kirimTelaah() {
        const daftar = data.resep?.nilai ?? [];
        telaahDicoba = true;
        if (daftar.filter((r) => !resepTerkunci(r)).some((r) => Object.keys(galatIsianTelaah(telaah[r.id])).length)) { telaahGalat = FARMASI.telaah.periksaIsian; telaahInfo = null; lukis(); return; }
        telaahProses = true; telaahGalat = telaahInfo = null; lukis();
        const kurang = []; let tersimpan = 0, berubah = false;
        try {
            await simpanSeluruhTelaah(daftar, telaah, {
                telaah: telaahResep, siapkan: siapkanResep,
                tersimpan(baru) { berubah = true; data.resep = { nilai: data.resep.nilai.map((x) => (x.id === baru.id ? baru : x)) }; telaah = { ...telaah, [baru.id]: { ...telaah[baru.id], item: barisDariItem(baru.item) } }; },
                kekurangan(h) { kurang.push(...h); }, selesaiResep() { tersimpan += 1; },
            });
            telaahInfo = FARMASI.telaah.tersimpanSemua;
        }
        catch (e) { telaahGalat = `${tersimpan ? `${tersimpan} resep sudah disimpan. ` : ''}${pesanGalat(e, FARMASI.telaah.gagal)} Isian tetap tersedia; simpan kembali untuk melanjutkan.`; }
        finally {
            telaahKekurangan = kurang; telaahProses = false;
            if (aktif) { if (berubah) { await muat(); onBerubah(); } lukis(); lukisKepala(); }
        }
    }
    const blokPlan = (r) => `${T.resep.judulPlan}:\n${teksPlanResep(r, obatMaster ?? [])}`;
    function isiResep() {
        const R = T.resep, bungkus = buat('div', 'profil-kolom');
        muatData('resep', () => resepKunjungan(kunjunganId));
        const d = data.resep;
        if (d.memuat) return bungkus.append(redup(T.memuat)), bungkus;
        if (d.galat) return bungkus.append(peringatan(d.galat)), bungkus;
        const ada = d.nilai[0] ?? null;
        // Apoteker menelaah resep di sini setelah pemeriksaan diselesaikan (tahap resep), sebelum kunjungan maju ke kasir.
        // Dokter mengubah resep sampai apoteker mulai menelaahnya (termasuk setelah pemeriksaan diselesaikan); apoteker menelaah di tahap resep.
        const tahapSekarang = klinis.kunjungan.tahap_layanan;
        const bolehUbah = mode().ubah && boleh('resep', 'input') && ['menunggu_skrining', 'pemeriksaan', 'resep'].includes(tahapSekarang) && (!ada || (ada.status === 'diajukan' && !ada.telaah));
        const bolehTelaah = boleh('farmasi', 'input') && tahapSekarang === 'resep' && d.nilai.some((r) => !resepTerkunci(r));
        if (bolehTelaah && (!bolehUbah || modeResep === 'telaah')) return isiTelaah(bungkus, d.nilai);
        for (const x of infoTelaah()) bungkus.append(x);
        const kepalaResep = (r) => { const h = buat('div', 'profil-kotak-kepala'); h.append(buat('strong', null, r.nomor_resep), lencana(r.status === 'diajukan' ? R.menungguFarmasi : STATUS_RESEP.label(r.status), STATUS_RESEP.warna(r.status))); return h; };
        if (!bolehUbah) {
            // Sesudah pemeriksaan diselesaikan (atau tanpa izin) resep hanya dibaca. Status sudah ada di kepala panel; kotak kepala hanya bila ada >1 resep.
            if (!d.nilai.length) bungkus.append(redup(R.kosong));
            for (const r of d.nilai) { const kotak = buat('div', 'profil-kotak'); if (d.nilai.length > 1) kotak.append(kepalaResep(r)); kotak.append(TampilanResep({ resep: r })); bungkus.append(kotak); }
            if (ada && mode().ubah && boleh('resep', 'input')) bungkus.append(redup(R.terkunci));
            return bungkus;
        }
        muatObat();
        if (obatGalat) return bungkus.append(peringatan(obatGalat)), bungkus;
        if (!obatMaster) return bungkus.append(redup(T.memuat)), bungkus;
        // Formulir diisi dari resep tersimpan sekali (dan lagi setelah disimpan); selanjutnya isian pengguna yang dipakai.
        if (!resepSinkron) { resep = ada ? resepDariServer(ada) : awalResep(); resepSinkron = true; }
        const kotak = buat('div', 'profil-kotak');
        const simpan = tombol(resepProses ? R.mengajukan : ada ? R.simpanUbah : R.ajukan, () => void kirimResep());
        simpan.style.alignSelf = 'flex-start';
        // Resep yang sudah diajukan: tombol simpan hanya muncul bila isian berbeda dari resep tersimpan.
        const asal = ada ? JSON.stringify(resepDariServer(ada)) : null;
        const segarkanSimpan = () => { simpan.disabled = resepProses || !adaIsianResep(resep); simpan.hidden = asal !== null && JSON.stringify(resep) === asal; };
        segarkanSimpan();
        // Editor menggambar ulang dirinya sendiri; panel hanya mencatat isian dan membuka tombol simpan.
        const form = LangkahResep({ resep, obat: obatMaster, onUbah(p) { resep = { ...resep, ...p }; resepPesan = null; segarkanSimpan(); }, galat: galatResep(resep), tampilGalat: resepTampilGalat, disabled: resepProses });
        kotak.append(form);
        if (resepGalat) kotak.append(peringatan(resepGalat));
        if (resepPesan) kotak.append(peringatan(resepPesan, 'hijau'));
        kotak.append(simpan); bungkus.append(kotak);
        return bungkus;
    }
    /** Penutup (tagihan, pembayaran, serah obat, tutup kunjungan) dibuat sekali dan dipakai ulang supaya isian pembayaran tidak hilang saat berpindah tab. */
    function isiPenutup() {
        if (!penutup) penutup = PanelPenutup({ kunjunganId, pasien, ringkas, klinis: () => klinis, onBerubah: () => { void muat(); onBerubah(); }, onKepala: () => { if (aktif && sub === 'penutup') lukisKepala(); } });
        penutup.perbarui();
        return penutup;
    }
    function isiTindakan() {
        const R = T.resep, bungkus = buat('div', 'profil-kolom');
        const item = klinis.bagian.tindakan.isi?.item ?? [];
        // Seperti resep: dapat diubah selama pemeriksaan berjalan (sesudah skrining) dan belum diselesaikan. Status dan tombol Persetujuan ada di kepala panel.
        const bolehUbah = mode().ubah && klinis.kunjungan.tahap_layanan === 'pemeriksaan';
        if (!bolehUbah) {
            if (!item.length) bungkus.append(redup(R.tindakanKosong));
            else {
                const t = tabel([{ judul: R.kolom.kode }, { judul: R.kolom.nama }, { judul: R.kolom.jumlah }, { judul: R.kolom.waktu }], R.tindakan);
                for (const x of item) t.tbody.append(baris(sel(x.kode), sel(x.nama), sel(String(x.jumlah ?? 1)), sel(tanggalWaktuPendek(x.mulai))));
                bungkus.append(t.el);
            }
            if (mode().ubah && item.length) bungkus.append(redup(R.tindakanTerkunci));
            return bungkus;
        }
        // Formulir diisi dari catatan tersimpan sekali (dan lagi setelah disimpan); selanjutnya isian pengguna yang dipakai.
        if (!tindakanSinkron) { tindakan = barisDariTindakan(item); tindakanSinkron = true; }
        const kotak = buat('div', 'profil-kotak');
        const simpan = tombol(tindakanProses ? R.menyimpan : R.simpanTindakan, () => void kirimTindakan());
        simpan.disabled = tindakanProses; simpan.style.alignSelf = 'flex-start';
        const editor = EditorTindakan({
            idAwal: 'tindakan', baris: tindakan, galat: galatTindakan(tindakan), tampilGalat: tindakanTampilGalat, disabled: tindakanProses,
            onUbah(b) { tindakan = b; tindakanPesan = null; if (tindakanTampilGalat) editor.perbarui({ galat: galatTindakan(b) }); }
        });
        kotak.append(editor, redup(R.tindakanUbahKet));
        if (tindakanGalat) kotak.append(peringatan(tindakanGalat));
        if (tindakanPesan) kotak.append(peringatan(tindakanPesan, 'hijau'));
        kotak.append(simpan); bungkus.append(kotak);
        return bungkus;
    }
    async function kirimTindakan() {
        if (Object.keys(galatTindakan(tindakan)).length) { tindakanTampilGalat = true; tindakanGalat = null; tindakanPesan = null; lukis(); return; }
        tindakanProses = true; tindakanGalat = null; tindakanPesan = null; lukis();
        try {
            const h = await simpanBagian(kunjunganId, 'tindakan', bentukIsiTindakan(tindakan)); if (!aktif) return;
            klinis = { kunjungan: h.kunjungan, bagian: { ...klinis.bagian, tindakan: h.bagian } };
            tindakanSinkron = false; tindakanTampilGalat = false;
            tindakanPesan = [h.tersimpan === false ? S.tanpaPerubahan : T.resep.tindakanTersimpan, h.pesan_tagihan].filter(Boolean).join(' ');
            lukisKepala(); onBerubah();
        }
        catch (e) { if (aktif) tindakanGalat = pesanGalat(e, S.gagal); }
        finally { tindakanProses = false; if (aktif) lukis(); }
    }
    /** Master obat aktif dimuat sekali untuk memilih obat resep. */
    function muatObat() {
        if (obatMaster || obatMemuat || obatGalat) return;
        obatMemuat = true;
        semuaMasterObatAktif().then((d) => { obatMaster = d; }).catch((e) => { obatGalat = pesanGalat(e, T.resep.gagalMuat); }).finally(() => { obatMemuat = false; if (aktif && sub === 'resep') lukis(); });
    }
    async function kirimResep() {
        const g = Object.values(galatResep(resep))[0];
        if (g) { resepGalat = null; resepTampilGalat = true; resepPesan = null; lukis(); return; }
        resepProses = true; resepGalat = null; resepPesan = null; lukis();
        try {
            const diajukan = resep, lama = data.resep?.nilai?.[0] ?? null;
            await simpanResep(kunjunganId, bentukResep(diajukan)); if (!aktif) return;
            // Plan mengikuti resep: blok resep sebelumnya diganti yang baru (atau ditambahkan bila belum ada); draf tersimpan bersama catatan saat Selesaikan.
            const plan = perbaruiPlan(k.plan, lama ? blokPlan(resepDariServer(lama)) : null, blokPlan(diajukan), MAKS_NARASI.plan);
            if (plan !== null) { k = { ...k, plan }; catatDraf(); }
            resepSinkron = false; resepTampilGalat = false; data.resep = null;
            resepPesan = lama ? (plan !== null ? T.resep.diperbarui : T.resep.diperbaruiPlanPenuh) : (plan !== null ? T.resep.diajukan : T.resep.diajukanPlanPenuh);
            onBerubah();
            if (subSah.includes('pemeriksaan')) {
                pesan = resepPesan;
                el.pilihSub('pemeriksaan');
                onSub?.('pemeriksaan');
            }
        }
        catch (e) { if (aktif) resepGalat = pesanGalat(e, GALAT.umum); }
        finally { resepProses = false; if (aktif) { lukis(); lukisKepala(); } }
    }
    function isiPenunjang() {
        const P = T.penunjang, bungkus = buat('div', 'profil-kolom');
        muatData('penunjang', () => ordersKunjungan(kunjunganId));
        const d = data.penunjang;
        if (d.memuat) bungkus.append(redup(T.memuat));
        else if (d.galat) bungkus.append(peringatan(d.galat));
        else if (!d.nilai.length) bungkus.append(redup(P.kosong));
        else bungkus.append(DaftarOrderLab({ orders: d.nilai }));
        return bungkus;
    }

    function isiBangsal() {
        if (!bangsalPanel) bangsalPanel = PanelBangsal({ kunjunganId, pasien, bolehInput: boleh('klinis', 'input'), onBerubah: () => { void muat(); onBerubah(); } });
        return bangsalPanel;
    }

    /** Melukis ulang isi tab aktif; fokus dan posisi kursor isian dipulihkan karena formulir dibangun ulang tiap perubahan. */
    function lukis() {
        if (!aktif) return;
        const fokus = document.activeElement, id = isi.contains(fokus) ? fokus.id : '', mulai = fokus?.selectionStart, akhir = fokus?.selectionEnd;
        isi.setAttribute('aria-labelledby', `tab-kunjungan-${sub}`);
        if (galatMuat) isi.replaceChildren(peringatan(galatMuat));
        else if (!klinis) isi.replaceChildren(redup(KLINIS.detail.memuat));
        else isi.replaceChildren(terbatas ? (sub === 'penutup' ? isiPenutup() : isiPenunjang()) : sub === 'bangsal' ? isiBangsal() : sub === 'resep' ? isiResep() : sub === 'tindakan' ? isiTindakan() : sub === 'penutup' ? isiPenutup() : sub === 'penunjang' ? isiPenunjang() : isiPemeriksaan());
        if (id) {
            const f = document.getElementById(id);
            f?.focus({ preventScroll: true });
            if (mulai != null && f?.setSelectionRange) { try { f.setSelectionRange(mulai, akhir); } catch { /* tipe isian tanpa seleksi */ } }
        }
    }
    async function muat() {
        const awalKosong = !klinis;
        if (terbatas) { klinis = { kunjungan: ringkas, bagian: {} }; galatMuat = null; lukis(); lukisKepala(); return; }
        try {
            const [hasilKlinis, ctx] = await Promise.all([ambilKlinis(kunjunganId), ambilKonteksKlinis(kunjunganId).catch(() => null)]);
            if (!aktif) return;
            klinis = hasilKlinis; konteks = ctx; galatMuat = null; setelKeadaan(); mulaiDraf(); data.resep = data.penunjang = null; kasirKepala = null; cetakSiap = false; resepSinkron = false; tindakanSinkron = false; telaahSinkron = false;
        }
        catch (e) { if (aktif) galatMuat = pesanGalat(e, KLINIS.detail.gagal); }
        if (aktif) {
            lukis(); lukisKepala();
            if (awalKosong && klinis) { isi.classList.remove('profil-masuk'); void isi.offsetWidth; isi.classList.add('profil-masuk'); }
        }
    }

    /** Ada isian pemeriksaan yang belum disimpan (selain yang sudah ada di server). */
    el.adaDraf = () => !!klinis && bisaDraf() && JSON.stringify(bentukDraf(k, tensiTeks)) !== JSON.stringify(awalDraf);
    el.buangDraf = () => draf?.hapus();
    el.pilihSub = (baru) => {
        if (!subSah.includes(baru) || baru === sub) return;
        sub = baru; tabs.pilih(`kunjungan-${sub}`); lukis(); lukisKepala();
        isi.classList.remove('profil-masuk'); void isi.offsetWidth; isi.classList.add('profil-masuk');
    };
    el.tutup = () => { aktif = false; tutupMenuCetak(); penutup?.tutup(); bangsalPanel?.tutup(); draf?.tutup(); tutupModal(); };
    lukis(); void muat();
    return el;
}
