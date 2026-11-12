import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_ANAMNESIS, DEFAULT_PEMERIKSAAN, KELOMPOK_PEMERIKSAAN, LABEL_NARASI, KLINIS, MAKS_NARASI, STATUS_PERAN_DIAGNOSIS, STATUS_RINGKASAN_BAGIAN, TANDA_VITAL,
  bidangKelompok, isianDiubah, kembalikanNormal, labelBidangPemeriksaan, samaDenganDefault,
} from '@klira/shared';
import type { BagianNarasi, BagianKlinis, BagianKlinisDto, FavoritDto, KunciDefaultAnamnesis } from '@klira/shared';
import { BilahNormal, KelompokNormal } from '../../komponen/kelompok-normal/kelompok-normal';
import { cariTerminologi, cariTindakanKlinik } from '../../api-klien/klinis';
import { token } from '../../gaya/token';
import { InfoPengesahan } from '../../komponen/info-pengesahan/info-pengesahan';
import { PencarianKode } from '../../komponen/pencarian-kode/pencarian-kode';
import type { HasilTambahan } from '../../komponen/pencarian-kode/pencarian-kode';
import { AreaTeks } from '../../komponen/ui/area-teks';
import { Isian } from '../../komponen/ui/isian';
import { KotakCentang } from '../../komponen/ui/kotak-centang';
import { Lencana } from '../../komponen/ui/lencana';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Baris, Daftar, DaftarRingkasan, Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { Tombol } from '../../komponen/ui/tombol';
import { hapusDiagnosis, hapusTindakan, jadikanUtama, kunciItemTindakan, ringkasanIsi, tambahDiagnosis, tambahTindakan, ubahTindakan } from './keadaan-pemeriksaan';
import { rupiahAtau } from './keadaan-order-lab';
import type { KeadaanPemeriksaan, RencanaSimpan } from './keadaan-pemeriksaan';
import { Bingkai } from '../../komponen/ui/kartu';

type Ubah = (perubahan: Partial<KeadaanPemeriksaan>) => void;
export type DasarLangkah = {
  k: KeadaanPemeriksaan;
  ubah: Ubah;
  /** Galat bagian ini (tampil setelah pengguna mencoba lanjut atau menyimpan). */
  galat?: string | null;
  /** Keadaan pengesahan bagian ini dari server. */
  server?: Pick<BagianKlinisDto, 'pengesahan' | 'verifikasi'> | null;
};

const teksRedup = { margin: 0, color: token.warna.teksRedup } as const;
const cariIcd10 = (q: string) => cariTerminologi('icd10', q);
const cariIcd9 = (q: string) => cariTerminologi('icd9cm', q);

export function GalatBagian({ galat }: { galat?: string | null }) {
  return galat ? <Peringatan>{galat}</Peringatan> : null;
}

/** Anamnesa sesuai formulir klinik; riwayat penyakit dahulu dan keluarga berdefault "tidak ada". */
export function LangkahAnamnesis({ k, ubah, galat, server }: DasarLangkah) {
  const a = KLINIS.anamnesis;
  const setA = (n: keyof KeadaanPemeriksaan['anamnesis'], v: string) => ubah({ anamnesis: { ...k.anamnesis, [n]: v } });
  const setR = (n: keyof KeadaanPemeriksaan['riwayat'], v: string) => ubah({ riwayat: { ...k.riwayat, [n]: v } });
  const diubah = (n: KunciDefaultAnamnesis) => !samaDenganDefault(k.riwayat[n], DEFAULT_ANAMNESIS[n]);
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <Baris>
        <AreaTeks id="anamnesis-keluhan" label={a.keluhanUtama} required value={k.anamnesis.keluhan_utama} maxLength={1000} onChange={(e) => setA('keluhan_utama', e.target.value)} />
        <AreaTeks id="anamnesis-penyerta" label={a.penyerta} value={k.anamnesis.penyerta} maxLength={1000} onChange={(e) => setA('penyerta', e.target.value)} />
        <AreaTeks id="anamnesis-sekarang" label={a.riwayatSekarang} value={k.anamnesis.riwayat_sekarang} maxLength={1000} onChange={(e) => setA('riwayat_sekarang', e.target.value)} />
        <AreaTeks id="anamnesis-dahulu" label={a.riwayatPribadi} value={k.riwayat.riwayat_pribadi} maxLength={1000} diubah={diubah('riwayat_pribadi')} onChange={(e) => setR('riwayat_pribadi', e.target.value)} />
        <AreaTeks id="anamnesis-keluarga" label={a.riwayatKeluarga} value={k.riwayat.riwayat_keluarga} maxLength={1000} diubah={diubah('riwayat_keluarga')} onChange={(e) => setR('riwayat_keluarga', e.target.value)} />
        <AreaTeks id="anamnesis-sosial" label={a.kajianSosial} value={k.riwayat.kajian_sosial} maxLength={1000} onChange={(e) => setR('kajian_sosial', e.target.value)} />
      </Baris>
    </Kolom>
  );
}

