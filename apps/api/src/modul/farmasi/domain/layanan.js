import { FARMASI, KASIR, ringkasPerubahanHarga, rupiahTeks } from '@klira/shared';
import { gagal } from '../../hasil.js';
const G = FARMASI.galat;
export function buatLayananFarmasi({ repo, audit }) {
    const catat = (p, aksi, entitas, id, keterangan, alamat) => audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });
    return {
        cariKfa: (p, f) => repo.cariKfa(p.fasyankes_id, f),
        daftarMaster: (p, f) => repo.daftarMaster(p.fasyankes_id, f),
        async buatMaster(p, m, alamat) {
            const k = await repo.kfa(p.fasyankes_id, m.kfa_kode);
            if (!k)
                return gagal('tidak_valid', G.kfaTidakAda, 'kfa_kode');
            if (k.status !== 'aktif')
                return gagal('tidak_valid', G.kfaTidakAktif, 'kfa_kode');
            const hasil = await repo.buatMaster(p.fasyankes_id, p.id, m, k);
            if (hasil === 'duplikat')
                return gagal('konflik', G.obatTertaut, 'kfa_kode');
            await catat(p, 'input', 'master_obat', hasil.id, `Obat ${hasil.nama_tampil} (KFA ${hasil.kfa_kode}) ditambahkan ke master, harga ${rupiahTeks(hasil.harga)}`, alamat);
            return { ok: true, data: hasil };
        },
        async ubahMaster(p, id, m, alamat) {
            const sebelum = await repo.master(p.fasyankes_id, id);
            const hasil = await repo.ubahMaster(p.fasyankes_id, id, m);
            if (!hasil)
                return gagal('tidak_ditemukan', G.obatTidakAda);
            const harga = sebelum ? ringkasPerubahanHarga([['harga', sebelum.harga, hasil.harga]]) : null;
            await catat(p, 'perbaikan', 'master_obat', id, harga ? `Harga obat diubah (${harga}): ${hasil.nama_tampil}` : `Master obat ${hasil.nama_tampil} diubah (${Object.keys(m).join(', ')})`, alamat);
            return { ok: true, data: hasil };
        },
        async stok(p, masterId) {
            if (!(await repo.master(p.fasyankes_id, masterId)))
                return gagal('tidak_ditemukan', G.obatTidakAda);
            return { ok: true, data: { stok: await repo.stokMaster(p.fasyankes_id, masterId), mutasi: await repo.riwayatMutasi(p.fasyankes_id, masterId) } };
        },
        async mutasi(p, m, alamat) {
            const h = await repo.mutasi(p.fasyankes_id, p.id, m);
            if (!h.ok) {
                return h.sebab === 'obat_tidak_ada' ? gagal('tidak_ditemukan', G.obatTidakAda) : h.sebab === 'batch_tidak_ada' ? gagal('tidak_valid', G.batchTidakAda, 'batch') : gagal('konflik', G.stokTidakCukup, 'jumlah');
            }
            await catat(p, 'input', 'mutasi_stok', h.stok.id, `${m.jenis} batch ${m.batch}, stok sekarang ${h.stok.jumlah}${m.alasan ? ` (${m.alasan})` : ''}`, alamat);
            return { ok: true, data: h.stok };
        },
        /** Resep dari dokter berupa teks bebas (P3): tanpa item dan tanpa item tagihan; item obat dan biayanya diisi apoteker saat telaah. */
        async buatResep(p, kunjunganId, m, alamat) {
            const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            if (k.tahap_layanan === 'ditutup')
                return gagal('konflik', G.kunjunganDitutup);
            const { resepId, tagihan } = await repo.buatResep({ fasyankesId: p.fasyankes_id, kunjungan: k, dpjpId: p.id, oleh: p.id, teks: m.teks.trim() });
            const resep = (await repo.resep(p.fasyankes_id, resepId));
            await catat(p, 'input', 'resep', resepId, `Resep ${resep.nomor_resep} (teks dokter) untuk kunjungan ${kunjunganId}`, alamat);
            return { ok: true, data: { resep, tagihan } };
        },
        async resepKunjungan(p, kunjunganId, alamat) {
            if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId)))
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            await catat(p, 'lihat', 'resep', null, `Resep kunjungan ${kunjunganId} dibuka`, alamat);
            return { ok: true, data: await repo.resepKunjungan(p.fasyankes_id, kunjunganId) };
        },
        /** Telaah dan item obat apoteker (obat aktif di master klinik) disimpan bersama; item tagihan obat resep itu ikut disinkronkan. */
        async telaah(p, resepId, m, alamat) {
            const r = await repo.resep(p.fasyankes_id, resepId);
            if (!r)
                return gagal('tidak_ditemukan', G.resepTidakAda);
            if (r.status === 'siap' || r.status === 'diserahkan')
                return gagal('konflik', G.statusTidakSah);
            // Tanpa `item` dalam permintaan: hanya telaah yang dicatat, item resep dan tagihan obat tidak disentuh.
            const item = m.item ? m.item.map((i) => ({ master_obat_id: i.master_obat_id, aturan_pakai: i.aturan_pakai.trim(), bentuk: i.bentuk?.trim() || null, rute: i.rute?.trim() || null, jumlah: Number(i.jumlah) })) : null;
            const ids = [...new Set((item ?? []).map((i) => i.master_obat_id))];
            const obat = ids.length ? await repo.obatAktifDari(p.fasyankes_id, ids) : [];
            if (obat.length !== ids.length)
                return gagal('tidak_valid', G.obatTidakAda, 'item');
            const h = await repo.catatTelaah(p.fasyankes_id, resepId, p.id, m, item, obat);
            if (h === 'status_berubah')
                return gagal('konflik', G.statusTidakSah);
            if (h === 'tagihan_terkunci')
                return gagal('konflik', G.itemTerkunci, 'item');
            await catat(p, 'input', 'telaah_resep', resepId, `Telaah resep ${r.nomor_resep}: ${m.administratif && m.farmasetik && m.klinis ? 'terpenuhi' : 'belum terpenuhi'}, ${item ? `${item.length} item obat` : 'item obat tidak diubah'}`, alamat);
            return { ok: true, data: (await repo.resep(p.fasyankes_id, resepId)) };
        },
        /** Tandai siap (setelah telaah terpenuhi dan minimal satu item obat). Stok kurang tidak memblokir: kekurangannya dilaporkan agar apoteker menyiapkan sendiri (3.2 Peringatan stok kurang). */
        async siap(p, resepId, alamat) {
            const r = await repo.resep(p.fasyankes_id, resepId);
            if (!r)
                return gagal('tidak_ditemukan', G.resepTidakAda);
            if (r.status === 'diajukan')
                return gagal('konflik', G.telaahBelumLengkap);
            if (r.status !== 'ditelaah')
                return gagal('konflik', G.statusTidakSah);
            if (!r.item.length)
                return gagal('konflik', G.itemWajib);
            const hasil = await repo.tandaiSiap(p.fasyankes_id, resepId);
            if (!hasil)
                return gagal('konflik', G.statusTidakSah);
            const baru = (await repo.resep(p.fasyankes_id, resepId));
            const kekurangan = baru.item.filter((i) => i.stok_tersedia < i.jumlah).map((i) => ({ master_obat_id: i.master_obat_id, nama: i.nama, butuh: i.jumlah, tersedia: i.stok_tersedia }));
            await catat(p, 'perbaikan', 'resep', resepId, `Resep ${baru.nomor_resep} siap${kekurangan.length ? `, stok kurang ${kekurangan.length} obat` : ''}`, alamat);
            return { ok: true, data: { resep: baru, kekurangan, tahap_kunjungan: hasil.tahap } };
        },
        async serahTerima(p, kunjunganId, m, alamat) {
            if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId)))
                return gagal('tidak_ditemukan', KASIR.galat.kunjunganTidakAda);
            const izinkan = !!m.izinkan_stok_kurang;
            const alasan = typeof m.alasan === 'string' && m.alasan.trim() ? m.alasan.trim() : null;
            const h = await repo.serahTerima(p.fasyankes_id, p.id, kunjunganId, izinkan, alasan);
            if (!h.ok) {
                if (h.sebab === 'stok_kurang') {
                    return { ok: false, kode: 'konflik', pesan: KASIR.galat.stokKurang, rincian: h.kekurangan.map((x) => ({ jalur: `obat.${x.master_obat_id}`, pesan: KASIR.bayar.stokKurang(x.nama, x.butuh, x.tersedia) })) };
                }
                const pesan = { tidak_ada_resep: KASIR.galat.tidakAdaResep, belum_siap: KASIR.galat.resepBelumSiap, sudah_diserahkan: KASIR.bayar.serahSudah, tahap_salah: KASIR.galat.tahapSalah }[h.sebab];
                return gagal('konflik', pesan);
            }
            await catat(p, 'input', 'pengeluaran_obat', kunjunganId, `Serah terima obat kunjungan ${kunjunganId}${h.kekurangan.length ? `, stok kurang ${h.kekurangan.length} obat (${alasan ?? '-'})` : ''}`, alamat);
            return { ok: true, data: { resep: await repo.resepKunjungan(p.fasyankes_id, kunjunganId), kekurangan: h.kekurangan } };
        },
        riwayat: (p, f) => repo.riwayat(p.fasyankes_id, f),
    };
}
