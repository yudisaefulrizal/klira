import { kabarkanLayarPanggilan } from '../../layar-panggilan/domain/kanal.js';
import { BAGIAN_NARASI, BAGIAN_KLINIS, GALAT, KEDALUWARSA_DRAF_KLINIS_JAM, KLINIS, SKEMA_BAGIAN } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { keDto } from '../../rekam-medis/domain/layanan.js';
import { BentrokVersiError } from '../data-access/repositori.js';
/** Tahap yang masih menerima catatan klinis; setelah kasir, perubahan lewat perbaikan catatan (Rekam medis). */
export const TAHAP_BOLEH_CATAT = ['menunggu_skrining', 'pemeriksaan', 'resep'];
/** Bagian yang wajib tersimpan sebelum pemeriksaan diselesaikan. */
export const BAGIAN_WAJIB_SELESAI = ['anamnesis', 'diagnosis', 'tindak_lanjut'];
const ADA_ISI = (bagian, isi) => bagian === 'diagnosis' || bagian === 'tindakan' ? (isi?.item.length ?? 0) > 0 : isi !== null;
export function buatLayananKlinis({ repo, audit, pengesahan, kunjungan, sekarang = () => new Date() }) {
    const kedaluwarsaMs = KEDALUWARSA_DRAF_KLINIS_JAM * 3_600_000;
    // Penyedia isi untuk deteksi perubahan setelah pengesahan: entitas = nama bagian, entitas_id = id kunjungan.
    for (const bagian of BAGIAN_KLINIS)
        pengesahan.daftarkanPenyedia(bagian, (fas, id) => repo.bacaBagian(fas, id, bagian));
    async function bagianDto(fasyankesId, kunjunganId, bagian) {
        const [isi, k] = await Promise.all([repo.bacaBagian(fasyankesId, kunjunganId, bagian), pengesahan.keadaan(fasyankesId, bagian, kunjunganId)]);
        return {
            bagian,
            isi: k.pengesahan || ADA_ISI(bagian, isi) ? isi : null,
            pengesahan: k.pengesahan ? keDto(k.pengesahan) : null,
            verifikasi: k.status,
        };
    }
    const catatLihat = (p, entitas, id, keterangan, alamat) => audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas, entitas_id: id, keterangan, alamat });
    return {
        /** Semua bagian catatan klinis kunjungan beserta keadaan pengesahannya; dicatat `lihat` sebelum dilepas. */
        async ambil(p, kunjunganId, alamat) {
            const k = await repo.kunjunganDto(p.fasyankes_id, kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const daftar = await Promise.all(BAGIAN_KLINIS.map((b) => bagianDto(p.fasyankes_id, kunjunganId, b)));
            await catatLihat(p, 'catatan_klinis', kunjunganId, 'Membuka catatan klinis kunjungan', alamat);
            return { ok: true, data: { kunjungan: k, bagian: Object.fromEntries(daftar.map((d) => [d.bagian, d])) } };
        },
        /** Rekam medis rawat jalan satu kunjungan untuk dicetak (P8): catatan klinis dan data pendukung; dicatat `lihat` sebagai pencetakan. */
        async cetak(p, kunjunganId, alamat) {
            const data = await repo.dataCetak(p.fasyankes_id, kunjunganId);
            const k = data && (await repo.kunjunganDto(p.fasyankes_id, kunjunganId));
            if (!data || !k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const daftar = await Promise.all(BAGIAN_KLINIS.map((b) => bagianDto(p.fasyankes_id, kunjunganId, b)));
            await catatLihat(p, 'catatan_klinis', kunjunganId, 'Mencetak rekam medis rawat jalan kunjungan', alamat);
            return {
                ok: true,
                data: {
                    ...data, klinis: { kunjungan: k, bagian: Object.fromEntries(daftar.map((d) => [d.bagian, d])) },
                    dicetak_oleh: await repo.namaPengguna(p.id), dicetak_pada: sekarang().toISOString(),
                },
            };
        },
        /** Simpan satu bagian = pengesahan (7): isi berversi, hash isi, jenis akun pengesah; perbaikan butuh alasan. Tanpa perubahan tidak menulis apa pun. */
        async simpanBagian(p, kunjunganId, bagian, isiMentah, alasan, alamat, opsi = {}) {
            const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            // Perbaikan catatan yang sudah disahkan boleh pada kunjungan yang sudah ditutup (PMK 24/2022 P30); isian baru tidak.
            if (!opsi.perbaikan && !TAHAP_BOLEH_CATAT.includes(k.tahap_layanan))
                return gagal('konflik', KLINIS.galat.kunjunganTertutup);
            const h = SKEMA_BAGIAN[bagian].safeParse(isiMentah);
            if (!h.success) {
                return { ok: false, kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: h.error.issues.map((i) => ({ jalur: ['isi', ...i.path].join('.'), pesan: i.message })) };
            }
            let isi = h.data;
            if (bagian === 'tindakan') {
                const t = isi;
                const item = t.item.map((x) => ({ ...x, performer_id: x.performer_id ?? p.id }));
                for (const id of new Set(item.map((x) => x.performer_id))) {
                    if (!(await repo.penggunaAda(p.fasyankes_id, id)))
                        return gagal('tidak_valid', KLINIS.galat.pelaksanaTidakSah, 'isi.item');
                }
                const tarifIds = [...new Set(item.flatMap((x) => (x.tarif_layanan_id ? [x.tarif_layanan_id] : [])))];
                const sah = new Map((await repo.tarifTindakanSah(p.fasyankes_id, tarifIds)).map((t) => [t.id, t.kode_icd9cm]));
                if (tarifIds.some((id) => !sah.has(id)))
                    return gagal('tidak_valid', KLINIS.galat.tarifTindakanTidakAda, 'isi.item');
                // Kode tindakan bertarif harus sama dengan kode ICD-9-CM tindakan klinik itu (P5), agar kode klaim dan tagihan tidak menyimpang.
                if (item.some((x) => x.tarif_layanan_id && sah.get(x.tarif_layanan_id) !== x.kode))
                    return gagal('tidak_valid', KLINIS.galat.kodeTarifTidakCocok, 'isi.item');
                isi = { item };
            }
            // Bagian narasi yang belum pernah diisi tidak menghasilkan catatan kosong.
            if (BAGIAN_NARASI.includes(bagian) && isi.isi === null
                && (await pengesahan.keadaan(p.fasyankes_id, bagian, kunjunganId)).status === 'belum_disahkan') {
                return { ok: true, data: { bagian: await bagianDto(p.fasyankes_id, kunjunganId, bagian), kunjungan: (await repo.kunjunganDto(p.fasyankes_id, kunjunganId)), tersimpan: false } };
            }
            const rencana = await pengesahan.siapkan({
                fasyankesId: p.fasyankes_id, pelakuId: p.id, fitur: 'klinis', entitas: bagian, entitasId: kunjunganId, isiBaru: isi, alasan, disetujuiOleh: opsi.disetujuiOleh,
                bacaIsiSekarang: () => repo.bacaBagian(p.fasyankes_id, kunjunganId, bagian),
            });
            if (!rencana.ok)
                return rencana;
            const dto = (await repo.kunjunganDto(p.fasyankes_id, kunjunganId));
            if (rencana.data.jenis === 'sama')
                return { ok: true, data: { bagian: await bagianDto(p.fasyankes_id, kunjunganId, bagian), kunjungan: dto, tersimpan: false } };
            const { rencana: r } = rencana.data;
            try {
                await repo.simpanBagian({ fasyankesId: p.fasyankes_id, kunjunganId, bagian, isi, oleh: p.id, pengesahan: { ...r, fasyankesId: p.fasyankes_id, entitas: bagian, entitasId: kunjunganId } });
            }
            catch (e) {
                if (e instanceof BentrokVersiError)
                    return gagal('konflik', KLINIS.galat.bentrok);
                throw e;
            }
            kabarkanLayarPanggilan(p.fasyankes_id);
            const perbaikan = r.versi > 1;
            await audit.catat({
                fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: perbaikan ? 'perbaikan' : 'input', entitas: bagian, entitas_id: kunjunganId,
                keterangan: `${perbaikan ? 'Perbaikan' : 'Simpan'} dan sahkan ${bagian} versi ${r.versi}`, alamat,
            });
            // Tindakan dokter menjadi item tagihan (P5); bila tagihan terkunci, tindakan tetap tersimpan dan pengguna diberi pesan untuk kasir.
            let pesanTagihan = null;
            if (bagian === 'tindakan') {
                const s = await repo.sinkronTagihanTindakan(p.fasyankes_id, kunjunganId, p.id, isi.item);
                if (s === 'terkunci')
                    pesanTagihan = KLINIS.tindakan.tagihanTerkunci;
                else if (s === 'disinkron') {
                    await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'tagihan', entitas_id: kunjunganId, keterangan: `Item tagihan tindakan disinkronkan dari pencatatan tindakan versi ${r.versi}`, alamat });
                }
            }
            // Mulai mengisi catatan di tahap skrining berarti pemeriksaan dimulai: maju satu tahap (gagal diam bila sudah berpindah).
            if (k.tahap_layanan === 'menunggu_skrining')
                await kunjungan.ubahTahap(p, kunjunganId, 'pemeriksaan', alamat);
            const baru = (await repo.kunjunganDto(p.fasyankes_id, kunjunganId));
            return { ok: true, data: { bagian: await bagianDto(p.fasyankes_id, kunjunganId, bagian), kunjungan: baru, tersimpan: true, pesan_tagihan: pesanTagihan } };
        },
        /** Selesaikan pemeriksaan: anamnesis, diagnosis, dan tindak lanjut harus sudah disahkan; maju ke resep atau kasir. */
        async selesai(p, kunjunganId, tahap, alamat) {
            const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            if (k.tahap_layanan !== 'pemeriksaan')
                return gagal('konflik', KLINIS.galat.tahapSelesai);
            for (const b of BAGIAN_WAJIB_SELESAI) {
                if ((await pengesahan.keadaan(p.fasyankes_id, b, kunjunganId)).status !== 'sah')
                    return gagal('konflik', KLINIS.galat.syaratSelesai);
            }
            const hasil = await kunjungan.ubahTahap(p, kunjunganId, tahap, alamat);
            if (hasil.ok)
                await repo.hapusDraf(p.fasyankes_id, kunjunganId); // pemeriksaan selesai: draf tidak lagi berguna
            return hasil;
        },
        /** Draf alur klinis milik pengguna ini; kedaluwarsa dibuang. Isi draf sengaja tidak dicatat di audit. */
        async bacaDraf(p, kunjunganId, alur) {
            if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const d = await repo.bacaDraf(p.fasyankes_id, p.id, alur, kunjunganId);
            if (!d)
                return { ok: true, data: null };
            if (sekarang().getTime() - d.diperbarui_pada.getTime() > kedaluwarsaMs) {
                await repo.hapusDraf(p.fasyankes_id, kunjunganId, p.id, alur);
                return { ok: true, data: null };
            }
            return { ok: true, data: { alur, kunjungan_id: kunjunganId, langkah: d.langkah, isi: d.isi, diperbarui_pada: d.diperbarui_pada.toISOString() } };
        },
        async simpanDraf(p, kunjunganId, alur, m) {
            const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            // Draf catatan klinis hanya selama catatan masih diterima; draf hasil lab dan persetujuan mengikuti kunjungan yang belum ditutup.
            const alurCatatan = alur === 'pemeriksaan-klinis' || alur === 'skrining';
            if (alurCatatan ? !TAHAP_BOLEH_CATAT.includes(k.tahap_layanan) : k.tahap_layanan === 'ditutup')
                return gagal('konflik', KLINIS.galat.kunjunganTertutup);
            const d = await repo.simpanDraf({ fasyankesId: p.fasyankes_id, penggunaId: p.id, alur, kunjunganId, pasienId: k.pasien_id, langkah: m.langkah, isi: m.isi, sekarang: sekarang() });
            return { ok: true, data: { alur, kunjungan_id: kunjunganId, langkah: d.langkah, isi: d.isi, diperbarui_pada: d.diperbarui_pada.toISOString() } };
        },
        async hapusDraf(p, kunjunganId, alur) {
            if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await repo.hapusDraf(p.fasyankes_id, kunjunganId, p.id, alur);
            return { ok: true, data: { kunjungan_id: kunjunganId } };
        },
        /** Ringkasan pasien untuk kepala modal (identitas, alergi, diagnosis aktif, tanda vital terakhir); dicatat `lihat`. */
        async konteks(p, kunjunganId, alamat) {
            const d = await repo.konteks(p.fasyankes_id, kunjunganId);
            if (!d)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await catatLihat(p, 'pasien', d.pasien.id, 'Membuka ringkasan klinis pasien', alamat);
            return { ok: true, data: d };
        },
        /** Riwayat kunjungan sebelumnya pasien, ringkas dan dibatasi 20; dicatat `lihat`. */
        async riwayat(p, pasienId, kecualiKunjunganId, alamat) {
            const d = await repo.riwayatPasien(p.fasyankes_id, pasienId, kecualiKunjunganId, 20);
            if (!d)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await catatLihat(p, 'pasien', pasienId, 'Membuka riwayat kunjungan pasien', alamat);
            return { ok: true, data: d };
        },
        /** Isi kunjungan sebelumnya (anamnesis, diagnosis, tindakan) untuk disalin sebagai draf; tidak menyimpan apa pun. */
        async salinan(p, kunjunganId, sumberId, alamat) {
            const [k, s] = await Promise.all([repo.kunjungan(p.fasyankes_id, kunjunganId), repo.kunjungan(p.fasyankes_id, sumberId)]);
            if (!k || !s)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            if (k.id === s.id || k.pasien_id !== s.pasien_id)
                return gagal('tidak_valid', KLINIS.galat.sumberTidakSah);
            const d = await repo.salinan(p.fasyankes_id, sumberId);
            if (!d)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await catatLihat(p, 'catatan_klinis', sumberId, 'Menyalin catatan dari kunjungan sebelumnya', alamat);
            return { ok: true, data: d };
        },
        kamusTerminologi: (q) => repo.kamusTerminologi(q),
        cariTerminologi(q) {
            return repo.cariTerminologi(q.sistem, q.q, q.batas);
        },
        /** Daftar tindakan klinik (tarif tindakan aktif) untuk pencarian tindakan; tanpa data pasien. */
        tindakanKlinik: (p, cari, batas) => repo.tindakanKlinik(p.fasyankes_id, cari, batas),
        daftarFavorit: (p, jenis) => repo.daftarFavorit(p.fasyankes_id, p.id, jenis),
        async tambahFavorit(p, d) {
            const f = await repo.tambahFavorit(p.fasyankes_id, p.id, { ...d, kode: d.kode.trim(), nama: d.nama.trim() });
            return f ? { ok: true, data: f } : gagal('konflik', KLINIS.galat.favoritGanda);
        },
        async ubahUrutanFavorit(p, id, urutan) {
            const f = await repo.ubahUrutanFavorit(p.fasyankes_id, p.id, id, urutan);
            return f ? { ok: true, data: f } : gagal('tidak_ditemukan', KLINIS.galat.favoritTidakAda);
        },
        async hapusFavorit(p, id) {
            return (await repo.hapusFavorit(p.fasyankes_id, p.id, id)) ? { ok: true, data: { id } } : gagal('tidak_ditemukan', KLINIS.galat.favoritTidakAda);
        },
        daftarTemplat: (p, bagian) => repo.daftarTemplat(p.fasyankes_id, p.id, bagian),
        async tambahTemplat(p, m) {
            return { ok: true, data: await repo.tambahTemplat(p.fasyankes_id, p.id, { bagian: m.bagian, nama: m.nama, isi: m.isi }) };
        },
        async hapusTemplat(p, id) {
            return (await repo.hapusTemplat(p.fasyankes_id, p.id, id)) ? { ok: true, data: { id } } : gagal('tidak_ditemukan', KLINIS.galat.templatTidakAda);
        },
        /** Ringkasan keluarga: wali dan anggota yang juga pasien; anggota berpenanda privasi tanpa identitas. Dicatat `lihat`. */
        async folderKeluarga(p, pasienId, alamat) {
            if (!(await repo.pasienAda(p.fasyankes_id, pasienId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const d = await repo.folderKeluarga(p.fasyankes_id, pasienId);
            await catatLihat(p, 'pasien', pasienId, 'Membuka family folder', alamat);
            return { ok: true, data: d };
        },
        async tautkanKeluarga(p, pasienId, d, alamat) {
            if (d.anggota_pasien_id === pasienId)
                return gagal('tidak_valid', KLINIS.galat.diriSendiri, 'anggota_pasien_id');
            const [a, b] = await Promise.all([repo.pasienAda(p.fasyankes_id, pasienId), repo.pasienAda(p.fasyankes_id, d.anggota_pasien_id)]);
            if (!a)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            if (!b)
                return gagal('tidak_ditemukan', KLINIS.galat.anggotaTidakAda, 'anggota_pasien_id');
            const k = await repo.tautkanKeluarga(p.fasyankes_id, p.id, pasienId, { ...d, hubungan: d.hubungan.trim() });
            if (!k)
                return gagal('konflik', KLINIS.galat.keluargaGanda);
            await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: 'keluarga_pasien', entitas_id: k.id, keterangan: 'Menautkan anggota keluarga', alamat });
            return { ok: true, data: k };
        },
        async ubahKeluarga(p, pasienId, id, d, alamat) {
            const k = await repo.ubahKeluarga(p.fasyankes_id, pasienId, id, { ...d, ...(d.hubungan !== undefined ? { hubungan: d.hubungan.trim() } : {}) });
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.keluargaTidakAda);
            await audit.catat({
                fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'keluarga_pasien', entitas_id: id,
                keterangan: d.dibatasi === undefined ? 'Mengubah hubungan anggota keluarga' : `Penanda privasi anggota keluarga ${d.dibatasi ? 'dipasang' : 'dilepas'}`, alamat,
            });
            return { ok: true, data: k };
        },
    };
}