export function LangkahTandaVital({ k, ubah, galat, server }: DasarLangkah) {
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <p style={teksRedup}>{KLINIS.tandaVital.petunjuk}</p>
      <GalatBagian galat={galat} />
      <Baris>
        {TANDA_VITAL.map((t) => (
          <Isian
            key={t.kunci} id={`tv-${t.kunci}`} label={`${KLINIS.tandaVital[t.kunci]} (${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan})`} inputMode="decimal" autoComplete="off"
            value={k.tanda_vital[t.kunci]} onChange={(e) => ubah({ tanda_vital: { ...k.tanda_vital, [t.kunci]: e.target.value } })}
          />
        ))}
      </Baris>
    </Kolom>
  );
}

/**
 * Pemeriksaan fisik terstruktur per kelompok organ (formulir klinik): isian berdefault keadaan baik, isian yang berbeda ditandai,
 * "Semua normal" per kelompok dan "Kembalikan semua ke normal". Odontogram: centang "Sudah dibuat" dan tanggal.
 */
export function LangkahPemeriksaan({ k, ubah, galat, server }: DasarLangkah) {
  const pm = k.pemeriksaan;
  const set = (p: Partial<KeadaanPemeriksaan['pemeriksaan']>) => ubah({ pemeriksaan: { ...pm, ...p } });
  const diubah = new Set(isianDiubah(pm, DEFAULT_PEMERIKSAAN));
  const p = KLINIS.pemeriksaan;
  const [odontogramDibuat, setOdontogramDibuat] = useState(pm.odontogram_tanggal !== '');
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <BilahNormal diubah={diubah.size} onKembalikan={() => ubah({ pemeriksaan: kembalikanNormal(pm, DEFAULT_PEMERIKSAAN) })} />
      {KELOMPOK_PEMERIKSAAN.filter((g) => g.kunci !== 'odontogram').map((g) => {
        const bidang = bidangKelompok(g.kunci);
        return (
          <KelompokNormal key={g.kunci} judul={g.label} diubah={bidang.filter((b) => diubah.has(b as never)).length}
            onNormal={() => ubah({ pemeriksaan: kembalikanNormal(pm, DEFAULT_PEMERIKSAAN, bidang as never[]) })}>
            <Baris>
              {bidang.map((b) => (
                <Isian key={b} id={`pemeriksaan-${b}`} label={labelBidangPemeriksaan(b)} value={pm[b]} maxLength={300} autoComplete="off"
                  diubah={diubah.has(b as never)} onChange={(e) => set({ [b]: e.target.value })} />
              ))}
            </Baris>
          </KelompokNormal>
        );
      })}
      <KelompokNormal judul={KELOMPOK_PEMERIKSAAN.find((g) => g.kunci === 'odontogram')?.label ?? ''}>
        <Baris>
          <KotakCentang id="odontogram-dibuat" label={p.odontogramDibuat} checked={odontogramDibuat}
            onChange={(e) => { setOdontogramDibuat(e.target.checked); if (!e.target.checked) set({ odontogram_tanggal: '' }); }} />
          {odontogramDibuat && <Isian id="odontogram-tanggal" type="date" label={p.odontogramTanggal} required value={pm.odontogram_tanggal}
            galat={pm.odontogram_tanggal ? undefined : KLINIS.galat.odontogramWajib} onChange={(e) => set({ odontogram_tanggal: e.target.value })} />}
        </Baris>
      </KelompokNormal>
    </Kolom>
  );
}

