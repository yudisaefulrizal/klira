import { useState } from 'react';
import { KASIR } from '@klira/shared';
import type { ItemTagihanDto, KasirKunjunganDto } from '@klira/shared';
import { ubahHargaItem } from '../../api-klien/kasir';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { galatUbahHarga } from './keadaan-kasir';
import { rupiahAtau } from './keadaan-order-lab';

const U = KASIR.ubahHarga;
type Props = { kunjunganId: number; item: ItemTagihanDto; onTutup: () => void; onUbah: (g: KasirKunjunganDto) => void };

/** Ubah harga satu item tagihan per kunjungan (bukan obat, sebelum ada pembayaran); alasan wajib dan tercatat di audit. */
export function UbahHarga({ kunjunganId, item, onTutup, onUbah }: Props) {
  const [harga, setHarga] = useState(item.harga === null ? '' : String(item.harga));
  const [alasan, setAlasan] = useState('');
  const [dicoba, setDicoba] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const gb = galatUbahHarga(harga, alasan, item.harga);
  const berubah = harga !== (item.harga === null ? '' : String(item.harga)) || alasan.trim() !== '';

  async function simpan() {
    setDicoba(true);
    if (proses || Object.keys(gb).length) return;
    setProses(true);
    setGalat(null);
    try {
      onUbah(await ubahHargaItem(kunjunganId, item.id, harga.trim(), alasan.trim()));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KASIR.bayar.gagal);
      setProses(false);
    }
  }

  return (
    <Modal1
      judul={U.judul}
      lebar="modalKecil"
      lindungiTutup={berubah}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup} disabled={proses}>{U.batal}</Tombol>
          <Tombol type="submit" form="bentuk-ubah-harga" disabled={proses}>{proses ? U.menyimpan : U.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom
        tag="form"
        id="bentuk-ubah-harga"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void simpan();
        }}
      >
        <DaftarRingkasan bagian={[{ judul: '', baris: [
          { label: U.item, nilai: `${item.nama} x${item.jumlah}` },
          { label: U.hargaSekarang, nilai: rupiahAtau(item.harga) },
          ...(item.harga_acuan !== null && item.harga_acuan !== undefined && item.harga_acuan !== item.harga ? [{ label: U.hargaAcuan, nilai: rupiahAtau(item.harga_acuan) }] : []),
        ] }]} />
        <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{U.petunjuk}</span>
        <Isian id="ubah-harga-nilai" label={U.hargaBaru} inputMode="numeric" value={harga} autoComplete="off" onChange={(e) => setHarga(e.target.value)} galat={dicoba ? gb.harga : undefined} aria-required />
        <Isian id="ubah-harga-alasan" label={U.alasan} petunjuk={U.alasanPetunjuk} value={alasan} maxLength={300} autoComplete="off" onChange={(e) => setAlasan(e.target.value)} galat={dicoba ? gb.alasan : undefined} aria-required />
      </Kolom>
    </Modal1>
  );
}
