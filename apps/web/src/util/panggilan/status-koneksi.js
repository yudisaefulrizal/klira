import { sambungkanKanalWs } from '../ws/kanal-ws.js';

/** Pemantau tidak dihitung sebagai layar publik yang sedang tersambung. */
export function pantauStatusKoneksi(fasilitas, opsi) {
    const ambil = opsi.ambil ?? fetch;
    let aktif = true, memeriksa = false;
    let pengontrol;
    let timerServer;
    async function periksaServer() {
        if (!aktif || memeriksa)
            return;
        memeriksa = true;
        clearTimeout(timerServer);
        pengontrol = new AbortController();
        const batas = setTimeout(() => pengontrol?.abort(), 5000);
        try {
            const res = await ambil('/api/kesehatan', { cache: 'no-store', credentials: 'omit', signal: pengontrol.signal });
            const isi = await res.json();
            if (aktif)
                opsi.server(res.ok && isi.status === 'ok' ? 'terhubung' : 'terputus');
        }
        catch {
            if (aktif)
                opsi.server('terputus');
        }
        finally {
            clearTimeout(batas);
            memeriksa = false;
            if (aktif)
                timerServer = setTimeout(() => void periksaServer(), 15000);
        }
    }
    const kanal = fasilitas ? () => sambungkanKanalWs({
        path: `/api/publik/layar-panggilan/${fasilitas}/ws?pemantau=1`,
        asal: opsi.asal,
        buatSocket: opsi.buatSocket,
        putusSaatGalat: true,
        saatPutus() {
            opsi.layar({ status: 'tidak-diketahui', jumlah: null });
            void periksaServer();
        },
        saatGagalBuat: () => opsi.layar({ status: 'tidak-diketahui', jumlah: null }),
        saatPesan(pesan, awasi) {
            if (pesan.tipe === 'antrean') {
                awasi();
                opsi.antrean?.();
            }
            else if (pesan.tipe === 'layar' && Number.isSafeInteger(pesan.jumlah) && pesan.jumlah >= 0) {
                awasi();
                opsi.layar({ status: pesan.jumlah ? 'terhubung' : 'tidak-ada', jumlah: pesan.jumlah });
            }
        },
    }) : null;
    opsi.server('memeriksa');
    opsi.layar({ status: fasilitas ? 'memeriksa' : 'tanpa-fasilitas', jumlah: null });
    void periksaServer();
    const sambungan = kanal?.();
    return {
        periksaServer,
        tutup() {
            aktif = false;
            clearTimeout(timerServer);
            pengontrol?.abort();
            sambungan?.tutup();
        },
    };
}