export function LangkahDiagnosis({ k, ubah, galat, server, favorit }: DasarLangkah & { favorit: readonly FavoritDto[] }) {
  const d = KLINIS.diagnosis;
  const tambah = (x: { kode: string; nama: string }) => ubah({ diagnosis: tambahDiagnosis(k.diagnosis, x) });
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <PencarianKode kamus={{ judul: 'Kamus ICD-10', sistem: 'icd10' }} id="diagnosis-cari" label={d.cari} petunjuk={d.petunjukCari} cari={cariIcd10} onPilih={tambah} manual teksManual={{ kode: d.kode, nama: d.nama }} />
      {favorit.length > 0 && (
        <Sebaris bungkus>
          <span style={{ color: token.warna.teksRedup }}>{d.favoritSaya}</span>
          {favorit.map((f) => (
            <Tombol key={f.id} type="button" varian="sekunder" onClick={() => tambah(f)}>{f.kode} {f.nama}</Tombol>
          ))}
        </Sebaris>
      )}
      <Kolom jarak="sm">
        <strong>{d.kunjunganIni}</strong>
        {k.diagnosis.length === 0 ? (
          <p style={teksRedup}>{d.kosong}</p>
        ) : (
          <Daftar>
            {k.diagnosis.map((x) => (
              <Bingkai tag="li" jarak="md" key={x.kode}>
                <strong style={{ minWidth: token.ukuran.kolomKode }}>{x.kode}</strong>
                <Tumbuh>{x.nama}</Tumbuh>
                <Lencana warna={STATUS_PERAN_DIAGNOSIS.warna(x.peran)}>{x.peran === 'utama' ? KLINIS.kesimpulan.diagnosaMedis : KLINIS.kesimpulan.diagnosaTambahan}</Lencana>
                {x.peran !== 'utama' && <Tombol type="button" varian="teks" onClick={() => ubah({ diagnosis: jadikanUtama(k.diagnosis, x.kode) })}>{d.jadikanUtama}</Tombol>}
                <Tombol type="button" varian="teks" onClick={() => ubah({ diagnosis: hapusDiagnosis(k.diagnosis, x.kode) })}>{d.hapus}</Tombol>
              </Bingkai>
            ))}
          </Daftar>
        )}
      </Kolom>
    </Kolom>
  );
}

/** Daftar tindakan klinik sebagai hasil tambahan pencarian: kunci `tarif:<id>|<kode ICD-9-CM>`. Tanpa kode ICD-9-CM tidak dapat dicatat. */
const cariTindakanKlinikTambahan = async (q: string): Promise<HasilTambahan[]> =>
  (await cariTindakanKlinik(q)).flatMap((x) => (x.kode_icd9cm ? [{
    kunci: `${x.id}|${x.kode_icd9cm}`, kode: x.kode_icd9cm, nama: x.nama,
    keterangan: `${KLINIS.tindakan.tindakanKlinik} ${x.kode} · ${rupiahAtau(x.harga_umum, KLINIS.tindakan.tanpaHarga)}${x.harga_jkn !== null ? ` · JKN ${rupiahAtau(x.harga_jkn)}` : ''}`,
  }] : []));
const tarifDariKunci = (kunci: string): number => Number(kunci.split('|')[0]);

