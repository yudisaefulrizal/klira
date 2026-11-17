/**
 * Membuka tab peramban baru (`_blank`) untuk pratinjau cetak agar tidak menutupi halaman kerja.
 * Mengembalikan `null` bila pop-up diblokir peramban sehingga pemanggil dapat jatuh kembali ke dialog di halaman yang sama.
 */
export function bukaTabCetak({ judul, cssHref, onTutup }) {
    const tab = window.open('', '_blank');
    if (!tab) return null;

    const doc = tab.document;
    doc.open();
    doc.write('<!doctype html><html lang="id"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body></body></html>');
    doc.close();
    doc.title = judul;

    const tema = document.documentElement.dataset.tema;
    if (tema) doc.documentElement.dataset.tema = tema;

    for (const href of ['/src/gaya/token.css', '/src/komponen/ui/primitif.css', cssHref]) {
        if (!href) continue;
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = new URL(href, window.location.origin).href;
        doc.head.append(link);
    }

    let selesai = false;
    const bersih = () => {
        if (selesai) return;
        selesai = true;
        tab.removeEventListener('beforeunload', saatTutupTab);
        onTutup?.();
    };
    const saatTutupTab = () => bersih();
    tab.addEventListener('beforeunload', saatTutupTab);

    return {
        body: doc.body,
        cetak() { tab.focus(); tab.print(); },
        tutup() {
            bersih();
            if (!tab.closed) tab.close();
        },
        hancurkan() {
            if (selesai) return;
            selesai = true;
            tab.removeEventListener('beforeunload', saatTutupTab);
            if (!tab.closed) tab.close();
        },
    };
}
