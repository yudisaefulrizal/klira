import { useState } from 'react';
import { MODAL } from '@klira/shared';
import type { KonfirmasiPeringatan, PeringatanTerdeteksi } from '@klira/shared';
import { token } from '../../gaya/token';
import { alasanSiap } from '../../util/alasan';
import { Dialog } from '../ui/dialog';
import { AreaTeks } from '../ui/area-teks';
import { KotakCentang } from '../ui/kotak-centang';
import { Peringatan } from '../ui/peringatan';
import { Tombol } from '../ui/tombol';
import { Kolom, Sebaris } from '../ui/susunan';

export type IsianPeringatan = { alasan: string; terima: boolean };
export const isianPeringatanAwal: IsianPeringatan = { alasan: '', terima: false };
export const dariIsian = (i: IsianPeringatan): KonfirmasiPeringatan => ({ alasan: i.alasan.trim(), terima_untuk_akun: i.terima });
export const isianPeringatanSiap = (i: IsianPeringatan): boolean => alasanSiap(i.alasan, true);

type FormProps = {
  peringatan: readonly { pesan: string }[] | readonly PeringatanTerdeteksi[];
  nilai: IsianPeringatan;
  onUbah: (n: IsianPeringatan) => void;
  /** Tampilkan opsi "Terima untuk akun ini" (pilihan pimpinan atas akun tertentu, 2.2). */
  opsiTerima?: boolean;
  idDasar?: string;
};

/**
 * Isi peringatan: daftar peringatan, alasan wajib, dan opsi Terima untuk akun ini. Pada alur bertahap dipasang
 * langsung di langkah terakhir (3.2); alur lain memakai DialogPeringatan.
 */
export function FormPeringatan({ peringatan, nilai, onUbah, opsiTerima = true, idDasar = 'peringatan' }: FormProps) {
  return (
    <Kolom tag="section" jarak="sm" aria-label={MODAL.peringatanJudul}>
      <Peringatan nada="kuning">
        <strong>{MODAL.peringatanJudul}</strong>
        <ul style={{ margin: `${token.jarak.xs} 0 0`, paddingLeft: token.jarak.lg }}>
          {peringatan.map((w) => <li key={w.pesan}>{w.pesan}</li>)}
        </ul>
        <div style={{ marginTop: token.jarak.sm }}>{MODAL.peringatanKeterangan}</div>
      </Peringatan>
      <AreaTeks id={`${idDasar}-alasan`} label={MODAL.peringatanAlasan} required value={nilai.alasan} onChange={(e) => onUbah({ ...nilai, alasan: e.target.value })} />
      {opsiTerima && (
        <KotakCentang
          id={`${idDasar}-terima`}
          label={MODAL.peringatanTerima}
          keterangan={MODAL.peringatanTerimaKet}
          checked={nilai.terima}
          onChange={(e) => onUbah({ ...nilai, terima: e.target.checked })}
        />
      )}
    </Kolom>
  );
}

type DialogProps = {
  peringatan: readonly PeringatanTerdeteksi[];
  onLanjut: (konfirmasi: KonfirmasiPeringatan) => void;
  onBatal: () => void;
  opsiTerima?: boolean;
  memproses?: boolean;
  labelLanjut?: string;
};

/** Peringatan sebagai dialog (di luar alur bertahap): alasan wajib, tercatat; tidak memblokir bila alasan diisi. */
export function DialogPeringatan({ peringatan, onLanjut, onBatal, opsiTerima = true, memproses, labelLanjut = MODAL.lanjutkanDenganAlasan }: DialogProps) {
  const [nilai, setNilai] = useState(isianPeringatanAwal);
  const siap = isianPeringatanSiap(nilai) && !memproses;
  return (
    <Dialog judul={MODAL.peringatanJudul} onEsc={onBatal} lapis="konfirmasi" lebar="modalSedang">
      <Kolom tag="form" jarak="md" padding="lg"
        onSubmit={(e) => {
          e.preventDefault();
          if (siap) onLanjut(dariIsian(nilai));
        }}
      >
        <FormPeringatan peringatan={peringatan} nilai={nilai} onUbah={setNilai} opsiTerima={opsiTerima} idDasar="dialog-peringatan" />
        <Sebaris jarak="sm" sejajar="regang" sebaran="akhir">
          <Tombol type="button" varian="sekunder" onClick={onBatal}>{MODAL.batal}</Tombol>
          <Tombol type="submit" disabled={!siap}>{labelLanjut}</Tombol>
        </Sebaris>
      </Kolom>
    </Dialog>
  );
}
