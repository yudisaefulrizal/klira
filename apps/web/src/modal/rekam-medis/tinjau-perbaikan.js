import { REKAM_MEDIS, STATUS_PERBAIKAN, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan, lencana, kartu } from '../../komponen/ui/primitif.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { putuskanPerbaikan } from '../../api-klien/rekam-medis.js';
import { ringkasIsi, selisihBaris } from './keadaan-rm.js';

export function bukaTinjauPerbaikan({ permintaan: q, bolehPutuskan = true, onTutup, onSelesai }) {
  const T = REKAM_MEDIS.tinjau, diputuskan = q.status !== 'diajukan', bisa = bolehPutuskan && !diputuskan;
  let catatan = '', dicoba = false, proses = false, hasil = false, aktif = true;
  function tutup() { aktif = false; modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: T.judul, lebar: 'modalBesar', onTutup: tutup, lindungiTutup: () => !hasil && catatan.trim().length > 0 }), status = document.createElement('div'), contenu = document.createElement('div');
  Object.assign(contenu.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const nom = document.createElement('strong'); nom.textContent = `${q.pasien_nama} (${q.pasien_nomor_rm}) · ${REKAM_MEDIS.perbaikan.bagianLabel[q.bagian]}`;
  const meta = document.createElement('div'); meta.style.color = token.warna.teksRedup; meta.append(`${T.kolom.pemohon}: ${q.pemohon_nama ?? '-'} · ${formatWaktu(q.dibuat_pada)} `, lencana(STATUS_PERBAIKAN.label(q.status), STATUS_PERBAIKAN.warna(q.status)));
  const alasan = kartu({ susun: 'xs', style: { padding: token.jarak.md } }), title = document.createElement('strong'); title.textContent = T.kolom.alasan; alasan.append(title, q.alasan); contenu.append(nom, meta, alasan);
  const s = selisihBaris(ringkasIsi(q.isi_sekarang), ringkasIsi(q.isi_baru)), row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.md, alignItems: 'stretch', flexWrap: 'wrap' });
  for (const [label, lignes] of [[T.sekarang, s.sekarang], [T.usulan, s.usulan]]) { const box = kartu({ susun: 'xs', style: { padding: token.jarak.md, flex: '1 1 0', minWidth: '0' } }), h = document.createElement('strong'); h.textContent = label; box.append(h); if (!lignes.length) box.append('-'); for (const b of lignes) { const el = document.createElement('span'); el.textContent = b.teks; el.style.whiteSpace = 'pre-wrap'; if (b.beda) { el.style.fontWeight = token.huruf.berat.tebal; el.style.color = token.warna.status.kuning.teks; } box.append(el); } row.append(box); } contenu.append(row);
  if (diputuskan) contenu.append(peringatan(`${T.sudahDiputuskan} ${q.penyetuju_nama ? `Oleh ${q.penyetuju_nama}. ` : ''}${q.catatan_keputusan ?? ''}`, 'biru'));

  const f = bidang({ id: 'tinjau-catatan', label: T.catatan, jenis: 'textarea', maxLength: 500, ubah(v) { catatan = v; if (dicoba) f.kontrol.setAttribute('aria-invalid', String(!catatan.trim())); } });
  if (bisa) { const aide = document.createElement('small'); aide.textContent = T.catatanTolakPetunjuk; aide.style.color = token.warna.teksRedup; contenu.append(f.el, aide); }
  const tolak = tombol(T.tolak, () => putuskan('tolak'), 'sekunder'), setujui = tombol(T.setujui, () => putuskan('setujui'));
  async function putuskan(keputusan) { dicoba = true; if (!bisa || proses) return; if (keputusan === 'tolak' && !catatan.trim()) { f.kontrol.setAttribute('aria-invalid', 'true'); f.kontrol.focus(); return; } proses = true; tolak.disabled = setujui.disabled = true; tolak.textContent = setujui.textContent = T.memproses; status.replaceChildren(); try { await putuskanPerbaikan(q.id, { keputusan, catatan: catatan.trim() || undefined }); if (!aktif) return; hasil = true; modal.isi.replaceChildren(peringatan(keputusan === 'setujui' ? T.disetujui : T.ditolak, 'biru')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); modal.setLebar('modalKecil'); } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : T.gagal)); } finally { proses = false; tolak.disabled = setujui.disabled = false; tolak.textContent = T.tolak; setujui.textContent = T.setujui; } }
  modal.isi.append(status, contenu); modal.aksi.append(tombol(bisa ? TOMBOL.batal : TOMBOL.tutup, modal.mintaTutup, bisa ? 'sekunder' : 'utama')); if (bisa) modal.aksi.append(tolak, setujui); modal.fokus(); return { tutup() { aktif = false; modal.tutup(); } };
}
