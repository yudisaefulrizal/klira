/** Pengaman kueri: filter `id` yang undefined diam-diam melepas kondisi WHERE (mengubah/membaca/menghapus semua baris). */
export function wajibId(fungsi, id) {
    if (id === undefined)
        throw new TypeError(`${fungsi}: id wajib diisi`);
}
