import { panggilApi } from './klien.js';

const qs = (p = {}) => {
    const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined && v !== '')).toString();
    return s ? `?${s}` : '';
};

export const ringkasanKeuangan = (p) => panggilApi('GET', `/keuangan/ringkasan${qs(p)}`);
export const daftarCoa = () => panggilApi('GET', '/keuangan/coa');
export const tambahCoa = (d) => panggilApi('POST', '/keuangan/coa', d);
export const daftarJurnal = (p) => panggilApi('GET', `/keuangan/jurnal${qs(p)}`);
export const catatJurnalManual = (d) => panggilApi('POST', '/keuangan/jurnal', d);
export const daftarPengeluaran = (p) => panggilApi('GET', `/keuangan/pengeluaran${qs(p)}`);
export const tambahPengeluaran = (d) => panggilApi('POST', '/keuangan/pengeluaran', d);
export const daftarHutang = () => panggilApi('GET', '/keuangan/hutang');
export const tambahFakturSupplier = (d) => panggilApi('POST', '/keuangan/hutang', d);
export const bayarHutang = (id, d) => panggilApi('POST', `/keuangan/hutang/${id}/bayar`, d);
export const daftarPiutang = () => panggilApi('GET', '/keuangan/piutang');
export const tambahPiutang = (d) => panggilApi('POST', '/keuangan/piutang', d);
export const bayarPiutang = (id, d) => panggilApi('POST', `/keuangan/piutang/${id}/bayar`, d);
export const rekapJasaMedis = (p) => panggilApi('GET', `/keuangan/jasa-medis${qs(p)}`);
export const daftarTarifJasa = () => panggilApi('GET', '/keuangan/tarif-jasa');
export const simpanTarifJasa = (id, d) => panggilApi('PATCH', `/keuangan/tarif-jasa/${id}`, d);
