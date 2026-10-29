import { token } from '../../gaya/token';

export type ItemTab<T extends string> = { id: T; label: string };

/** Tab bersama untuk semua halaman bertab (3.1, 5.1h); pemilih tab dikendalikan pemanggil. */
export function Tab<T extends string>({ daftar, aktif, onPilih, label }: { daftar: readonly ItemTab<T>[]; aktif: T; onPilih: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: token.jarak.sm }}>
      {daftar.map((t) => {
        const on = t.id === aktif;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={on}
            aria-controls={`panel-${t.id}`}
            onClick={() => onPilih(t.id)}
            style={{
              height: token.ukuran.tab, padding: `0 ${token.jarak.md}`, borderRadius: token.radius.pil, cursor: 'pointer',
              border: `${token.ukuran.garis} solid ${on ? token.warna.utama : token.warna.garisIsian}`,
              background: on ? token.warna.utama : token.warna.permukaan,
              color: on ? token.warna.diAtasUtama : token.warna.teks,
              fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar,
              fontWeight: on ? token.huruf.berat.tebal : token.huruf.berat.biasa,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
