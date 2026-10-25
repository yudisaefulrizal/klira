import { useEffect, useMemo, useState } from 'react';
import { FARMASI, JENIS_MUTASI, TOMBOL } from '@klira/shared';
import type { MasterObatDto, MutasiStokDto, StokObatDto } from '@klira/shared';
import { catatMutasiStok, stokObat } from '../../api-klien/farmasi';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Baris, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { awalMutasi, bentukMutasi, galatMutasi, gantiJenisMutasi, pilihBatch } from './keadaan-farmasi';
import type { KeadaanMutasi } from './keadaan-farmasi';

type Props = { obat: MasterObatDto; onTutup: () => void; onSelesai: () => void };
const MU = FARMASI.mutasi;
const OPSI_JENIS = (['terima', 'keluar', 'koreksi'] as const).map((j) => ({ nilai: j, label: MU.jenisLabel[j] }));

/**
 * Modal Mutasi stok (3.3, MODAL-1): terima (batch dan kedaluwarsa), keluar (alasan wajib, tidak melebihi stok), koreksi (jumlah sebenarnya, alasan wajib).
 * Mutasi hanya ditambah dan tidak dapat diubah atau dihapus; riwayat terakhir tampil di bawah.
 */
export function MutasiStok({ obat, onTutup, onSelesai }: Props) {
  const awal = useMemo(() => awalMutasi(String(obat.id)), [obat.id]);
  const [k, setK] = useState<KeadaanMutasi>(awal);
  const [stok, setStok] = useState<StokObatDto[] | null>(null);
  const [riwayat, setRiwayat] = useState<MutasiStokDto[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [adaTercatat, setAdaTercatat] = useState(false);

  useEffect(() => {
    let batal = false;
    stokObat(obat.id)
      .then((h) => {
        if (batal) return;
        setStok(h.stok);
        setRiwayat(h.mutasi);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : MU.gagal));
    return () => {
      batal = true;
    };
  }, [obat.id, adaTercatat]);

  const g = galatMutasi(k);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const dariDaftar = k.jenis !== 'terima';
  const opsiBatch = [{ nilai: '', label: MU.pilihBatch }, ...(stok ?? []).map((s) => ({ nilai: s.batch, label: `${s.batch} · ${s.jumlah} ${obat.satuan} · ${s.kedaluwarsa}` }))];
  const dipilih = stok?.find((s) => s.batch === k.batch);

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      await catatMutasiStok(bentukMutasi(k));
      setInfo(MU.tersimpan);
      setK({ ...awal, jenis: k.jenis });
      setDicoba(false);
      setAdaTercatat(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : MU.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const tutup = () => (adaTercatat ? onSelesai() : onTutup());

  return (
    <Modal1
      judul={`${MU.judul}: ${obat.nama_tampil}`}
      lindungiTutup={adaPerubahan(awal, k)}
      onTutup={tutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={tutup}>{TOMBOL.tutup}</Tombol>
          <Tombol type="submit" form="bentuk-mutasi" disabled={memproses}>{memproses ? MU.menyimpan : MU.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      <Kolom tag="form" id="bentuk-mutasi" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        <Pilihan id="mutasi-jenis" label={MU.jenis} opsi={OPSI_JENIS} value={k.jenis} onChange={(e) => setK(gantiJenisMutasi(k, e.target.value as KeadaanMutasi['jenis']))} />
        <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{k.jenis === 'terima' ? MU.petunjukTerima : k.jenis === 'keluar' ? MU.petunjukKeluar : MU.petunjukKoreksi}</span>
        {dariDaftar ? (
          <Pilihan id="mutasi-batch" label={MU.batch} opsi={opsiBatch} value={k.batch} onChange={(e) => setK(pilihBatch(k, stok ?? [], e.target.value))} galat={tampil('batch')} />
        ) : (
          <Baris>
            <Isian id="mutasi-batch" label={MU.batch} value={k.batch} onChange={(e) => setK({ ...k, batch: e.target.value })} galat={tampil('batch')} autoComplete="off" />
            <Isian id="mutasi-kedaluwarsa" label={MU.kedaluwarsa} type="date" value={k.kedaluwarsa} onChange={(e) => setK({ ...k, kedaluwarsa: e.target.value })} galat={tampil('kedaluwarsa')} />
          </Baris>
        )}
        {dipilih && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{MU.stokSekarang(dipilih.jumlah, obat.satuan)}</span>}
        <Isian id="mutasi-jumlah" label={`${MU.jumlah} (${obat.satuan})`} inputMode="numeric" value={k.jumlah} onChange={(e) => setK({ ...k, jumlah: e.target.value })} galat={tampil('jumlah')} autoComplete="off" />
        {k.jenis !== 'terima' && <AreaTeks id="mutasi-alasan" label={MU.alasan} value={k.alasan} maxLength={300} onChange={(e) => setK({ ...k, alasan: e.target.value })} aria-invalid={tampil('alasan') ? true : undefined} />}
        {tampil('alasan') && <Peringatan>{g.alasan}</Peringatan>}
      </Kolom>
      {riwayat.length > 0 && (
        <Kolom jarak="xs" role="group" aria-label={MU.riwayat}>
          <strong>{MU.riwayat}</strong>
          {riwayat.slice(0, 8).map((m) => (
            <Sebaris key={m.id} jarak="sm" bungkus>
              <Lencana warna={JENIS_MUTASI.warna(m.jenis)}>{JENIS_MUTASI.label(m.jenis)}</Lencana>
              <Tumbuh tag="span">{m.batch}: {m.jumlah > 0 ? `+${m.jumlah}` : m.jumlah}{m.alasan ? ` (${m.alasan})` : ''}</Tumbuh>
              <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{m.pengguna_nama ?? '-'} · {formatWaktu(m.waktu)}</span>
            </Sebaris>
          ))}
        </Kolom>
      )}
    </Modal1>
  );
}
