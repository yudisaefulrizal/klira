import { KoneksiInstagram } from './koneksi';
import { AvatarInstagram } from './avatar';
import { IkonInstagram } from './ikon';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { punyaIzin, type PesanWaDto } from '@klira/shared';
import { bacaWa, kirimWa, pesanWa, ubahWa } from '../../api-klien/instagram';
import { token } from '../../gaya/token';
import { usePengguna } from '../../util/konteks-pengguna';
import { useNavigasi } from '../../util/navigasi';
import { InfoKontakPesan } from './info-kontak';
import { Fragment } from 'react';
import { IkonPesan } from '../pesan/ikon';
import { Isian } from '../ui/isian';
import { Tombol } from '../ui/tombol';
import { Sebaris } from '../ui/susunan';
import { Peringatan } from '../ui/peringatan';
import { Lencana } from '../ui/lencana';
import { usePesan } from './konteks-pesan';
import '../pesan/pesan.css';
const namaKontak = (kontak?: { nama: string; jid: string }) =>
  kontak?.nama && kontak.nama !== kontak.jid ? kontak.nama : 'Pengguna Instagram';
const variabel = {
  '--wa-lebar': token.ukuran.lebarChat,
  '--wa-jarak': token.jarak.md,
  '--wa-sm': token.jarak.sm,
  '--wa-xs': token.jarak.xs,
  '--wa-font-kecil': token.huruf.ukuran.kecil,
  '--wa-font-dasar': token.huruf.ukuran.dasar,
  '--wa-huruf': token.huruf.keluarga,
  '--wa-avatar': token.ukuran.tombol,
  '--wa-media': token.ukuran.tinggiMediaPesan,
  '--wa-balasan-max': token.ukuran.tinggiBalasanPesan,
  '--wa-lapis': token.lapis.pesan,
  '--wa-tepi': token.jarak.lg,
  '--wa-celah': token.jarak.sm,
  '--wa-tombol': token.ukuran.tombolPesan,
  '--wa-jendela': token.ukuran.tinggiJendelaPesan,
  '--wa-radius': token.radius.besar,
  '--wa-garis': token.ukuran.garis,
  '--wa-tinggi': token.ukuran.tinggiPesan,
  '--wa-daftar': token.ukuran.daftarPesan,
  '--wa-info': token.ukuran.infoKontakPesan,
  '--wa-media-penuh': token.ukuran.tinggiMediaPesanPenuh,
  '--wa-media-lebar': token.ukuran.lebarMediaPesanPenuh,
} as CSSProperties;
const waktu = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
export function TombolPesan() {
  const p = usePesan();
  const { pengguna } = usePengguna();
  const { path } = useNavigasi();
  if (path === '/pesan' || !pengguna || !punyaIzin(pengguna, 'instagram', 'lihat')) return null;
  return (
    <div className="wa-peluncur" data-terbuka={p.terbuka} style={{ ...variabel, bottom: `calc(max(${token.jarak.lg}, env(safe-area-inset-bottom)) + ${token.ukuran.tombolPesan} + ${token.jarak.sm})` }}>
      <span className="wa-notifikasi" role="status" aria-live="polite">
        {p.pemberitahuan ? 'Pesan Instagram baru masuk' : ''}
      </span>
      <Tombol
        varian="utama"
        title={p.terbuka ? 'Minimalkan pesan' : 'Buka pesan Instagram'}
        style={{
          width: token.ukuran.tombolPesan,
          height: token.ukuran.tombolPesan,
          padding: 0,
          borderRadius: token.radius.pil,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: token.bayangan.modal,
        }}
        aria-controls="ig-jendela"
        aria-label={`Pesan Instagram, ${p.belum} percakapan belum dibaca`}
        aria-expanded={p.terbuka}
        onClick={() => p.setTerbuka(!p.terbuka)}
      >
        <IkonInstagram />
        {p.belum > 0 && (
          <span className="wa-badge">
            <Lencana warna="hijau">{p.belum > 99 ? '99+' : p.belum}</Lencana>
          </span>
        )}
      </Tombol>
    </div>
  );
}
function DaftarPercakapan() {
  const p = usePesan();
  const [cari, setCari] = useState('');
  const [filter, setFilter] = useState('semua');
  const tersaring = p.daftar.filter(
    (v) =>
      `${v.nama} ${v.jid}`.toLowerCase().includes(cari.toLowerCase()) &&
      (filter !== 'belum' || v.belum_dibaca > 0) &&
      (filter !== 'dibaca' || v.belum_dibaca === 0),
  );
  const hitung = {
    semua: p.daftar.length,
    belum: p.daftar.filter((v) => v.belum_dibaca > 0).length,
    dibaca: p.daftar.filter((v) => v.belum_dibaca === 0).length,
  };
  const preview = (teks: string) =>
    ({ '[image]': 'Gambar', '[video]': 'Video', '[audio]': 'Pesan suara', '[document]': 'Dokumen' })[teks] ?? teks;
  const waktuBaris = (tanggal: string) =>
    new Date(tanggal).toLocaleDateString('id-ID') === new Date().toLocaleDateString('id-ID')
      ? new Date(tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  return (
    <section className="wa-daftar" aria-label="Daftar percakapan">
      <div className="wa-daftar-cari">
        <IkonPesan nama="cari" />
        <input
          id="ig-cari"
          aria-label="Cari percakapan"
          placeholder="Cari nama atau akun"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
      </div>
      <div className="wa-filter-baris">
        {(
          [
            ['semua', 'Semua'],
            ['belum', 'Belum dibaca'],
            ['dibaca', 'Dibaca'],
          ] as const
        ).map(([id, label]) => (
          <Tombol
            key={id}
            varian="teks"
            className="wa-filter"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
            <span>{hitung[id]}</span>
          </Tombol>
        ))}
      </div>
      {p.galat && <Peringatan nada="merah">{p.galat}</Peringatan>}
      <div className="wa-daftar-scroll">
        {tersaring.map((v) => (
          <Tombol
            key={v.id}
            varian="langkah"
            className="wa-kontak-baris"
            terpilih={p.aktif === v.id}
            aria-pressed={p.aktif === v.id}
            onClick={() => {
              p.batalPasien();
              p.pilih(v.id);
            }}
          >
            <AvatarInstagram id={v.id} nama={namaKontak(v)} foto={v.foto_profil} />
            <span className="wa-baris-ringkas">
              <span className="wa-baris-atas">
                <strong>{namaKontak(v)}</strong>
                <time dateTime={v.diperbarui_pada}>{waktuBaris(v.diperbarui_pada)}</time>
              </span>
              <span className="wa-baris-bawah">
                <span>{preview(v.terakhir) || 'Percakapan Instagram'}</span>
                {v.belum_dibaca > 0 && <Lencana warna="hijau">{v.belum_dibaca}</Lencana>}
              </span>
            </span>
          </Tombol>
        ))}
        {p.adaLagi && (
          <Tombol varian="teks" onClick={p.muatLagi}>
            Muat percakapan lainnya
          </Tombol>
        )}
        {!tersaring.length && !p.galat && (
          <div className="wa-daftar-kosong">
            <IkonPesan nama="chat" />
            <p>{p.daftar.length ? 'Tidak ada percakapan yang cocok.' : 'Belum ada percakapan pribadi.'}</p>
            <small>
              {p.daftar.length
                ? 'Coba kata pencarian atau filter lain.'
                : 'Hubungkan Instagram untuk mulai menerima pesan.'}
            </small>
          </div>
        )}
      </div>
    </section>
  );
}

function Percakapan({
  id,
  lengkap = false,
  onInfo,
  infoTerbuka = false,
}: {
  id: number;
  lengkap?: boolean;
  onInfo?: () => void;
  infoTerbuka?: boolean;
}) {
  const p = usePesan();
  const { pengguna } = usePengguna();
  const [pesan, setPesan] = useState<PesanWaDto[]>([]);
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [pencarian, setPencarian] = useState(false);
  const [cariPesan, setCariPesan] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const riwayat = useRef<HTMLDivElement>(null);
  const diBawah = useRef(true);
  const balasan = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sudahBaca = useRef(0);
  const row = p.daftar.find((v) => v.id === id);
  const teks = p.draf[id] ?? '';
  const bolehKirim = !!pengguna && punyaIzin(pengguna, 'instagram', 'lihat');
  const bolehUbah = !!pengguna && punyaIzin(pengguna, 'instagram', 'lihat');
  useEffect(() => {
    let hidup = true;
    let berjalan = false;

    const muat = async () => {
      if (berjalan || document.hidden) return;
      berjalan = true;
      try {
        const rows = await pesanWa(id);
        if (!hidup) return;
        setPesan(rows);
        setGalat('');
        const terakhir = rows.at(-1)?.id;
        if (terakhir && terakhir > sudahBaca.current) {
          await bacaWa(id, terakhir);
          sudahBaca.current = terakhir;
        }
      } catch (e) {
        if (hidup) setGalat(e instanceof Error ? e.message : 'Gagal memuat pesan');
      } finally {
        berjalan = false;
      }
    };
    void muat();
    return () => {
      hidup = false;
    };
  }, [id, p.revisi]);
  const terbaru = pesan.at(-1)?.id;
  useEffect(() => {
    if (riwayat.current && diBawah.current) riwayat.current.scrollTop = riwayat.current.scrollHeight;
  }, [terbaru]);
  useEffect(() => {
    if (balasan.current) {
      balasan.current.style.height = 'auto';
      balasan.current.style.height = `${balasan.current.scrollHeight}px`;
    }
  }, [teks]);
  async function kirim() {
    if (!teks.trim() && !file) return;
    if (sibuk) return;
    setSibuk(true);
    setGalat('');
    try {
      let media: { base64: string; mime: string; nama: string } | undefined;
      if (file) {
        if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran lampiran maksimal 8 MB');
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result).split(',')[1]);
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        media = { base64, mime: file.type, nama: file.name };
      }
      await kirimWa(id, file ? '' : teks, media);
      diBawah.current = true;
      if (!file) p.tulis(id, '');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      const rows = await pesanWa(id);
      setPesan(rows);
      await p.muat();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengirim pesan');
    } finally {
      setSibuk(false);
    }
  }
  const ubah = (data: { penanggung_jawab?: number | null }) => {
    void ubahWa(id, data)
      .then(p.muat)
      .catch((e) => setGalat(e.message));
  };
  const jam = (tanggal: string) =>
    new Date(tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const hari = (tanggal: string) => new Date(tanggal).toLocaleDateString('id-ID');
  const labelTanggal = (tanggal: string) =>
    hari(tanggal) === hari(new Date().toISOString())
      ? 'Hari ini'
      : new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const pesanTampil = pesan.filter((v) => !cariPesan || v.teks.toLowerCase().includes(cariPesan.toLowerCase()));
  return (
    <div className="wa-chat">
      <header className="wa-kontak">
        <Tombol
          varian="teks"
          className="wa-ikon"
          aria-label="Kembali ke daftar percakapan"
          onClick={() => p.pilih(null)}
        >
          <IkonPesan nama="kembali" />
        </Tombol>
        <AvatarInstagram id={id} nama={namaKontak(row)} foto={row?.foto_profil} />
        <div className="wa-identitas">
          <strong>{namaKontak(row)}</strong>
          <small>
            {lengkap
              ? 'Percakapan pribadi'
              : row?.pasien_id ? 'Kontak pasien' : 'Kontak Instagram'}
          </small>
        </div>
        {bolehUbah && !lengkap && (
          <div className="wa-kelola">
            {!lengkap && (
              <Tombol
                varian="teks"
                className="wa-tugas"
                title={
                  row?.penanggung_jawab === pengguna?.id
                    ? 'Lepaskan tugas saya'
                    : row?.penanggung_jawab
                      ? 'Ambil alih percakapan'
                      : 'Tangani percakapan'
                }
                onClick={() => ubah({ penanggung_jawab: row?.penanggung_jawab === pengguna?.id ? null : pengguna?.id })}
              >
                {row?.penanggung_jawab === pengguna?.id
                  ? 'Ditangani Anda'
                  : row?.penanggung_jawab
                    ? `Petugas #${row.penanggung_jawab}`
                    : 'Tangani'}
              </Tombol>
            )}
          </div>
        )}
        {lengkap && (
          <>
            <Tombol
              varian="teks"
              className="wa-ikon"
              aria-label="Cari dalam percakapan"
              title="Cari dalam 10 pesan terakhir"
              aria-expanded={pencarian}
              onClick={() => {
                setPencarian((v) => !v);
                setCariPesan('');
              }}
            >
              <IkonPesan nama="cari" />
            </Tombol>
            <Tombol
              varian="teks"
              className="wa-ikon"
              aria-label="Tampilkan info kontak"
              title="Info kontak"
              aria-expanded={infoTerbuka}
              onClick={onInfo}
            >
              <IkonPesan nama="info" />
            </Tombol>
          </>
        )}
      </header>
      {pencarian && (
        <div className="wa-cari-pesan">
          <Isian
            id="ig-cari-dalam"
            label="Cari dalam 10 pesan terakhir"
            value={cariPesan}
            onChange={(e) => setCariPesan(e.target.value)}
            autoFocus
          />
          <Tombol
            varian="teks"
            className="wa-ikon"
            aria-label="Tutup pencarian pesan"
            onClick={() => {
              setPencarian(false);
              setCariPesan('');
            }}
          >
            <IkonPesan nama="tutup" />
          </Tombol>
        </div>
      )}
      {galat && <Peringatan nada="merah">{galat}</Peringatan>}
      <div
        ref={riwayat}
        className="wa-riwayat"
        role="log"
        aria-label="Riwayat pesan"
        onScroll={(e) => {
          const v = e.currentTarget;
          diBawah.current = v.scrollHeight - v.scrollTop - v.clientHeight < 80;
        }}
      >
        {!pesan.length && !galat && (
          <div className="wa-kosong">Mulai percakapan pribadi dengan {namaKontak(row)}.</div>
        )}
        {pencarian && cariPesan && !pesanTampil.length && <p className="wa-kosong">Tidak ada pesan yang cocok.</p>}
        {pesanTampil.map((v, index) => (
          <Fragment key={v.id}>
            {(index === 0 || hari(pesanTampil[index - 1].dibuat_pada) !== hari(v.dibuat_pada)) && (
              <span className="wa-tanggal">{labelTanggal(v.dibuat_pada)}</span>
            )}
            <article className={`wa-gelembung ${v.arah === 'keluar' ? 'wa-keluar' : 'wa-masuk'}`}>
              {v.media_id && (
                <PratinjauPesan
                  pesan={v}
                  onMuat={() => {
                    if (riwayat.current && diBawah.current) riwayat.current.scrollTop = riwayat.current.scrollHeight;
                  }}
                />
              )}
              {v.teks && <div className="wa-teks">{v.teks}</div>}
              <footer className="wa-waktu">
                <time dateTime={v.dibuat_pada} title={waktu(v.dibuat_pada)}>
                  {jam(v.dibuat_pada)}
                </time>
                {v.arah === 'keluar' && (
                  <span className={v.status === 'dibaca' ? 'wa-dibaca' : ''} aria-label={v.status} title={v.status}>
                    {['terkirim', 'diterima', 'dibaca'].includes(v.status) ? (
                      <IkonPesan nama={v.status === 'terkirim' ? 'centang' : 'ganda'} />
                    ) : v.status === 'antre' || v.status === 'mengirim' ? (
                      '◷'
                    ) : (
                      v.status
                    )}
                  </span>
                )}
              </footer>
              {v.status === 'gagal' && <small>Belum terkonfirmasi. Periksa Instagram sebelum mengirim ulang.</small>}
            </article>
          </Fragment>
        ))}
      </div>
      <small className="wa-batas">10 pesan terakhir · Riwayat lengkap di Instagram</small>
      {bolehKirim && (
        <form
          className="wa-komposer"
          onSubmit={(e) => {
            e.preventDefault();
            void kirim();
          }}
        >
          {file && (
            <div className="wa-file-pilih">
              <IkonPesan nama="berkas" />
              <span>{file.name} · Gambar dikirim tanpa caption</span>
              <Tombol
                type="button"
                className="wa-ikon"
                varian="teks"
                aria-label="Hapus lampiran"
                onClick={() => {
                  setFile(null);
                  if (fileInput.current) fileInput.current.value = '';
                }}
              >
                <IkonPesan nama="tutup" />
              </Tombol>
            </div>
          )}
          <div className="wa-baris-balasan">
            <input
              hidden
              ref={fileInput}
              type="file"
              aria-label="Lampiran maksimal 8 MB"
              accept="image/jpeg,image/png"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > 8 * 1024 * 1024) {
                  setGalat('Ukuran lampiran maksimal 8 MB');
                  e.target.value = '';
                  return;
                }
                setGalat('');
                setFile(f);
              }}
            />
            <Tombol
              type="button"
              varian="sekunder"
              className="wa-ikon wa-bulat"
              aria-label="Pilih lampiran"
              title="Pilih lampiran (maksimal 8 MB)"
              onClick={() => fileInput.current?.click()}
            >
              <IkonPesan nama="lampiran" />
            </Tombol>
            <textarea
              ref={balasan}
              id="ig-balasan"
              aria-label="Balasan"
              rows={1}
              value={teks}
              maxLength={10000}
              placeholder="Tulis pesan…"
              onChange={(e) => p.tulis(id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void kirim();
                }
              }}
            />
            <Tombol
              type="submit"
              className="wa-ikon wa-bulat"
              aria-label={sibuk ? 'Mengantrekan pesan' : 'Kirim pesan'}
              title="Kirim pesan"
              disabled={sibuk || (!teks.trim() && !file)}
            >
              <IkonPesan nama="kirim" />
            </Tombol>
          </div>
          <small className="wa-petunjuk">Enter untuk kirim · Shift+Enter untuk baris baru</small>
        </form>
      )}
    </div>
  );
}
function PratinjauPesan({ pesan, onMuat }: { pesan: PesanWaDto; onMuat: () => void }) {
  const [gagal, setGagal] = useState(false);
  const url = `/api/instagram/media/${pesan.media_id}`;
  const preview = `${url}?pratinjau=1`;
  if (!gagal && pesan.jenis === 'image')
    return (
      <a className="wa-media" href={preview} target="_blank" rel="noreferrer" aria-label="Buka gambar">
        <img
          src={preview}
          alt="Gambar dalam percakapan"
          loading="lazy"
          onLoad={onMuat}
          onError={() => setGagal(true)}
        />
      </a>
    );
  if (!gagal && pesan.jenis === 'video')
    return (
      <video
        className="wa-media"
        src={preview}
        controls
        preload="metadata"
        onLoadedMetadata={onMuat}
        aria-label="Video dalam percakapan"
        onError={() => setGagal(true)}
      />
    );
  if (!gagal && pesan.jenis === 'audio')
    return (
      <audio
        className="wa-audio"
        src={preview}
        controls
        preload="metadata"
        aria-label="Pesan audio"
        onError={() => setGagal(true)}
      />
    );
  return (
    <a className="wa-file" href={url} target="_blank" rel="noreferrer">
      <IkonPesan nama="berkas" />
      <span>{gagal ? 'Pratinjau tidak tersedia · Unduh lampiran' : 'Unduh dokumen'}</span>
    </a>
  );
}

