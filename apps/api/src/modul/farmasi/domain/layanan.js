import { FARMASI, KASIR, ringkasPerubahanHarga, rupiahTeks } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
const G = FARMASI.galat;
export function buatLayananFarmasi({ repo, audit }) {
    const catat = (p, aksi, entitas, id, keterangan, alamat) => audit.catat({ pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });
    return {
        cariKfa: (p, f) => repo.cariKfa(f),
        daftarMaster: (p, f) => repo.daftarMaster(f),
        async buatMaster(p, m, alamat) {
            const k = await repo.kfa(m.kfa_kode);
            if (!k)
                return gagal('tidak_valid', G.kfaTidakAda, 'kfa_kode');
            if (k.status !== 'aktif')
                return gagal('tidak_valid', G.kfaTidakAktif, 'kfa_kode');
            const hasil = await repo.buatMaster(p.id, m, k);
            if (hasil === 'duplikat')
                return gagal('konflik', G.obatTertaut, 'kfa_kode');
            await catat(p, 'input', 'master_obat', hasil.id, `Obat ${hasil.nama_tampil} (KFA ${hasil.kfa_kode}) ditambahkan ke master, harga ${rupiahTeks(hasil.harga)}`, alamat);
            return { ok: true, data: hasil };
        },
        async ubahMaster(p, id, m, alamat) {
            const sebelum = await repo.master(id);
            const hasil = await repo.ubahMaster(id, m);
            if (!hasil)
                return gagal('tidak_ditemukan', G.obatTidakAda);
            const harga = sebelum ? ringkasPerubahanHarga([['harga', sebelum.harga, hasil.harga]]) : null;
            await catat(p, 'perbaikan', 'master_obat', id, harga ? `Harga obat diubah (${harga}): ${hasil.nama_tampil}` : `Master obat ${hasil.nama_tampil} diubah (${Object.keys(m).join(', ')})`, alamat);
            return { ok: true, data: hasil };
        },
        async stok(p, masterId) {
            if (!(await repo.master(masterId)))
                return gagal('tidak_ditemukan', G.obatTidakAda);
            return { ok: true, data: { stok: await repo.stokMaster(masterId), mutasi: await repo.riwayatMutasi(masterId) } };
        },
        async mutasi(p, m, alamat) {
            const h = await repo.mutasi(p.id, m);
            if (!h.ok) {
                return h.sebab === 'obat_tidak_ada' ? gagal('tidak_ditemukan', G.obatTidakAda) : h.sebab === 'batch_tidak_ada' ? gagal('tidak_valid', G.batchTidakAda, 'batch') : gagal('konflik', G.stokTidakCukup, 'jumlah');
            }
            await catat(p, 'input', 'mutasi_stok', h.stok.id, `${m.jenis} batch ${m.batch}, stok sekarang ${h.stok.jumlah}${m.alasan ? ` (${m.alasan})` : ''}`, alamat);
            return { ok: true, data: h.stok };
        },
        /**
         * Satu resep per kunjungan: dokter memilih obat (jumlah dan aturan pakai) dengan catatan seluruh resep. Dibuat bila belum ada, selain itu diganti
         * selama pemeriksaan belum diselesaikan dan resep belum ditelaah. Item tagihan obat dibuat (atau dibuat ulang) saat disimpan.
         */
        async simpanResep(p, kunjunganId, m, alamat) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            if (k.tahap_layanan === 'ditutup')
                return gagal('konflik', G.kunjunganDitutup);
            // Resep masih bisa dibuat atau diubah dokter sampai diteruskan ke kasir; resep yang sudah ditelaah apoteker ditolak oleh repositori.
            if (!['menunggu_skrining', 'pemeriksaan', 'resep'].includes(k.tahap_layanan))
                return gagal('konflik', G.resepTerkunciPemeriksaan);
            const item = m.item.map((i) => ({ master_obat_id: i.master_obat_id, aturan_pakai: i.aturan_pakai.trim(), bentuk: i.bentuk?.trim() || null, rute: i.rute?.trim() || null, jumlah: Number(i.jumlah) }));
            const ids = [...new Set(item.map((i) => i.master_obat_id))];
            const obat = await repo.obatAktifDari(ids);
            if (obat.length !== ids.length)
                return gagal('tidak_valid', G.obatTidakAda, 'item');
            // Rute bawaan dari master obat bila dokter tidak menyebutkannya.
            const lengkap = item.map((i) => ({ ...i, rute: i.rute ?? obat.find((o) => o.id === i.master_obat_id)?.rute ?? null }));
            const hasil = await repo.simpanResep({ kunjungan: k, dpjpId: p.id, oleh: p.id, catatan: m.catatan?.trim() ?? '', item: lengkap, obat });
            if (hasil === 'tagihan_terkunci')
                return gagal('konflik', G.itemTerkunci, 'item');
            if (hasil === 'resep_terkunci')
                return gagal('konflik', G.resepTerkunciTelaah);
            const { resepId, diubah, tagihan } = hasil;
            const resep = (await repo.resep(resepId));
            await catat(p, diubah ? 'perbaikan' : 'input', 'resep', resepId, `Resep ${resep.nomor_resep} ${diubah ? 'diubah' : 'dibuat'} (${item.length} item obat) untuk kunjungan ${kunjunganId}`, alamat);
            return { ok: true, data: { resep, tagihan, diubah } };
        },
        async resepKunjungan(p, kunjunganId, alamat) {
            if (!(await repo.kunjungan(kunjunganId)))
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            await catat(p, 'lihat', 'resep', null, `Resep kunjungan ${kunjunganId} dibuka`, alamat);
            return { ok: true, data: await repo.resepKunjungan(kunjunganId) };
        },
        /** Telaah dan item obat apoteker (obat aktif di master klinik) disimpan bersama; item tagihan obat resep itu ikut disinkronkan. */
        async telaah(p, resepId, m, alamat) {
            const r = await repo.resep(resepId);
            if (!r)
                return gagal('tidak_ditemukan', G.resepTidakAda);
            if (r.status === 'siap' || r.status === 'diserahkan')
                return gagal('konflik', G.statusTidakSah);
            // Tanpa `item` dalam permintaan: hanya telaah yang dicatat, item resep dan tagihan obat tidak disentuh.
            const item = m.item ? m.item.map((i) => ({ master_obat_id: i.master_obat_id, aturan_pakai: i.aturan_pakai.trim(), bentuk: i.bentuk?.trim() || null, rute: i.rute?.trim() || null, jumlah: Number(i.jumlah) })) : null;
            const ids = [...new Set((item ?? []).map((i) => i.master_obat_id))];
            const obat = ids.length ? await repo.obatAktifDari(ids) : [];
            if (obat.length !== ids.length)
                return gagal('tidak_valid', G.obatTidakAda, 'item');
            const h = await repo.catatTelaah(resepId, p.id, m, item, obat);
            if (h === 'status_berubah')
                return gagal('konflik', G.statusTidakSah);
            if (h === 'tagihan_terkunci')
                return gagal('konflik', G.itemTerkunci, 'item');
            await catat(p, 'input', 'telaah_resep', resepId, `Telaah resep ${r.nomor_resep}: ${m.administratif && m.farmasetik && m.klinis ? 'terpenuhi' : 'belum terpenuhi'}, ${item ? `${item.length} item obat` : 'item obat tidak diubah'}`, alamat);
            return { ok: true, data: (await repo.resep(resepId)) };
        },
        /** Tandai siap (setelah telaah terpenuhi dan minimal satu item obat). Stok kurang tidak memblokir: kekurangannya dilaporkan agar apoteker menyiapkan sendiri (3.2 Peringatan stok kurang). */
        async siap(p, resepId, alamat) {
            const r = await repo.resep(resepId);
            if (!r)
                return gagal('tidak_ditemukan', G.resepTidakAda);
            if (r.status === 'diajukan')
                return gagal('konflik', G.telaahBelumLengkap);
            if (r.status !== 'ditelaah')
                return gagal('konflik', G.statusTidakSah);
            if (!r.item.length)
                return gagal('konflik', G.itemWajib);
            const hasil = await repo.tandaiSiap(resepId);
            if (!hasil)
                return gagal('konflik', G.statusTidakSah);
            const baru = (await repo.resep(resepId));
            const kekurangan = baru.item.filter((i) => i.stok_tersedia < i.jumlah).map((i) => ({ master_obat_id: i.master_obat_id, nama: i.nama, butuh: i.jumlah, tersedia: i.stok_tersedia }));
            await catat(p, 'perbaikan', 'resep', resepId, `Resep ${baru.nomor_resep} siap${kekurangan.length ? `, stok kurang ${kekurangan.length} obat` : ''}`, alamat);
            return { ok: true, data: { resep: baru, kekurangan, tahap_kunjungan: hasil.tahap } };
        },
        async serahTerima(p, kunjunganId, m, alamat) {
            if (!(await repo.kunjungan(kunjunganId)))
                return gagal('tidak_ditemukan', KASIR.galat.kunjunganTidakAda);
            const izinkan = !!m.izinkan_stok_kurang;
            const alasan = typeof m.alasan === 'string' && m.alasan.trim() ? m.alasan.trim() : null;
            const h = await repo.serahTerima(p.id, kunjunganId, izinkan, alasan);
            if (!h.ok) {
                if (h.sebab === 'stok_kurang') {
                    return { ok: false, kode: 'konflik', pesan: KASIR.galat.stokKurang, rincian: h.kekurangan.map((x) => ({ jalur: `obat.${x.master_obat_id}`, pesan: KASIR.bayar.stokKurang(x.nama, x.butuh, x.tersedia) })) };
                }
                const pesan = { tidak_ada_resep: KASIR.galat.tidakAdaResep, belum_siap: KASIR.galat.resepBelumSiap, sudah_diserahkan: KASIR.bayar.serahSudah, tahap_salah: KASIR.galat.tahapSalah }[h.sebab];
                return gagal('konflik', pesan);
            }
            await catat(p, 'input', 'pengeluaran_obat', kunjunganId, `Serah terima obat kunjungan ${kunjunganId}${h.kekurangan.length ? `, stok kurang ${h.kekurangan.length} obat (${alasan ?? '-'})` : ''}`, alamat);
            return { ok: true, data: { resep: await repo.resepKunjungan(kunjunganId), kekurangan: h.kekurangan } };
        },
        riwayat: (p, f) => repo.riwayat(f),
    };
}
