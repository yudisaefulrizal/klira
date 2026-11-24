/** Tampilkan galat tiap kontrol formulir; galat baru muncul setelah pengguna mencoba mengirim (`dicoba`). */
export function tampilkanGalat(controls, galat, dicoba) {
    for (const [nama, kontrol] of controls)
        kontrol.setGalat(dicoba ? galat[nama] : undefined);
}