function RuangPesan() {
  const p = usePesan();
  const [layarLebar, setLayarLebar] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const [infoMode, setInfoMode] = useState<boolean | 'auto'>('auto');
  const infoTerbuka = infoMode === 'auto' ? layarLebar : infoMode;
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)');
    const ubah = () => setLayarLebar(media.matches);
    media.addEventListener('change', ubah);
    return () => media.removeEventListener('change', ubah);
  }, []);
  const kontak = p.daftar.find((v) => v.id === p.aktif);
  return (
    <div
      className="wa-penuh"
      data-aktif={p.aktif !== null}
      data-info={!!kontak && infoTerbuka}
      style={variabel}
    >
      <DaftarPercakapan />
      <div className="wa-chat-utama">
        {p.aktif ? (
          <Percakapan
            key={p.aktif}
            id={p.aktif}
            lengkap
            onInfo={() => setInfoMode(!infoTerbuka)}
            infoTerbuka={infoTerbuka}
          />
        ) : (
          <div className="wa-pilih-chat">
            <span className="wa-avatar wa-avatar-besar">
              <IkonPesan nama="chat" />
            </span>
            <h2>Percakapan yang lebih teratur</h2>
            <p>Pilih kontak di sebelah kiri untuk membaca dan membalas pesan.</p>
            <small>Hanya pesan pribadi · 10 pesan terakhir per kontak</small>
          </div>
        )}
      </div>
      {kontak && infoTerbuka && <InfoKontakPesan key={kontak.id} kontak={kontak} onTutup={() => setInfoMode(false)} />}
    </div>
  );
}
export function IsiPesan({ penuh = false }: { penuh?: boolean }) {
  return <>
    <div className="wa-koneksi"><KoneksiInstagram /></div>
    <PercakapanPanel penuh={penuh} />
  </>;
}

