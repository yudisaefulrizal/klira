import { useCallback, useEffect, useMemo, useState } from 'react';
import { KELAS_RAWAT, RAWAT_INAP, STATUS_BED } from '@klira/shared';
import type { BedDto, PapanDto } from '@klira/shared';
import { ambilPapan } from '../api-klien/rawat-inap';
import { GalatApi } from '../api-klien/klien';
import { useIzin } from '../komponen/izin-saja';
import { Kartu } from '../komponen/ui/kartu';
import { Lencana } from '../komponen/ui/lencana';
import { Peringatan } from '../komponen/ui/peringatan';
import { Kisi, Kolom, Sebaris } from '../komponen/ui/susunan';
import { Tombol } from '../komponen/ui/tombol';
import { token } from '../gaya/token';
import { AdmisiRawatInap } from '../modal/pelayanan-klinik/admisi-rawat-inap';
import { CatatanHarian } from '../modal/pelayanan-klinik/catatan-harian';
import { PemulanganRawatInap } from '../modal/pelayanan-klinik/pemulangan-rawat-inap';
import { UbahPenempatan } from '../modal/pelayanan-klinik/ubah-penempatan';
import { formatWaktu } from '../util/penyaring-tab';

const P = RAWAT_INAP.papan;
type Pasien = { kunjungan_id: number; nama: string; nomor_rm: string };
type Modal = { jenis: 'admisi' } | { jenis: 'cppt' | 'penempatan' | 'pulang'; pasien: Pasien } | null;
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Halaman Rawat inap (3.1): papan bed per ruang dengan penghuninya dan daftar menunggu ruangan; admisi, penempatan, catatan harian, dan pemulangan dibuka sebagai modal. */
export function HalamanRawatInap() {
  const boleh = useIzin();
  const [papan, setPapan] = useState<PapanDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(0);
  const [modal, setModal] = useState<Modal>(null);

  const selesai = useCallback(() => {
    setModal(null);
    setMuat((n) => n + 1);
  }, []);

  useEffect(() => {
    let batal = false;
    ambilPapan()
      .then((p) => {
        if (batal) return;
        setPapan(p);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : RAWAT_INAP.gagalMuat));
    return () => {
      batal = true;
    };
  }, [muat]);

  const perRuang = useMemo(() => {
    const peta = new Map<string, BedDto[]>();
    for (const b of papan?.bed ?? []) peta.set(b.ruang_nama ?? P.ruangTanpa, [...(peta.get(b.ruang_nama ?? P.ruangTanpa) ?? []), b]);
    return [...peta];
  }, [papan]);
  const bisaInput = boleh('klinis', 'input');

  return (
    <>
      <Sebaris tag="header" jarak="md" bungkus>
        <h1 style={{ margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: 1 }}>{RAWAT_INAP.judul}</h1>
        {papan && <span style={{ color: token.warna.teksRedup }}>{P.ringkasan(papan.ringkasan.total, papan.ringkasan.terisi, papan.ringkasan.kosong)}</span>}
        {bisaInput && <Tombol type="button" onClick={() => setModal({ jenis: 'admisi' })}>{P.admisi}</Tombol>}
      </Sebaris>
      {galat && <Peringatan>{galat}</Peringatan>}
      {papan && !!papan.menunggu.length && (
        <Kartu susun="sm" aria-label={P.menunggu}>
          <strong>{P.menunggu}</strong>
          {papan.menunggu.map((m) => (
            <Sebaris key={m.kunjungan_id} jarak="md" bungkus>
              <span style={{ flexGrow: 1 }}><strong>{m.pasien_nama}</strong> <span style={kecil}>{m.pasien_nomor_rm}{m.dpjp_nama ? ` · ${P.dpjp(m.dpjp_nama)}` : ''} · {P.sejak(formatWaktu(m.mulai))}</span></span>
              {bisaInput && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'penempatan', pasien: { kunjungan_id: m.kunjungan_id, nama: m.pasien_nama, nomor_rm: m.pasien_nomor_rm } })}>{P.tempatkan}</Tombol>}
              {bisaInput && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'pulang', pasien: { kunjungan_id: m.kunjungan_id, nama: m.pasien_nama, nomor_rm: m.pasien_nomor_rm } })}>{P.pemulangan}</Tombol>}
            </Sebaris>
          ))}
        </Kartu>
      )}
      {papan && !papan.bed.length && <Peringatan nada="biru">{P.kosong}</Peringatan>}
      {perRuang.map(([ruang, bed]) => (
        <Kolom key={ruang} jarak="sm">
          <h2 style={{ margin: 0, fontSize: token.huruf.ukuran.besar }}>{ruang}</h2>
          <Kisi kolom={`repeat(auto-fill, minmax(${token.ukuran.kartuBed}, 1fr))`}>
            {bed.map((b) => (
              <Kartu key={b.id} susun="xs" aria-label={`${P.bedLabel} ${b.nama}`}>
                <Sebaris jarak="sm" sebaran="awal"><strong style={{ flexGrow: 1 }}>{b.nama}</strong><Lencana warna={STATUS_BED.warna(b.status)}>{STATUS_BED.label(b.status)}</Lencana></Sebaris>
                {b.penghuni ? (
                  <>
                    <span><strong>{b.penghuni.pasien_nama}</strong> <span style={kecil}>{b.penghuni.pasien_nomor_rm}</span></span>
                    <span style={kecil}>{KELAS_RAWAT.label(b.penghuni.kelas)}{b.penghuni.dpjp_nama ? ` · ${P.dpjp(b.penghuni.dpjp_nama)}` : ''} · {P.sejak(formatWaktu(b.penghuni.mulai))}</span>
                    <Sebaris bungkus jarak="sm">
                      {boleh('klinis', 'lihat') && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'cppt', pasien: { kunjungan_id: b.penghuni!.kunjungan_id, nama: b.penghuni!.pasien_nama, nomor_rm: b.penghuni!.pasien_nomor_rm } })}>{P.cppt}</Tombol>}
                      {bisaInput && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'penempatan', pasien: { kunjungan_id: b.penghuni!.kunjungan_id, nama: b.penghuni!.pasien_nama, nomor_rm: b.penghuni!.pasien_nomor_rm } })}>{P.penempatan}</Tombol>}
                      {bisaInput && <Tombol type="button" varian="teks" onClick={() => setModal({ jenis: 'pulang', pasien: { kunjungan_id: b.penghuni!.kunjungan_id, nama: b.penghuni!.pasien_nama, nomor_rm: b.penghuni!.pasien_nomor_rm } })}>{P.pemulangan}</Tombol>}
                    </Sebaris>
                  </>
                ) : <span style={kecil}>{P.kosongBed}</span>}
              </Kartu>
            ))}
          </Kisi>
        </Kolom>
      ))}
      {modal?.jenis === 'admisi' && <AdmisiRawatInap onTutup={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'cppt' && <CatatanHarian kunjunganId={modal.pasien.kunjungan_id} pasien={modal.pasien} onTutup={selesai} />}
      {modal?.jenis === 'penempatan' && <UbahPenempatan kunjunganId={modal.pasien.kunjungan_id} onTutup={() => setModal(null)} onSelesai={selesai} />}
      {modal?.jenis === 'pulang' && <PemulanganRawatInap kunjunganId={modal.pasien.kunjungan_id} pasien={modal.pasien} onTutup={() => setModal(null)} onSelesai={selesai} />}
    </>
  );
}
