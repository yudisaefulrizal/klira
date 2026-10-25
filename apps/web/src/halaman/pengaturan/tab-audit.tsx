import { useEffect, useState } from 'react';
import { AKSI_AUDIT, AUDIT } from '@klira/shared';
import type { CatatanAuditDto, Halaman } from '@klira/shared';
import { daftarAudit, eksporAudit } from '../../api-klien/audit';
import { GalatApi } from '../../api-klien/klien';
import { BilahPenyaring } from '../../komponen/bilah-penyaring';
import { Paginasi } from '../../komponen/paginasi';
import { PanelDetail } from '../../komponen/panel-detail/panel-detail';
import { Isian } from '../../komponen/ui/isian';
import { Kartu } from '../../komponen/ui/kartu';
import { Peringatan } from '../../komponen/ui/peringatan';
import { Pilihan } from '../../komponen/ui/pilihan';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel';
import { Tombol } from '../../komponen/ui/tombol';
import { token } from '../../gaya/token';
import type { NilaiPenyaring } from '../../util/penyaring-tab';
import { BAWAAN_AUDIT, bacaPenyaring, formatWaktu, penggunaIdSah, queryPenyaring, rentangTerbalik, saringanAudit, saringanEkspor, ubahPenyaring } from '../../util/penyaring-tab';
import { unduhTeks } from '../../util/unduh';

const UKURAN = 20;
const KOLOM = [
  { judul: AUDIT.kolom.waktu }, { judul: AUDIT.kolom.pengguna }, { judul: AUDIT.kolom.aksi }, { judul: AUDIT.kolom.entitas },
  { judul: AUDIT.kolom.keterangan }, { judul: AUDIT.kolom.tindakan, rataKanan: true },
];
const OPSI_AKSI = [{ nilai: '', label: AUDIT.semuaAksi }, ...AKSI_AUDIT.map((a) => ({ nilai: a, label: AUDIT.aksi[a] ?? a }))];

