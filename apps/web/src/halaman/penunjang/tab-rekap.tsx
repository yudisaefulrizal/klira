import { useEffect, useState } from 'react';
import { INTERPRETASI_HASIL, NILAI_STATUS_ORDER, PENUNJANG, PRIORITAS_ORDER, STATUS_ORDER_PENUNJANG } from '@klira/shared';
import type { RekapLabDto, StatusOrderPenunjang } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { rekapLab } from '../../api-klien/penunjang';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { token } from '../../gaya/token';
import { useNavigasi } from '../../util/navigasi';
import { formatWaktu } from '../../util/penyaring-tab';

const R = PENUNJANG.rekap;
const UKURAN = 20;
const KOLOM = [{ judul: R.kolom.pasien }, { judul: R.kolom.pemeriksaan }, { judul: R.kolom.prioritas }, { judul: R.kolom.status }, { judul: R.kolom.hasil }, { judul: R.kolom.waktu }];
const OPSI_STATUS = [{ nilai: '', label: R.semuaStatus }, ...NILAI_STATUS_ORDER.map((s) => ({ nilai: s, label: STATUS_ORDER_PENUNJANG.label(s) }))];

type Saringan = { status: StatusOrderPenunjang | ''; dari: string; sampai: string; halaman: number };
const AWAL: Saringan = { status: '', dari: '', sampai: '', halaman: 1 };

/** Tab Rekap lab (3.1): order lab hari ini atau rentang tanggal, dengan penyaring status dan paginasi; pekerjaan per pasien dari Daftar pasien. */
export function TabRekap() {
  const { ganti } = useNavigasi();
  const [terapan, setTerapan] = useState<Saringan>(AWAL);
  const [draf, setDraf] = useState<Saringan>(AWAL);
  const [hasil, setHasil] = useState<RekapLabDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    rekapLab({ status: terapan.status || undefined, dari: terapan.dari || undefined, sampai: terapan.sampai || undefined, halaman: terapan.halaman, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : R.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapan]);

  const terbalik = !!draf.dari && !!draf.sampai && draf.dari > draf.sampai;

  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <BilahPenyaring labelTerapkan="Terapkan" labelAturUlang="Atur ulang" nonaktif={terbalik} onTerapkan={() => setTerapan({ ...draf, halaman: 1 })} onAturUlang={() => { setDraf(AWAL); setTerapan(AWAL); }}>
          <Pilihan id="rekap-status" label={R.filterStatus} opsi={OPSI_STATUS} value={draf.status} onChange={(e) => setDraf({ ...draf, status: e.target.value as Saringan['status'] })} />
          <Isian id="rekap-dari" label={R.dari} type="date" value={draf.dari} onChange={(e) => setDraf({ ...draf, dari: e.target.value })} />
          <Isian id="rekap-sampai" label={R.sampai} type="date" value={draf.sampai} onChange={(e) => setDraf({ ...draf, sampai: e.target.value })} galat={terbalik ? 'Tanggal akhir sebelum tanggal awal.' : undefined} />
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={PENUNJANG.tab.rekap}>
          {hasil?.data.map((o) => (
            <BarisTabel key={o.id}>
              <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{o.pasien_nama}</div><div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{o.pasien_nomor_rm}</div></SelTabel>
              <SelTabel>{o.nama}</SelTabel>
              <SelTabel><Lencana warna={PRIORITAS_ORDER.warna(o.prioritas)}>{PRIORITAS_ORDER.label(o.prioritas)}</Lencana></SelTabel>
              <SelTabel><Lencana warna={STATUS_ORDER_PENUNJANG.warna(o.status)}>{STATUS_ORDER_PENUNJANG.label(o.status)}</Lencana></SelTabel>
              <SelTabel>{o.hasil_singkat ?? '-'}{o.interpretasi && <> <Lencana warna={INTERPRETASI_HASIL.warna(o.interpretasi)}>{INTERPRETASI_HASIL.label(o.interpretasi)}</Lencana></>}</SelTabel>
              <SelTabel>{formatWaktu(o.dibuat_pada)}</SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{R.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{R.catatan} <a href="/pasien" onClick={(e) => { e.preventDefault(); ganti('/pasien'); }}>{R.bukaDaftar}</a></p>
    </>
  );
}
