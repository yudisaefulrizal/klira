import { BAGIAN_SOAPIE, CARA_PEMBAYARAN, alergiTercatat, FARMASI, GALAT, KESADARAN, KLINIS, LABEL_NARASI, MAKS_NARASI, PENUNJANG, PERSETUJUAN_TINDAKAN, PROFIL_PASIEN, REKAM_MEDIS, STATUS_PENGESAHAN, STATUS_RESEP, TAHAP_LAYANAN } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { ambilKlinis, ambilKonteksKlinis, selesaikanPemeriksaan, simpanBagian } from '../../api-klien/klinis.js';
import { resepKunjungan, semuaMasterObatAktif, siapkanResep, simpanResep, telaahResep } from '../../api-klien/farmasi.js';
import { ordersKunjungan } from '../../api-klien/penunjang.js';
import { ambilDokumen } from '../../api-klien/dokumen-rm.js';
import { token } from '../../gaya/token.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { InfoPengesahan } from '../../komponen/klinis/info-pengesahan.js';
import { bidang, lencana, peringatan, tab, tabel, baris, sel, tombol } from '../../komponen/ui/primitif.js';
import { DaftarRingkasan, PasanganRingkasan } from '../../komponen/ui/susunan.js';
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
import { DaftarOrderLab } from '../../modal/penunjang/daftar-order-lab.js';
import { bukaPersetujuanTindakan } from '../../modal/pemeriksaan/persetujuan-tindakan.js';
import { bukaOrderLab } from '../../modal/penunjang/order-lab.js';
import { bukaAmbilSpesimen } from '../../modal/penunjang/ambil-spesimen.js';
import { bukaHasilLab } from '../../modal/penunjang/hasil-lab.js';
import { menungguSpesimen } from '../../modal/penunjang/keadaan-spesimen.js';
import { menungguHasil } from '../../modal/penunjang/keadaan-hasil-lab.js';
import { bukaCetakRekamMedis } from '../../modal/rekam-medis/cetak-rekam-medis.js';
import { bukaResumeSurat } from '../../modal/rekam-medis/resume-surat.js';
import { tanggalWaktuPendek } from '../../util/format.js';
import { SUB_TAB, bentukDraf, modeCatatan, parseTensi, pelaksana, teksTensi, terapkanDraf } from './keadaan-profil-pasien.js';
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
    const subSah = terbatas ? subTerbatas : SUB_TAB;
    let aktif = true, sub = subSah.includes(subAwal) ? subAwal : subSah[0], klinis = null, konteks = null, galatMuat = null, k = null, awal = null, tensiTeks = '', modal;
    let tampilGalat = false, galat = null, pesan = null, memproses = false, alasan = '';
    let resep = awalResep(), resepGalat = null, resepPesan = null, resepProses = false, resepTampilGalat = false, obatMaster = null, obatGalat = null, obatMemuat = false, resepSinkron = false;
    let penutup = null;
    let modeResep = 'telaah';
    let telaah = {}, telaahSinkron = false, telaahGalat = null, telaahInfo = null, telaahKekurangan = [], telaahProses = false, telaahDicoba = false;
    let tindakan = [], tindakanSinkron = false, tindakanGalat = null, tindakanPesan = null, tindakanProses = false, tindakanTampilGalat = false;
    // Data tab pendamping dimuat saat tabnya pertama dibuka, lalu dipakai ulang sampai ada perubahan.
    const data = { resep: null, penunjang: null, dokumen: null };

    const tabs = tab(subSah.map((id) => ({ id: `kunjungan-${id}`, label: T.tab[id] })), `kunjungan-${sub}`, T.riwayat.judul, (id) => onSub(id.replace('kunjungan-', '')));
    navTab.append(tabs.el);

    const mode = () => modeCatatan(klinis.kunjungan, boleh);
    const server = () => keadaanDariServer(klinis.bagian);
    function setelKeadaan() {
        k = server();
        awal = k; alasan = ''; tampilGalat = false; tensiTeks = teksTensi(k.tanda_vital); awalDraf = bentukDraf(k, tensiTeks);
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
    const ubah = (p) => { k = { ...k, ...p }; pesan = null; catatDraf(); lukis(); };
    /** Bagian yang bisa disimpan dari halaman ini menurut tahap kunjungan: tanda vital dan/atau enam catatan SOAPIE. */
    const bagianUbah = () => [...(mode().ubahVital ? ['tanda_vital', 'keperawatan'] : []), ...(mode().ubah ? [...BAGIAN_SOAPIE, 'diagnosis'] : [])];
    const rencana = () => rencanaSimpanBagian(bagianUbah(), k, server(), disahkanDari(klinis.bagian));
    const idKolom = (bagian) => (bagian === 'tanda_vital' ? 'tv-suhu' : bagian === 'keperawatan' ? 'profil-alergi' : bagian === 'diagnosis' ? 'diagnosis-cari' : `narasi-${bagian}`);
    const tutupModal = () => { modal?.tutup(); modal = undefined; };
    const pasienRingkas = { id: pasien.id, nama: pasien.nama, nomor_rm: pasien.nomor_rm };

    function lukisKepala() {
        kepala.replaceChildren();
        if (!klinis) return;
        // Alergi tampil di kepala pasien (sejajar dengan identitas): isian skrining kunjungan ini, atau yang tercatat sebelumnya.
        const sini = klinis.bagian.keperawatan?.isi?.alergi;
        onAlergi?.(sini?.trim() ? alergiTercatat(sini) : (konteks?.alergi ?? null));
        const kj = klinis.kunjungan;
        const tanda = buat('div', 'profil-panel-tanda');
        tanda.append(lencana(TAHAP_LAYANAN.label(kj.tahap_layanan), TAHAP_LAYANAN.warna(kj.tahap_layanan)), lencana(CARA_PEMBAYARAN.label(kj.cara_pembayaran), 'abu'));
        if (terbatas) { kepala.append(tanda); return; }
        const cetak = tombol(T.soapie.cetak, () => { tutupModal(); modal = bukaCetakRekamMedis({ kunjunganId, onTutup() { modal = undefined; } }); }, 'sekunder');
        kepala.append(tanda, cetak);
    }

    // --- Tab Pemeriksaan (formulir SOAPIE dua kolom) ---
    const S = T.soapie;
    const barisForm = (label, kontrol, ...tambahan) => {
        const b = buat('div', 'profil-form-baris'), l = buat('label', null, label), sisi = buat('div', 'profil-form-sisi');
        l.htmlFor = kontrol.id; sisi.append(kontrol, ...tambahan.filter(Boolean)); b.append(l, sisi); return b;
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
    const galatDi = (bagian) => (tampilGalat ? rencana().find((r) => r.bagian === bagian)?.galat ?? null : null);
    const kecil = (teks, kelas = 'profil-redup') => buat('small', kelas, teks);
    function teksSoapie(bagian, m, rows) {
        const g = galatDi(bagian), sah = penandaSah(klinis.bagian[bagian]);
        const c = isian(`narasi-${bagian}`, k[bagian], { boleh: m.ubah, baris: rows, maxLength: MAKS_NARASI[bagian], onInput: (v) => ubah({ [bagian]: v }) });
        if (g) c.setAttribute('aria-invalid', 'true');
        // Diagnosis ICD-10 berada di baris Asesmen, di bawah teks bebasnya.
        const dx = bagian === 'asesmen' ? EditorDiagnosis({ diagnosis: k.diagnosis, disabled: !m.ubah, galat: galatDi('diagnosis'), onUbah(diagnosis) { ubah({ diagnosis }); } }) : null;
        const baris = barisForm(LABEL_NARASI[bagian], c, g && kecil(g, 'profil-galat'), sah, dx);
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
        grid.append(...['suhu', 'tinggi_badan', 'berat_badan', 'tensi', 'respirasi', 'nadi', 'spo2', 'gcs', 'kesadaran'].map((x) => selVital(x, m)));
        const g = !parseTensi(tensiTeks).sah ? S.vital.galatTensi : galatDi('tanda_vital'), sah = penandaSah(klinis.bagian.tanda_vital);
        kotak.append(...[grid, g && kecil(g, 'profil-galat'), sah].filter(Boolean));
        return kotak;
    }
    function isiPemeriksaan() {
        const m = mode(), bungkus = buat('div', 'profil-soapie');
        if (!m.ubah) bungkus.append(peringatan(S.bacaSaja[m.alasan], 'biru'));
        if (m.alasan !== 'lab') {
            const form = buat('div', 'profil-form'), kiri = buat('div', 'profil-form-kolom'), kanan = buat('div', 'profil-form-kolom profil-form-kanan');
            const p = pelaksana(klinis.bagian, ['tanda_vital', ...BAGIAN_SOAPIE]), pengguna = penggunaSaatIni().pengguna;
            const dilakukan = isian('profil-dilakukan', p?.nama ?? (m.ubah || m.ubahVital ? pengguna?.nama ?? '' : '-'), { boleh: false });
            const profesi = isian('profil-profesi', [p?.jenis_akun, ringkas?.poli_nama].filter(Boolean).join(' · ') || '-', { boleh: false });
            const alergi = isian('profil-alergi', k.keperawatan.alergi, { boleh: m.ubahVital, maxLength: 500, onInput: (v) => ubah({ keperawatan: { ...k.keperawatan, alergi: v } }) });
            alergi.placeholder = konteks?.alergi ? S.alergiTercatat(konteks.alergi) : S.tanpaAlergi;
            const nomor = isian('profil-nomor-dokumen', klinis.kunjungan.nomor_dokumen ?? '-', { boleh: false });
            nomor.title = S.nomorDokumen; nomor.setAttribute('aria-label', S.nomorDokumen); nomor.classList.add('profil-form-nomor');
            const ganda = buat('div', 'profil-form-ganda'); ganda.append(nomor, dilakukan);
            const barisDilakukan = barisForm(S.dilakukan, ganda); barisDilakukan.querySelector('label').htmlFor = 'profil-dilakukan';
            const galatAlergi = galatDi('keperawatan');
            kiri.append(barisDilakukan, barisForm(S.profesi, profesi), teksSoapie('subjek', m, 3), teksSoapie('objek', m, 3), tandaVital(m));
            kanan.append(barisForm(S.alergi, alergi, galatAlergi && kecil(galatAlergi, 'profil-galat')), teksSoapie('asesmen', m, 3), teksSoapie('plan', m, 3), teksSoapie('instruksi', m, 3), teksSoapie('evaluasi', m, 3));
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
            // Selama kunjungan belum ditutup tidak ada alasan yang diminta; sesudah ditutup setiap perubahan wajib beralasan.
            if (m.tutup && r.length) {
                const f = bidang({ id: 'soapie-alasan', label: S.alasan, jenis: 'textarea', nilai: alasan, maxLength: 500, ubah(v) { alasan = v; } });
                f.kontrol.style.height = '56px'; // pendek: kolom ini menempel di bawah dan tidak boleh menutupi formulir
                kaki.append(f.el, redup(S.alasanKet));
                if (tampilGalat && !alasan.trim()) f.setGalat(S.alasanWajib);
            }
            // Satu tombol untuk petugas skrining maupun dokter: Selesaikan menyimpan isian; di tahap skrining itu menyelesaikan skrining, di tahap
            // pemeriksaan ikut diselesaikan. Di tahap pemeriksaan tombol selalu bisa ditekan (kekurangan dilaporkan saat ditekan); di tahap lain hanya bila ada isian baru.
            const selesai = tombol(memproses ? S.menyimpan : tahapKerja ? S.selesaikan : S.simpanPerubahan, () => void selesaikan());
            selesai.disabled = memproses || (!(m.ubah && tahap === 'pemeriksaan') && !r.length);
            // Di luar tahap kerja (setelah pemeriksaan selesai) tombol Simpan perubahan hanya muncul bila ada perubahan.
            if (!tahapKerja && !r.length) return kaki;
            const baris = buat('div', 'profil-soapie-tombol'); baris.append(selesai); kaki.append(baris);
        }
        return kaki;
    }
    /** Selesaikan = simpan dan sahkan isian yang berubah, lalu (tahap pemeriksaan) selesaikan pemeriksaan. */
    async function selesaikan() {
        if (memproses) return;
        const sebut = (teks, kolom) => { tampilGalat = true; galat = teks; pesan = null; lukis(); if (kolom) document.getElementById(kolom)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); };
        if (!parseTensi(tensiTeks).sah) return void (sebut(S.vital.galatTensi), document.getElementById('tv-tensi')?.focus());
        const r = rencana(), masalah = r.find((x) => x.galat);
        if (masalah) return void sebut(masalah.galat, idKolom(masalah.bagian));
        if (mode().tutup && r.length && !alasan.trim()) return void sebut(S.alasanWajib);
        const tahap = klinis.kunjungan.tahap_layanan, kurang = ['subjek', 'diagnosis'].find((b) => klinis.bagian[b].verifikasi !== 'sah' && !r.some((x) => x.bagian === b));
        // Di tahap pemeriksaan Selesaikan menuntut Subjek dan Diagnosis ICD-10 (Asesmen boleh kosong); di tahap menunggu skrining isian hanya disimpan (skrining selesai, kunjungan maju ke pemeriksaan) dan dokter memeriksa setelah memanggil.
        if (mode().ubah && tahap === 'pemeriksaan' && kurang) return void sebut(S.syaratSelesai, idKolom(kurang));
        const akanSelesai = mode().ubah && tahap === 'pemeriksaan';
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
        ambil().then((nilai) => { data[nama] = { nilai }; }).catch((e) => { data[nama] = { galat: pesanGalat(e, T[nama].gagal) }; }).finally(() => { if (aktif && sub === nama) lukis(); });
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
            if (aktif) { if (berubah) { await muat(); onBerubah(); } lukis(); }
        }
    }
    const blokPlan = (r) => `${T.resep.judulPlan}:\n${teksPlanResep(r, obatMaster ?? [])}`;
    function isiResep() {
        const R = T.resep, bungkus = buat('div', 'profil-kolom');
        muatData('resep', () => resepKunjungan(kunjunganId));
        bungkus.append(judulSeksi(R.judul));
        const d = data.resep;
        if (d.memuat) return bungkus.append(redup(T.memuat)), bungkus;
        if (d.galat) return bungkus.append(peringatan(d.galat)), bungkus;
        const ada = d.nilai[0] ?? null;
        // Apoteker menelaah resep di sini setelah pemeriksaan diselesaikan (tahap resep), sebelum kunjungan maju ke kasir.
        // Dokter mengubah resep sampai apoteker mulai menelaahnya (termasuk setelah pemeriksaan diselesaikan); apoteker menelaah di tahap resep.
        const tahapSekarang = klinis.kunjungan.tahap_layanan;
        const bolehUbah = mode().ubah && boleh('resep', 'input') && ['menunggu_skrining', 'pemeriksaan', 'resep'].includes(tahapSekarang) && (!ada || (ada.status === 'diajukan' && !ada.telaah));
        const bolehTelaah = boleh('farmasi', 'input') && tahapSekarang === 'resep' && d.nilai.some((r) => !resepTerkunci(r));
        // Akun yang memegang kedua peran memilih sendiri mode yang dikerjakan.
        if (bolehUbah && bolehTelaah) {
            const baris = buat('div', 'profil-chip-baris'); Object.assign(baris.style, { display: 'flex', gap: token.jarak.sm });
            for (const [nilai, label] of [['ubah', R.modeUbah], ['telaah', R.modeTelaah]]) { const b = tombol(label, () => { modeResep = nilai; lukis(); }, modeResep === nilai ? 'utama' : 'sekunder'); baris.append(b); }
            bungkus.append(baris);
        }
        if (bolehTelaah && (!bolehUbah || modeResep === 'telaah')) return isiTelaah(bungkus, d.nilai);
        for (const x of infoTelaah()) bungkus.append(x);
        const kepala = (r) => { const h = buat('div', 'profil-kotak-kepala'); h.append(buat('strong', null, r.nomor_resep), lencana(r.status === 'diajukan' ? R.menungguFarmasi : STATUS_RESEP.label(r.status), STATUS_RESEP.warna(r.status))); return h; };
        if (!bolehUbah) {
            // Sesudah pemeriksaan diselesaikan (atau tanpa izin) resep hanya dibaca.
            if (!d.nilai.length) bungkus.append(redup(R.kosong));
            for (const r of d.nilai) { const kotak = buat('div', 'profil-kotak'); kotak.append(kepala(r), TampilanResep({ resep: r })); bungkus.append(kotak); }
            if (ada && mode().ubah && boleh('resep', 'input')) bungkus.append(redup(R.terkunci));
            return bungkus;
        }
        muatObat();
        if (obatGalat) return bungkus.append(peringatan(obatGalat)), bungkus;
        if (!obatMaster) return bungkus.append(redup(T.memuat)), bungkus;
        // Formulir diisi dari resep tersimpan sekali (dan lagi setelah disimpan); selanjutnya isian pengguna yang dipakai.
        if (!resepSinkron) { resep = ada ? resepDariServer(ada) : awalResep(); resepSinkron = true; }
        const kotak = buat('div', 'profil-kotak');
        if (ada) kotak.append(kepala(ada));
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
        if (!penutup) penutup = PanelPenutup({ kunjunganId, klinis: () => klinis, onBerubah: () => { void muat(); onBerubah(); } });
        penutup.perbarui();
        return penutup;
    }
    function isiTindakan() {
        const R = T.resep, bungkus = buat('div', 'profil-kolom');
        const kepalaSeksi = buat('div', 'profil-kotak-kepala'); kepalaSeksi.append(judulSeksi(R.tindakan));
        // Persetujuan tindakan: alur bertahap di modal, hanya untuk kunjungan yang sedang berjalan.
        if (boleh('persetujuan', 'input') && !['menunggu_skrining', 'ditutup'].includes(klinis.kunjungan.tahap_layanan))
            kepalaSeksi.append(tombol(PERSETUJUAN_TINDAKAN.judul, () => { tutupModal(); modal = bukaPersetujuanTindakan({ kunjunganId, pasien: pasienRingkas, onTutup: tutupModal, onSelesai: tutupModal }); }, 'sekunder'));
        bungkus.append(kepalaSeksi);
        const item = klinis.bagian.tindakan.isi?.item ?? [];
        // Seperti resep: dapat diubah selama pemeriksaan berjalan (sesudah skrining) dan belum diselesaikan.
        const bolehUbah = mode().ubah && klinis.kunjungan.tahap_layanan === 'pemeriksaan';
        if (!bolehUbah) {
            if (!item.length) bungkus.append(redup(R.tindakanKosong));
            else {
                const t = tabel([{ judul: R.kolom.kode }, { judul: R.kolom.nama }, { judul: R.kolom.jumlah }, { judul: R.kolom.waktu }], R.tindakan);
                for (const x of item) t.tbody.append(baris(sel(x.kode), sel(x.nama), sel(String(x.jumlah ?? 1)), sel(tanggalWaktuPendek(x.mulai))));
                bungkus.append(t.el, InfoPengesahan({ bagian: klinis.bagian.tindakan }) ?? '');
            }
            if (mode().ubah && item.length) bungkus.append(redup(R.tindakanTerkunci));
            return bungkus;
        }
        // Formulir diisi dari catatan tersimpan sekali (dan lagi setelah disimpan); selanjutnya isian pengguna yang dipakai.
        if (!tindakanSinkron) { tindakan = barisDariTindakan(item); tindakanSinkron = true; }
        const kotak = buat('div', 'profil-kotak');
        const simpan = tombol(tindakanProses ? R.menyimpan : R.simpanTindakan, () => void kirimTindakan());
        simpan.disabled = tindakanProses; simpan.style.alignSelf = 'flex-start';
        const editor = EditorTindakan({ idAwal: 'tindakan', baris: tindakan, galat: galatTindakan(tindakan), tampilGalat: tindakanTampilGalat, disabled: tindakanProses,
            onUbah(b) { tindakan = b; tindakanPesan = null; if (tindakanTampilGalat) editor.perbarui({ galat: galatTindakan(b) }); } });
        kotak.append(editor, redup(R.tindakanUbahKet));
        if (tindakanGalat) kotak.append(peringatan(tindakanGalat));
        if (tindakanPesan) kotak.append(peringatan(tindakanPesan, 'hijau'));
        kotak.append(simpan); bungkus.append(kotak);
        if (item.length) bungkus.append(InfoPengesahan({ bagian: klinis.bagian.tindakan }) ?? '');
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
        }
        catch (e) { if (aktif) resepGalat = pesanGalat(e, GALAT.umum); }
        finally { resepProses = false; if (aktif) lukis(); }
    }
    function isiPenunjang() {
        const P = T.penunjang, bungkus = buat('div', 'profil-kolom'), kj = klinis.kunjungan;
        muatData('penunjang', () => ordersKunjungan(kunjunganId));
        const kepalaSeksi = buat('div', 'profil-kotak-kepala'); kepalaSeksi.append(judulSeksi(P.judul));
        if (boleh('klinis', 'input') && !['menunggu_skrining', 'ditutup'].includes(kj.tahap_layanan))
            kepalaSeksi.append(tombol(P.order, () => { tutupModal(); modal = bukaOrderLab({ kunjunganId, pasien: pasienRingkas, cara: kj.cara_pembayaran === 'jkn' ? 'jkn' : 'umum', onTutup: tutupModal, onSelesai() { tutupModal(); data.penunjang = null; lukis(); onBerubah(); } }); }, 'sekunder'));
        // Ambil spesimen dan Hasil lab muncul hanya bila ada order yang menunggu; kunjungan penunjang saja tetap bisa diisi hasilnya setelah Selesai.
        const dm = data.penunjang;
        if (boleh('penunjang', 'input') && dm.nilai && (kj.jenis === 'LAB' || kj.tahap_layanan !== 'menunggu_skrining')) {
            const sesudah = () => { tutupModal(); data.penunjang = null; lukis(); onBerubah(); };
            const buka = (fungsi) => () => { tutupModal(); modal = fungsi({ kunjunganId, pasien: pasienRingkas, onTutup: tutupModal, onSelesai: sesudah }); };
            if (menungguSpesimen(dm.nilai).length) kepalaSeksi.append(tombol(PENUNJANG.aksi.spesimen, buka(bukaAmbilSpesimen), 'sekunder'));
            if (menungguHasil(dm.nilai).length) kepalaSeksi.append(tombol(PENUNJANG.aksi.hasil, buka(bukaHasilLab), 'sekunder'));
        }
        bungkus.append(kepalaSeksi);
        const d = data.penunjang;
        if (d.memuat) bungkus.append(redup(T.memuat));
        else if (d.galat) bungkus.append(peringatan(d.galat));
        else if (!d.nilai.length) bungkus.append(redup(P.kosong));
        else bungkus.append(DaftarOrderLab({ orders: d.nilai }));
        return bungkus;
    }
    function isiDokumen() {
        const D = T.dokumen, R = REKAM_MEDIS.dok.resume, bungkus = buat('div', 'profil-kolom');
        muatData('dokumen', () => ambilDokumen(kunjunganId));
        const kepalaSeksi = buat('div', 'profil-kotak-kepala'); kepalaSeksi.append(judulSeksi(D.resume));
        if (boleh('klinis', 'input'))
            kepalaSeksi.append(tombol(D.kelola, () => { tutupModal(); modal = bukaResumeSurat({ kunjunganId, onTutup: tutupModal, onSelesai() { tutupModal(); data.dokumen = null; lukis(); } }); }, 'sekunder'));
        bungkus.append(kepalaSeksi);
        const d = data.dokumen;
        if (d.memuat) { bungkus.append(redup(T.memuat)); return bungkus; }
        if (d.galat) { bungkus.append(peringatan(d.galat)); return bungkus; }
        const resume = d.nilai.resume;
        if (!resume) bungkus.append(redup(D.resumeKosong));
        else {
            const r = resume.isi;
            bungkus.append(redup(`${R.versi(resume.versi)} · ${resume.verifikasi === 'sah' ? R.sah : R.berubah}`), DaftarRingkasan({ bagian: [{ judul: '', baris: [
                { label: D.ringkasan, nilai: r.ringkasan || '-' }, { label: D.diagnosis, nilai: r.diagnosis_akhir || '-' }, { label: D.terapi, nilai: r.terapi || '-' },
                { label: D.kondisi, nilai: r.kondisi_pulang || '-' }, { label: D.anjuran, nilai: r.anjuran || '-' },
            ] }] }));
        }
        bungkus.append(judulSeksi(D.surat));
        if (!d.nilai.surat.length) bungkus.append(redup(D.suratKosong));
        for (const s of d.nilai.surat) {
            const kotak = buat('div', 'profil-kotak'), kepalaSurat = buat('div', 'profil-kotak-kepala');
            kepalaSurat.append(buat('strong', null, s.nomor_surat), lencana(R.jenisSurat[s.jenis] ?? s.jenis, 'abu'));
            kotak.append(kepalaSurat, redup([s.tujuan, tanggalWaktuPendek(s.dibuat_pada)].filter(Boolean).join(' · '))); bungkus.append(kotak);
        }
        return bungkus;
    }

    /** Melukis ulang isi tab aktif; fokus dan posisi kursor isian dipulihkan karena formulir dibangun ulang tiap perubahan. */
    function lukis() {
        if (!aktif) return;
        const fokus = document.activeElement, id = isi.contains(fokus) ? fokus.id : '', mulai = fokus?.selectionStart, akhir = fokus?.selectionEnd;
        isi.setAttribute('aria-labelledby', `tab-kunjungan-${sub}`);
        if (galatMuat) isi.replaceChildren(peringatan(galatMuat));
        else if (!klinis) isi.replaceChildren(redup(KLINIS.detail.memuat));
        else isi.replaceChildren(terbatas ? (sub === 'penutup' ? isiPenutup() : isiPenunjang()) : sub === 'resep' ? isiResep() : sub === 'tindakan' ? isiTindakan() : sub === 'penutup' ? isiPenutup() : sub === 'penunjang' ? isiPenunjang() : sub === 'dokumen' ? isiDokumen() : isiPemeriksaan());
        if (id) {
            const f = document.getElementById(id);
            f?.focus({ preventScroll: true });
            if (mulai != null && f?.setSelectionRange) { try { f.setSelectionRange(mulai, akhir); } catch { /* tipe isian tanpa seleksi */ } }
        }
    }
    async function muat() {
        if (terbatas) { klinis = { kunjungan: ringkas, bagian: {} }; galatMuat = null; lukisKepala(); lukis(); return; }
        try {
            const [hasilKlinis, ctx] = await Promise.all([ambilKlinis(kunjunganId), ambilKonteksKlinis(kunjunganId).catch(() => null)]);
            if (!aktif) return;
            klinis = hasilKlinis; konteks = ctx; galatMuat = null; setelKeadaan(); mulaiDraf(); data.resep = data.penunjang = data.dokumen = null; resepSinkron = false; tindakanSinkron = false; telaahSinkron = false;
        }
        catch (e) { if (aktif) galatMuat = pesanGalat(e, KLINIS.detail.gagal); }
        if (aktif) { lukisKepala(); lukis(); }
    }

    el.pilihSub = (baru) => { if (!subSah.includes(baru) || baru === sub) return; sub = baru; tabs.pilih(`kunjungan-${sub}`); lukis(); };
    el.tutup = () => { aktif = false; penutup?.tutup(); draf?.tutup(); tutupModal(); };
    lukis(); void muat();
    return el;
}
