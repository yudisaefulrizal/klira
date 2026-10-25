import { useMemo, useState } from 'react';
import { aksiKlaimTersedia, KLAIM, STATUS_KLAIM, TOMBOL } from '@klira/shared';
import type { KlaimDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { ubahStatusKlaim } from '../../api-klien/klaim';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { formatWaktu } from '../../util/penyaring-tab';
import { rupiah } from './keadaan-order-lab';
import { awalStatusKlaim, bentukStatusKlaim, galatStatusKlaim } from './keadaan-klaim';
import type { KeadaanStatusKlaim } from './keadaan-klaim';

type Props = { klaim: KlaimDto; onTutup: () => void; onSelesai: () => void };
const T = KLAIM.status;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;
const hariIni = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);

/** Modal Ubah status klaim (3.3, MODAL-1): ajukan, berkas dikembalikan (berita acara), ajukan ulang, ditolak (alasan), dibayar (jumlah dan tanggal); riwayat status ditampilkan. */
export function UbahStatusKlaim({ klaim, onTutup, onSelesai }: Props) {
  const aksi = aksiKlaimTersedia(klaim.status);
  const awal = useMemo(() => awalStatusKlaim(aksi.length === 1 ? aksi[0] : '', hariIni()), [aksi]);
  const [k, setK] = useState<KeadaanStatusKlaim>(awal);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const g = useMemo(() => galatStatusKlaim(k), [k]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanStatusKlaim) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });

  async function simpan() {
    setDicoba(true);
    if (Object.keys(g).length || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      await ubahStatusKlaim(klaim.id, bentukStatusKlaim(k));
      setSelesai(true);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : T.gagal);
    } finally {
      setMemproses(false);
    }
  }

  if (selesai) {
    return (
      <Modal1 judul={T.judul} lebar="modalKecil" onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <Peringatan nada="biru">{T.tersimpan}</Peringatan>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={T.judul} lindungiTutup={adaPerubahan(awal, k)} onTutup={onTutup}
      aksi={<><Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>{aksi.length > 0 && <Tombol type="submit" form="bentuk-status-klaim" disabled={memproses}>{memproses ? T.memproses : T.simpan}</Tombol>}</>}
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      <Kolom tag="form" id="bentuk-status-klaim" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
        <span><strong>{klaim.pasien_nama}</strong> <span style={kecil}>{klaim.pasien_nomor_rm}{klaim.nomor_sep ? ` · SEP ${klaim.nomor_sep}` : ''}</span> <Lencana warna={STATUS_KLAIM.warna(klaim.status)}>{STATUS_KLAIM.label(klaim.status)}</Lencana></span>
        {klaim.sisa_hari !== null && <span style={kecil}>{KLAIM.batas.sisa(klaim.sisa_hari)}</span>}
        {klaim.status === 'dikembalikan' && klaim.batas_ajukan_ulang && <Peringatan nada="biru">{T.batasUlang(formatWaktu(klaim.batas_ajukan_ulang))}</Peringatan>}
        {klaim.berita_acara && <span style={{ whiteSpace: 'pre-wrap' }}>{T.beritaAcara}: {klaim.berita_acara}</span>}
        {klaim.status === 'dibayar' && klaim.jumlah_dibayar !== null && <span>{T.jumlah}: {rupiah(klaim.jumlah_dibayar)}{klaim.dibayar_pada ? ` · ${formatWaktu(klaim.dibayar_pada)}` : ''}</span>}
        {aksi.length === 0 ? <span style={kecil}>{T.tidakAda}</span> : (
          <>
            <Pilihan id="sk-aksi" label={T.aksi} galat={tampil('aksi')} value={k.aksi} onChange={set('aksi')} opsi={[{ nilai: '', label: '...' }, ...aksi.map((a) => ({ nilai: a, label: T.aksiLabel[a] }))]} />
            {k.aksi === 'dikembalikan' && <AreaTeks id="sk-ba" label={T.beritaAcara} value={k.berita_acara} maxLength={2000} onChange={set('berita_acara')} aria-invalid={tampil('berita_acara') ? true : undefined} />}
            {k.aksi === 'dikembalikan' && tampil('berita_acara') && <Peringatan>{g.berita_acara}</Peringatan>}
            {k.aksi === 'ditolak' && <AreaTeks id="sk-alasan" label={T.alasan} value={k.alasan} maxLength={500} onChange={set('alasan')} aria-invalid={tampil('alasan') ? true : undefined} />}
            {k.aksi === 'ditolak' && tampil('alasan') && <Peringatan>{g.alasan}</Peringatan>}
            {k.aksi === 'dibayar' && (
              <>
                <Isian id="sk-jumlah" label={T.jumlah} inputMode="numeric" value={k.jumlah_dibayar} onChange={set('jumlah_dibayar')} galat={tampil('jumlah_dibayar')} autoComplete="off" />
                <Isian id="sk-tanggal" label={T.dibayarPada} type="date" value={k.dibayar_pada} onChange={set('dibayar_pada')} galat={tampil('dibayar_pada')} />
              </>
            )}
          </>
        )}
        {!!klaim.riwayat.length && (
          <Kolom jarak="xs">
            <strong>{T.riwayat}</strong>
            {[...klaim.riwayat].reverse().map((r, i) => <span key={i} style={kecil}>{formatWaktu(r.waktu)} · {r.dari ? `${STATUS_KLAIM.label(r.dari)} → ` : ''}{STATUS_KLAIM.label(r.ke)}{r.oleh_nama ? ` · ${r.oleh_nama}` : ''}{r.alasan ? ` · ${r.alasan}` : ''}</span>)}
          </Kolom>
        )}
      </Kolom>
    </Modal1>
  );
}
