import { useEffect, useMemo, useState } from 'react';
import { BAGIAN_KLINIS, REKAM_MEDIS, TOMBOL } from '@klira/shared';
import type { BagianKlinis, HasilPerbaikanDto, KlinisKunjunganDto } from '@klira/shared';
import { ambilKlinis } from '../../api-klien/klinis';
import { GalatApi } from '../../api-klien/klien';
import { ajukanPerbaikan } from '../../api-klien/rekam-medis';
import { token } from '../../gaya/token';
import { Modal1 } from '../../komponen/modal-1/modal-1';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { disahkanDari, galatBagian, isiBagian, keadaanDariServer } from './keadaan-pemeriksaan';
import type { KeadaanPemeriksaan } from './keadaan-pemeriksaan';
import { galatAlasanPerbaikan } from './keadaan-rm';
import { LangkahNarasi, LangkahAnamnesis, LangkahDiagnosis, LangkahPemeriksaan, LangkahTandaVital, LangkahTindakan, LangkahTindakLanjut } from './langkah-pemeriksaan';
import { KepalaPasien } from './kepala-pasien';

type Props = { kunjunganId: number; pasien: { id: number; nama: string; nomor_rm: string }; onTutup: () => void; onSelesai: () => void };
const P = REKAM_MEDIS.perbaikan;

/**
 * Modal Perbaiki catatan (3.3, MODAL-1): pilih bagian yang sudah disahkan, ubah isinya, tulis alasan. Pembuat dalam 2x24 jam langsung menerapkan versi baru;
 * selain itu menjadi permintaan yang disetujui orang lain (antrean perbaikan). Versi lama selalu tersimpan.
 */
export function PerbaikiCatatan({ kunjunganId, pasien, onTutup, onSelesai }: Props) {
  const [klinis, setKlinis] = useState<KlinisKunjunganDto | null>(null);
  const [bagian, setBagian] = useState<BagianKlinis | ''>('');
  const [k, setK] = useState<KeadaanPemeriksaan | null>(null);
  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [dicoba, setDicoba] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<HasilPerbaikanDto | null>(null);

  useEffect(() => {
    let batal = false;
    ambilKlinis(kunjunganId)
      .then((h) => {
        if (batal) return;
        setKlinis(h);
        setK(keadaanDariServer(h.bagian));
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : P.gagal));
    return () => {
      batal = true;
    };
  }, [kunjunganId]);

  const disahkan = useMemo(() => (klinis ? disahkanDari(klinis.bagian) : null), [klinis]);
  const opsi = [{ nilai: '', label: P.pilihBagian }, ...BAGIAN_KLINIS.filter((b) => disahkan?.[b]).map((b) => ({ nilai: b, label: P.bagianLabel[b] }))];
  const galatIsi = bagian && k ? galatBagian(bagian, k) : null;
  const galatAlasan = galatAlasanPerbaikan(alasan);
  const ubah = (p: Partial<KeadaanPemeriksaan>) => k && setK({ ...k, ...p });
  const server = bagian && klinis ? klinis.bagian[bagian] : null;
  const dasar = { k: k as KeadaanPemeriksaan, ubah, galat: dicoba ? galatIsi : null, server };

  async function simpan() {
    setDicoba(true);
    if (!bagian || !k || galatIsi || galatAlasan || memproses) return;
    setMemproses(true);
    setGalat(null);
    try {
      setHasil(await ajukanPerbaikan(kunjunganId, { bagian, isi: isiBagian(bagian, k), alasan }));
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : P.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const kepala = <KepalaPasien nama={pasien.nama} nomorRm={pasien.nomor_rm} />;
  if (hasil) {
    return (
      <Modal1 judul={P.judul} lebar="modalKecil" konteks={kepala} onTutup={onSelesai} aksi={<Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol>}>
        <Peringatan nada="biru">{hasil.jenis === 'diterapkan' ? P.diterapkan : P.diajukanPesan}</Peringatan>
      </Modal1>
    );
  }

  return (
    <Modal1
      judul={P.judul}
      lebar="modalBesar"
      konteks={kepala}
      lindungiTutup={alasan.trim().length > 0}
      onTutup={onTutup}
      aksi={
        <>
          <Tombol type="button" varian="sekunder" onClick={onTutup}>{TOMBOL.batal}</Tombol>
          <Tombol type="submit" form="bentuk-perbaikan" disabled={memproses || !bagian}>{memproses ? P.mengajukan : P.ajukan}</Tombol>
        </>
      }
    >
      {galat && <Peringatan>{galat}</Peringatan>}
      {!klinis && !galat && <span style={{ color: token.warna.teksRedup }}>{REKAM_MEDIS.memuat}</span>}
      {klinis && k && (
        <Kolom tag="form" id="bentuk-perbaikan" noValidate onSubmit={(e) => { e.preventDefault(); void simpan(); }}>
          <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.batasInfo}</span>
          <Pilihan
            id="perbaikan-bagian" label={P.bagian} opsi={opsi} value={bagian}
            onChange={(e) => { setBagian(e.target.value as BagianKlinis | ''); setK(keadaanDariServer(klinis.bagian)); setDicoba(false); }}
          />
          {(bagian === 'assessment' || bagian === 'plan' || bagian === 'implementasi' || bagian === 'evaluasi') && <LangkahNarasi bagian={bagian} {...dasar} />}
          {opsi.length === 1 && <Peringatan nada="biru">{P.belumDisahkan}</Peringatan>}
          {bagian === 'anamnesis' && <LangkahAnamnesis {...dasar} />}
          {bagian === 'tanda_vital' && <LangkahTandaVital {...dasar} />}
          {bagian === 'pemeriksaan' && <LangkahPemeriksaan {...dasar} />}
          {bagian === 'diagnosis' && <LangkahDiagnosis {...dasar} favorit={[]} />}
          {bagian === 'tindakan' && <LangkahTindakan {...dasar} favorit={[]} />}
          {bagian === 'tindak_lanjut' && <LangkahTindakLanjut {...dasar} />}
          {bagian && (
            <>
              <AreaTeks id="perbaikan-alasan" label={P.alasan} value={alasan} maxLength={500} onChange={(e) => setAlasan(e.target.value)} aria-invalid={dicoba && galatAlasan ? true : undefined} />
              <span style={{ color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }}>{P.alasanPetunjuk}</span>
              {dicoba && galatAlasan && <Peringatan>{galatAlasan}</Peringatan>}
            </>
          )}
        </Kolom>
      )}
    </Modal1>
  );
}
