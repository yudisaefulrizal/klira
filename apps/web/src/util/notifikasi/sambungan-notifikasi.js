export const PERISTIWA_NOTIFIKASI = 'klira:notifikasi';

/**
 * Menjaga koneksi WebSocket `/api/notifikasi/ws` selama sesi aktif,
 * memantau heartbeat, menyambung ulang otomatis, dan meneruskan event notifikasi.
 */
export function sambungkanNotifikasi(opsi) {
    const buatSocket = opsi.buatSocket ?? ((url) => new WebSocket(url));
    let aktif = true;
    let jeda = 1000;
    let socket;
    let timerSocket;
    let timerHidup;

    function awasi(ms = 45000) {
        clearTimeout(timerHidup);
        timerHidup = setTimeout(() => {
            if (socket)
                putus(socket);
        }, ms);
    }

    function putus(lama) {
        if (!aktif || socket !== lama)
            return;
        socket = undefined;
        lama.onmessage = null;
        lama.onclose = null;
        lama.onerror = null;
        lama.close();
        clearTimeout(timerHidup);
        clearTimeout(timerSocket);
        timerSocket = setTimeout(hubungkan, jeda);
        jeda = Math.min(jeda * 2, 15000);
    }

    function hubungkan() {
        if (!aktif)
            return;
        try {
            const url = new URL('/api/notifikasi/ws', opsi.asal);
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
                        jeda = 1000;
                        awasi();
                    } else if (pesan.tipe === 'hidup') {
                        awasi();
                    } else if (['skrining_selesai', 'order_lab_baru', 'hasil_lab_selesai', 'hasil_lab_kasir'].includes(pesan.tipe)) {
                        awasi();
                        opsi.onNotifikasi?.(pesan);
                        if (typeof window !== 'undefined')
                            window.dispatchEvent(new CustomEvent(PERISTIWA_NOTIFIKASI, { detail: pesan }));
                    }
                } catch { /* Abaikan payload tidak valid. */ }
            };
            baru.onerror = () => putus(baru);
            baru.onclose = () => putus(baru);
        } catch {
            clearTimeout(timerSocket);
            timerSocket = setTimeout(hubungkan, jeda);
            jeda = Math.min(jeda * 2, 15000);
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
                lama.onmessage = null;
                lama.onclose = null;
                lama.onerror = null;
                lama.close();
            }
        },
    };
}
