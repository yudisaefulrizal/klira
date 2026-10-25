import { useEffect, useMemo, useState } from 'react';
import { INDIKATOR_KELAS, KELAS_RAWAT, RAWAT_INAP, TOMBOL } from '@klira/shared';
import type { AsalAdmisiDto, OpsiRawatInapDto } from '@klira/shared';
import { admisiRawatInap, ambilAsalAdmisi, ambilOpsiRawatInap } from '../../api-klien/rawat-inap';
import { GalatApi } from '../../api-klien/klien';
import { token } from '../../gaya/token';
import { ModalBertahap } from '../../komponen/modal-bertahap/modal-bertahap';
import type { LangkahModal } from '../../komponen/modal-bertahap/modal-bertahap';
import { PemilihPasien } from '../../komponen/pemilih-pasien';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { DaftarRingkasan, Kolom } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { adaPerubahan } from '../../util/draf';
import { awalAdmisi, bentukAdmisi, galatAdmisi, isiSpriAsal, langkahBermasalahAdmisi } from './keadaan-rawat-inap';
import type { KeadaanAdmisi } from './keadaan-rawat-inap';
import { rupiah } from './keadaan-order-lab';

type Props = { onTutup: () => void; onSelesai: () => void };
const A = RAWAT_INAP.admisi;
const OPSI_KELAS = KELAS_RAWAT.nilai.map((n) => ({ nilai: n, label: KELAS_RAWAT.label(n) }));
const OPSI_INDIKATOR = INDIKATOR_KELAS.nilai.map((n) => ({ nilai: n, label: INDIKATOR_KELAS.label(n) }));
const kecil = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/** Modal Admisi rawat inap (3.3, MODAL-BERTAHAP): Pasien > Ruang dan kelas > DPJP > SPRI > Ringkasan. Dari rawat jalan, kunjungan asal ditutup dan tagihannya digabung. */
export function AdmisiRawatInap({ onTutup, onSelesai }: Props) {
  const awal = useMemo(awalAdmisi, []);
  const [k, setK] = useState<KeadaanAdmisi>(awal);
  const [opsi, setOpsi] = useState<OpsiRawatInapDto | null>(null);
  const [asal, setAsal] = useState<AsalAdmisiDto | null>(null);
  const [indeks, setIndeks] = useState(0);
  const [dicoba, setDicoba] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [hasil, setHasil] = useState<{ menunggu: boolean } | null>(null);

  useEffect(() => {
    let batal = false;
    ambilOpsiRawatInap().then((o) => !batal && setOpsi(o)).catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : A.gagal));
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    if (k.pasien_id === null) return setAsal(null);
    let batal = false;
    ambilAsalAdmisi(k.pasien_id)
      .then((a) => {
        if (batal) return;
        setAsal(a);
        setK((s) => isiSpriAsal(s, a.asal?.spri ?? null));
      })
      .catch(() => !batal && setAsal(null));
    return () => {
      batal = true;
    };
  }, [k.pasien_id]);

  const g = useMemo(() => {
    const e = galatAdmisi(k);
    if (asal?.rawat_inap_id) e.pasien_id = A.sudahInap;
    else if (asal?.ada_pembayaran) e.pasien_id = A.adaPembayaran;
    return e;
  }, [k, asal]);
  const tampil = (b: string) => (dicoba ? g[b] : undefined);
  const set = (b: keyof KeadaanAdmisi) => (e: { target: { value: string } }) => setK({ ...k, [b]: e.target.value });
  const dpjp = [{ nilai: '', label: A.pilihDpjp }, ...(opsi?.dpjp ?? []).map((d) => ({ nilai: String(d.id), label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}` }))];
  const bedLabel = (id: string) => opsi?.bed_kosong.find((b) => String(b.id) === id);
  const tarifLabel = (id: string) => opsi?.tarif_kamar.find((t) => String(t.id) === id);

  async function kirim() {
    setDicoba(true);
    if (memproses) return;
    const bermasalah = langkahBermasalahAdmisi(g);
    if (bermasalah >= 0) return setIndeks(bermasalah);
    setMemproses(true);
    setGalat(null);
    try {
      const h = await admisiRawatInap(bentukAdmisi(k));
      setHasil({ menunggu: h.menunggu_ruangan });
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : A.gagal);
    } finally {
      setMemproses(false);
    }
  }

  const langkah: LangkahModal[] = [
    {
      id: 'pasien', judul: A.langkah.pasien, selesai: !g.pasien_id,
      isi: (
        <Kolom>
          <PemilihPasien id="adm-pasien" pasienId={k.pasien_id} onPilih={(id) => setK({ ...k, pasien_id: id })} galat={tampil('pasien_id')} />
          {k.pasien_id !== null && !asal && <span style={kecil}>{A.cekAsal}</span>}
          {asal?.asal && <Peringatan nada="biru">{A.asalInfo(asal.asal.poli_nama)}</Peringatan>}
          {asal && !asal.asal && !asal.rawat_inap_id && <span style={kecil}>{A.tanpaAsal}</span>}
          {!asal?.asal && k.pasien_id !== null && (
            <Pilihan id="adm-cara" label="Cara pembayaran" opsi={[{ nilai: 'umum', label: 'Umum' }, { nilai: 'jkn', label: 'JKN' }]} value={k.cara_pembayaran} onChange={(e) => setK({ ...k, cara_pembayaran: e.target.value as KeadaanAdmisi['cara_pembayaran'] })} />
          )}
        </Kolom>
      ),
    },
    {
      id: 'ruang', judul: A.langkah.ruang, selesai: !g.bed_id && !g.kelas && !g.tarif_id,
      isi: (
        <Kolom>
          <Pilihan id="adm-bed" label={A.bed} opsi={[{ nilai: '', label: A.bedMenunggu }, ...(opsi?.bed_kosong ?? []).map((b) => ({ nilai: String(b.id), label: `${b.ruang_nama ? `${b.ruang_nama} · ` : ''}${b.nama}` }))]} value={k.bed_id} onChange={set('bed_id')} galat={tampil('bed_id')} />
          <Pilihan id="adm-kelas" label={A.kelas} opsi={OPSI_KELAS} value={k.kelas} onChange={set('kelas')} galat={tampil('kelas')} />
          <Pilihan id="adm-indikator" label={A.indikator} opsi={OPSI_INDIKATOR} value={k.indikator} onChange={set('indikator')} galat={tampil('indikator')} />
          <Pilihan id="adm-tarif" label={A.tarif} opsi={[{ nilai: '', label: A.tarifTanpa }, ...(opsi?.tarif_kamar ?? []).map((t) => ({ nilai: String(t.id), label: `${t.nama} (${rupiah(t.harga_umum)})` }))]} value={k.tarif_id} onChange={set('tarif_id')} galat={tampil('tarif_id')} />
        </Kolom>
      ),
    },
    {
      id: 'dpjp', judul: A.langkah.dpjp, selesai: !g.dpjp_id && !g.dpjp_bersama,
      isi: (
        <Kolom>
          <Pilihan id="adm-dpjp" label={A.dpjpUtama} opsi={dpjp} value={k.dpjp_id} onChange={set('dpjp_id')} galat={tampil('dpjp_id')} />
          <Kolom jarak="xs" role="group" aria-label={A.dpjpBersama}>
            <strong>{A.dpjpBersama}</strong>
            {(opsi?.dpjp ?? []).filter((d) => String(d.id) !== k.dpjp_id).map((d) => (
              <KotakCentang
                key={d.id} id={`adm-bersama-${d.id}`} label={`${d.nama}${d.profesi ? ` (${d.profesi})` : ''}`} checked={k.dpjp_bersama.includes(String(d.id))}
                onChange={(e) => setK({ ...k, dpjp_bersama: e.target.checked ? [...k.dpjp_bersama, String(d.id)] : k.dpjp_bersama.filter((x) => x !== String(d.id)) })}
              />
            ))}
            {tampil('dpjp_bersama') && <Peringatan>{g.dpjp_bersama}</Peringatan>}
          </Kolom>
        </Kolom>
      ),
    },
    {
      id: 'spri', judul: A.langkah.spri,
      isi: (
        <Kolom>
          <Isian id="adm-spri" label={A.spri} value={k.spri} onChange={set('spri')} autoComplete="off" />
          <span style={kecil}>{A.spriPetunjuk}</span>
          <AreaTeks id="adm-keluhan" label={A.keluhan} value={k.keluhan_singkat} maxLength={500} onChange={set('keluhan_singkat')} />
        </Kolom>
      ),
    },
    {
      id: 'ringkasan', judul: A.langkah.ringkasan,
      isi: (
        <Kolom>
          {asal?.asal && <Peringatan nada="biru">{A.asalInfo(asal.asal.poli_nama)}</Peringatan>}
          <DaftarRingkasan bagian={[{
            judul: A.judul,
            baris: [
              { label: A.bed, nilai: bedLabel(k.bed_id) ? `${bedLabel(k.bed_id)!.ruang_nama ?? ''} ${bedLabel(k.bed_id)!.nama}`.trim() : A.bedMenunggu },
              { label: A.kelas, nilai: `${KELAS_RAWAT.label(k.kelas)} · ${INDIKATOR_KELAS.label(k.indikator)}` }, { label: A.tarif, nilai: tarifLabel(k.tarif_id)?.nama ?? A.tarifTanpa },
              { label: A.dpjpUtama, nilai: opsi?.dpjp.find((d) => String(d.id) === k.dpjp_id)?.nama ?? '-' },
              { label: A.dpjpBersama, nilai: k.dpjp_bersama.map((id) => opsi?.dpjp.find((d) => String(d.id) === id)?.nama).filter(Boolean).join(', ') || '-' },
              { label: A.spri, nilai: k.spri || '-' }, { label: A.keluhan, nilai: k.keluhan_singkat || '-' },
            ],
          }]} />
        </Kolom>
      ),
    },
  ];

  return (
    <ModalBertahap
      judul={A.judul} langkah={langkah} indeks={indeks} onIndeks={setIndeks} galat={galat} onTutup={hasil ? onSelesai : onTutup} lindungiTutup={adaPerubahan(awal, k)}
      labelKirim={memproses ? A.menyimpan : A.simpan} onKirim={() => void kirim()} kirimNonaktif={memproses || !opsi}
      hasil={hasil ? { judul: A.hasilJudul, isi: <p style={{ margin: 0 }}>{A.hasilPesan(hasil.menunggu)}</p>, aksi: <Tombol type="button" onClick={onSelesai}>{TOMBOL.tutup}</Tombol> } : undefined}
    />
  );
}
