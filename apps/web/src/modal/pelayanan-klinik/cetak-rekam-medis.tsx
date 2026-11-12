import './cetak-rekam-medis.css';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CARA_PEMBAYARAN, KLINIS, LABEL_NARASI, TANDA_VITAL } from '@klira/shared';
import type { BagianKlinis, RekamMedisCetakDto } from '@klira/shared';
import { ambilRekamMedisCetak } from '../../api-klien/klinis';
import { GalatApi } from '../../api-klien/klien';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Tombol } from '../../komponen/ui/tombol';
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format';
import { keperawatanDariIsi, ringkasanKeperawatan } from './keadaan-keperawatan';
import { barisPemeriksaanFisik, keadaanDariServer, ringkasanIsi } from './keadaan-pemeriksaan';

const C = KLINIS.cetak;
type Sel = { label: string; nilai: string; tebal?: boolean };
type Pengesah = { peran: string; nama: string | null; waktu: string | null };

/** Satu blok formulir: pita judul, sel isian dalam kisi, dan kolom pengesahan elektronik di kanan (pengganti kotak tanda tangan). */
function Blok({ judul, sel, pengesah, kolom = 3, children }: { judul: string; sel: Sel[]; pengesah: Pengesah; kolom?: number; children?: ReactNode }) {
  return (
    <section className="crm-blok">
      <h2 className="crm-pita">{judul}</h2>
      <div className="crm-isi">
        <div className="crm-kisi" style={{ gridTemplateColumns: `repeat(${kolom}, minmax(0, 1fr))` }}>
          {sel.length === 0 && <div className="crm-sel"><span className="crm-nilai">-</span></div>}
          {sel.map((s, i) => (
            <div className="crm-sel" key={`${s.label}-${i}`}>
              <span className="crm-label">{s.label}</span>
              <span className={s.tebal ? 'crm-nilai crm-tebal' : 'crm-nilai'}>{s.nilai || '-'}</span>
            </div>
          ))}
        </div>
        {children}
      </div>
      <div className="crm-sah">
        <strong>{pengesah.peran}</strong>
        <span>{pengesah.nama ?? '-'}</span>
        {pengesah.waktu && <span>{tanggalWaktuPendek(pengesah.waktu)}</span>}
        {pengesah.nama && pengesah.waktu && <span>{C.disahkan}</span>}
      </div>
    </section>
  );
}

/** Rekam medis rawat jalan satu kunjungan (P8) dalam tata letak A4 formulir klinik; dicetak lewat dialog cetak peramban. */
export function CetakRekamMedis({ kunjunganId, onTutup }: { kunjunganId: number; onTutup: () => void }) {
  const [data, setData] = useState<RekamMedisCetakDto | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    ambilRekamMedisCetak(kunjunganId).then((d) => !batal && setData(d)).catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : C.gagal));
    return () => { batal = true; };
  }, [kunjunganId]);

  return createPortal(
    <div className="crm-lapis" role="dialog" aria-modal="true" aria-label={C.judul}>
      <div className="crm-alat">
        <strong>{C.judul}</strong>
        <span className="crm-tumbuh" />
        <Tombol type="button" varian="sekunder" onClick={onTutup}>{C.tutup}</Tombol>
        <Tombol type="button" disabled={!data} onClick={() => window.print()}>{C.cetak}</Tombol>
      </div>
      {galat && <Peringatan>{galat}</Peringatan>}
      {!data && !galat && <p className="crm-memuat">{C.memuat}</p>}
      {data && <Lembar d={data} />}
    </div>,
    document.body,
  );
}

