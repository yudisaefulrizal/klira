import { useState } from 'react';
import { laporanKeCsv, REKAM_MEDIS, TOMBOL } from '@klira/shared';
import type { LaporanDto } from '@klira/shared';
import { buatLaporan } from '../../api-klien/dokumen-rm';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { Isian } from '../../komponen/ui/isian';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Baris, Kolom } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { unduhTeks } from '../../util/unduh';
import { awalLaporan, galatLaporan } from './keadaan-dokumen';
import type { KeadaanLaporan } from './keadaan-dokumen';

const L = REKAM_MEDIS.dok.laporan;
const OPSI = Object.entries(L.jenisLabel).map(([nilai, label]) => ({ nilai, label }));

/** Modal Buat laporan (3.3, MODAL-1): jenis dan rentang tanggal kunjungan ditutup; hasil tampil sebagai tabel dan dapat diunduh CSV. */
export function LaporanRm({ onTutup }: { onTutup: () => void }) {
  const [k, setK] = useState<KeadaanLaporan>(awalLaporan);
  const [hasil, setHasil] = useState<LaporanDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const g = galatLaporan(k);

  async function buat() {
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      setHasil(await buatLaporan({ jenis: k.jenis, dari: k.dari || undefined, sampai: k.sampai || undefined }));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : L.gagal);
    } finally {
      setMemproses(false);
    }
  }

  return (
    <Modal1
      judul={L.judul} lebar="modalBesar" onTutup={onTutup}
      aksi={<>
        {hasil && <Tombol type="button" varian="sekunder" onClick={() => unduhTeks(`laporan-${hasil.jenis}-${hasil.dari}-${hasil.sampai}.csv`, laporanKeCsv(hasil))}>{L.unduh}</Tombol>}
        <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.tutup}</Tombol>
        <Tombol type="submit" form="bentuk-laporan" disabled={memproses}>{memproses ? L.membuat : L.buat}</Tombol>
      </>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-laporan" noValidate onSubmit={(e) => { e.preventDefault(); void buat(); }}>
        <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{L.petunjuk}</span>
        <Baris>
          <Pilihan id="lap-jenis" label={L.jenis} opsi={OPSI} value={k.jenis} onChange={(e) => setK({ ...k, jenis: e.target.value as KeadaanLaporan['jenis'] })} />
          <Isian id="lap-dari" label={L.dari} type="date" value={k.dari} onChange={(e) => setK({ ...k, dari: e.target.value })} />
          <Isian id="lap-sampai" label={L.sampai} type="date" value={k.sampai} onChange={(e) => setK({ ...k, sampai: e.target.value })} galat={g.sampai} />
        </Baris>
      </Kolom>
      {hasil && (
        <Kolom>
          <span style={{ color: token.warna.teksRedup }}>{L.jenisLabel[hasil.jenis]} · {L.rentang(hasil.dari, hasil.sampai)} · {L.total(hasil.total)}</span>
          <Tabel kolom={hasil.kolom.map((judul, i) => ({ judul, rataKanan: i === hasil.kolom.length - 1 }))} label={L.judul}>
            {hasil.baris.map((b, i) => <BarisTabel key={i}>{b.map((s, j) => <SelTabel key={j} style={j === b.length - 1 ? { textAlign: 'right' } : undefined}>{s}</SelTabel>)}</BarisTabel>)}
          </Tabel>
          {!hasil.baris.length && <span style={{ color: token.warna.teksRedup }}>{L.kosong}</span>}
        </Kolom>
      )}
    </Modal1>
  );
}
