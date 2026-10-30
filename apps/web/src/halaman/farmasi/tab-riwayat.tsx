import { SerahTerimaObat } from '../../modal/pelayanan-klinik/serah-terima-obat';
import { HanyaDenganIzin } from '../../komponen/izin-saja';
import { Tombol } from '../../komponen/ui/tombol';
import { useEffect, useState } from 'react';
import { FARMASI, STATUS_RESEP } from '@klira/shared';
import type { RiwayatObatDto } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien';
import { riwayatObat } from '../../api-klien/farmasi';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { Paginasi } from '../../komponen/paginasi';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { token } from '../../gaya/token';
import { formatWaktu } from '../../util/penyaring-tab';

const R = FARMASI.riwayat;
const UKURAN = 20;
const STATUS = ['diajukan', 'ditelaah', 'siap', 'diserahkan'] as const;
const OPSI = [{ nilai: '', label: R.semuaStatus }, ...STATUS.map((s) => ({ nilai: s, label: STATUS_RESEP.label(s) }))];
const KOLOM = [{ judul: R.kolom.nomor }, { judul: R.kolom.pasien }, { judul: R.kolom.dokter }, { judul: R.kolom.item }, { judul: R.kolom.status }, { judul: R.kolom.waktu }, { judul: 'Tindakan' }];
type Saringan = { status: '' | (typeof STATUS)[number]; dari: string; sampai: string; halaman: number };
const AWAL: Saringan = { status: '', dari: '', sampai: '', halaman: 1 };

/** Tab Riwayat obat (3.1): resep klinik dengan penyaring status dan tanggal; telaah dan penyiapan dibuka dari Daftar pasien. */
export function TabRiwayat() {
  const [terapan, setTerapan] = useState<Saringan>(AWAL);
  const [draf, setDraf] = useState<Saringan>(AWAL);
  const [hasil, setHasil] = useState<RiwayatObatDto | null>(null);
  const [terbuka, setTerbuka] = useState<RiwayatObatDto['data'][number] | null>(null);
  const [versi, setVersi] = useState(0);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    riwayatObat({ status: terapan.status || undefined, dari: terapan.dari || undefined, sampai: terapan.sampai || undefined, halaman: terapan.halaman, ukuran: UKURAN })
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : R.gagalMuat));
    return () => {
      batal = true;
    };
  }, [terapan, versi]);

  const terbalik = !!draf.dari && !!draf.sampai && draf.dari > draf.sampai;

  return (
    <>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <BilahPenyaring labelTerapkan="Terapkan" labelAturUlang="Atur ulang" nonaktif={terbalik} onTerapkan={() => setTerapan({ ...draf, halaman: 1 })} onAturUlang={() => { setDraf(AWAL); setTerapan(AWAL); }}>
          <Pilihan id="riwayat-status" label={R.filterStatus} opsi={OPSI} value={draf.status} onChange={(e) => setDraf({ ...draf, status: e.target.value as Saringan['status'] })} />
          <Isian id="riwayat-dari" label={R.dari} type="date" value={draf.dari} onChange={(e) => setDraf({ ...draf, dari: e.target.value })} />
          <Isian id="riwayat-sampai" label={R.sampai} type="date" value={draf.sampai} onChange={(e) => setDraf({ ...draf, sampai: e.target.value })} galat={terbalik ? 'Tanggal akhir sebelum tanggal awal.' : undefined} />
        </BilahPenyaring>
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={FARMASI.tab.riwayat}>
          {hasil?.data.map((r) => (
            <BarisTabel key={r.id}>
              <SelTabel style={{ fontWeight: token.huruf.berat.tebal }}>{r.nomor_resep}</SelTabel>
              <SelTabel><div>{r.pasien_nama}</div><div style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{r.pasien_nomor_rm}</div></SelTabel>
              <SelTabel>{r.dpjp_nama ?? '-'}</SelTabel>
              <SelTabel>{R.jumlahObat(r.jumlah_item)}</SelTabel>
              <SelTabel><Lencana warna={STATUS_RESEP.warna(r.status)}>{STATUS_RESEP.label(r.status)}</Lencana></SelTabel>
              <SelTabel>{formatWaktu(r.dibuat_pada)}</SelTabel>
              <SelTabel>{r.status === 'siap' && <HanyaDenganIzin fitur="farmasi" aksi="input"><Tombol type="button" varian="sekunder" onClick={() => setTerbuka(r)}>Serahkan obat</Tombol></HanyaDenganIzin>}</SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{R.kosong}</div>}
        {hasil && <Paginasi halaman={terapan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => setTerapan({ ...terapan, halaman: h })} />}
      </Kartu>
      {terbuka && <SerahTerimaObat kunjunganId={terbuka.kunjungan_id} pasien={{ nama: terbuka.pasien_nama, nomor_rm: terbuka.pasien_nomor_rm }} onTutup={() => setTerbuka(null)} onSelesai={() => { setTerbuka(null); setVersi((v) => v + 1); }} />}
      <p style={{ margin: 0, color: token.warna.teksRedup }}>{R.catatan}</p>
    </>
  );
}
