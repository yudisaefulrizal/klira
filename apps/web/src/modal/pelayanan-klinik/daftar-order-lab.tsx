import { INTERPRETASI_HASIL, PENUNJANG, PRIORITAS_ORDER, STATUS_ORDER_PENUNJANG, STATUS_PENGESAHAN } from '@klira/shared';
import type { OrderPenunjangDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { TampilanAddendum } from '../../komponen/addendum/tampilan-addendum';
import { Bingkai } from '../../komponen/ui/kartu';
import { Lencana } from '../../komponen/ui/lencana';
import { Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan';
import { tanggalWaktuPendek } from '../../util/format';

const redup = { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil } as const;

/**
 * Order lab satu kunjungan beserta status, spesimen, hasil (bila sudah divalidasi atau menunggu validasi), pengesahan, dan addendum.
 * Dokter melihat hasil yang sudah divalidasi di sini selama pemeriksaan (7); hasil susulan tampil sebagai addendum.
 */
export function DaftarOrderLab({ orders }: { orders: readonly OrderPenunjangDto[] }) {
  const D = PENUNJANG.daftar;
  return (
    <Kolom jarak="sm">
      {orders.map((o) => (
        <Bingkai key={o.id} arah="kolom" padding="md">
          <Sebaris bungkus>
            <strong>{o.nama}</strong>
            {o.kode_loinc && <span style={redup}>{`${D.kodeLoinc} ${o.kode_loinc}`}</span>}
            <Tumbuh />
            <Lencana warna={PRIORITAS_ORDER.warna(o.prioritas)}>{PRIORITAS_ORDER.label(o.prioritas)}</Lencana>
            <Lencana warna={STATUS_ORDER_PENUNJANG.warna(o.status)}>{STATUS_ORDER_PENUNJANG.label(o.status)}</Lencana>
          </Sebaris>
          <span style={redup}>{`${PENUNJANG.order.dipesanOleh(o.dibuat_oleh_nama ?? '-')} · ${tanggalWaktuPendek(o.dibuat_pada)}`}</span>
          {o.catatan && <span>{`${D.catatan}: ${o.catatan}`}</span>}
          {o.spesimen && <span style={redup}>{`${D.spesimen}: ${D.spesimenInfo(o.spesimen.asal, o.spesimen.petugas_nama)}, ${tanggalWaktuPendek(o.spesimen.waktu_ambil)}`}</span>}
          {o.hasil && (
            <Kolom jarak="xs">
              <Sebaris bungkus>
                <strong>{`${o.hasil.nilai}${o.hasil.satuan ? ` ${o.hasil.satuan}` : ''}`}</strong>
                <Lencana warna={INTERPRETASI_HASIL.warna(o.hasil.interpretasi)}>{INTERPRETASI_HASIL.label(o.hasil.interpretasi)}</Lencana>
                {o.status !== 'divalidasi' && <Lencana warna="kuning">{D.menungguValidasi}</Lencana>}
              </Sebaris>
              {o.hasil.rujukan_teks && <span style={redup}>{`${D.rujukan}: ${o.hasil.rujukan_teks}`}</span>}
              {o.hasil.catatan && <span>{`${D.catatan}: ${o.hasil.catatan}`}</span>}
              {o.hasil.validator_nama && (
                <Sebaris bungkus style={redup}>
                  <span>{`${D.validator} ${o.hasil.validator_nama}`}</span>
                  <Lencana warna={STATUS_PENGESAHAN.warna(o.verifikasi)}>{STATUS_PENGESAHAN.label(o.verifikasi)}</Lencana>
                </Sebaris>
              )}
            </Kolom>
          )}
          <TampilanAddendum daftar={o.addendum} />
        </Bingkai>
      ))}
    </Kolom>
  );
}