export function LangkahTindakan({ k, ubah, galat, server, favorit }: DasarLangkah & { favorit: readonly FavoritDto[] }) {
  const t = KLINIS.tindakan;
  const tambah = (x: { kode: string; nama: string; tarif_layanan_id?: number | null }) => ubah({ tindakan: tambahTindakan(k.tindakan, x, new Date()) });
  const ubahItem = (kunci: string, p: Partial<(typeof k.tindakan)[number]>) => ubah({ tindakan: ubahTindakan(k.tindakan, kunci, p) });
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      <GalatBagian galat={galat} />
      <PencarianKode kamus={{ judul: t.kamus, sistem: 'icd9cm' }} id="tindakan-cari" label={t.cari} petunjuk={t.petunjukCari} cari={cariIcd9} onPilih={tambah} manual teksManual={{ kode: t.kode, nama: t.nama }}
        tambahan={{ judul: t.daftarKlinik, judulKamus: t.kamus, cari: cariTindakanKlinikTambahan, onPilih: (h) => tambah({ kode: h.kode, nama: h.nama, tarif_layanan_id: tarifDariKunci(h.kunci) }) }} />
      {favorit.length > 0 && (
        <Sebaris bungkus>
          <span style={{ color: token.warna.teksRedup }}>{KLINIS.diagnosis.favoritSaya}</span>
          {favorit.map((f) => (
            <Tombol key={f.id} type="button" varian="sekunder" onClick={() => tambah(f)}>{f.kode} {f.nama}</Tombol>
          ))}
        </Sebaris>
      )}
      <Kolom jarak="sm">
        <strong>{t.kunjunganIni}</strong>
        {k.tindakan.length === 0 && <p style={teksRedup}>{t.kosong}</p>}
        {k.tindakan.map((x) => {
          const kunci = kunciItemTindakan(x);
          const idBaris = kunci.replace(/[^\w-]/g, '-');
          return (
            <Bingkai arah="kolom" key={kunci}>
              <Sebaris jarak="md">
                <strong style={{ minWidth: token.ukuran.kolomKode }}>{x.kode}</strong>
                <Tumbuh>{x.nama}</Tumbuh>
                {x.tarif_layanan_id ? <Lencana warna="biru">{t.tindakanKlinik}</Lencana> : null}
                <span style={{ color: token.warna.teksRedup }}>{t.performer}: {t.saya}</span>
                <Tombol type="button" varian="teks" onClick={() => ubah({ tindakan: hapusTindakan(k.tindakan, kunci) })}>{t.hapus}</Tombol>
              </Sebaris>
              <Baris>
                <Isian id={`tindakan-jumlah-${idBaris}`} label={t.jumlah} inputMode="numeric" value={x.jumlah ?? '1'} onChange={(e) => ubahItem(kunci, { jumlah: e.target.value })} autoComplete="off" />
                <Isian id={`tindakan-mulai-${idBaris}`} label={t.mulai} type="datetime-local" value={x.mulai} onChange={(e) => ubahItem(kunci, { mulai: e.target.value })} />
                <Isian id={`tindakan-selesai-${idBaris}`} label={t.selesai} type="datetime-local" value={x.selesai} onChange={(e) => ubahItem(kunci, { selesai: e.target.value })} />
              </Baris>
            </Bingkai>
          );
        })}
      </Kolom>
    </Kolom>
  );
}

export function LangkahTindakLanjut({ k, ubah, galat, server, ringkas = false }: DasarLangkah & { ringkas?: boolean }) {
  const t = KLINIS.tindakLanjut;
  const tl = k.tindak_lanjut;
  const set = (p: Partial<typeof tl>) => ubah({ tindak_lanjut: { ...tl, ...p } });
  return (
    <Kolom>
      <InfoPengesahan bagian={server} />
      {!ringkas && <p style={teksRedup}>{t.keterangan}</p>}
      <GalatBagian galat={galat} />
      <fieldset style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
        <legend style={{ padding: 0, marginBottom: token.jarak.sm, fontWeight: token.huruf.berat.sedang }}>Tindak lanjut</legend>
        <Sebaris bungkus jarak="md">
          {t.jenisOpsi.map((o) => <label key={o.nilai} style={{ display: 'inline-flex', alignItems: 'center', gap: token.jarak.xs, minHeight: 44, cursor: 'pointer' }}>
            <input type="radio" name="tl-jenis" value={o.nilai} checked={tl.jenis === o.nilai}
              onChange={() => set({ jenis: o.nilai as typeof tl.jenis })} style={{ accentColor: token.warna.utama }} />
            {o.label}
          </label>)}
        </Sebaris>
      </fieldset>
      {tl.jenis === 'rujuk' && <Isian id="tl-tujuan" label={t.tujuan} value={tl.tujuan} onChange={(e) => set({ tujuan: e.target.value })} autoComplete="off" />}
      {tl.jenis === 'rawat_inap' && <Isian id="tl-spri" label={t.spri} value={tl.spri} onChange={(e) => set({ spri: e.target.value })} autoComplete="off" />}
      {(!ringkas || tl.catatan) && <AreaTeks id="tl-catatan" label={ringkas ? 'Catatan tindak lanjut tersimpan' : t.catatan} value={tl.catatan} onChange={(e) => set({ catatan: e.target.value })} />}
    </Kolom>
  );
}

