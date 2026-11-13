import { GALAT, MASTER, kodeTindakanBerikut, ringkasPerubahanHarga } from '@klira/shared';
import { entriIcd } from '../../klinis/data-access/terminologi-icd.js';
const ENTITAS = {
    poli: 'lokasi', ruang: 'lokasi', bed: 'lokasi', praktisi: 'profil_profesi', jadwal: 'jadwal_praktik', tarif: 'tarif_layanan',
};
const tidakValid = (jalur, pesan) => ({ ok: false, kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: [{ jalur, pesan }] });
const tidakDitemukan = { ok: false, kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan };
const tampil = (v) => (v === null || v === undefined || v === '' ? '-' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
/** Ringkasan perubahan SIP tenaga untuk riwayat_profil; null bila SIP, masa berlaku, dan profesi tidak berubah. */
export function ringkasanSip(sebelum, sesudah) {
    const bagian = [];
    const bandingkan = (label, lama, baru) => {
        if (tampil(lama) !== tampil(baru))
            bagian.push(`${label}: ${tampil(lama)} menjadi ${tampil(baru)}`);
    };
    bandingkan('Nomor SIP', sebelum?.nomor_sip, sesudah.nomor_sip);
    bandingkan('Masa berlaku SIP', sebelum?.masa_berlaku_sip, sesudah.masa_berlaku_sip);
    if (sesudah.profesi !== undefined)
        bandingkan('Profesi', sebelum?.profesi, sesudah.profesi);
    return bagian.length ? bagian.join('; ') : null;
}
export function buatLayananMaster({ repo, audit }) {
    /** Rujukan harus milik fasyankes yang sama (lintas klinik ditolak). */
    async function periksaRujukan(f, jenis, d, id) {
        if (jenis === 'ruang' && d.induk_id && !(await repo.lokasiAda(f, d.induk_id, 'poli')))
            return tidakValid('induk_id', MASTER.galat.bukanMilikKlinik);
        if (jenis === 'bed' && !(await repo.lokasiAda(f, d.induk_id, 'ruang')))
            return tidakValid('induk_id', MASTER.galat.bukanMilikKlinik);
        if (jenis === 'jadwal') {
            if (!(await repo.penggunaAda(f, d.pengguna_id)) || !(await repo.punyaProfil(f, d.pengguna_id)))
                return tidakValid('pengguna_id', MASTER.galat.bukanMilikKlinik);
            if (!(await repo.lokasiAda(f, d.lokasi_id, 'poli')))
                return tidakValid('lokasi_id', MASTER.galat.bukanMilikKlinik);
        }
        if (jenis === 'tarif') {
            if (d.jenis === 'tindakan' && !entriIcd('icd9cm', String(d.kode_icd9cm ?? '')))
                return tidakValid('kode_icd9cm', MASTER.galat.icd9TidakAda);
            if (await repo.tarifKodeAda(f, d.kode, id))
                return { ok: false, kode: 'konflik', pesan: MASTER.galat.kodeKembar };
        }
        return null;
    }
    /** Tarif tindakan tanpa kode: saat tambah dibuat TND-nnn berikutnya, saat ubah kode lama dipertahankan. */
    async function lengkapiKodeTarif(f, jenis, data, lama) {
        if (jenis !== 'tarif')
            return data;
        const d = data;
        if (d.kode)
            return data;
        return { ...d, kode: lama ? String(lama.kode) : kodeTindakanBerikut(await repo.kodeTarifTindakan(f)) };
    }
    return {
        async daftar(p, jenis, filter) {
            const { total, baris } = await repo.daftar(p.fasyankes_id, jenis, filter);
            return { data: baris, halaman: filter.halaman, ukuran: filter.ukuran, total };
        },
        opsi(p, sumber, cari) {
            return repo.opsi(p.fasyankes_id, sumber, cari);
        },
        async buat(p, jenis, data, alamat) {
            const f = p.fasyankes_id;
            if (jenis === 'praktisi') {
                const d = data;
                if (!(await repo.penggunaAda(f, d.pengguna_id)))
                    return tidakValid('pengguna_id', MASTER.galat.bukanMilikKlinik);
                if (await repo.punyaProfil(f, d.pengguna_id))
                    return { ok: false, kode: 'konflik', pesan: MASTER.galat.penggunaSudahPunyaProfil };
            }
            else {
                data = await lengkapiKodeTarif(f, jenis, data);
                const salah = await periksaRujukan(f, jenis, data);
                if (salah)
                    return salah;
            }
            const baris = await repo.buat(f, jenis, data, p.id);
            if (jenis === 'praktisi') {
                const ringkasan = ringkasanSip(null, data);
                if (ringkasan)
                    await repo.tambahRiwayatProfil(f, 'sip', baris.pengguna_id, ringkasan, p.id);
            }
            await audit.catat({ fasyankes_id: f, pengguna_id: p.id, aksi: 'input', entitas: ENTITAS[jenis], entitas_id: baris.id, keterangan: `Tambah master ${jenis}${jenis === 'tarif' ? ` ${baris.kode}${baris.kode_icd9cm ? ` (ICD-9-CM ${baris.kode_icd9cm})` : ''}: ${ringkasPerubahanHarga([['harga umum', null, baris.harga_umum ?? null], ['harga JKN', null, baris.harga_jkn ?? null]]) ?? ''}` : ''}`, alamat });
            return { ok: true, data: baris };
        },
        async ubah(p, jenis, id, data, alamat) {
            const f = p.fasyankes_id;
            const lama = await repo.ambil(f, jenis, id);
            if (!lama)
                return tidakDitemukan;
            data = await lengkapiKodeTarif(f, jenis, data, lama);
            const salah = await periksaRujukan(f, jenis, data, id);
            if (salah)
                return salah;
            const baris = await repo.ubah(f, jenis, id, data);
            if (jenis === 'praktisi') {
                const ringkasan = ringkasanSip(lama, data);
                if (ringkasan)
                    await repo.tambahRiwayatProfil(f, 'sip', lama.pengguna_id, ringkasan, p.id);
            }
            const harga = jenis === 'tarif' ? ringkasPerubahanHarga([['harga umum', lama.harga_umum ?? null, baris.harga_umum ?? null], ['harga JKN', lama.harga_jkn ?? null, baris.harga_jkn ?? null]]) : null;
            await audit.catat({ fasyankes_id: f, pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS[jenis], entitas_id: id, keterangan: `Ubah master ${jenis}${harga ? `: ${harga}` : ''}`, alamat });
            return { ok: true, data: baris };
        },
        async ubahAktif(p, jenis, id, aktif, alamat) {
            const f = p.fasyankes_id;
            const lama = await repo.ambil(f, jenis, id);
            if (!lama)
                return tidakDitemukan;
            const baris = lama.aktif === aktif ? lama : await repo.setAktif(f, jenis, id, aktif);
            if (lama.aktif !== aktif) {
                await audit.catat({ fasyankes_id: f, pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS[jenis], entitas_id: id, keterangan: `${aktif ? 'Aktifkan' : 'Nonaktifkan'} master ${jenis}`, alamat });
            }
            return { ok: true, data: baris };
        },
    };
}
