import { useCallback, useEffect, useState } from 'react';
import { FARMASI, STATUS_RESEP, TOMBOL } from '@klira/shared';
import type { HasilSiapDto, ResepDto } from '@klira/shared';
import { resepKunjungan, siapkanResep, telaahResep } from '../../api-klien/farmasi';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Bingkai } from '../../komponen/ui/kartu';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { KepalaPasien } from './kepala-pasien';
import { awalTelaah, galatTelaah, telaahLengkap } from './keadaan-farmasi';
import type { KeadaanTelaah } from './keadaan-farmasi';

type Props = {
  kunjunganId: number;
  pasien: { id: number; nama: string; nomor_rm: string };
  onTutup: () => void;
  /** Dipanggil saat modal ditutup setelah ada perubahan (muat ulang daftar). */
  onSelesai: () => void;
};
const T = FARMASI.telaah;

function KartuResep({ resep, onSelesaiTelaah, onSiap, memproses }: { resep: ResepDto; onSelesaiTelaah: (k: KeadaanTelaah) => Promise<void>; onSiap: () => Promise<void>; memproses: boolean }) {
  const [k, setK] = useState<KeadaanTelaah>(() => awalTelaah(resep.telaah));
  const [dicoba, setDicoba] = useState(false);
  const g = galatTelaah(k);
  const dikunci = resep.status === 'siap' || resep.status === 'diserahkan';
  return (
    <Bingkai arah="kolom" jarak="sm" padding="md">
      <Sebaris jarak="sm" bungkus>
        <Tumbuh tag="span"><strong>{T.resep(resep.nomor_resep)}</strong></Tumbuh>
        <Lencana warna={STATUS_RESEP.warna(resep.status)}>{STATUS_RESEP.label(resep.status)}</Lencana>
      </Sebaris>
      <Kolom jarak="xs" role="list" aria-label={FARMASI.resep.daftarObat}>
        {resep.item.map((i) => (
          <div key={i.id} role="listitem">
            <strong>{i.nama}</strong>: {i.jumlah} {i.satuan}, {i.aturan_pakai}
            <span style={{ color: i.stok_tersedia < i.jumlah ? token.warna.status.merah.teks : token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>
              {' '}· stok {i.stok_tersedia}
            </span>
          </div>
        ))}
      </Kolom>
      <Peringatan nada="biru">{T.alergiPeringatan}</Peringatan>
      <Kolom jarak="xs" role="group" aria-label={T.judul}>
        <KotakCentang id={`tel-adm-${resep.id}`} label={T.administratif} checked={k.administratif} disabled={dikunci} onChange={(e) => setK({ ...k, administratif: e.target.checked })} />
        <KotakCentang id={`tel-far-${resep.id}`} label={T.farmasetik} checked={k.farmasetik} disabled={dikunci} onChange={(e) => setK({ ...k, farmasetik: e.target.checked })} />
        <KotakCentang id={`tel-kli-${resep.id}`} label={T.klinis} checked={k.klinis} disabled={dikunci} onChange={(e) => setK({ ...k, klinis: e.target.checked })} />
        <AreaTeks id={`tel-cat-${resep.id}`} label={T.catatan} value={k.catatan} maxLength={1000} disabled={dikunci} onChange={(e) => setK({ ...k, catatan: e.target.value })} aria-invalid={dicoba && g.catatan ? true : undefined} />
        {dicoba && g.catatan && <Peringatan>{g.catatan}</Peringatan>}
      </Kolom>
      {resep.telaah && <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{T.oleh(resep.telaah.apoteker_nama ?? '-')}</span>}
      {!dikunci && (
        <Sebaris jarak="sm" bungkus>
          <Tombol type="button" varian="sekunder" disabled={memproses} onClick={() => { setDicoba(true); if (!Object.keys(g).length) void onSelesaiTelaah(k); }}>{memproses ? T.memproses : T.simpan}</Tombol>
          <Tombol type="button" disabled={memproses || resep.status !== 'ditelaah' || !telaahLengkap(k)} onClick={() => void onSiap()}>{T.siap}</Tombol>
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{T.siapInfo}</span>
        </Sebaris>
      )}
    </Bingkai>
  );
}

/**
 * Modal Telaah dan siapkan resep (3.3, MODAL-1): telaah administratif, farmasetik, klinis, lalu tandai siap. Stok kurang tidak memblokir
 * tetapi ditampilkan sebagai peringatan. Setelah semua resep kunjungan siap, kunjungan maju ke kasir; obat diserahkan melalui aksi farmasi tersendiri.
 */
export function TelaahResep({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const [daftar, setDaftar] = useState<ResepDto[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [kekurangan, setKekurangan] = useState<HasilSiapDto['kekurangan']>([]);
  const [memproses, setMemproses] = useState(false);
  const [berubah, setBerubah] = useState(false);

  const muat = useCallback(() => resepKunjungan(kunjunganId).then(setDaftar), [kunjunganId]);
  useEffect(() => {
    muat().catch((e) => setGalat(e instanceof GalatApi ? e.message : FARMASI.resep.gagalMuat));
  }, [muat]);

  async function jalankan(f: () => Promise<void>) {
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      await f();
      setBerubah(true);
      await muat();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : T.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const tutup = () => (berubah ? onSelesai() : onTutup());
  const perluTelaah = (daftar ?? []).filter((r) => r.status === 'diajukan' || r.status === 'ditelaah');

  return (
    <Modal1
      judul={T.judul}
      lebar="modalBesar"
      konteks={<KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />}
      onTutup={tutup}
      aksi={<Tombol type="button" onClick={tutup}>{TOMBOL.tutup}</Tombol>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      {kekurangan.length > 0 && (
        <Peringatan>
          <strong>{T.stokKurangJudul}</strong>
          {kekurangan.map((x) => <div key={x.master_obat_id}>{T.stokKurang(x.nama, x.butuh, x.tersedia)}</div>)}
        </Peringatan>
      )}
      {!daftar && !galat && <span style={{ color: token.warna.teksRedup }}>{FARMASI.memuat}</span>}
      {daftar && daftar.length === 0 && <span style={{ color: token.warna.teksRedup }}>{T.kosong}</span>}
      {daftar && daftar.length > 0 && perluTelaah.length === 0 && <Peringatan nada="biru">{T.selesaiPesan}</Peringatan>}
      <Kolom>
        {daftar?.map((r) => (
          <KartuResep
            key={`${r.id}-${r.status}`}
            resep={r}
            memproses={memproses}
            onSelesaiTelaah={(k) => jalankan(async () => { await telaahResep(r.id, k); setInfo(T.tercatat); })}
            onSiap={() => jalankan(async () => { const h = await siapkanResep(r.id); setKekurangan(h.kekurangan); setInfo(T.sudahSiap); })}
          />
        ))}
      </Kolom>
    </Modal1>
  );
}
