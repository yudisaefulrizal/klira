import { useState } from 'react';
import { KASIR } from '@klira/shared';
import type { KasirKunjunganDto } from '@klira/shared';
import { tambahItemTagihan } from '../../api-klien/kasir';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Isian } from '../../komponen/ui/isian';
import { Bingkai } from '../../komponen/ui/kartu';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { galatTambahItem } from './keadaan-kasir';
import { rupiahAtau } from './keadaan-order-lab';

const T = KASIR.tambah;
type Props = { kunjunganId: number; gambaran: KasirKunjunganDto; onUbah: (g: KasirKunjunganDto) => void };

/** Kasir menambah item tagihan dari master tarif (konsultasi, visite, tindakan, kamar) agar tagihan rawat jalan dan rawat inap lengkap tanpa aturan otomatis yang kaku. */
export function TambahItemTarif({ kunjunganId, gambaran, onUbah }: Props) {
  const [tarifId, setTarifId] = useState('');
  const [jumlah, setJumlah] = useState('1');
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  if (gambaran.kunjungan.tahap_layanan === 'ditutup') return null;
  const opsi = [{ nilai: '', label: T.pilih }, ...gambaran.tarif.map((t) => ({ nilai: String(t.id), label: `${t.nama} · ${rupiahAtau(t.harga, T.tanpaHarga)}` }))];

  async function tambah() {
    const g = galatTambahItem(tarifId, jumlah);
    if (g) return setGalat(g);
    setProses(true);
    setGalat(null);
    try {
      onUbah(await tambahItemTagihan(kunjunganId, Number(tarifId), Number(jumlah)));
      setTarifId('');
      setJumlah('1');
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : KASIR.bayar.gagal);
    } finally {
      setProses(false);
    }
  }

  return (
    <Bingkai halus arah="kolom" jarak="sm">
      <strong>{T.judul}</strong>
      <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{T.petunjuk}</span>
      {galat && <Peringatan>{galat}</Peringatan>}
      {gambaran.tarif.length === 0 ? <span style={{ color: token.warna.teksRedup }}>{T.tanpaTarif}</span> : (
        <Sebaris jarak="sm" sejajar="akhir" bungkus>
          <Tumbuh><Pilihan id="tambah-tarif" label={T.tarif} opsi={opsi} value={tarifId} disabled={proses} onChange={(e) => setTarifId(e.target.value)} /></Tumbuh>
          <div style={{ width: 96 }}><Isian id="tambah-jumlah" label={T.jumlah} inputMode="numeric" value={jumlah} disabled={proses} autoComplete="off" onChange={(e) => setJumlah(e.target.value)} /></div>
          <Tombol type="button" varian="sekunder" disabled={proses || !tarifId} onClick={() => void tambah()}>{proses ? T.menyimpan : T.simpan}</Tombol>
        </Sebaris>
      )}
    </Bingkai>
  );
}
