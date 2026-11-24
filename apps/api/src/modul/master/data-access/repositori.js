import * as db from '@klira/db';
import { awalanUntukJenis } from '@klira/shared';
import { dataWilayah } from '../../wilayah/data-access/data.js';
import { AWALAN_KODE_TINDAKAN } from '@klira/shared';
const tgl = (d) => (d ? d.toISOString().slice(0, 10) : null);
const LOKASI = ['poli', 'ruang_periksa', 'ruang', 'bed'];
/** Lokasi yang berinduk: ruang periksa di bawah poli, bed di dalam ruang rawat inap. */
const BERINDUK = ['ruang_periksa', 'bed'];
const UKURAN_OPSI = 500;
const barisLokasi = (l) => ({
    id: l.id, aktif: l.status_operasional === 'O', nama: l.nama, induk_id: l.induk_id, induk_nama: l.induk?.nama ?? null,
    status_operasional: l.status_operasional, ihs_location_id: l.ihs_location_id,
});
const barisPraktisi = (p) => ({
    id: p.id, aktif: p.aktif, pengguna_id: p.pengguna_id, pengguna_nama: p.pengguna.nama, profesi: p.profesi, nomor_sip: p.nomor_sip,
    masa_berlaku_sip: tgl(p.masa_berlaku_sip), ihs_practitioner_id: p.ihs_practitioner_id,
});
/** Jadwal membawa nama dan jam shift-nya (jam hanya tersimpan di tabel shift). */
const barisJadwal = (j, shift) => ({
    id: j.id, pengguna_id: j.pengguna_id, pengguna_nama: j.pengguna.nama, lokasi_id: j.lokasi_id, lokasi_nama: j.lokasi.nama,
    hari: j.hari, shift_id: j.shift_id, shift_nama: shift.get(j.shift_id)?.nama ?? null, jam_mulai: shift.get(j.shift_id)?.jam_mulai ?? null, jam_selesai: shift.get(j.shift_id)?.jam_selesai ?? null, kuota: j.kuota,
});
const barisTarif = (t) => ({
    id: t.id, aktif: t.aktif, kode: t.kode, nama: t.nama, jenis: t.jenis, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn, kode_icd9cm: t.kode_icd9cm,
});
/** Data tarif dari masukan; kode sudah dipastikan terisi oleh layanan (dibuat otomatis untuk tindakan). */
const dataTarif = (d) => ({ kode: d.kode ?? '', nama: d.nama, jenis: d.jenis, harga_umum: d.harga_umum, harga_jkn: d.harga_jkn, kode_icd9cm: d.kode_icd9cm });
export class RepositoriMasterMysql {
    async daftar(jenis, f) {
        const halaman = { skip: (f.halaman - 1) * f.ukuran, take: f.ukuran };
        const cari = f.cari;
        const aktif = f.status === 'semua' ? undefined : f.status === 'aktif';
        if (LOKASI.includes(jenis)) {
            const [total, data] = await Promise.all([
                db.hitungLokasiUntukDaftar(jenis, (!(aktif === undefined)) ? (aktif ? 'O' : 'U') : undefined, cari, cari, cari),
                db.daftarLokasiUntukDaftar(jenis, (!(aktif === undefined)) ? (aktif ? 'O' : 'U') : undefined, cari, cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
            ]);
            return { total, baris: await this.sertakanRincian(jenis, data.map(barisLokasi)) };
        }
        if (jenis === 'praktisi') {
            const [total, data] = await Promise.all([
                db.hitungProfilProfesiUntukDaftar((!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari),
                db.daftarProfilProfesiUntukDaftar((!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
            ]);
            return { total, baris: data.map(barisPraktisi) };
        }
        if (jenis === 'jadwal') {
            const [total, data] = await Promise.all([
                db.hitungJadwalPraktikUntukDaftar(cari, cari),
                db.daftarJadwalPraktikUntukDaftar(cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
            ]);
            const shift = await this.petaShift();
            return { total, baris: data.map((j) => barisJadwal(j, shift)) };
        }
        if (jenis === 'tarif') {
            const [total, data] = await Promise.all([
                db.hitungTarifLayananUntukDaftar((!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari),
                db.daftarTarifLayananUntukDaftar((!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
            ]);
            return { total, baris: data.map(barisTarif) };
        }
        // Wilayah adalah referensi statis aplikasi, tidak memerlukan tabel database.
        const tingkat = ['provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa'];
        const kata = cari?.toLocaleLowerCase('id');
        const data = Object.entries(dataWilayah()).map(([kode, nama], i) => ({
            id: i + 1, aktif: true, kode, nama, tingkat: tingkat[kode.split('.').length - 1],
            induk_kode: kode.includes('.') ? kode.slice(0, kode.lastIndexOf('.')) : null, contoh: false,
        })).filter((w) => (!f.tingkat || w.tingkat === f.tingkat) && (!kata || w.kode.includes(kata) || w.nama.toLocaleLowerCase('id').includes(kata)));
        return { total: data.length, baris: data.slice(halaman.skip, halaman.skip + halaman.take) };
    }
    /** Poli membawa awalan antrean dan jumlah ruang periksa; ruang rawat inap membawa jumlah bed dan tarif kamar bawaan. */
    async sertakanRincian(jenis, baris) {
        if ((jenis !== 'poli' && jenis !== 'ruang') || !baris.length)
            return baris;
        const ids = baris.map((b) => b.id);
        const [anak, awalan, tarifRuang] = await Promise.all([
            db.hitungAnakLokasi(ids),
            jenis === 'poli' ? db.daftarAwalanPoli(ids) : [],
            jenis === 'ruang' ? db.daftarTarifRuang(ids) : [],
        ]);
        const jumlah = new Map(anak.map((x) => [x.induk_id, Number(x.jumlah)]));
        const peta = new Map(awalan.map((x) => [x.id, x.awalan_antrean]));
        const petaKategori = new Map(awalan.map((x) => [x.id, x.kategori_poli]));
        const petaTarif = new Map(tarifRuang.map((x) => [x.id, x]));
        return baris.map((b) => {
            if (jenis === 'poli')
                return { ...b, kategori_poli: petaKategori.get(b.id) ?? 'umum', awalan_antrean: peta.get(b.id) ?? null, jumlah_ruang: jumlah.get(b.id) ?? 0 };
            const t = petaTarif.get(b.id);
            return { ...b, jumlah_bed: jumlah.get(b.id) ?? 0, tarif_id: t?.tarif_id ?? null, tarif_nama: t?.tarif_nama ?? null, harga_umum: t?.harga_umum ?? null, harga_jkn: t?.harga_jkn ?? null };
        });
    }
    /** Poli baru mendapat awalan antrean dari namanya yang belum dipakai poli lain. */
    async tetapkanAwalan(id, nama) {
        const terpakai = (await db.daftarPoli()).filter((x) => x.id !== id).map((x) => x.awalan_antrean).filter(Boolean);
        await db.ubahAwalanPoli(id, awalanUntukJenis(nama, terpakai));
    }
    async ambil(jenis, id) {
        if (LOKASI.includes(jenis)) {
            const l = await db.cariLokasiUntukAmbil(id, jenis);
            return l ? (await this.sertakanRincian(jenis, [barisLokasi(l)]))[0] : null;
        }
        if (jenis === 'praktisi') {
            const p = await db.cariProfilProfesiUntukAmbil(id);
            return p ? barisPraktisi(p) : null;
        }
        if (jenis === 'jadwal') {
            const j = await db.cariJadwalPraktikUntukAmbil(id);
            return j ? barisJadwal(j, await this.petaShift()) : null;
        }
        const t = await db.cariTarifLayananUntukAmbil(id);
        return t ? barisTarif(t) : null;
    }
    async buat(jenis, data, oleh) {
        if (LOKASI.includes(jenis)) {
            const d = data;
            const l = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahLokasiUntukBuat(d.nama, jenis, BERINDUK.includes(jenis) ? d.induk_id : null, d.status_operasional, d.ihs_location_id ?? null, oleh, koneksiBaru); return db.tambahLokasiUntukBuatHasil(_hasil.id, koneksiBaru); });
            if (jenis === 'poli') {
                await this.tetapkanAwalan(l.id, d.nama);
                await db.ubahKategoriPoli(l.id, d.kategori_poli ?? 'umum');
            }
            if (jenis === 'ruang') {
                if (d.harga_umum !== undefined)
                    await this.simpanHargaRuang(l.id, d.nama, null, d.harga_umum, d.harga_jkn, oleh);
                else if (d.tarif_id !== undefined)
                    await db.ubahTarifLokasi(l.id, d.tarif_id ?? null);
            }
            return (await this.sertakanRincian(jenis, [barisLokasi(l)]))[0];
        }
        if (jenis === 'praktisi') {
            const d = data;
            const p = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahProfilProfesiUntukBuat(d.pengguna_id, d.profesi, d.nomor_sip ?? null, d.masa_berlaku_sip ?? null, d.ihs_practitioner_id ?? null, oleh, koneksiBaru); return db.tambahProfilProfesiUntukBuatHasil(_hasil.id, koneksiBaru); });
            return barisPraktisi(p);
        }
        if (jenis === 'jadwal') {
            const d = data;
            const j = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahJadwalPraktikUntukBuat(d.pengguna_id, d.lokasi_id, d.hari, d.shift_id, d.kuota ?? null, oleh, koneksiBaru); return db.tambahJadwalPraktikUntukBuatHasil(_hasil.id, koneksiBaru); });
            return barisJadwal(j, await this.petaShift());
        }
        const d = data;
        return barisTarif(await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahTarifLayananUntukBuat((dataTarif(d))?.kode, (dataTarif(d))?.nama, (dataTarif(d))?.jenis, (dataTarif(d))?.harga_umum, (dataTarif(d))?.harga_jkn, (dataTarif(d))?.kode_icd9cm, oleh, koneksiBaru); return db.tambahTarifLayananUntukBuatHasil(_hasil.id, koneksiBaru); }));
    }
    async ubah(jenis, id, data) {
        // Kunci fasyankes_id di where agar tidak pernah melintasi klinik, walau pemanggil lupa memeriksa.
        if (LOKASI.includes(jenis)) {
            const d = data;
            // Awalan antrean poli tidak berubah saat poli diganti nama (nomor hari ini tetap berurutan); pemetaan kode BPJS ikut nama baru.
            const lama = jenis === 'poli' ? await db.cariLokasiUntukAmbil(id, 'poli') : null;
            if (lama && d.nama && lama.nama !== d.nama)
                await db.ubahKunciPemetaanPoli(lama.nama, d.nama);
            const lamaRuang = jenis === 'ruang' ? (await this.sertakanRincian('ruang', [{ id }]))[0] : null;
            await db.ubahLokasiUntukUbah(d.nama, BERINDUK.includes(jenis) ? d.induk_id : undefined, d.status_operasional, d.ihs_location_id ?? null, id);
            if (jenis === 'poli' && d.kategori_poli !== undefined)
                await db.ubahKategoriPoli(id, d.kategori_poli);
            if (jenis === 'ruang') {
                if (d.harga_umum !== undefined)
                    await this.simpanHargaRuang(id, d.nama, lamaRuang?.tarif_id ?? null, d.harga_umum, d.harga_jkn, null);
                else if (d.tarif_id !== undefined)
                    await db.ubahTarifLokasi(id, d.tarif_id ?? null);
            }
        }
        else if (jenis === 'praktisi') {
            const d = data;
            await db.ubahProfilProfesiUntukUbah(d.profesi, d.nomor_sip ?? null, d.masa_berlaku_sip ?? null, d.ihs_practitioner_id ?? null, id);
        }
        else if (jenis === 'jadwal') {
            const d = data;
            await db.ubahJadwalPraktikUntukUbah(d.pengguna_id, d.lokasi_id, d.hari, d.shift_id, d.kuota ?? null, id);
        }
        else {
            const d = data;
            await db.ubahTarifLayananUntukUbah((dataTarif(d))?.kode, (dataTarif(d))?.nama, (dataTarif(d))?.jenis, (dataTarif(d))?.harga_umum, (dataTarif(d))?.harga_jkn, (dataTarif(d))?.kode_icd9cm, id);
        }
        return (await this.ambil(jenis, id));
    }
    async setAktif(jenis, id, aktif) {
        if (LOKASI.includes(jenis))
            await db.ubahLokasiUntukSetAktif(aktif ? 'O' : 'U', id);
        else if (jenis === 'praktisi')
            await db.ubahProfilProfesiUntukSetAktif(aktif, id);
        else
            await db.ubahTarifLayananUntukSetAktif(aktif, id);
        return (await this.ambil(jenis, id));
    }
    async bedSedangDihuni(id) {
        return (await db.hitungPenempatanLokasi(id, true)) > 0;
    }
    async ruangAdaBedDihuni(id) {
        return (await db.hitungBedAktifDalamRuang(id)) > 0;
    }
    async lokasiPunyaAnak(id) {
        const baris = await db.hitungAnakLokasi([id]);
        return Number(baris[0]?.jumlah ?? 0) > 0;
    }
    async hapusLokasi() {
        await db.hapusLokasi(id);
    }
    async simpanHargaRuang(ruangId, namaRuang, tarifIdLama, hargaUmum, hargaJkn, oleh) {
        if (hargaUmum === null) {
            await db.ubahTarifLokasi(ruangId, null);
            return;
        }
        const namaTarif = `Kamar ${namaRuang}`.slice(0, 200);
        const nilaiJkn = hargaJkn ?? hargaUmum;
        if (tarifIdLama) {
            await db.ubahTarifLayananUntukUbah(undefined, namaTarif, 'kamar', hargaUmum, nilaiJkn, null, tarifIdLama);
            await db.ubahTarifLayananUntukSetAktif(true, tarifIdLama);
            return;
        }
        let kode = `KMR-${ruangId}`;
        if (await this.tarifKodeAda(kode))
            kode = `KMR-${ruangId}-${Date.now().toString().slice(-4)}`;
        const t = await db.tambahTarifLayananUntukBuat(kode, namaTarif, 'kamar', hargaUmum, nilaiJkn, null, oleh);
        await db.ubahTarifLokasi(ruangId, t.id);
    }
    async tarifKamarSah(id) {
        return (await db.hitungTarifLayananUntukTarifKamarSah(id, 'kamar', true)) > 0;
    }
    async opsi(sumber, cari) {
        if (sumber === 'poli' || sumber === 'ruang') {
            const l = await db.daftarLokasiUntukOpsi(sumber, 'O', (cari) ? (cari) : undefined, UKURAN_OPSI);
            return l.map((x) => ({ nilai: String(x.id), label: x.nama }));
        }
        if (sumber === 'tarif-kamar') {
            const t = await db.daftarTarifLayananUntukOpsi('kamar', true, 200);
            const q = cari?.trim().toLowerCase();
            return t
                .filter((x) => !q || x.nama.toLowerCase().includes(q) || x.kode.toLowerCase().includes(q))
                .map((x) => ({ nilai: String(x.id), label: `${x.nama} (Rp ${Number(x.harga_umum).toLocaleString('id-ID')})` }));
        }
        if (sumber === 'praktisi') {
            const p = await db.daftarPenggunaUntukOpsi(true, (cari) ? (cari) : undefined, UKURAN_OPSI);
            return p.map((x) => ({ nilai: String(x.id), label: x.nama }));
        }
        if (sumber === 'shift')
            return (await this.daftarShift()).map((x) => ({ nilai: String(x.id), label: `${x.nama} (${x.jam_mulai}-${x.jam_selesai})` }));
        const p = await db.daftarPenggunaUntukOpsi2(true, (cari) ? (cari) : undefined, UKURAN_OPSI);
        return p.map((x) => ({ nilai: String(x.id), label: x.nama }));
    }
    /** Shift klinik (urut Pagi, Siang, Malam). */
    async daftarShift() {
        return (await db.daftarShiftUntukDaftar()).map((x) => ({ id: x.id, urutan: x.urutan, nama: x.nama, jam_mulai: x.jam_mulai, jam_selesai: x.jam_selesai }));
    }
    async petaShift() {
        return new Map((await this.daftarShift()).map((x) => [x.id, x]));
    }
    async ambilShift(id) {
        return (await this.daftarShift()).find((x) => x.id === id) ?? null;
    }
    async ubahShift(id, d) {
        await db.ubahShiftUntukUbah(d.jam_mulai, d.jam_selesai, id);
        return this.ambilShift(id);
    }
    async shiftAda(id) {
        return !!(await db.cariShiftUntukAmbil(id));
    }
    /** Jadwal lain dokter itu pada hari dan shift yang sama (dokter tidak bisa di dua tempat sekaligus). */
    async jadwalBentrok(penggunaId, hari, shiftId, kecualiId) {
        const b = await db.cariJadwalPraktikUntukBentrok(penggunaId, hari, shiftId, kecualiId);
        return b ? { id: b.id, lokasi_nama: b.lokasi_nama } : null;
    }
    async hapusJadwal(id) {
        await db.hapusJadwalPraktikUntukHapus(id);
    }
    async lokasiAda(id, jenis) {
        return (await db.hitungLokasiUntukLokasiAda(id, jenis)) > 0;
    }
    async namaLokasiAda(jenis, nama, kecualiId) {
        return (await db.hitungLokasiUntukNamaAda(jenis, nama, kecualiId)) > 0;
    }
    async penggunaAda(id) {
        return (await db.hitungPenggunaUntukPenggunaAda(id)) > 0;
    }
    async punyaProfil(penggunaId) {
        return (await db.hitungProfilProfesiUntukPunyaProfil(penggunaId)) > 0;
    }
    async tarifKodeAda(kode, kecualiId) {
        return (await db.hitungTarifLayananUntukTarifKodeAda(kode, (kecualiId) ? (kecualiId) : undefined)) > 0;
    }
    async kodeTarifTindakan() {
        const t = await db.daftarTarifLayananUntukKodeTarifTindakan(AWALAN_KODE_TINDAKAN);
        return t.map((x) => x.kode);
    }
    async tambahRiwayatProfil(jenis, penggunaId, ringkasan, oleh) {
        await db.tambahRiwayatProfilUntukTambahRiwayatProfil(jenis, penggunaId, ringkasan.slice(0, 2000), oleh);
    }
}
