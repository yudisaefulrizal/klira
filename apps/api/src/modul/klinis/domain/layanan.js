import QRCode from 'qrcode';
import { kabarkanLayarPanggilan } from '../../layar-panggilan/domain/kanal.js';
import { BAGIAN_NARASI, BAGIAN_KLINIS, GALAT, KEDALUWARSA_DRAF_KLINIS_JAM, KLINIS, SKEMA_BAGIAN } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { keDto } from '../../rekam-medis/domain/layanan.js';
import { BentrokVersiError } from '../data-access/repositori.js';
/** Tahap yang masih menerima catatan klinis; setelah kasir, perubahan lewat perbaikan catatan (Rekam medis). */
export const TAHAP_BOLEH_CATAT = ['menunggu_skrining', 'pemeriksaan', 'resep'];
/** Bagian yang wajib tersimpan sebelum pemeriksaan diselesaikan: Subjek dan Asesmen pada catatan SOAPIE, serta diagnosis ICD-10 (satu utama). */
/** Asesmen tidak wajib: diagnosis ICD-10 yang terisi sudah memenuhi syarat asesmen. */
export const BAGIAN_WAJIB_SELESAI = ['subjek', 'diagnosis'];
const ADA_ISI = (bagian, isi) => bagian === 'diagnosis' || bagian === 'tindakan' ? (isi?.item.length ?? 0) > 0 : isi !== null;
/** Bagian catatan dokter: diisi atas nama dokter pendaftaran. Tanda vital dan skrining keperawatan tetap atas nama pengisinya. */
const BAGIAN_DOKTER = ['subjek', 'objek', 'asesmen', 'plan', 'instruksi', 'evaluasi', 'diagnosis'];
export function buatLayananKlinis({ repo, audit, pengesahan, kunjungan, sekarang = () => new Date() }) {
    const kedaluwarsaMs = KEDALUWARSA_DRAF_KLINIS_JAM * 3_600_000;
    // Penyedia isi untuk deteksi perubahan setelah pengesahan: entitas = nama bagian, entitas_id = id kunjungan.
    for (const bagian of BAGIAN_KLINIS)
        pengesahan.daftarkanPenyedia(bagian, (id) => repo.bacaBagian(id, bagian));
    async function bagianDto(kunjunganId, bagian) {
        const [isi, k] = await Promise.all([repo.bacaBagian(kunjunganId, bagian), pengesahan.keadaan(bagian, kunjunganId)]);
        return {
            bagian,
            isi: k.pengesahan || ADA_ISI(bagian, isi) ? isi : null,
            pengesahan: k.pengesahan ? keDto(k.pengesahan) : null,
            verifikasi: k.status,
        };
    }
    const catatLihat = (p, entitas, id, keterangan, alamat) => audit.catat({ pengguna_id: p.id, aksi: 'lihat', entitas, entitas_id: id, keterangan, alamat });
    return {
        /** Semua bagian catatan klinis kunjungan beserta keadaan pengesahannya; dicatat `lihat` sebelum dilepas. */
        async ambil(p, kunjunganId, alamat) {
            const k = await repo.kunjunganDto(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const daftar = await Promise.all(BAGIAN_KLINIS.map((b) => bagianDto(kunjunganId, b)));
            await catatLihat(p, 'catatan_klinis', kunjunganId, 'Membuka catatan klinis kunjungan', alamat);
            return { ok: true, data: { kunjungan: k, bagian: Object.fromEntries(daftar.map((d) => [d.bagian, d])) } };
        },
        /** Rekam medis rawat jalan satu kunjungan untuk dicetak (P8): catatan klinis dan data pendukung; dicatat `lihat` sebagai pencetakan. */
        async cetak(p, kunjunganId, alamat) {
            const data = await repo.dataCetak(kunjunganId);
            const k = data && (await repo.kunjunganDto(kunjunganId));
            if (!data || !k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const daftar = await Promise.all(BAGIAN_KLINIS.map((b) => bagianDto(kunjunganId, b)));
            await catatLihat(p, 'catatan_klinis', kunjunganId, 'Mencetak rekam medis rawat jalan kunjungan', alamat);
            const pengesahDokter = daftar
                .filter((x) => x.pengesahan && x.pengesahan.jenis_akun === 'Dokter/DPJP')
                .map((x) => x.pengesahan)
                .sort((a, b) => b.waktu.localeCompare(a.waktu))[0] ?? null;
            const teksQr = [
                `Dikeluarkan oleh ${data.fasyankes?.nama ?? 'Klira'}`,
                `Ditandatangani secara elektronik oleh ${pengesahDokter?.pengguna_nama ?? data.kepala?.dokter ?? '-'}`,
                `Pasien: ${data.pasien?.nama ?? '-'} (${data.pasien?.nomor_rm ?? '-'})`,
                `Kunjungan: ${k.id_layanan ?? k.id}`,
                ...(pengesahDokter ? [`Waktu Sah: ${pengesahDokter.waktu}`, `Hash: ${String(pengesahDokter.hash ?? '').slice(0, 16)}`] : []),
            ].join('\n');
            const tte_qr = await QRCode.toDataURL(teksQr, { width: 112, margin: 1 });
            return {
                ok: true,
                data: {
                    ...data, klinis: { kunjungan: k, bagian: Object.fromEntries(daftar.map((d) => [d.bagian, d])) },
                    dicetak_oleh: await repo.namaPengguna(p.id), dicetak_pada: sekarang().toISOString(),
                    tte_qr,
                    tte_pengesah: pengesahDokter ? { nama: pengesahDokter.pengguna_nama, waktu: pengesahDokter.waktu, hash: pengesahDokter.hash } : null,
                },
            };
        },
        /** Simpan satu bagian = pengesahan (7): isi berversi, hash isi, jenis akun pengesah; perbaikan butuh alasan. Tanpa perubahan tidak menulis apa pun. */
        async simpanBagian(p, kunjunganId, bagian, isiMentah, alasan, alamat, opsi = {}) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            // Catatan boleh diubah bebas selama kunjungan belum ditutup (tanpa alasan dan tanpa persetujuan); sesudah ditutup setiap perubahan wajib beralasan.
            const tutup = k.tahap_layanan === 'ditutup';
            if (tutup && !alasan?.trim())
                return gagal('tidak_valid', KLINIS.galat.alasanPerubahanTutup, 'alasan');
            const h = SKEMA_BAGIAN[bagian].safeParse(isiMentah);
            if (!h.success) {
                return { ok: false, kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: h.error.issues.map((i) => ({ jalur: ['isi', ...i.path].join('.'), pesan: i.message })) };
            }
            let isi = h.data;
            if (bagian === 'tindakan') {
                const t = isi;
                const item = t.item.map((x) => ({ ...x, performer_id: x.performer_id ?? p.id }));
                for (const id of new Set(item.map((x) => x.performer_id))) {
                    if (!(await repo.penggunaAda(id)))
                        return gagal('tidak_valid', KLINIS.galat.pelaksanaTidakSah, 'isi.item');
                }
                const tarifIds = [...new Set(item.flatMap((x) => (x.tarif_layanan_id ? [x.tarif_layanan_id] : [])))];
                const sah = new Map((await repo.tarifTindakanSah(tarifIds)).map((t) => [t.id, t.kode_icd9cm]));
                if (tarifIds.some((id) => !sah.has(id)))
                    return gagal('tidak_valid', KLINIS.galat.tarifTindakanTidakAda, 'isi.item');
                // Kode tindakan bertarif harus sama dengan kode ICD-9-CM tindakan klinik itu (P5), agar kode klaim dan tagihan tidak menyimpang.
                if (item.some((x) => x.tarif_layanan_id && sah.get(x.tarif_layanan_id) !== x.kode))
                    return gagal('tidak_valid', KLINIS.galat.kodeTarifTidakCocok, 'isi.item');
                isi = { item };
            }
            // Bagian narasi yang belum pernah diisi tidak menghasilkan catatan kosong.
            if (BAGIAN_NARASI.includes(bagian) && isi.isi === null
                && (await pengesahan.keadaan(bagian, kunjunganId)).status === 'belum_disahkan') {
                return { ok: true, data: { bagian: await bagianDto(kunjunganId, bagian), kunjungan: (await repo.kunjunganDto(kunjunganId)), tersimpan: false } };
            }
            // Dokter lain boleh mengisi, tetapi catatan tetap atas nama dokter yang dipilih saat pendaftaran; pelaku sebenarnya hanya tercatat di log audit.
            const dpjpId = k.peserta?.[0]?.pengguna_id ?? null;
            const atasNama = dpjpId && dpjpId !== p.id && BAGIAN_DOKTER.includes(bagian) && (await repo.penggunaDokter(p.id, sekarang())) ? dpjpId : p.id;
            const rencana = await pengesahan.siapkan({
                pelakuId: atasNama, fitur: 'klinis', entitas: bagian, entitasId: kunjunganId, isiBaru: isi, disetujuiOleh: opsi.disetujuiOleh, lewatiBatas: true,
                alasan: alasan?.trim() || (tutup ? undefined : KLINIS.alasanOtomatis),
                bacaIsiSekarang: () => repo.bacaBagian(kunjunganId, bagian),
            });
            if (!rencana.ok)
                return rencana;
            const dto = (await repo.kunjunganDto(kunjunganId));
            if (rencana.data.jenis === 'sama')
                return { ok: true, data: { bagian: await bagianDto(kunjunganId, bagian), kunjungan: dto, tersimpan: false } };
            const { rencana: r } = rencana.data;
            try {
                await repo.simpanBagian({ kunjunganId, bagian, isi, oleh: atasNama, pengesahan: { ...r, entitas: bagian, entitasId: kunjunganId } });
            }
            catch (e) {
                if (e instanceof BentrokVersiError)
                    return gagal('konflik', KLINIS.galat.bentrok);
                throw e;
            }
            kabarkanLayarPanggilan();
            const perbaikan = r.versi > 1;
            await audit.catat({
                pengguna_id: p.id, aksi: perbaikan ? 'perbaikan' : 'input', entitas: bagian, entitas_id: kunjunganId,
                keterangan: `${perbaikan ? 'Perbaikan' : 'Simpan'} dan sahkan ${bagian} versi ${r.versi}${atasNama !== p.id ? ` atas nama dokter pendaftaran (pengguna ${atasNama})` : ''}`, alamat,
            });
            // Tindakan dokter menjadi item tagihan (P5); bila tagihan terkunci, tindakan tetap tersimpan dan pengguna diberi pesan untuk kasir.
            let pesanTagihan = null;
            if (bagian === 'tindakan') {
                const s = await repo.sinkronTagihanTindakan(kunjunganId, p.id, isi.item);
                if (s === 'terkunci')
                    pesanTagihan = KLINIS.tindakan.tagihanTerkunci;
                else if (s === 'disinkron') {
                    await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'tagihan', entitas_id: kunjunganId, keterangan: `Item tagihan tindakan disinkronkan dari pencatatan tindakan versi ${r.versi}`, alamat });
                }
            }
            // Mulai mengisi catatan di tahap skrining berarti pemeriksaan dimulai: maju satu tahap (gagal diam bila sudah berpindah).
            if (k.tahap_layanan === 'menunggu_skrining')
                await kunjungan.ubahTahap(p, kunjunganId, 'pemeriksaan', alamat);
            const baru = (await repo.kunjunganDto(kunjunganId));
            return { ok: true, data: { bagian: await bagianDto(kunjunganId, bagian), kunjungan: baru, tersimpan: true, pesan_tagihan: pesanTagihan } };
        },
        /** Selesaikan pemeriksaan: anamnesis, diagnosis, dan tindak lanjut harus sudah disahkan; maju ke resep atau kasir. */
        async selesai(p, kunjunganId, tahap, alamat) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            if (k.tahap_layanan !== 'pemeriksaan')
                return gagal('konflik', KLINIS.galat.tahapSelesai);
            for (const b of BAGIAN_WAJIB_SELESAI) {
                if ((await pengesahan.keadaan(b, kunjunganId)).status !== 'sah')
                    return gagal('konflik', KLINIS.galat.syaratSelesai);
            }
            const hasil = await kunjungan.ubahTahap(p, kunjunganId, tahap, alamat);
            if (hasil.ok)
                await repo.hapusDraf(kunjunganId); // pemeriksaan selesai: draf tidak lagi berguna
            return hasil;
        },
        /** Draf alur klinis milik pengguna ini; kedaluwarsa dibuang. Isi draf sengaja tidak dicatat di audit. */
        async bacaDraf(p, kunjunganId, alur) {
            if (!(await repo.kunjungan(kunjunganId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const d = await repo.bacaDraf(p.id, alur, kunjunganId);
            if (!d)
                return { ok: true, data: null };
            if (sekarang().getTime() - d.diperbarui_pada.getTime() > kedaluwarsaMs) {
                await repo.hapusDraf(kunjunganId, p.id, alur);
                return { ok: true, data: null };
            }
            return { ok: true, data: { alur, kunjungan_id: kunjunganId, langkah: d.langkah, isi: d.isi, diperbarui_pada: d.diperbarui_pada.toISOString() } };
        },
        async simpanDraf(p, kunjunganId, alur, m) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            // Draf catatan klinis boleh pada semua tahap (catatan bisa diubah sampai dan sesudah ditutup, yang terakhir dengan alasan); draf hasil lab dan persetujuan mengikuti kunjungan yang belum ditutup.
            const alurCatatan = alur === 'pemeriksaan-klinis' || alur === 'skrining';
            if (!alurCatatan && k.tahap_layanan === 'ditutup')
                return gagal('konflik', KLINIS.galat.kunjunganTertutup);
            const d = await repo.simpanDraf({ penggunaId: p.id, alur, kunjunganId, pasienId: k.pasien_id, langkah: m.langkah, isi: m.isi, sekarang: sekarang() });
            return { ok: true, data: { alur, kunjungan_id: kunjunganId, langkah: d.langkah, isi: d.isi, diperbarui_pada: d.diperbarui_pada.toISOString() } };
        },
        async hapusDraf(p, kunjunganId, alur) {
            if (!(await repo.kunjungan(kunjunganId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await repo.hapusDraf(kunjunganId, p.id, alur);
            return { ok: true, data: { kunjungan_id: kunjunganId } };
        },
        /** Ringkasan pasien untuk kepala modal (identitas, alergi, diagnosis aktif, tanda vital terakhir); dicatat `lihat`. */
        async konteks(p, kunjunganId, alamat) {
            const d = await repo.konteks(kunjunganId);
            if (!d)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await catatLihat(p, 'pasien', d.pasien.id, 'Membuka ringkasan klinis pasien', alamat);
            return { ok: true, data: d };
        },
        /** Riwayat kunjungan pasien, ringkas; bawaan 20 terbaru (halaman Pasien meminta lebih banyak lewat `batas`); dicatat `lihat`. */
        async riwayat(p, pasienId, kecualiKunjunganId, alamat, batas = 20) {
            const d = await repo.riwayatPasien(pasienId, kecualiKunjunganId, batas);
            if (!d)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await catatLihat(p, 'pasien', pasienId, 'Membuka riwayat kunjungan pasien', alamat);
            return { ok: true, data: d };
        },
        /** Histori pemeriksaan rawat jalan pasien (SOAP, tanda vital, diagnosis) untuk tabel di bawah formulir Pemeriksaan; dicatat sebagai lihat. */
        async historiRawatJalan(p, pasienId, kecualiKunjunganId, alamat, batas = 20) {
            const d = await repo.historiRawatJalan(pasienId, kecualiKunjunganId, batas);
            if (!d)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            await catatLihat(p, 'pasien', pasienId, 'Membuka histori pemeriksaan rawat jalan pasien', alamat);
            return { ok: true, data: d };
        },
        /** Isi kunjungan sebelumnya (anamnesis, diagnosis, tindakan) untuk disalin sebagai draf; tidak menyimpan apa pun. */
        async salinan(p, kunjunganId, sumberId, alamat) {
            const [k, s] = await Promise.all([repo.kunjungan(kunjunganId), repo.kunjungan(sumberId)]);
            if (!k || !s)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            if (k.id === s.id || k.pasien_id !== s.pasien_id)
                return gagal('tidak_valid', KLINIS.galat.sumberTidakSah);
            const d = await repo.salinan(sumberId);
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
        tindakanKlinik: (p, cari, batas) => repo.tindakanKlinik(cari, batas),
        daftarFavorit: (p, jenis) => repo.daftarFavorit(p.id, jenis),
        async tambahFavorit(p, d) {
            const f = await repo.tambahFavorit(p.id, { ...d, kode: d.kode.trim(), nama: d.nama.trim() });
            return f ? { ok: true, data: f } : gagal('konflik', KLINIS.galat.favoritGanda);
        },
        async ubahUrutanFavorit(p, id, urutan) {
            const f = await repo.ubahUrutanFavorit(p.id, id, urutan);
            return f ? { ok: true, data: f } : gagal('tidak_ditemukan', KLINIS.galat.favoritTidakAda);
        },
        async hapusFavorit(p, id) {
            return (await repo.hapusFavorit(p.id, id)) ? { ok: true, data: { id } } : gagal('tidak_ditemukan', KLINIS.galat.favoritTidakAda);
        },
        daftarTemplat: (p, bagian) => repo.daftarTemplat(p.id, bagian),
        async tambahTemplat(p, m) {
            return { ok: true, data: await repo.tambahTemplat(p.id, { bagian: m.bagian, nama: m.nama, isi: m.isi }) };
        },
        async hapusTemplat(p, id) {
            return (await repo.hapusTemplat(p.id, id)) ? { ok: true, data: { id } } : gagal('tidak_ditemukan', KLINIS.galat.templatTidakAda);
        },
        /** Ringkasan keluarga: wali dan anggota yang juga pasien; anggota berpenanda privasi tanpa identitas. Dicatat `lihat`. */
        async folderKeluarga(p, pasienId, alamat) {
            if (!(await repo.pasienAda(pasienId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const d = await repo.folderKeluarga(pasienId);
            await catatLihat(p, 'pasien', pasienId, 'Membuka family folder', alamat);
            return { ok: true, data: d };
        },
        async tautkanKeluarga(p, pasienId, d, alamat) {
            if (d.anggota_pasien_id === pasienId)
                return gagal('tidak_valid', KLINIS.galat.diriSendiri, 'anggota_pasien_id');
            const [a, b] = await Promise.all([repo.pasienAda(pasienId), repo.pasienAda(d.anggota_pasien_id)]);
            if (!a)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            if (!b)
                return gagal('tidak_ditemukan', KLINIS.galat.anggotaTidakAda, 'anggota_pasien_id');
            const k = await repo.tautkanKeluarga(p.id, pasienId, { ...d, hubungan: d.hubungan.trim() });
            if (!k)
                return gagal('konflik', KLINIS.galat.keluargaGanda);
            await audit.catat({ pengguna_id: p.id, aksi: 'input', entitas: 'keluarga_pasien', entitas_id: k.id, keterangan: 'Menautkan anggota keluarga', alamat });
            return { ok: true, data: k };
        },
        async ubahKeluarga(p, pasienId, id, d, alamat) {
            const k = await repo.ubahKeluarga(pasienId, id, { ...d, ...(d.hubungan !== undefined ? { hubungan: d.hubungan.trim() } : {}) });
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.keluargaTidakAda);
            await audit.catat({
                pengguna_id: p.id, aksi: 'perbaikan', entitas: 'keluarga_pasien', entitas_id: id,
                keterangan: d.dibatasi === undefined ? 'Mengubah hubungan anggota keluarga' : `Penanda privasi anggota keluarga ${d.dibatasi ? 'dipasang' : 'dilepas'}`, alamat,
            });
            return { ok: true, data: k };
        },
        /** Odontogram kumulatif terakhir milik pasien (FDI + intraoral). */
        async bacaOdontogram(p, pasienId, alamat) {
            if (!(await repo.pasienAda(pasienId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const o = await repo.bacaOdontogram(pasienId);
            await catatLihat(p, 'odontogram_pasien', pasienId, 'Membuka odontogram pasien', alamat);
            return { ok: true, data: o ?? { pasien_id: pasienId, gigi: {}, intraoral: {}, diperbarui_pada: null } };
        },
        async simpanOdontogram(p, pasienId, d, alamat) {
            if (!(await repo.pasienAda(pasienId)))
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const o = await repo.simpanOdontogram(pasienId, d.kunjungan_id ?? null, d.gigi, d.intraoral, p.id);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'odontogram_pasien', entitas_id: o.id, keterangan: 'Memperbarui odontogram pasien', alamat });
            return { ok: true, data: o };
        },
        /** Data KIA terstruktur untuk kunjungan ini (atau nilai awal obstetri/KB dari riwayat terakhir pasien). */
        async bacaKia(p, kunjunganId, alamat) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const kia = await repo.bacaKia(kunjunganId, k.pasien_id);
            await catatLihat(p, 'kia_kunjungan', kunjunganId, 'Membuka catatan KIA kunjungan', alamat);
            return { ok: true, data: kia ?? { sumber: 'kosong', pasien_id: k.pasien_id, kunjungan_id: kunjunganId, layanan: 'anc', data: {} } };
        },
        async simpanKia(p, kunjunganId, d, alamat) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const kia = await repo.simpanKia(k.pasien_id, kunjunganId, d.layanan, d.data, p.id);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kia_kunjungan', entitas_id: kia.id, keterangan: 'Memperbarui catatan KIA kunjungan', alamat });
            return { ok: true, data: kia };
        },
        /** Catatan triase & survei primer UGD kunjungan. */
        async bacaUgd(p, kunjunganId, alamat) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const ugd = await repo.bacaUgd(kunjunganId);
            await catatLihat(p, 'ugd_kunjungan', kunjunganId, 'Membuka catatan triase UGD kunjungan', alamat);
            return { ok: true, data: ugd ?? { pasien_id: k.pasien_id, kunjungan_id: kunjunganId, triase: 'hijau', waktu_triase: null, data: {} } };
        },
        async simpanUgd(p, kunjunganId, d, alamat) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', KLINIS.galat.kunjunganTidakAda);
            const ugd = await repo.simpanUgd(k.pasien_id, kunjunganId, d.triase, d.data, p.id);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'ugd_kunjungan', entitas_id: ugd.id, keterangan: `Memperbarui triase UGD (${d.triase})`, alamat });
            return { ok: true, data: ugd };
        },
    };
}