function PercakapanPanel({ penuh = false }: { penuh?: boolean }) {
  const p = usePesan();
  if (penuh) return <RuangPesan />;
  return p.aktif ? <Percakapan key={p.aktif} id={p.aktif} /> : <DaftarPercakapan />;
}

export function PanelPesan() {
  const p = usePesan();
  const { path, pindah } = useNavigasi();
  const { pengguna } = usePengguna();
  const panel = useRef<HTMLElement>(null);
  const tampil = p.terbuka && path !== '/pesan' && !!pengguna && punyaIzin(pengguna, 'instagram', 'lihat');
  useEffect(() => {
    if (!tampil) return;
    const sebelumnya = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) {
        p.setTerbuka(false);
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      sebelumnya?.focus();
    };
  }, [tampil, p.setTerbuka]);
  if (!tampil) return null;
  return (
    <aside
      id="ig-jendela"
      ref={panel}
      tabIndex={-1}
      className="wa-panel"
      aria-label="Panel pesan Instagram"
      style={variabel}
    >
      <Sebaris padding="sm" garis="bawah" className="wa-kepala">
        <IkonPesan nama="chat" />
        <strong>Instagram</strong>
        <span
          className="wa-sambungan"
          title={p.sambungan === 'terhubung' ? 'Pembaruan pesan terhubung' : 'Menyambungkan pembaruan pesan'}
          data-terhubung={p.sambungan === 'terhubung'}
          aria-label={
            p.sambungan === 'terhubung' ? 'Pembaruan pesan terhubung' : 'Pembaruan pesan sedang tersambung ulang'
          }
        />
        <Tombol
          varian="teks"
          className="wa-ikon"
          aria-label="Perluas pesan"
          title="Perluas pesan"
          onClick={() => {
            p.setTerbuka(false);
            pindah('/pesan?kanal=instagram');
          }}
        >
          <IkonPesan nama="perluas" />
        </Tombol>
        <Tombol
          varian="teks"
          className="wa-ikon"
          aria-label="Minimalkan pesan"
          title="Minimalkan pesan"
          onClick={() => p.setTerbuka(false)}
        >
          <IkonPesan nama="minimalkan" />
        </Tombol>
      </Sebaris>
      <IsiPesan />
    </aside>
  );
}
