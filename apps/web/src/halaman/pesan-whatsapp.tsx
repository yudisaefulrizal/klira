import { useEffect, useState } from 'react';
import type { KoneksiWaDto } from '@klira/shared';
import { koneksiWa } from '../api-klien/whatsapp';
import { IsiPesan } from '../komponen/pesan/pesan';
import { usePesan } from '../komponen/pesan/konteks-pesan';
export function HalamanPesanWhatsapp() {
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
          <h1>Pesan</h1>
          <p>Respons cepat untuk percakapan pribadi</p>
        </div>
        <span className="wa-status-koneksi" data-aktif={aktif} role="status">
          <i aria-hidden="true" />
          {aktif
            ? 'WhatsApp terhubung'
            : koneksi?.status === 'qr'
              ? 'Menunggu pemindaian QR'
              : koneksi?.status === 'menghubungkan'
                ? 'Menghubungkan WhatsApp'
                : 'WhatsApp belum terhubung'}
        </span>
      </header>
      <IsiPesan penuh />
    </section>
  );
}
