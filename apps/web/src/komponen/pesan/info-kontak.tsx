import { useEffect, useRef, useState } from 'react';
import { punyaIzin, type InfoKontakWaDto, type PasienBarisDto, type PercakapanWaDto } from '@klira/shared';
import { daftarPasien } from '../../api-klien/pasien';
import { infoKontakWa, ubahWa } from '../../api-klien/whatsapp';
import { usePengguna } from '../../util/konteks-pengguna';
import { Tombol } from '../ui/tombol';
import { Isian } from '../ui/isian';
import { Peringatan } from '../ui/peringatan';
import { usePesan } from './konteks-pesan';
import { IkonPesan } from './ikon';
export function InfoKontakPesan({ kontak, onTutup }: { kontak: PercakapanWaDto; onTutup: () => void }) {
  const { pengguna } = usePengguna();
  const p = usePesan();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia('(min-width: 1280px)').matches) return;
    const lama = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => {
      lama?.focus();
    };
  }, []);
  const [info, setInfo] = useState<InfoKontakWaDto | null>(null);
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [menautkan, setMenautkan] = useState(false);
  const [cari, setCari] = useState('');
  const [hasil, setHasil] = useState<PasienBarisDto[]>([]);
  const [pilihan, setPilihan] = useState<PasienBarisDto | null>(null);
  const [mencari, setMencari] = useState(false);
  const bolehPasien = !!pengguna && punyaIzin(pengguna, 'pasien', 'lihat');
  useEffect(() => {
    let hidup = true;
    void infoKontakWa(kontak.id)
      .then((v) => {
        if (hidup) {
          setInfo(v);
          setGalat('');
        }
      })
      .catch((e) => {
        if (hidup) setGalat(e.message);
      });
    return () => {
      hidup = false;
    };
  }, [kontak.id, kontak.pasien_id, kontak.penanggung_jawab]);
  useEffect(() => {
    let hidup = true;
    setHasil([]);
    if (!menautkan || cari.trim().length < 2) {
      setMencari(false);
      return;
    }
    setMencari(true);
    const timer = setTimeout(() => {
      void daftarPasien({ cari: cari.trim(), tahap: 'semua', halaman: 1, ukuran: 5 })
        .then((v) => {
          if (hidup) {
            setHasil(v.data);
            setGalat('');
          }
        })
        .catch((e) => {
          if (hidup) setGalat(e.message);
        })
        .finally(() => {
          if (hidup) setMencari(false);
        });
    }, 300);
    return () => {
      hidup = false;
      clearTimeout(timer);
    };
  }, [cari, menautkan]);
  async function ubah(data: { penanggung_jawab?: number | null; pasien_id?: number }) {
    if (sibuk) return;
    setSibuk(true);
    setGalat('');
    try {
      await ubahWa(kontak.id, data);
      await p.muat();
      setInfo(await infoKontakWa(kontak.id));
      if (data.pasien_id) {
        setMenautkan(false);
        setPilihan(null);
        setCari('');
      }
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengubah kontak');
    } finally {
      setSibuk(false);
    }
  }
  const inisial = kontak.nama
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0])
    .join('')
    .toUpperCase();
  const nomor = kontak.jid.endsWith('@s.whatsapp.net') ? `+${kontak.jid.split('@')[0]}` : 'Nomor belum tersedia';
  return (
    <aside
      ref={panel}
      tabIndex={-1}
      className="wa-info"
      aria-label="Info kontak"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onTutup();
        }
      }}
    >
      <header className="wa-info-kepala">
        <h2>Info kontak</h2>
        <Tombol className="wa-ikon" varian="teks" aria-label="Tutup info kontak" onClick={onTutup}>
          <IkonPesan nama="tutup" />
        </Tombol>
      </header>
      <div className="wa-info-profil">
        <span className="wa-avatar wa-avatar-besar" data-warna={kontak.id % 4} aria-hidden="true">
          {inisial}
        </span>
        <strong>{kontak.nama}</strong>
        <small>Kontak WhatsApp</small>
        <span>{nomor}</span>
      </div>
      {galat && <Peringatan nada="merah">{galat}</Peringatan>}
      <section className="wa-info-bagian">
        <h3>Penanganan</h3>
        <div className="wa-info-status">
          <span>Ditangani oleh</span>
          <strong>
            {kontak.penanggung_jawab === pengguna?.id ? 'Anda' : (info?.penanggung?.nama ?? 'Belum ditugaskan')}
          </strong>
        </div>
        <Tombol
          varian="teks"
          disabled={sibuk}
          onClick={() =>
            void ubah({ penanggung_jawab: kontak.penanggung_jawab === pengguna?.id ? null : pengguna?.id })
          }
        >
          {kontak.penanggung_jawab === pengguna?.id
            ? 'Lepaskan tugas saya'
            : kontak.penanggung_jawab
              ? 'Ambil alih percakapan'
              : 'Tangani percakapan'}
        </Tombol>
      </section>
      <section className="wa-info-bagian">
        <h3>Tautan pasien</h3>
        {info?.pasien ? (
          <>
            <strong>{info.pasien.nama}</strong>
            <small>No. RM {info.pasien.nomor_rm}</small>
          </>
        ) : (
          <p>{kontak.pasien_id ? 'Kontak sudah ditautkan ke pasien.' : 'Belum ditautkan ke pasien.'}</p>
        )}
        {!kontak.pasien_id && bolehPasien && !menautkan && (
          <Tombol varian="sekunder" onClick={() => setMenautkan(true)}>
            <IkonPesan nama="tautan" />
            Tautkan pasien
          </Tombol>
        )}
        {menautkan && (
          <form
            className="wa-taut-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (pilihan) void ubah({ pasien_id: pilihan.id });
            }}
          >
            <Isian
              id="wa-cari-pasien"
              label="Cari nama atau nomor RM"
              value={cari}
              onChange={(e) => {
                setCari(e.target.value);
                setPilihan(null);
              }}
              placeholder="Ketik minimal 2 karakter"
            />
            <div aria-live="polite">
              {mencari ? 'Mencari pasien…' : cari.trim().length >= 2 && !hasil.length ? 'Pasien tidak ditemukan.' : ''}
            </div>
            {hasil.map((v) => (
              <Tombol
                type="button"
                key={v.id}
                varian="langkah"
                terpilih={pilihan?.id === v.id}
                aria-pressed={pilihan?.id === v.id}
                onClick={() => setPilihan(v)}
              >
                {v.nama} · {v.nomor_rm}
              </Tombol>
            ))}
            {pilihan && (
              <small>
                Tautkan kontak ini ke {pilihan.nama} ({pilihan.nomor_rm})?
              </small>
            )}
            <Tombol type="submit" disabled={!pilihan || sibuk}>
              Tautkan pasien terpilih
            </Tombol>
            <Tombol
              type="button"
              varian="teks"
              onClick={() => {
                setMenautkan(false);
                setPilihan(null);
                setCari('');
              }}
            >
              Batal
            </Tombol>
          </form>
        )}
      </section>
      <div className="wa-pribadi">
        <IkonPesan nama="info" />
        <div>
          <strong>Khusus pesan pribadi</strong>
          <p>Grup, status, dan channel tidak ditampilkan.</p>
        </div>
      </div>
    </aside>
  );
}
