/**
 * Sambungan WebSocket kanal pembaruan: menyambung, memantau denyut (watchdog), dan menyambung ulang dengan jeda
 * yang berlipat (1 dtk sampai 15 dtk). Pesan 'siap' mereset jeda, 'hidup' hanya menyegarkan watchdog; pesan lain
 * diserahkan ke `saatPesan(pesan, awasi)` (pemanggil menyegarkan watchdog sendiri bila perlu).
 *
 * opsi: path, asal, buatSocket, saatPesan, saatSiap, saatPutus, saatGagalBuat, putusSaatGalat.
 * Mengembalikan { tutup } yang menghentikan semua timer dan menutup soket.
 */
export function sambungkanKanalWs(opsi) {
    const buatSocket = opsi.buatSocket ?? ((url) => new WebSocket(url));
    let aktif = true;
    let jeda = 1000;
    let socket;
    let timerSocket;
    let timerHidup;
    const lepasPengait = (s) => {
        s.onmessage = null;
        s.onclose = null;
        s.onerror = null;
        s.close();
    };
    const jadwalkanUlang = () => {
        timerSocket = setTimeout(hubungkan, jeda);
        jeda = Math.min(jeda * 2, 15000);
    };
    function awasi(ms = 45000) {
        clearTimeout(timerHidup);
        timerHidup = setTimeout(() => {
            if (socket)
                putus(socket);
        }, ms);
    }
    function putus(lama) {
        if (!aktif || !lama || socket !== lama)
            return;
        socket = undefined;
        lepasPengait(lama);
        clearTimeout(timerHidup);
        opsi.saatPutus?.();
        clearTimeout(timerSocket);
        jadwalkanUlang();
    }
    function hubungkan() {
        if (!aktif)
            return;
        try {
            const url = new URL(opsi.path, opsi.asal);
            url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
            const baru = buatSocket(url.href);
            socket = baru;
            awasi(10000);
            baru.onmessage = (event) => {
                if (!aktif || socket !== baru)
                    return;
                try {
                    const pesan = JSON.parse(String(event.data));
                    if (pesan.tipe === 'siap') {
                        opsi.saatSiap?.();
                        jeda = 1000;
                        awasi();
                    }
                    else if (pesan.tipe === 'hidup')
                        awasi();
                    else
                        opsi.saatPesan(pesan, awasi);
                }
                catch {
                    if (opsi.putusSaatGalat)
                        putus(baru);
                }
            };
            baru.onclose = () => putus(baru);
            baru.onerror = () => putus(baru);
        }
        catch {
            opsi.saatGagalBuat?.();
            clearTimeout(timerSocket);
            jadwalkanUlang();
        }
    }
    hubungkan();
    return {
        tutup() {
            aktif = false;
            clearTimeout(timerSocket);
            clearTimeout(timerHidup);
            if (socket) {
                const lama = socket;
                socket = undefined;
                lepasPengait(lama);
            }
        },
    };
}
