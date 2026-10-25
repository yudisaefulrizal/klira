import { useCallback, useEffect, useMemo, useState } from 'react';
import { FARMASI, STATUS_RESEP } from '@klira/shared';
import type { MasterObatDto, ResepDto } from '@klira/shared';
import { buatResep, daftarMasterObat, resepKunjungan } from '../../api-klien/farmasi';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { useIzin } from '../../komponen/izin-saja';
import { Bingkai } from '../../komponen/ui/kartu';
import { Isian } from '../../komponen/ui/isian';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Baris, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { awalResep, barisResepKosong, biayaResep, bentukResep, galatResep, hapusBarisResep, ubahBarisResep } from './keadaan-farmasi';
import type { BarisResep } from './keadaan-farmasi';
import { rupiah } from './keadaan-order-lab';

type Props = {
  kunjunganId: number;
  /** Dipanggil setelah resep diajukan (induk menandai ada resep agar tahap berikutnya resep, bukan kasir). */
  onResepDiajukan: () => void;
};
const R = FARMASI.resep;

/**
 * Langkah Resep di Pemeriksaan klinis (3.3): resep kunjungan ini dan formulir obat (dari master obat klinik, tanpa obat ketik bebas), jumlah, aturan pakai.
 * Resep tersimpan langsung ke server dan biayanya masuk tagihan saat diajukan; tidak menunggu tombol Simpan pemeriksaan.
 */
export function LangkahResep({ kunjunganId, onResepDiajukan }: Props) {
  const boleh = useIzin();
  const bolehResep = boleh('resep', 'input');
  const [daftar, setDaftar] = useState<ResepDto[] | null>(null);
  const [obat, setObat] = useState<MasterObatDto[] | null>(null);
  const [baris, setBaris] = useState<BarisResep[]>(awalResep);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);

  const muat = useCallback(() => resepKunjungan(kunjunganId).then(setDaftar), [kunjunganId]);
  useEffect(() => {
    let batal = false;
    Promise.all([resepKunjungan(kunjunganId), bolehResep ? daftarMasterObat({ aktif: true, ukuran: 100 }) : Promise.resolve(null)])
      .then(([r, o]) => {
        if (batal) return;
        setDaftar(r);
        setObat(o ? o.data : []);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : R.gagalMuat));
    return () => {
      batal = true;
    };
  }, [kunjunganId, bolehResep]);

  const g = galatResep(baris);
  const opsiObat = useMemo(() => [{ nilai: '', label: R.pilihObat }, ...(obat ?? []).map((o) => ({ nilai: String(o.id), label: `${o.nama_tampil} (${rupiah(o.harga)}/${o.satuan})` }))], [obat]);

  async function ajukan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    setInfo(null);
    try {
      const h = await buatResep(kunjunganId, bentukResep(baris));
      setInfo(`${R.terajukan(h.resep.nomor_resep)} ${R.tagihanInfo}`);
      setBaris(awalResep());
      setDicoba(false);
      onResepDiajukan();
      await muat();
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : R.gagal);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <Kolom>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{R.petunjuk}</p>
      {galat && <Peringatan>{galat}</Peringatan>}
      {info && <Peringatan nada="biru">{info}</Peringatan>}
      <Kolom jarak="sm">
        <h4 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{R.judul}</h4>
        {!daftar && !galat && <span style={{ color: token.warna.teksRedup }}>{FARMASI.memuat}</span>}
        {daftar?.length === 0 && <span style={{ color: token.warna.teksRedup }}>{R.kosong}</span>}
        {daftar?.map((r) => (
          <Bingkai key={r.id} arah="kolom" jarak="xs">
            <Sebaris jarak="sm" bungkus>
              <Tumbuh tag="span"><strong>{R.nomor(r.nomor_resep)}</strong></Tumbuh>
              <Lencana warna={STATUS_RESEP.warna(r.status)}>{STATUS_RESEP.label(r.status)}</Lencana>
            </Sebaris>
            {r.item.map((i) => <span key={i.id}>{i.nama}: {i.jumlah} {i.satuan}, {i.aturan_pakai}</span>)}
          </Bingkai>
        ))}
      </Kolom>
      {bolehResep && obat && (
        obat.length === 0 ? <Peringatan nada="biru">{R.belumAdaMaster}</Peringatan> : (
          <Kolom tag="section" aria-label={R.ajukan}>
            {baris.map((b, n) => (
              <Bingkai key={n} arah="kolom" jarak="sm" padding="md" halus>
                <Pilihan id={`resep-obat-${n}`} label={R.cariObat} opsi={opsiObat} value={b.master_obat_id} onChange={(e) => setBaris(ubahBarisResep(baris, n, { master_obat_id: e.target.value }))} galat={dicoba ? g[`item.${n}.master_obat_id`] : undefined} />
                <Baris>
                  <Isian id={`resep-jumlah-${n}`} label={R.jumlah} inputMode="numeric" value={b.jumlah} onChange={(e) => setBaris(ubahBarisResep(baris, n, { jumlah: e.target.value }))} galat={dicoba ? g[`item.${n}.jumlah`] : undefined} autoComplete="off" />
                  <Isian id={`resep-aturan-${n}`} label={R.aturan} placeholder={R.aturanPetunjuk} value={b.aturan_pakai} onChange={(e) => setBaris(ubahBarisResep(baris, n, { aturan_pakai: e.target.value }))} galat={dicoba ? g[`item.${n}.aturan_pakai`] : undefined} autoComplete="off" />
                </Baris>
                <Baris>
                  <Isian id={`resep-bentuk-${n}`} label={R.bentuk} value={b.bentuk} onChange={(e) => setBaris(ubahBarisResep(baris, n, { bentuk: e.target.value }))} autoComplete="off" />
                  <Isian id={`resep-rute-${n}`} label={R.rute} value={b.rute} onChange={(e) => setBaris(ubahBarisResep(baris, n, { rute: e.target.value }))} autoComplete="off" />
                </Baris>
                <div><Tombol type="button" varian="teks" onClick={() => setBaris(hapusBarisResep(baris, n))}>{R.hapusItem}</Tombol></div>
              </Bingkai>
            ))}
            <Sebaris jarak="sm" bungkus>
              <Tombol type="button" varian="sekunder" onClick={() => setBaris([...baris, barisResepKosong()])}>{R.tambahItem}</Tombol>
              <Tumbuh tag="span" style={{ color: token.warna.teksRedup }}>{R.harga(rupiah(biayaResep(baris, obat)))}</Tumbuh>
              <Tombol type="button" disabled={memproses} onClick={() => void ajukan()}>{memproses ? R.mengajukan : R.ajukan}</Tombol>
            </Sebaris>
          </Kolom>
        )
      )}
    </Kolom>
  );
}
