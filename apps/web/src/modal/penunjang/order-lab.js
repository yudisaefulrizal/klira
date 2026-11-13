import { PENUNJANG, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { buatOrderLab, daftarMasterPemeriksaan } from '../../api-klien/penunjang.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { peringatan, tombol } from '../../komponen/ui/primitif.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { FormOrderLab } from './form-order-lab.js';
import { KepalaPasien } from '../pasien/kepala-pasien.js';
import { awalOrderLab, bentukOrderLab, galatOrderLab, rupiah } from './keadaan-order-lab.js';

export function bukaOrderLab({ kunjunganId, pasien, cara, onTutup, onSelesai }) {
  const O = PENUNJANG.order, awal = awalOrderLab();
  let k = { ...awal }, master = null, dicoba = false, proses = false, hasil = null, aktif = true, isiForm;
  function tutup() { aktif = false; isiForm?.tutup(); modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: PENUNJANG.aksi.order, onTutup: tutup, lindungiTutup: () => !hasil && adaPerubahan(awal, k) });
  modal.konteks.append(KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }));
  const status = document.createElement('div'), form = document.createElement('form'); form.noValidate = true; form.append(PENUNJANG.memuat);
  const simpan = tombol(O.pesan, kirim); simpan.disabled = true;
  async function kirim() {
    dicoba = true; isiForm?.perbarui({ galat: galatOrderLab(k) }); if (!master || proses || galatOrderLab(k)) return;
    proses = true; simpan.disabled = true; simpan.textContent = O.memesan; status.replaceChildren();
    try { const h = await buatOrderLab(kunjunganId, bentukOrderLab(k)); if (!aktif) return; hasil = h; isiForm?.tutup(); modal.judul.textContent = O.hasilJudul; modal.setLebar('modalKecil'); const pesan = document.createElement('p'), ul = document.createElement('ul'); pesan.style.margin = '0'; pesan.textContent = O.hasilPesan(h.order.length); for (const o of h.order) { const li = document.createElement('li'); li.textContent = o.nama; ul.append(li); } modal.isi.replaceChildren(pesan, ul, O.tagihanTotal(rupiah(h.tagihan.total))); if (h.tagihan.status_tagihan === 'belum_lengkap') modal.isi.append(peringatan(O.tagihanBelumLengkap, 'kuning')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); }
    catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : O.gagal)); }
    finally { proses = false; simpan.disabled = !master; simpan.textContent = O.pesan; }
  }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form); modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); modal.fokus();
  daftarMasterPemeriksaan({ aktif: true }).then(m => { if (!aktif) return; master = m; isiForm = FormOrderLab({ awalan: 'order-lab', master, k, cara, galat: dicoba ? galatOrderLab(k) : null, onUbah(baru) { k = baru; isiForm.perbarui({ k, galat: dicoba ? galatOrderLab(k) : null }); } }); form.replaceChildren(isiForm); simpan.disabled = proses; }).catch(e => { if (aktif) { form.replaceChildren(); status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : PENUNJANG.master.gagalMuat)); } });
  return { tutup() { aktif = false; isiForm?.tutup(); modal.tutup(); } };
}
