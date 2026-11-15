/** Galat dari layanan eksternal (SATUSEHAT, PCare). `rincian` berisi pesan asli layanan bila ada. */
export class GalatIntegrasi extends Error {
    layanan;
    status;
    rincian;
    jaringan;
    constructor(pesan, { layanan, status = null, rincian = [], jaringan = false } = {}) {
        super(pesan);
        this.name = 'GalatIntegrasi';
        this.layanan = layanan;
        this.status = status;
        this.rincian = rincian;
        this.jaringan = jaringan;
    }
}