type PropsRingkasan = {
  k: KeadaanPemeriksaan;
  ubah: Ubah;
  rencana: RencanaSimpan;
  status: Record<BagianKlinis, keyof typeof STATUS_RINGKASAN_BAGIAN.peta>;
  /** Bagian yang tampil di ringkasan (menurut mode modal). */
  bagian: readonly BagianKlinis[];
  labelBagian: Record<BagianKlinis, string>;
  perluAlasan: boolean;
  bisaSelesai: boolean;
  tampilSelesai: boolean;
  selesai: boolean;
  onSelesai: (v: boolean) => void;
  children?: ReactNode;
};

export function LangkahRingkasan({ k, ubah, rencana, status, bagian, labelBagian, perluAlasan, bisaSelesai, tampilSelesai, selesai, onSelesai, children }: PropsRingkasan) {
  const r = KLINIS.ringkasan;
  return (
    <Kolom>
      <p style={teksRedup}>{r.judul}</p>
      {!tampilSelesai && <Daftar jarak="xs">
        {bagian.map((b) => (
          <Sebaris tag="li" jarak="md" key={b}>
            <Tumbuh>{labelBagian[b]}</Tumbuh>
            <Lencana warna={STATUS_RINGKASAN_BAGIAN.warna(status[b])}>{STATUS_RINGKASAN_BAGIAN.label(status[b])}</Lencana>
          </Sebaris>
        ))}
      </Daftar>}
      {tampilSelesai && <DaftarRingkasan bagian={ringkasanIsi(k).map((b) => ({ ...b, baris: b.baris.filter((x) => x.nilai !== '-') }))} />}
      {children}
      {rencana.map((x) => x.galat && <Peringatan key={x.bagian}>{`${labelBagian[x.bagian]}: ${x.galat}`}</Peringatan>)}
      {perluAlasan && <AreaTeks id="ringkasan-alasan" label={r.alasan} value={k.alasan} onChange={(e) => ubah({ alasan: e.target.value })} />}
      {perluAlasan && <p style={{ ...teksRedup, fontSize: token.huruf.ukuran.kecil }}>{r.alasanKet}</p>}
      {tampilSelesai && (
        <KotakCentang id="ringkasan-selesai" label={r.tahapKasir} keterangan={bisaSelesai ? r.selesaiOtomatis : r.syaratSelesai} checked={selesai && bisaSelesai} disabled={!bisaSelesai} onChange={(e) => onSelesai(e.target.checked)} />
      )}
      <Peringatan nada="biru">{r.penjelasanSimpan}</Peringatan>
    </Kolom>
  );
}


/** Isian teks bebas formulir (diagnosa banding, KIE, obat yang diberikan di poli). */
export function LangkahNarasi({ bagian, k, ubah, galat, server, keterangan }: DasarLangkah & { bagian: BagianNarasi; keterangan?: string }) {
  return <Kolom jarak="sm">
    <InfoPengesahan bagian={server} />
    <GalatBagian galat={galat} />
    <AreaTeks id={`narasi-${bagian}`} label={LABEL_NARASI[bagian]} value={k[bagian]} maxLength={MAKS_NARASI[bagian]} onChange={(e) => ubah({ [bagian]: e.target.value })} />
    {keterangan && <p style={{ ...teksRedup, fontSize: token.huruf.ukuran.kecil }}>{keterangan}</p>}
  </Kolom>;
}
