import { REKAM_MEDIS, STATUS_PERBAIKAN, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan, lencana, kartu } from '../../komponen/ui/primitif.js';
import { formatWaktu } from '../../util/penyaring-tab.js';
import { putuskanPembukaan } from '../../api-klien/dokumen-rm.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';

export function bukaTinjauPembukaan({ permintaan: q, bolehPutuskan = true, onTutup, onSelesai }) {
  const T = REKAM_MEDIS.dok.pembukaan, diputuskan = q.status !== 'diajukan', bisa = bolehPutuskan && !diputuskan;
  let catatan = '', dicoba = false, proses = false, hasil = false, aktif = true;
  function tutup() { aktif = false; modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: T.tinjauJudul, lebar: 'modalSedang', onTutup: tutup, lindungiTutup: () => !hasil && catatan.trim().length > 0 }), status = document.createElement('div'), contenu = document.createElement('div');
  Object.assign(contenu.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const meta = document.createElement('div'); meta.style.color = token.warna.teksRedup; meta.append(`${q.diminta_oleh_nama ? `${T.diminta(q.diminta_oleh_nama)} · ` : ''}${formatWaktu(q.dibuat_pada)} `, lencana(STATUS_PERBAIKAN.label(q.status), STATUS_PERBAIKAN.warna(q.status)));
  contenu.append(meta, DaftarRingkasan({ bagian: [{ judul: `${q.pasien_nama} (${q.pasien_nomor_rm})`, baris: [{ label: T.pemohon, nilai: [q.pemohon_nama, q.pemohon_instansi].filter(Boolean).join(' · ') }, { label: T.dasarLabel, nilai: `${T.dasar[q.dasar]}${q.alasan_hukum ? ` · ${T.alasan[q.alasan_hukum]}` : ''}` }, { label: T.dasarRinci, nilai: q.dasar_rinci }, { label: T.cakupan, nilai: q.cakupan }, { label: T.samar, nilai: q.identitas_disamarkan ? T.samarYa : T.samarTidak }] }] }));
  if (diputuskan) contenu.append(peringatan(`${q.penyetuju_nama ? `${T.oleh(q.penyetuju_nama)}. ` : ''}${q.catatan_keputusan ?? ''}`, 'biru'));

  const f = bidang({ id: 'tinjau-catatan', label: T.catatan, jenis: 'textarea', maxLength: 500, ubah(v) { catatan = v; if (dicoba) f.kontrol.setAttribute('aria-invalid', String(!catatan.trim())); } });
  if (bisa) { const aide = document.createElement('small'); aide.textContent = T.catatanPetunjuk; aide.style.color = token.warna.teksRedup; contenu.append(f.el, aide); }
  const tolak = tombol(T.tolak, () => putuskan('tolak'), 'sekunder'), setujui = tombol(T.setujui, () => putuskan('setujui'));
  async function putuskan(keputusan) { dicoba = true; if (!bisa || proses) return; if (keputusan === 'tolak' && !catatan.trim()) { f.kontrol.setAttribute('aria-invalid', 'true'); f.kontrol.focus(); return; } proses = true; tolak.disabled = setujui.disabled = true; tolak.textContent = setujui.textContent = T.memproses; status.replaceChildren(); try { await putuskanPembukaan(q.id, { keputusan, catatan: catatan.trim() || undefined }); if (!aktif) return; hasil = true; modal.isi.replaceChildren(peringatan(keputusan === 'setujui' ? T.disetujui : T.ditolak, 'biru')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); modal.setLebar('modalKecil'); } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : T.gagal)); } finally { proses = false; tolak.disabled = setujui.disabled = false; tolak.textContent = T.tolak; setujui.textContent = T.setujui; } }
  modal.isi.append(status, contenu); modal.aksi.append(tombol(bisa ? TOMBOL.batal : TOMBOL.tutup, modal.mintaTutup, bisa ? 'sekunder' : 'utama')); if (bisa) modal.aksi.append(tolak, setujui); modal.fokus(); return { tutup() { aktif = false; modal.tutup(); } };
}