/** Tab Log audit (3.1, 4.7): tabel dengan penyaring, detail lewat Panel detail, dan Ekspor CSV sesuai penyaring. */
export function TabAudit({ search, ubahAlamat }: { search: string; ubahAlamat: (query: string) => void }) {
  const keadaan = bacaPenyaring(search, BAWAAN_AUDIT);
  const [draf, setDraf] = useState(keadaan.nilai);
  const [hasil, setHasil] = useState<Halaman<CatatanAuditDto> | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mengekspor, setMengekspor] = useState(false);
  const [detail, setDetail] = useState<CatatanAuditDto | null>(null);

  useEffect(() => setDraf(bacaPenyaring(search, BAWAAN_AUDIT).nilai), [search]);

  const kunci = JSON.stringify([keadaan.nilai, keadaan.halaman]);
  useEffect(() => {
    let batal = false;
    daftarAudit(saringanAudit(bacaPenyaring(search, BAWAAN_AUDIT), UKURAN))
      .then((h) => {
        if (batal) return;
        setHasil(h);
        setGalat(null);
      })
      .catch((e) => !batal && setGalat(e instanceof GalatApi ? e.message : AUDIT.gagalMuat));
    return () => {
      batal = true;
    };
    // search diwakili `kunci` agar hanya berubah saat penyaring atau halaman berubah.
  }, [kunci]);

  async function ekspor() {
    setMengekspor(true);
    setGalat(null);
    setInfo(null);
    try {
      unduhTeks(AUDIT.namaBerkas, await eksporAudit(saringanEkspor(keadaan)));
      setInfo(AUDIT.eksporBerhasil);
    } catch (e) {
      setGalat(e instanceof GalatApi ? e.message : AUDIT.eksporGagal);
    } finally {
      setMengekspor(false);
    }
  }

  const pasang = (k: typeof keadaan) => ubahAlamat(queryPenyaring('audit', k, BAWAAN_AUDIT));
  const ubah = (perubahan: NilaiPenyaring) => setDraf({ ...draf, ...perubahan });
  const galatPengguna = penggunaIdSah(draf.pengguna) ? undefined : AUDIT.penggunaTidakValid;
  const terbalik = rentangTerbalik(draf.dari, draf.sampai);

  return (
    <section id="panel-audit" role="tabpanel" aria-labelledby="tab-audit" style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.md }}>
      <Kartu style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: `${token.jarak.md} ${token.jarak.md} 0`, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{AUDIT.judulTab}</div>
        <BilahPenyaring
          labelTerapkan={AUDIT.terapkan}
          labelAturUlang={AUDIT.aturUlang}
          nonaktif={terbalik || !!galatPengguna}
          onTerapkan={() => pasang(ubahPenyaring(keadaan, draf))}
          onAturUlang={() => pasang({ nilai: { ...BAWAAN_AUDIT }, halaman: 1 })}
          tombolLain={<Tombol type="button" varian="sekunder" disabled={mengekspor} onClick={() => void ekspor()}>{mengekspor ? AUDIT.mengekspor : AUDIT.ekspor}</Tombol>}
        >
          <Isian id="audit-pengguna" label={AUDIT.filterPengguna} inputMode="numeric" value={draf.pengguna} onChange={(e) => ubah({ pengguna: e.target.value })} galat={galatPengguna} />
          <Pilihan id="audit-aksi" label={AUDIT.filterAksi} value={draf.aksi} onChange={(e) => ubah({ aksi: e.target.value })} opsi={OPSI_AKSI} />
          <Isian id="audit-entitas" label={AUDIT.filterEntitas} value={draf.entitas} onChange={(e) => ubah({ entitas: e.target.value })} />
          <Isian id="audit-dari" label={AUDIT.filterDari} type="date" value={draf.dari} onChange={(e) => ubah({ dari: e.target.value })} />
          <Isian id="audit-sampai" label={AUDIT.filterSampai} type="date" value={draf.sampai} onChange={(e) => ubah({ sampai: e.target.value })} galat={terbalik ? AUDIT.rentangTerbalik : undefined} />
        </BilahPenyaring>
        {info && <Peringatan nada="biru" style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{info}</Peringatan>}
        {galat && <Peringatan style={{ margin: `0 ${token.jarak.md} ${token.jarak.md}` }}>{galat}</Peringatan>}
        <Tabel kolom={KOLOM} label={AUDIT.judulTab}>
          {hasil?.data.map((c) => (
            <BarisTabel key={c.id}>
              <SelTabel>{formatWaktu(c.waktu)}</SelTabel>
              <SelTabel>{c.pengguna_nama ?? AUDIT.tanpaPengguna}</SelTabel>
              <SelTabel>{AUDIT.aksi[c.aksi] ?? c.aksi}</SelTabel>
              <SelTabel>{c.entitas_id === null ? c.entitas : `${c.entitas} #${c.entitas_id}`}</SelTabel>
              <SelTabel>{c.keterangan}</SelTabel>
              <SelTabel style={{ textAlign: 'right' }}>
                <Tombol varian="teks" onClick={() => setDetail(c)}>{AUDIT.rincian}</Tombol>
              </SelTabel>
            </BarisTabel>
          ))}
        </Tabel>
        {hasil && hasil.data.length === 0 && <div style={{ padding: token.jarak.md, color: token.warna.teksRedup }}>{AUDIT.kosong}</div>}
        {hasil && <Paginasi halaman={keadaan.halaman} total={hasil.total} ukuran={hasil.ukuran} onPindah={(h) => pasang({ ...keadaan, halaman: h })} />}
      </Kartu>
      {detail && (
        <PanelDetail
          judul={AUDIT.judulDetail}
          onTutup={() => setDetail(null)}
          bagian={[{
            baris: [
              { label: AUDIT.detail.id, nilai: detail.id },
              { label: AUDIT.detail.waktu, nilai: formatWaktu(detail.waktu) },
              { label: AUDIT.detail.pengguna, nilai: detail.pengguna_nama ?? AUDIT.tanpaPengguna },
              { label: AUDIT.detail.aksi, nilai: AUDIT.aksi[detail.aksi] ?? detail.aksi },
              { label: AUDIT.detail.entitas, nilai: detail.entitas },
              { label: AUDIT.detail.entitasId, nilai: detail.entitas_id ?? '-' },
              { label: AUDIT.detail.keterangan, nilai: detail.keterangan ?? '-' },
              { label: AUDIT.detail.alamat, nilai: detail.alamat ?? '-' },
            ],
          }]}
        />
      )}
    </section>
  );
}