function Lembar({ d }: { d: RekamMedisCetakDto }) {
  const b = d.klinis.bagian;
  const k = keadaanDariServer(b);
  const sah = (peran: string, ...bagian: BagianKlinis[]): Pengesah => {
    const p = bagian.map((x) => b[x].pengesahan).filter((x) => x !== null).sort((x, y) => y.waktu.localeCompare(x.waktu))[0];
    return { peran, nama: p?.pengguna_nama ?? null, waktu: p?.waktu ?? null };
  };
  const [anamnesa, , kesimpulan] = ringkasanIsi(k);
  const keperawatan = b.keperawatan.isi ? ringkasanKeperawatan(keperawatanDariIsi(b.keperawatan.isi)).baris : [];
  const tv = TANDA_VITAL.filter((t) => k.tanda_vital[t.kunci]).map((t) => ({ label: KLINIS.tandaVital[t.kunci], nilai: `${k.tanda_vital[t.kunci]} ${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan}` }));
  const fisik = barisPemeriksaanFisik(k.pemeriksaan).map((x) => ({ ...x, tebal: x.nilai.includes('(!)'), nilai: x.nilai.replaceAll(' (!)', '') }));
  const obatPulang = d.resep.map((r) => [r.teks, ...r.item.map((i) => `• ${i.nama} ${i.jumlah} ${i.satuan}, ${i.aturan_pakai}`)].join('\n')).join('\n\n');
  const tl = k.tindak_lanjut;
  const validator = d.penunjang.find((p) => p.validator);
  const p = d.pasien;
  return (
    <article className="crm-lembar">
      <header className="crm-kepala">
        <h1>{C.judulLembar}</h1>
        <div className="crm-kisi" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {[
            { label: C.tglDaftar, nilai: `${tanggalWaktuPendek(d.kepala.mulai)}${d.kepala.nomor_antrean ? ` · ${d.kepala.nomor_antrean}` : ''}` },
            { label: C.noPelayanan, nilai: String(d.klinis.kunjungan.id) },
            { label: C.poli, nilai: d.kepala.poli ?? '-' },
            { label: C.dokter, nilai: d.kepala.dokter ?? '-' },
          ].map((s) => <div className="crm-sel" key={s.label}><span className="crm-label">{s.label}</span><span className="crm-nilai">{s.nilai}</span></div>)}
        </div>
      </header>

      <Blok judul={C.blok.administratif} kolom={4} pengesah={{ peran: C.peran.pasien, nama: d.persetujuan_umum ? C.persetujuanUmum : null, waktu: d.persetujuan_umum }} sel={[
        { label: C.noRm, nilai: p.nomor_rm, tebal: true }, { label: C.nama, nilai: p.nama, tebal: true },
        { label: C.kepalaKeluarga, nilai: [p.kepala_keluarga, p.folder].filter(Boolean).join(' · ') }, { label: C.nik, nilai: p.nik ?? '-' },
        { label: C.lahirKelamin, nilai: `${tanggalPendek(p.tanggal_lahir)} · ${p.jenis_kelamin === 'laki_laki' ? 'L' : 'P'}` },
        { label: C.agamaNikah, nilai: [p.agama, p.status_kawin].filter(Boolean).join(' · ') || '-' }, { label: C.hubungan, nilai: p.hubungan ?? '-' },
        { label: C.caraBayar, nilai: `${CARA_PEMBAYARAN.label(d.klinis.kunjungan.cara_pembayaran)}${p.nomor_jkn ? ` · ${p.nomor_jkn}` : ''}` },
      ]} />

      <Blok judul={C.blok.keperawatan} kolom={4} pengesah={sah(C.peran.perawat, 'keperawatan', 'tanda_vital')} sel={[
        { label: C.jenisKunjungan, nilai: C.rawatJalan }, ...tv, ...keperawatan,
      ]} />

      <Blok judul={C.blok.anamnesa} pengesah={sah(C.peran.dokter, 'anamnesis')} sel={anamnesa.baris} />

      <Blok judul={C.blok.fisik} kolom={4} pengesah={sah(C.peran.dokter, 'pemeriksaan')} sel={fisik} />

      <Blok judul={C.blok.penunjang} kolom={2} pengesah={{ peran: C.peran.lab, nama: validator?.validator ?? null, waktu: validator?.waktu ?? null }}
        sel={d.penunjang.map((x) => ({ label: x.nama, nilai: x.nilai ? `${x.nilai}${x.satuan ? ` ${x.satuan}` : ''}${x.interpretasi && x.interpretasi !== 'normal' ? ` (${x.interpretasi})` : ''}` : C.belumAdaHasil, tebal: !!x.interpretasi && x.interpretasi !== 'normal' }))} />

      <Blok judul={C.blok.kesimpulan} pengesah={sah(C.peran.dokter, 'diagnosis', 'diagnosis_banding', 'kie')} sel={kesimpulan.baris} />

      <Blok judul={C.blok.terapi} pengesah={sah(C.peran.dokter, 'tindakan', 'obat_poli')} sel={[
        { label: KLINIS.langkah.tindakan, nilai: k.tindakan.map((t) => `${t.kode} ${t.nama}${t.jumlah && t.jumlah !== '1' ? ` ×${t.jumlah}` : ''}`).join('\n') || '-' },
        { label: LABEL_NARASI.obat_poli, nilai: k.obat_poli || '-' },
        { label: KLINIS.terapi.obatPulang, nilai: obatPulang || '-' },
      ]} />

      <Blok judul={C.blok.rujukan} kolom={4} pengesah={tl.jenis === 'rujuk' ? sah(C.peran.dokter, 'tindak_lanjut') : { peran: C.peran.dokter, nama: null, waktu: null }} sel={tl.jenis === 'rujuk' ? [
        { label: C.suratRujukan, nilai: d.rujukan ? `${tanggalPendek(d.rujukan.tanggal)} · ${d.rujukan.nomor}` : '-' },
        { label: KLINIS.tindakLanjut.tujuan, nilai: d.rujukan?.tujuan ?? tl.tujuan },
        { label: C.alasanRujuk, nilai: tl.catatan || '-' },
      ] : [{ label: KLINIS.langkah.tindakLanjut, nilai: KLINIS.tindakLanjut.jenisOpsi.find((o) => o.nilai === tl.jenis)?.label ?? '-' }]} />

      <footer className="crm-kaki">
        <span>{C.dicetak(d.dicetak_oleh, tanggalWaktuPendek(d.dicetak_pada))}</span>
        <span>{C.tandaTebal}</span>
      </footer>
    </article>
  );
}
