import { useEffect, useMemo, useState } from 'react';
import { FARMASI, NAVIGASI, TOMBOL } from '@klira/shared';
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
import { Pilihan } from '../../komponen/ui/pilihan';
import { Baris, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { useNilaiTertunda } from '../../util/tunda';
import { awalMasterObat, bentukTambahObat, galatMasterObat, opsiRute, perubahanMasterObat, pilihKfa } from './keadaan-farmasi';
import type { KeadaanMasterObat } from './keadaan-farmasi';

type Props = { obat?: MasterObatDto; onTutup: () => void; onSelesai: () => void };

/** Jumlah saran KFA yang ditampilkan; sisanya dicapai dengan kata kunci yang lebih spesifik. */
const BATAS_HASIL_KFA = 10;

/** Modal Master obat (3.3, MODAL-1): pilih dari Referensi KFA (tanpa obat ketik bebas), atur nama tampil, satuan, rute pemberian, harga, aktif. Ubah tidak mengganti kode KFA. */
export function MasterObat({ obat, onTutup, onSelesai }: Props) {
  const M = FARMASI.master;
  const awal = useMemo(() => awalMasterObat(obat), [obat]);
  const [k, setK] = useState<KeadaanMasterObat>(awal);
  const [cari, setCari] = useState('');
  const tertunda = useNilaiTertunda(cari.trim(), 250);
  const [hasil, setHasil] = useState<ReferensiKfaDto[] | null>(null);
  const [mencari, setMencari] = useState(false);
  const [galatCari, setGalatCari] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const ubah = !!obat;

  const g = galatMasterObat(k, ubah);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);

  // Saran muncul saat mengetik (jeda singkat); permintaan lama dibatalkan agar hasil tidak tertukar.
  useEffect(() => {
    if (tertunda.length < 2) {
      setHasil(null);
      setMencari(false);
      return;
    }
    let batal = false;
    setMencari(true);
    setGalatCari(null);
    cariKfa(tertunda, BATAS_HASIL_KFA)
      .then((h) => !batal && setHasil(h))
      .catch((e) => !batal && setGalatCari(e instanceof GalatApi ? e.message : M.gagalMuat))
      .finally(() => !batal && setMencari(false));
    return () => {
      batal = true;
    };
  }, [tertunda, M.gagalMuat]);

  const pilih = (h: ReferensiKfaDto) => {
    setK(pilihKfa(k, h));
    setCari('');
    setHasil(null);
  };
  const tampilHasil = cari.trim().length >= 2 ? hasil : null;

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

  const kfaTampil = obat ? { kode: obat.kfa_kode, nama: obat.kfa_nama } : k.kfa;

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
            <Isian id="kfa-cari" label={M.cariKfa} placeholder={M.cariKfaPetunjuk} value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
            {galatCari && <Peringatan>{galatCari}</Peringatan>}
            {mencari && <span style={{ color: token.warna.teksRedup }}>{NAVIGASI.memuat}</span>}
            {tampilHasil && tampilHasil.length === 0 && !mencari && <Peringatan nada="biru">{M.kfaTidakAda}</Peringatan>}
            {tampilHasil && tampilHasil.length > 0 && (
              <div style={{ maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }}>
                <Bingkai tag="ul" arah="kolom" jarak="tanpa" padding="tanpa" aria-label={M.pilihKfa}>
                  {tampilHasil.map((h) => (
                    <Kolom tag="li" jarak="tanpa" garis="atas" halus key={h.kode}>
                      <Tombol type="button" varian="langkah" penuh disabled={h.status !== 'aktif'} onClick={() => pilih(h)}>
                        <span style={{ flexGrow: 1 }}>
                          {h.nama}
                          <small style={{ display: 'block', color: token.warna.teksRedup }}>{[h.kode, h.bentuk_sediaan].filter(Boolean).join(' · ')}</small>
                        </span>
                        {h.lokal && <Lencana warna="biru">{M.kfaLokal}</Lencana>}
                        {h.status !== 'aktif' && <Lencana warna="abu">{M.kfaTidakAktif}</Lencana>}
                      </Tombol>
                    </Kolom>
                  ))}
                </Bingkai>
              </div>
            )}
            {tampilHasil && tampilHasil.length >= BATAS_HASIL_KFA && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{M.kfaBatasHasil}</span>}
            {tampil('kfa_kode') && <Peringatan>{g.kfa_kode}</Peringatan>}
          </Kolom>
        )}
        {kfaTampil && (
          <Bingkai halus arah="kolom" jarak="xs">
            <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{M.terpilih}</span>
            <strong>{kfaTampil.nama}</strong>
            <span style={{ color: token.warna.teksRedup }}>{kfaTampil.kode}</span>
          </Bingkai>
        )}
        <Isian id="obat-nama" label={M.bidang.nama_tampil} value={k.nama_tampil} onChange={(e) => setK({ ...k, nama_tampil: e.target.value })} galat={tampil('nama_tampil')} autoComplete="off" />
        <Baris>
          <Isian id="obat-satuan" label={M.bidang.satuan} value={k.satuan} onChange={(e) => setK({ ...k, satuan: e.target.value })} galat={tampil('satuan')} autoComplete="off" />
          <Isian id="obat-harga" label={M.bidang.harga} petunjuk={M.petunjukHarga} inputMode="numeric" value={k.harga} onChange={(e) => setK({ ...k, harga: e.target.value })} galat={tampil('harga')} autoComplete="off" />
        </Baris>
        <Pilihan id="obat-rute" label={M.bidang.rute} petunjuk={M.bidang.rutePetunjuk} value={k.rute} opsi={opsiRute(k.rute)} onChange={(e) => setK({ ...k, rute: e.target.value })} galat={tampil('rute')} />
        <KotakCentang id="obat-aktif" label={M.bidang.aktif} checked={k.aktif} onChange={(e) => setK({ ...k, aktif: e.target.checked })} />
      </Kolom>
    </Modal1>
  );
}
