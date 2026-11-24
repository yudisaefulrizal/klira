import { kabarkanLayarPanggilan } from '../../layar-panggilan/domain/kanal.js';
import { kabarkanNotifikasi } from '../../notifikasi/domain/kanal.js';
import { ANTREAN_LAB, REGISTRASI, TAHAP_LAYANAN, bolehAksiAntrean, bolehPindahTahap, kodeAntrean, tanggalWib, TRANSISI_ANTREAN } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { AntreanDitutupError, KunjunganBerjalanError } from '../data-access/repositori.js';
import { kosongJadiNull } from '../../../umum/nilai.js';
/** `antreanBpjs` (opsional): mengabarkan antrean pasien JKN ke BPJS setelah daftar, panggil, dan batal; tidak pernah menggagalkan tindakan. */
export function buatLayananKunjungan({ repo, audit, orderLab, sinkronIhs, antreanBpjs, sekarang = () => new Date() }) {
    return {
        opsi(p) {
            return repo.opsi();
        },
        /** Pendaftaran kunjungan rawat jalan atau langsung rawat inap; antrean otomatis untuk rawat jalan. */
        async daftarkan(p, m, alamat) {
            if (!(await repo.pasienAda(m.pasien_id)))
                return gagal('tidak_ditemukan', REGISTRASI.galat.pasienTidakAda);
            let jenisPoli = null;
            if (m.jenis === 'LAB') {
                // Penunjang saja: tanpa poli dan dokter; antrean jenis Laboratorium (awalan L); pemeriksaan wajib dan harus sah.
                const ids = [...new Set(m.pemeriksaan_ids ?? [])];
                if (!ids.length || (await repo.pemeriksaanLabAktif(ids)) !== ids.length)
                    return gagal('tidak_valid', REGISTRASI.galat.pemeriksaanTidakSah, 'pemeriksaan_ids');
                m = { ...m, pemeriksaan_ids: ids, dpjp_id: undefined };
                jenisPoli = { jenis_poli: ANTREAN_LAB.jenis_poli, awalan: ANTREAN_LAB.awalan };
            }
            if (m.jenis === 'AMB') {
                jenisPoli = await repo.jenisPoliOperasional(m.jenis_poli);
                if (!jenisPoli)
                    return gagal('tidak_valid', REGISTRASI.galat.poliTidakSah, 'jenis_poli');
            }
            if (m.dpjp_id && !(await repo.dpjpSah(m.dpjp_id)))
                return gagal('tidak_valid', REGISTRASI.galat.dpjpTidakSah, 'dpjp_id');
            if (m.dpjp_id && jenisPoli && !(await repo.dokterDiJenis(m.dpjp_id, jenisPoli.jenis_poli))) {
                return gagal('tidak_valid', REGISTRASI.galat.dokterBukanPoli, 'dpjp_id');
            }
            if (await repo.kunjunganBerjalan(m.pasien_id))
                return gagal('konflik', REGISTRASI.galat.kunjunganBerjalan);
            let k;
            try {
                k = await repo.daftarkan(p.id, { ...m, ...(jenisPoli ?? {}), nomor_sep: kosongJadiNull(m.nomor_sep), keluhan_singkat: kosongJadiNull(m.keluhan_singkat) }, sekarang());
            }
            catch (e) {
                if (e instanceof KunjunganBerjalanError)
                    return gagal('konflik', REGISTRASI.galat.kunjunganBerjalan);
                if (e instanceof AntreanDitutupError)
                    return gagal('konflik', 'Antrean poli sedang ditutup. Buka antrean terlebih dahulu untuk mendaftarkan pasien rawat jalan atau penunjang.');
                throw e;
            }
            if (m.jenis === 'LAB') {
                // Order lab dan item tagihannya dibuat dari tarif tes; pemeriksaan sudah divalidasi di atas.
                const o = await orderLab(p, k.id, { pemeriksaan_ids: m.pemeriksaan_ids, prioritas: 'rutin', catatan: null }, alamat);
                if (!o.ok)
                    return o;
            }
            kabarkanLayarPanggilan();
            await audit.catat({
                pengguna_id: p.id, aksi: 'input', entitas: 'kunjungan', entitas_id: k.id,
                keterangan: `Pendaftaran kunjungan ${m.jenis}${k.antrean ? ` antrean ${k.antrean.kode}` : ''}${m.sumber === 'mobile_jkn' ? ' lewat Mobile JKN' : ''}`, alamat,
            });
            // Pasien yang belum punya IHS Number dicari lagi saat kunjungan (mis. SATUSEHAT baru dikonfigurasi); gagal tidak menggagalkan pendaftaran.
            const satusehat = sinkronIhs ? { satusehat: await sinkronIhs(p, m.pasien_id, { alamat }) } : {};
            const bpjs = antreanBpjs ? { antrean_bpjs: await antreanBpjs.setelahDaftar(p, k) } : {};
            return { ok: true, data: { ...k, ...satusehat, ...bpjs } };
        },
        /** Maju satu tahap layanan (skrining, pemeriksaan, resep, kasir); penutupan kunjungan punya peristiwanya sendiri. */
        async ubahTahap(p, id, ke, alamat) {
            const dari = await repo.tahapSekarang(id);
            if (!dari)
                return gagal('tidak_ditemukan', REGISTRASI.galat.kunjunganTidakAda);
            if (!bolehPindahTahap(dari, ke))
                return gagal('konflik', REGISTRASI.galat.tahapTidakSah, 'tahap');
            const k = await repo.ubahTahap(id, dari, ke);
            if (!k)
                return gagal('konflik', REGISTRASI.galat.tahapTidakSah, 'tahap');
            kabarkanLayarPanggilan();
            if (dari === 'menunggu_skrining' && ke === 'pemeriksaan') {
                kabarkanNotifikasi({
                    tipe: 'skrining_selesai',
                    pelakuId: p.id,
                    dpjpId: k.dpjp_id ?? null,
                    kunjunganId: k.id,
                    nomorAntrean: k.antrean?.kode ?? null,
                });
            }
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kunjungan', entitas_id: id, keterangan: `Tahap layanan ${dari} menjadi ${ke}`, alamat });
            return { ok: true, data: k };
        },
        /** Mengubah dokter (DPJP) kunjungan rawat jalan selama pasien belum diperiksa dokter. */
        async ubahDpjp(p, id, dpjpId, alamat) {
            const k = await repo.detailUntukUbahDpjp(id);
            if (!k)
                return gagal('tidak_ditemukan', REGISTRASI.galat.kunjunganTidakAda);
            const antreanStatus = k.antrean?.status;
            if (k.jenis !== 'AMB' || !['menunggu_skrining', 'pemeriksaan'].includes(k.tahap_layanan) || ['dilayani', 'selesai', 'batal'].includes(antreanStatus)) {
                return gagal('konflik', 'Dokter hanya dapat diubah sebelum pasien diperiksa dokter.');
            }
            if (dpjpId) {
                if (!(await repo.dpjpSah(dpjpId)))
                    return gagal('tidak_valid', REGISTRASI.galat.dpjpTidakSah, 'dpjp_id');
                if (k.antrean?.jenis_poli && !(await repo.dokterDiJenis(dpjpId, k.antrean.jenis_poli)))
                    return gagal('tidak_valid', REGISTRASI.galat.dokterBukanPoli, 'dpjp_id');
            }
            const hasil = await repo.ubahDpjp(id, dpjpId ?? null, p.id, sekarang());
            kabarkanLayarPanggilan();
            if (k.tahap_layanan === 'pemeriksaan' && dpjpId && dpjpId !== k.dpjp_id) {
                kabarkanNotifikasi({
                    tipe: 'skrining_selesai',
                    pelakuId: p.id,
                    dpjpId,
                    kunjunganId: id,
                    nomorAntrean: k.antrean?.kode ?? null,
                });
            }
            await audit.catat({
                pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kunjungan', entitas_id: id,
                keterangan: `Dokter tujuan (DPJP) diubah${dpjpId ? ` menjadi pengguna ${dpjpId}` : ' menjadi tanpa dokter pilihan'}`, alamat,
            });
            return { ok: true, data: hasil };
        },
        /** Panggil, mulai, selesai, atau batalkan antrean sesuai perpindahan status yang sah. */
        async aksiAntrean(p, id, aksi, alamat, lokasiPilihan) {
            const status = await repo.statusAntrean(id);
            if (!status)
                return gagal('tidak_ditemukan', REGISTRASI.galat.antreanTidakAda);
            if (!bolehAksiAntrean(status, aksi))
                return gagal('konflik', REGISTRASI.galat.antreanTidakSah);
            // Setelah daftar pasien langsung ke skrining; dokter baru memanggil pasien yang sudah diskrining.
            if (aksi === 'panggil' && (await repo.tahapAntrean(id)) === 'menunggu_skrining')
                return gagal('konflik', REGISTRASI.galat.belumSkrining);
            const t = TRANSISI_ANTREAN[aksi];
            const hasil = await repo.ubahAntrean(id, aksi, t.dari, t.ke, sekarang(), lokasiPilihan);
            if (!hasil)
                return gagal('konflik', REGISTRASI.galat.antreanTidakSah);
            if (hasil.galat === 'poli_sibuk')
                return gagal('konflik', REGISTRASI.galat.poliSibuk(hasil.poli, hasil.kode));
            if (hasil.galat === 'ruang_sibuk')
                return gagal('konflik', REGISTRASI.galat.poliSibukJenis(hasil.jenis));
            if (hasil.galat === 'dokter_sibuk')
                return gagal('konflik', REGISTRASI.galat.dokterSibuk(hasil.kode));
            if (hasil.galat === 'ruang_pilihan_tidak_tersedia')
                return gagal('konflik', REGISTRASI.galat.ruangBukanPoli);
            if (hasil.galat === 'ruang_tidak_operasional')
                return gagal('konflik', REGISTRASI.galat.ruangTidakOperasional(hasil.jenis));
            if (hasil.galat === 'poli_tidak_operasional')
                return gagal('konflik', REGISTRASI.galat.poliTidakOperasional(hasil.poli));
            kabarkanLayarPanggilan();
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'antrean', entitas_id: id, keterangan: `Antrean ${hasil.kode}: ${aksi} (${status} menjadi ${t.ke})${p.sistem === 'mobile_jkn' ? ' lewat Mobile JKN' : ''}`, alamat });
            const bpjs = antreanBpjs ? { antrean_bpjs: await antreanBpjs.setelahAksi(p, id, aksi) } : {};
            return { ok: true, data: { ...hasil, ...bpjs } };
        },
        /** Daftar antrean satu hari (bawaan hari ini menurut zona Asia/Jakarta). */
        async daftarAntrean(p, f) {
            const tanggal = f.tanggal ?? tanggalWib(sekarang());
            const { total, baris } = await repo.daftarAntrean({ ...f, tanggal });
            return { data: baris, halaman: f.halaman, ukuran: f.ukuran, total };
        },
        /** Status sesi antrean saat ini (buka/tutup) dan daftar tunggu sementara Mobile JKN. */
        async keadaanSesi(p) {
            const [sesi, sementara] = await Promise.all([
                repo.sesiAntreanTerakhir(),
                repo.daftarAntreanSementaraJkn(),
            ]);
            return {
                sesi: sesi ? { id: sesi.id, status: sesi.status, dibuka_pada: sesi.dibuka_pada.toISOString(), ditutup_pada: sesi.ditutup_pada?.toISOString() ?? null } : { id: null, status: 'tutup', dibuka_pada: null, ditutup_pada: null },
                antrean_sementara_jkn: sementara.map((s) => ({
                    id: s.id, pasien_id: s.pasien_id, pasien_nama: s.pasien_nama, pasien_nomor_rm: s.pasien_nomor_rm,
                    jenis_poli: s.jenis_poli, pcare_no_urut: s.pcare_no_urut, jkn_nomor_kartu: s.jkn_nomor_kartu,
                    tanggal_daftar: s.tanggal_daftar instanceof Date ? s.tanggal_daftar.toISOString().slice(0, 10) : String(s.tanggal_daftar),
                    dibuat_pada: s.dibuat_pada.toISOString(),
                })),
            };
        },
        /** Membuka sesi antrean baru dan otomatis memindahkan antrean sementara Mobile JKN ke antrean aktif. */
        async bukaAntrean(p, alamat) {
            const waktu = sekarang();
            const h = await repo.bukaSesiAntrean(p.id, waktu);
            if (h.galat === 'sudah_buka')
                return gagal('konflik', 'Antrean sudah dalam keadaan dibuka.');
            let dipindahkan = 0;
            for (const s of h.sementara ?? []) {
                const res = await this.daftarkan(
                    { ...p, sistem: 'mobile_jkn' },
                    { pasien_id: s.pasien_id, jenis: 'AMB', jenis_poli: s.jenis_poli, cara_pembayaran: 'jkn', keluhan_singkat: s.keluhan_singkat ?? undefined, sumber: 'mobile_jkn', pcare_no_urut: s.pcare_no_urut },
                    alamat,
                );
                if (res.ok) {
                    await repo.tandaiSementaraJknDipindahkan(s.id, res.data.id, waktu);
                    dipindahkan += 1;
                }
            }
            kabarkanLayarPanggilan();
            await audit.catat({ pengguna_id: p.id, aksi: 'input', entitas: 'sesi_antrean', entitas_id: h.sesi.id, keterangan: `Buka sesi antrean (${dipindahkan} antrean sementara Mobile JKN dipindahkan)`, alamat });
            return { ok: true, data: { sesi: { id: h.sesi.id, status: h.sesi.status, dibuka_pada: h.sesi.dibuka_pada.toISOString(), ditutup_pada: null }, dipindahkan } };
        },
        /** Menutup sesi antrean aktif; ditolak jika masih ada pasien yang belum selesai atau dibatalkan. */
        async tutupAntrean(p, alamat) {
            const waktu = sekarang();
            const h = await repo.tutupSesiAntrean(p.id, waktu);
            if (h.galat === 'sudah_tutup')
                return gagal('konflik', 'Antrean sudah dalam keadaan ditutup.');
            if (h.galat === 'belum_selesai') {
                const contoh = h.belum_selesai.slice(0, 5).map((b) => `${kodeAntrean(b.nomor, b.awalan)} ${b.pasien_nama} (${TAHAP_LAYANAN.label(b.tahap_layanan)})`).join(', ');
                const sisa = h.belum_selesai.length > 5 ? ` dan ${h.belum_selesai.length - 5} lainnya` : '';
                return gagal('konflik', `Antrean belum dapat ditutup karena masih ada ${h.belum_selesai.length} pasien belum selesai: ${contoh}${sisa}. Koordinasikan dengan petugas terkait untuk menyelesaikan atau membatalkannya.`);
            }
            kabarkanLayarPanggilan();
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'sesi_antrean', entitas_id: h.sesi_id, keterangan: 'Tutup sesi antrean', alamat });
            return { ok: true, data: { status: 'tutup', ditutup_pada: waktu.toISOString() } };
        },
    };
}
