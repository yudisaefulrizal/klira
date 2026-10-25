import { useMemo, useState } from 'react';
import { FARMASI, TOMBOL } from '@klira/shared';
import type { MasterObatDto, ReferensiKfaDto } from '@klira/shared';
import { buatMasterObat, cariKfa, ubahMasterObat } from '../../api-klien/farmasi';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Isian } from '../../komponen/ui/isian';
import { Bingkai } from '../../komponen/ui/kartu';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Baris, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalMasterObat, bentukTambahObat, galatMasterObat, perubahanMasterObat, pilihKfa } from './keadaan-farmasi';
import type { KeadaanMasterObat } from './keadaan-farmasi';

type Props = { obat?: MasterObatDto; onTutup: () => void; onSelesai: () => void };

/** Modal Master obat (3.3, MODAL-1): pilih dari Referensi KFA (tanpa obat ketik bebas), atur nama tampil, satuan, harga, aktif. Ubah tidak mengganti kode KFA. */
export function MasterObat({ obat, onTutup, onSelesai }: Props) {
  const M = FARMASI.master;
  const awal = useMemo(() => awalMasterObat(obat), [obat]);
  const [k, setK] = useState<KeadaanMasterObat>(awal);
  const [cari, setCari] = useState('');
  const [hasil, setHasil] = useState<ReferensiKfaDto[] | null>(null);
  const [mencari, setMencari] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const ubah = !!obat;

  const g = galatMasterObat(k, ubah);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);

  async function telusuri() {
    if (cari.trim().length < 2) return setGalat(FARMASI.galat.cariPendek);
    setMencari(true);
    setGalat(null);
    try {
      setHasil(await cariKfa(cari));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : M.gagalMuat);
    } finally {
      setMencari(false);
    }
  }

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      if (obat) await ubahMasterObat(obat.id, perubahanMasterObat(awal, k));
      else await buatMasterObat(bentukTambahObat(k));
      onSelesai();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : M.gagalMuat);
    } finally {
      setMemproses(false);
    }
  }

  const kfaTampil = obat ? { kode: obat.kfa_kode, nama: obat.kfa_nama, contoh: obat.kfa_contoh } : k.kfa;

  return (
    <Modal1
      judul={ubah ? M.judulUbah : M.judulTambah}
      lindungiTutup={adaPerubahan(awal, { ...k, kfa: null }) || (!ubah && !!k.kfa)}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="submit" form="bentuk-master-obat" disabled={memproses || (ubah && Object.keys(perubahanMasterObat(awal, k)).length === 0)}>{memproses ? FARMASI.mutasi.menyimpan : TOMBOL.simpan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-master-obat" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        {!ubah && (
          <Kolom jarak="sm">
            <Sebaris jarak="sm" sejajar="akhir" bungkus>
              <Tumbuh>
                <Isian id="kfa-cari" label={M.cariKfa} placeholder={M.cariKfaPetunjuk} value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void telusuri(); } }} />
              </Tumbuh>
              <Tombol type="button" varian="sekunder" disabled={mencari} onClick={() => void telusuri()}>{TOMBOL.cari}</Tombol>
            </Sebaris>
            {hasil && hasil.length === 0 && <Peringatan nada="biru">{M.kfaTidakAda}</Peringatan>}
            {hasil && hasil.length > 0 && (
              <Kolom jarak="xs" role="group" aria-label={M.pilihKfa} style={{ maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }}>
                {hasil.map((h) => (
                  <Bingkai key={h.id} halus>
                    <Tumbuh>
                      <div style={{ fontWeight: token.huruf.berat.sedang }}>{h.nama}</div>
                      <div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{[h.kode, h.bentuk_sediaan, h.kekuatan].filter(Boolean).join(' · ')}</div>
                    </Tumbuh>
                    {h.contoh && <Lencana warna="kuning">{M.contoh}</Lencana>}
                    <Tombol type="button" varian={k.kfa?.id === h.id ? 'utama' : 'sekunder'} onClick={() => setK(pilihKfa(k, h))}>{k.kfa?.id === h.id ? M.terpilih : TOMBOL.pilih}</Tombol>
                  </Bingkai>
                ))}
              </Kolom>
            )}
            {hasil?.some((h) => h.contoh) && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{M.kfaContohInfo}</span>}
            {tampil('kfa_id') && <Peringatan>{g.kfa_id}</Peringatan>}
          </Kolom>
        )}
        {kfaTampil && (
          <Bingkai halus arah="kolom" jarak="xs">
            <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{M.terpilih}</span>
            <strong>{kfaTampil.nama}</strong>
            <span style={{ color: token.warna.teksRedup }}>{kfaTampil.kode}{kfaTampil.contoh && <> <Lencana warna="kuning">{M.contoh}</Lencana></>}</span>
          </Bingkai>
        )}
        <Isian id="obat-nama" label={M.bidang.nama_tampil} value={k.nama_tampil} onChange={(e) => setK({ ...k, nama_tampil: e.target.value })} galat={tampil('nama_tampil')} autoComplete="off" />
        <Baris>
          <Isian id="obat-satuan" label={M.bidang.satuan} value={k.satuan} onChange={(e) => setK({ ...k, satuan: e.target.value })} galat={tampil('satuan')} autoComplete="off" />
          <Isian id="obat-harga" label={M.bidang.harga} inputMode="numeric" value={k.harga} onChange={(e) => setK({ ...k, harga: e.target.value })} galat={tampil('harga')} autoComplete="off" />
        </Baris>
        <KotakCentang id="obat-aktif" label={M.bidang.aktif} checked={k.aktif} onChange={(e) => setK({ ...k, aktif: e.target.checked })} />
      </Kolom>
    </Modal1>
  );
}
