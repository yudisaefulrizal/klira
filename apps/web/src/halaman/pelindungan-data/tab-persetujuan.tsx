import { useCallback, useEffect, useState } from 'react';
import { PDP } from '@klira/shared';
import type { PersetujuanPdpDto, TeksPemberitahuanDto } from '@klira/shared';
import { daftarPemberitahuan, daftarPersetujuanPdp } from '../../api-klien/pdp';
import { useIzin } from '../../komponen/izin-saja';
import { Kartu } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Kolom, Sebaris } from '../../komponen/ui/susunan';
import { BarisTabel, SelTabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import { TarikPersetujuan } from '../../modal/pelindungan-data/tarik-persetujuan';
import { VersiPemberitahuan } from '../../modal/pelindungan-data/versi-pemberitahuan';
import { formatWaktu } from '../../util/penyaring-tab';
import { TabDaftarPdp } from './tab-daftar';

const P = PDP.pemberitahuan;
const T = PDP.tarik;
const KOLOM = [{ judul: T.kolom.pasien }, { judul: T.kolom.jenis }, { judul: T.kolom.tujuan }, { judul: T.kolom.waktu }, { judul: T.kolom.status }, { judul: T.kolom.tindakan, rataKanan: true }];
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Tab Persetujuan dan pemberitahuan (3.1): teks pemberitahuan berversi dan persetujuan umum atau PDP pasien beserta penarikannya. */
export function TabPersetujuan() {
  const boleh = useIzin();
  const [teks, setTeks] = useState<TeksPemberitahuanDto[]>([]);
  const [versi, setVersi] = useState(0);
  const [modalTeks, setModalTeks] = useState(false);
  const [tarik, setTarik] = useState<PersetujuanPdpDto | null>(null);
  const berlaku = teks.find((t) => t.aktif) ?? null;

  useEffect(() => {
    let batal = false;
    daftarPemberitahuan().then((d) => !batal && setTeks(d)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [versi]);
  const selesai = useCallback(() => {
    setModalTeks(false);
    setTarik(null);
    setVersi((n) => n + 1);
  }, []);
  const ambil = useCallback((h: number) => daftarPersetujuanPdp({ halaman: h }), []);

  return (
    <>
      <Kartu susun="sm">
        <Sebaris jarak="md" bungkus>
          <strong style={{ flexGrow: 1, fontSize: token.huruf.ukuran.besar }}>{P.daftar}</strong>
          {boleh('pdp', 'input') && <Tombol type="button" onClick={() => setModalTeks(true)}>{P.tombol}</Tombol>}
        </Sebaris>
        {!teks.length && <span style={kecil}>{P.kosong}</span>}
        {teks.map((t) => (
          <Kolom key={t.id} jarak="xs">
            <Sebaris jarak="sm" bungkus><strong>{t.judul}</strong><Lencana warna={t.aktif ? 'hijau' : 'abu'}>{P.versi(t.versi)} · {t.aktif ? P.aktif : P.tidakAktif}</Lencana><span style={kecil}>{formatWaktu(t.dibuat_pada)}</span></Sebaris>
            <span style={kecil}>{t.tujuan}</span>
          </Kolom>
        ))}
      </Kartu>
      <TabDaftarPdp
        label={T.daftar} kolom={KOLOM} ambil={ambil} versi={versi} kosong={T.kosong}
        baris={(s: PersetujuanPdpDto) => (
          <BarisTabel key={s.id}>
            <SelTabel><div style={{ fontWeight: token.huruf.berat.tebal }}>{s.pasien_nama}</div><div style={kecil}>{s.pasien_nomor_rm}</div></SelTabel>
            <SelTabel>{s.jenis} v{s.versi_teks}</SelTabel>
            <SelTabel>{s.tujuan}</SelTabel>
            <SelTabel>{formatWaktu(s.waktu)}</SelTabel>
            <SelTabel>
              <Lencana warna={s.status === 'ditarik' ? 'merah' : 'hijau'}>{s.status === 'ditarik' ? T.ditarik : T.diberikan}</Lencana>
              {s.penarikan && <div style={kecil}>{T.batasHenti(formatWaktu(s.penarikan.batas_henti))}</div>}
            </SelTabel>
            <SelTabel style={{ textAlign: 'right' }}>{s.status === 'diberikan' && boleh('pdp', 'perbaikan') && <Tombol type="button" varian="teks" onClick={() => setTarik(s)}>{T.tombol}</Tombol>}</SelTabel>
          </BarisTabel>
        )}
      />
      {modalTeks && <VersiPemberitahuan berlaku={berlaku} onTutup={() => setModalTeks(false)} onSelesai={selesai} />}
      {tarik && <TarikPersetujuan persetujuan={tarik} onTutup={() => setTarik(null)} onSelesai={selesai} />}
    </>
  );
}
