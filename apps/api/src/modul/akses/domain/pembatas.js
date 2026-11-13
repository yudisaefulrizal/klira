export const OPSI_PEMBATAS_BAWAAN = {
    batasAkun: 5,
    batasAlamat: 20,
    jendelaMs: 15 * 60_000,
    jedaMs: 5 * 60_000,
    maksCatatan: 10_000,
};
/** Pembatas percobaan masuk gagal per akun dan per alamat, dalam memori proses. */
export class PembatasPercobaan {
    opsi;
    sekarang;
    akun = new Map();
    alamat = new Map();
    terakhirBersih = 0;
    constructor(opsi = OPSI_PEMBATAS_BAWAAN, sekarang = Date.now) {
        this.opsi = opsi;
        this.sekarang = sekarang;
    }
    /** Sisa jeda (ms) bila terkunci, 0 bila boleh mencoba. */
    sisaJeda(username, alamat) {
        const t = this.sekarang();
        const a = this.akun.get(kunciAkun(username));
        const b = this.alamat.get(alamat);
        return Math.max(0, (a?.terkunciSampai ?? 0) - t, (b?.terkunciSampai ?? 0) - t);
    }
    /** Jumlah catatan yang masih disimpan (untuk uji dan pemantauan). */
    ukuran() {
        return { akun: this.akun.size, alamat: this.alamat.size };
    }
    /** Buang catatan yang jendelanya lewat dan tidak sedang terkunci. */
    bersihkan() {
        const t = this.sekarang();
        this.terakhirBersih = t;
        for (const peta of [this.akun, this.alamat]) {
            for (const [k, c] of peta)
                if (c.terkunciSampai <= t && t - c.mulai > this.opsi.jendelaMs)
                    peta.delete(k);
        }
    }
    /** `batasAkun` menimpa batas bawaan per akun (kebijakan keamanan fasyankes). */
    catatGagal(username, alamat, batasAkun = this.opsi.batasAkun) {
        const maks = this.opsi.maksCatatan ?? OPSI_PEMBATAS_BAWAAN.maksCatatan;
        if (this.sekarang() - this.terakhirBersih >= this.opsi.jendelaMs || this.akun.size >= maks || this.alamat.size >= maks) {
            this.bersihkan();
        }
        this.tambah(this.akun, kunciAkun(username), batasAkun);
        this.tambah(this.alamat, alamat, this.opsi.batasAlamat);
    }
    catatBerhasil(username) {
        this.akun.delete(kunciAkun(username));
    }
    tambah(peta, kunci, batas) {
        const t = this.sekarang();
        let c = peta.get(kunci);
        if (!c || (t - c.mulai > this.opsi.jendelaMs && c.terkunciSampai <= t)) {
            c = { gagal: 0, mulai: t, terkunciSampai: 0 };
        }
        c.gagal += 1;
        if (c.gagal >= batas) {
            c.terkunciSampai = t + this.opsi.jedaMs;
            c.gagal = 0;
            c.mulai = t;
        }
        peta.set(kunci, c);
    }
}
function kunciAkun(username) {
    return username.trim().toLowerCase();
}
