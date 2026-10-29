import { useEffect, useState } from 'react';
import type { KoneksiWaDto } from '@klira/shared';
import { koneksiWa } from '../api-klien/instagram';
import { IsiPesan } from '../komponen/instagram/pesan';
import { usePesan } from '../komponen/instagram/konteks-pesan';
export function HalamanPesanInstagram() {
  const { revisi } = usePesan();
  const [koneksi, setKoneksi] = useState<KoneksiWaDto | null>(null);
  useEffect(() => {
    let hidup = true;
    void koneksiWa()
      .then((v) => {
        if (hidup) setKoneksi(v);
      })
      .catch(() => {
        if (hidup) setKoneksi(null);
      });
    return () => {
      hidup = false;
    };
  }, [revisi]);
  const aktif = koneksi?.status === 'terhubung' && koneksi.tersedia;
  return (
    <section className="wa-halaman">
      <header className="wa-halaman-kepala">
        <div>
          <h1>Pesan Instagram</h1>
          <p>Respons cepat untuk percakapan pribadi</p>
        </div>
        <span className="wa-status-koneksi" data-aktif={aktif} role="status">
          <i aria-hidden="true" />
          {aktif
            ? 'Instagram terhubung'
            : koneksi?.status === 'qr'
              ? 'Menunggu pemindaian QR'
              : koneksi?.status === 'menghubungkan'
                ? 'Menghubungkan Instagram'
                : 'Instagram belum terhubung'}
        </span>
      </header>
      <IsiPesan penuh />
    </section>
  );
}
