import { ATUR_IZIN, MODAL } from '@klira/shared';
import { akhiriIzinAkun, akhiriPenugasan, aksesEfektif, beriIzinAkun, daftarIzin, daftarIzinAkun, daftarJenisAkun, daftarPenugasan, tugaskanJenis } from '../../api-klien/izin.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bukaPanelDetail } from '../../komponen/panel/panel-detail.js';
import { bukaDialogPeringatan } from '../../komponen/izin/peringatan-izin.js';
import { peringatan, tombol } from '../../komponen/ui/primitif.js';
import { jalankanAksi } from './alur-atur-izin.js';
import { BagianIzin, BagianPenugasan, TeksMemuat } from './bagian-atur-izin.js';
import { hariIniLokal, opsiIzin } from './keadaan-akun.js';
import { bagianAkses, bentukIzinBaru, bentukPenugasanBaru, izinAwal, izinTerpakai, jenisBerjalan, opsiJenisBaru, penugasanAwal } from './keadaan-izin.js';
export function bukaAturIzin({ pengguna, onTutup }) {
  const hariIni = hariIniLokal(); let jenis = [], katalog = [], penugasan = [], izinAkun = [], memuat = true, galat = null, memproses = false, berubah = false, formTugas = penugasanAwal(hariIni), formIzin = izinAwal(hariIni), kata = '', aktif = true, tertunda, akses;
  const modal = bukaModal1({ judul: ATUR_IZIN.judul, lebar: 'modalBesar', onTutup: () => onTutup(berubah), lindungiTutup: () => formTugas.jenis_akun_id !== '' || formIzin.alasan.trim() !== '' || formIzin.izin_id !== 0 });
  const identitas = document.createElement('div'), nama = document.createElement('div'), username = document.createElement('div'); identitas.style.flexGrow = '1'; nama.textContent = pengguna.nama; nama.style.fontWeight = token.huruf.berat.tebal; username.textContent = pengguna.username; Object.assign(username.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }); identitas.append(nama, username); modal.konteks.append(identitas, tombol(ATUR_IZIN.lihatAkses, () => void bukaAkses(), 'sekunder'));
  modal.aksi.append(tombol(ATUR_IZIN.tutup, () => onTutup(berubah), 'sekunder'));
  const pesan = document.createElement('div'), tugas = document.createElement('div'), izin = document.createElement('div'); pesan.style.display = tugas.style.display = izin.style.display = 'contents'; modal.isi.append(pesan, tugas, izin);
  function tampilBagian(target, bangun) {
    const id = target.contains(document.activeElement) ? document.activeElement.id : null, selection = id && typeof document.activeElement.selectionStart === 'number' ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
    target.replaceChildren(bangun()); if (id) { const input = document.getElementById(id); input?.focus(); if (selection && input?.setSelectionRange && ['text', 'search', 'password', 'tel', 'url', 'textarea'].includes(input.type)) input.setSelectionRange(...selection); }
  }
  function tampil() {
    if (!aktif) return; pesan.replaceChildren(); if (galat) pesan.append(peringatan(galat));
    if (memuat) { tugas.replaceChildren(TeksMemuat()); izin.replaceChildren(); return; }
    tampilBagian(tugas, () => BagianPenugasan({ data: penugasan, jenis, opsiJenis: opsiJenisBaru(jenis, penugasan, hariIni), hariIni, form: formTugas, memproses,
      onForm(v) { formTugas = typeof v === 'function' ? v(formTugas) : v; tampil(); }, onTambah: () => void proses(k => tugaskanJenis(pengguna.id, bentukPenugasanBaru(formTugas, k)), () => { formTugas = penugasanAwal(hariIni); }), onPeriode: (id, selesai) => void proses(() => akhiriPenugasan(pengguna.id, id, selesai), () => {}),
    }));
    tampilBagian(izin, () => BagianIzin({ data: izinAkun, katalog, opsi: opsiIzin(formIzin.tipe, katalog, jenisBerjalan(jenis, penugasan, hariIni), izinTerpakai(izinAkun, hariIni), kata), hariIni, form: formIzin, kata, memproses,
      onForm(v) { formIzin = typeof v === 'function' ? v(formIzin) : v; tampil(); }, onKata(v) { kata = v; tampil(); }, onTambah: () => void proses(k => beriIzinAkun(pengguna.id, bentukIzinBaru(formIzin, k)), () => { formIzin = izinAwal(hariIni); kata = ''; }), onPeriode: (id, selesai) => void proses(() => akhiriIzinAkun(pengguna.id, id, selesai), () => {}),
    }));
  }
  async function muatData() { const [j, i, p, ia] = await Promise.all([daftarJenisAkun(), daftarIzin(), daftarPenugasan(pengguna.id), daftarIzinAkun(pengguna.id)]); if (!aktif) return; jenis = j; katalog = i; penugasan = p; izinAkun = ia; }
  async function proses(kirim, sesudah, konfirmasi) {
    memproses = true; galat = null; tampil(); tertunda?.perbarui({ memproses: true, labelLanjut: ATUR_IZIN.memproses });
    const h = await jalankanAksi(kirim, konfirmasi); if (!aktif) return;
    if (h.jenis === 'peringatan') { tertunda?.tutup(); tertunda = bukaDialogPeringatan({ peringatan: h.peringatan, onBatal() { tertunda.tutup(); tertunda = undefined; }, onLanjut: k => void proses(kirim, sesudah, k) }); }
    else if (h.jenis === 'galat') { tertunda?.tutup(); tertunda = undefined; galat = h.pesan; }
    else { tertunda?.tutup(); tertunda = undefined; try { await muatData(); } catch { galat = ATUR_IZIN.gagalMuat; } berubah = true; sesudah(); }
    memproses = false; tertunda?.perbarui({ memproses: false, labelLanjut: MODAL.lanjutkanDenganAlasan }); tampil();
  }
  async function bukaAkses() { try { const data = await aksesEfektif(pengguna.id); if (!aktif) return; akses?.tutup(); akses = bukaPanelDetail({ judul: ATUR_IZIN.aksesJudul, bagian: bagianAkses(data), onTutup() { akses.tutup(); akses = undefined; } }); } catch (e) { if (aktif) { galat = e instanceof GalatApi ? e.message : ATUR_IZIN.gagalMuat; tampil(); } } }
  tampil(); modal.fokus(); muatData().catch(e => { if (aktif) galat = e instanceof GalatApi ? e.message : ATUR_IZIN.gagalMuat; }).finally(() => { if (aktif) { memuat = false; tampil(); } });
  return () => { aktif = false; akses?.tutup(); tertunda?.tutup(); modal.tutup(); };
}
