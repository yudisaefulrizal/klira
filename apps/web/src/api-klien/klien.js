import { GALAT } from '@klira/shared';
export class GalatApi extends Error {
    status;
    peringatan;
    kode;
    rincian;
    constructor(status, message, peringatan, kode, rincian) {
        super(message);
        this.status = status;
        this.peringatan = peringatan;
        this.kode = kode;
        this.rincian = rincian;
    }
}
/** Pemanggil API dasar: JSON, cookie sesi ikut terkirim, galat dipetakan ke GalatApi. */
export async function panggilApi(metode, jalur, badan, ambil = fetch) {
    let res;
    try {
        res = await ambil(`/api${jalur}`, {
            method: metode,
            credentials: 'same-origin',
            headers: badan === undefined ? undefined : { 'content-type': 'application/json' },
            body: badan === undefined ? undefined : JSON.stringify(badan),
        });
    }
    catch {
        throw new GalatApi(0, GALAT.jaringan);
    }
    const isi = (await res.json().catch(() => null));
    if (!res.ok)
        throw new GalatApi(res.status, isi?.galat?.pesan ?? GALAT.umum, isi?.galat?.peringatan, isi?.galat?.kode, isi?.galat?.rincian);
    return isi?.data;
}
