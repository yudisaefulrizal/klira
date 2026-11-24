/**
 * Kelompokkan baris hasil JOIN (kolom beralias `t<N>__kolom`) menjadi objek per entitas tabel `t`.
 * Baris dikelompokkan menurut `t__id` (baris dengan id null dilewati). `entri` berisi nama kolom (diambil dari baris pertama
 * kelompok) atau pasangan [nama, (barisKelompok) => nilai] untuk relasi anak; urutan kunci hasil mengikuti urutan `entri`.
 */
export function kelompokkan(semua, t, entri) {
    const kolomId = `${t}__id`;
    const grup = new Map();
    for (const baris of semua) {
        if (baris[kolomId] === null)
            continue;
        const kunci = String(baris[kolomId]);
        const isi = grup.get(kunci);
        if (isi)
            isi.push(baris);
        else
            grup.set(kunci, [baris]);
    }
    return [...grup.values()].map((baris) => Object.fromEntries(entri.map((e) => (Array.isArray(e) ? [e[0], e[1](baris)] : [e, baris[0][`${t}__${e}`]]))));
}
