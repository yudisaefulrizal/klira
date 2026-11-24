import { GALAT, MASTER, kodeTindakanBerikut, ringkasPerubahanHarga } from '@klira/shared';
import { entriIcd } from '../../klinis/data-access/terminologi-icd.js';
const ENTITAS = {
    poli: 'lokasi', ruang_periksa: 'lokasi', ruang: 'lokasi', bed: 'lokasi', praktisi: 'profil_profesi', jadwal: 'jadwal_praktik', tarif: 'tarif_layanan',
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
    async function periksaRujukan(jenis, d, id) {
        // Satu layanan satu poli; ruang periksa dan ruang rawat inap diumumkan dengan namanya, jadi nama harus membedakan.
        if (jenis === 'poli' && d.nama && (await repo.namaLokasiAda('poli', d.nama, id)))
            return { ok: false, kode: 'konflik', pesan: MASTER.galat.namaPoliKembar };
        if ((jenis === 'ruang_periksa' || jenis === 'ruang') && d.nama && (await repo.namaLokasiAda(jenis, d.nama, id)))
            return { ok: false, kode: 'konflik', pesan: MASTER.galat.namaLokasiKembar };
        if (jenis === 'ruang_periksa' && !(await repo.lokasiAda(d.induk_id, 'poli')))
            return tidakValid('induk_id', MASTER.galat.bukanMilikKlinik);
        if (jenis === 'bed' && !(await repo.lokasiAda(d.induk_id, 'ruang')))
            return tidakValid('induk_id', MASTER.galat.bukanMilikKlinik);
        if (jenis === 'ruang' && d.tarif_id && !(await repo.tarifKamarSah(d.tarif_id)))
            return tidakValid('tarif_id', MASTER.galat.bukanMilikKlinik);
        if (jenis === 'jadwal') {
            if (!(await repo.penggunaAda(d.pengguna_id)) || !(await repo.punyaProfil(d.pengguna_id)))
                return tidakValid('pengguna_id', MASTER.galat.bukanMilikKlinik);
            if (!(await repo.lokasiAda(d.lokasi_id, 'poli')))
                return tidakValid('lokasi_id', MASTER.galat.bukanMilikKlinik);
            if (!(await repo.shiftAda(d.shift_id)))
                return tidakValid('shift_id', MASTER.galat.bukanMilikKlinik);
            // Satu dokter hanya satu tempat pada hari dan shift yang sama.
            const bentrok = await repo.jadwalBentrok(d.pengguna_id, d.hari, d.shift_id, id);
            if (bentrok)
                return { ok: false, kode: 'konflik', pesan: MASTER.galat.jadwalBentrok(bentrok.lokasi_nama) };
        }
        if (jenis === 'tarif') {
            if (d.jenis === 'tindakan' && !entriIcd('icd9cm', String(d.kode_icd9cm ?? '')))
                return tidakValid('kode_icd9cm', MASTER.galat.icd9TidakAda);
            if (await repo.tarifKodeAda(d.kode, id))
                return { ok: false, kode: 'konflik', pesan: MASTER.galat.kodeKembar };
        }
        return null;
    }
    /** Tarif tindakan tanpa kode: saat tambah dibuat TND-nnn berikutnya, saat ubah kode lama dipertahankan. */
    async function lengkapiKodeTarif(jenis, data, lama) {
        if (jenis !== 'tarif')
            return data;
        const d = data;
        if (d.kode)
            return data;
        return { ...d, kode: lama ? String(lama.kode) : kodeTindakanBerikut(await repo.kodeTarifTindakan()) };
    }
    return {
        async daftar(p, jenis, filter) {
            const { total, baris } = await repo.daftar(jenis, filter);
            return { data: baris, halaman: filter.halaman, ukuran: filter.ukuran, total };
        },
        daftarShift(p) {
            return repo.daftarShift();
        },
        /** Shift hanya diubah jamnya; jumlah dan namanya tetap. */
        async ubahShift(p, id, data, alamat) {
            const lama = await repo.ambilShift(id);
            if (!lama)
                return tidakDitemukan;
            const baris = await repo.ubahShift(id, data);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'shift', entitas_id: id, keterangan: `Ubah jam shift ${lama.nama}: ${lama.jam_mulai}-${lama.jam_selesai} menjadi ${data.jam_mulai}-${data.jam_selesai}`, alamat });
            return { ok: true, data: baris };
        },
        opsi(p, sumber, cari) {
            return repo.opsi(sumber, cari);
        },
        async buat(p, jenis, data, alamat) {
            if (jenis === 'praktisi') {
                const d = data;
                if (!(await repo.penggunaAda(d.pengguna_id)))
                    return tidakValid('pengguna_id', MASTER.galat.bukanMilikKlinik);
                if (await repo.punyaProfil(d.pengguna_id))
                    return { ok: false, kode: 'konflik', pesan: MASTER.galat.penggunaSudahPunyaProfil };
            }
            else {
                data = await lengkapiKodeTarif(jenis, data);
                const salah = await periksaRujukan(jenis, data);
                if (salah)
                    return salah;
            }
            const baris = await repo.buat(jenis, data, p.id);
            if (jenis === 'praktisi') {
                const ringkasan = ringkasanSip(null, data);
                if (ringkasan)
                    await repo.tambahRiwayatProfil('sip', baris.pengguna_id, ringkasan, p.id);
            }
            await audit.catat({ pengguna_id: p.id, aksi: 'input', entitas: ENTITAS[jenis], entitas_id: baris.id, keterangan: `Tambah master ${jenis}${jenis === 'tarif' ? ` ${baris.kode}${baris.kode_icd9cm ? ` (ICD-9-CM ${baris.kode_icd9cm})` : ''}: ${ringkasPerubahanHarga([['harga umum', null, baris.harga_umum ?? null], ['harga JKN', null, baris.harga_jkn ?? null]]) ?? ''}` : ''}`, alamat });
            return { ok: true, data: baris };
        },
        async ubah(p, jenis, id, data, alamat) {
            const lama = await repo.ambil(jenis, id);
            if (!lama)
                return tidakDitemukan;
            if (jenis === 'bed' && data.status_operasional !== undefined && data.status_operasional !== lama.status_operasional && (await repo.bedSedangDihuni(id)))
                return { ok: false, kode: 'konflik', pesan: 'Status bed tidak dapat diubah karena sedang ditempati pasien.' };
            data = await lengkapiKodeTarif(jenis, data, lama);
            const salah = await periksaRujukan(jenis, data, id);
            if (salah)
                return salah;
            const baris = await repo.ubah(jenis, id, data);
            if (jenis === 'praktisi') {
                const ringkasan = ringkasanSip(lama, data);
                if (ringkasan)
                    await repo.tambahRiwayatProfil('sip', lama.pengguna_id, ringkasan, p.id);
            }
            const harga = jenis === 'tarif' ? ringkasPerubahanHarga([['harga umum', lama.harga_umum ?? null, baris.harga_umum ?? null], ['harga JKN', lama.harga_jkn ?? null, baris.harga_jkn ?? null]]) : null;
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS[jenis], entitas_id: id, keterangan: `Ubah master ${jenis}${harga ? `: ${harga}` : ''}`, alamat });
            return { ok: true, data: baris };
        },
        /** Jadwal praktik tidak punya status aktif: ada berarti berlaku, dan dihapus bila tidak lagi dipakai. */
        async hapusJadwal(p, id, alamat) {
            const lama = await repo.ambil('jadwal', id);
            if (!lama)
                return tidakDitemukan;
            await repo.hapusJadwal(id);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS.jadwal, entitas_id: id, keterangan: `Hapus jadwal ${lama.pengguna_nama}, ${lama.lokasi_nama}, hari ${lama.hari}, shift ${lama.shift_nama}`, alamat });
            return { ok: true, data: { id } };
        },
        async hapusLokasi(p, jenis, id, alamat) {
            const lama = await repo.ambil(jenis, id);
            if (!lama)
                return tidakDitemukan;
            if (jenis === 'bed' && (await repo.bedSedangDihuni(id)))
                return { ok: false, kode: 'konflik', pesan: 'Bed sedang ditempati pasien dan tidak dapat dihapus.' };
            if (jenis === 'ruang' && (await repo.lokasiPunyaAnak(id)))
                return { ok: false, kode: 'konflik', pesan: 'Ruang masih memiliki bed; hapus semua bed di ruang ini terlebih dahulu.' };
            await repo.hapusLokasi(id);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS[jenis], entitas_id: id, keterangan: `Hapus master ${jenis} ${lama.nama}`, alamat });
            return { ok: true, data: { id } };
        },
        async ubahAktif(p, jenis, id, aktif, alamat) {
            if (jenis === 'jadwal')
                return tidakValid('jenis', MASTER.galat.jadwalTanpaStatus);
            const lama = await repo.ambil(jenis, id);
            if (!lama)
                return tidakDitemukan;
            if (jenis === 'bed' && (await repo.bedSedangDihuni(id)))
                return { ok: false, kode: 'konflik', pesan: 'Bed sedang ditempati pasien sehingga status aktifnya tidak dapat diubah.' };
            if (jenis === 'ruang' && !aktif && (await repo.ruangAdaBedDihuni(id)))
                return { ok: false, kode: 'konflik', pesan: 'Ruang tidak dapat dinonaktifkan karena masih ada bed yang ditempati pasien.' };
            const baris = lama.aktif === aktif ? lama : await repo.setAktif(jenis, id, aktif);
            if (lama.aktif !== aktif) {
                await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: ENTITAS[jenis], entitas_id: id, keterangan: `${aktif ? 'Aktifkan' : 'Nonaktifkan'} master ${jenis}`, alamat });
            }
            return { ok: true, data: baris };
        },
    };
}
