import { MODAL } from '@klira/shared';
import { bukaKonfirmasi } from '../modal-1/modal-dom.js';
export function buatTutupTerlindungi(lindungi, onTutup) {
  let konfirmasi;
  return { mintaTutup() {
    if (!lindungi()) { onTutup(); return true; }
    if (!konfirmasi) konfirmasi = bukaKonfirmasi({ judul: MODAL.tutupDrafJudul, pesan: MODAL.tutupDrafPesan, labelYa: MODAL.tutupDrafYa, labelTidak: MODAL.tutupDrafTidak,
      onYa() { konfirmasi.tutup(); konfirmasi = undefined; onTutup(); }, onTidak() { konfirmasi.tutup(); konfirmasi = undefined; },
    });
    return false;
  }, tutup() { konfirmasi?.tutup(); konfirmasi = undefined; } };
}
