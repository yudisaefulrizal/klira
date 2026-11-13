const pengelola = new WeakMap();
/**
 * Setiap lapisan menambah satu entri riwayat. Kembali peramban menutup lapisan teratas;
 * penutupan lewat antarmuka melepas entrinya tanpa menutup lapisan di bawahnya.
 */
export function bukaLapisanRiwayat(w, onKembali) {
    let keadaan = pengelola.get(w);
    if (!keadaan) {
        keadaan = { lapisan: [], abaikan: 0 };
        pengelola.set(w, keadaan);
        const aktif = keadaan;
        const saatKembali = () => {
            // back() saat pembersihan juga memicu popstate secara asinkron.
            if (aktif.abaikan > 0) {
                aktif.abaikan--;
            }
            else {
                const atas = aktif.lapisan[aktif.lapisan.length - 1];
                if (atas) {
                    atas.masihAda = false;
                    if (!atas.onKembali()) {
                        w.history.pushState({ klira_lapisan: true }, '');
                        atas.masihAda = true;
                    }
                }
            }
            if (aktif.lapisan.length === 0 && aktif.abaikan === 0) {
                w.removeEventListener('popstate', saatKembali);
                pengelola.delete(w);
            }
        };
        w.addEventListener('popstate', saatKembali);
    }
    const lapisan = { masihAda: true, onKembali };
    keadaan.lapisan.push(lapisan);
    w.history.pushState({ klira_lapisan: true }, '');
    return () => {
        const i = keadaan.lapisan.indexOf(lapisan);
        if (i < 0)
            return;
        keadaan.lapisan.splice(i, 1);
        if (lapisan.masihAda) {
            keadaan.abaikan++;
            w.history.back();
        }
    };
}
