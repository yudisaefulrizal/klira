import { token } from '../../gaya/token.js';
import { SELEKTOR_FOKUS, fokusBerikut } from '../../util/lapisan/fokus.js';
import { adalahAtas, adalahInert, keluarLapisan, langgananLapisan, lapisanAtas, masukLapisan, kunciGuliran, pilihTargetPemulihan } from '../../util/lapisan/lapisan.js';

let nomorDialog = 0;

/** Dialog DOM: tumpukan, trap fokus, Esc, kunci gulir, dan pemulihan fokus sama dengan dialog aplikasi. */
export function bukaDialog({ judul, onEsc, letak = 'tengah', lapis = 'dialog', lebar = 'modalSedang', tinggi, className }) {
  const id = `klira-native-dialog-${++nomorDialog}`;
  const pemicu = document.activeElement;
  const tirai = document.createElement('div'), isi = document.createElement('div');
  const kanan = letak === 'kanan';
  Object.assign(tirai.style, { position: 'fixed', inset: '0', zIndex: token.lapis[lapis], background: token.warna.tirai, display: 'flex', alignItems: kanan ? 'stretch' : 'center', justifyContent: kanan ? 'flex-end' : 'center', padding: kanan ? '0' : token.jarak.lg, boxSizing: 'border-box' });
  isi.dataset.lapisan = id; if (className) isi.className = className;
  isi.setAttribute('role', 'dialog'); isi.setAttribute('aria-modal', 'true'); isi.setAttribute('aria-label', judul); isi.tabIndex = -1;
  Object.assign(isi.style, { background: token.warna.permukaan, color: token.warna.teks, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar, boxShadow: token.bayangan.modal, display: 'flex', flexDirection: 'column', overflow: 'hidden', outline: 'none', width: token.ukuran[lebar], maxWidth: '100%', height: tinggi ? token.ukuran[tinggi] : '', maxHeight: kanan ? '' : token.ukuran.maksLayar, borderRadius: kanan ? '0' : token.radius.besar });
  tirai.append(isi); document.body.append(tirai);
  const perbaruiInert = () => { isi.inert = adalahInert(id); };
  const lepasLangganan = langgananLapisan(perbaruiInert);
  masukLapisan(id); perbaruiInert();
  const lepasGulir = kunciGuliran(document.body.style);
  function fokus() { if (adalahAtas(id) && !isi.contains(document.activeElement)) (isi.querySelector(SELEKTOR_FOKUS) ?? isi).focus(); }
  function tekan(e) {
    if (!adalahAtas(id)) return;
    if (e.key === 'Escape') { e.preventDefault(); onEsc(); }
    else if (e.key === 'Tab') {
      const daftar = [...isi.querySelectorAll(SELEKTOR_FOKUS)].filter(el => el.getClientRects().length > 0);
      const berikut = fokusBerikut(daftar.length, daftar.indexOf(document.activeElement), e.shiftKey);
      e.preventDefault(); (berikut >= 0 ? daftar[berikut] : isi).focus();
    }
  }
  document.addEventListener('keydown', tekan);
  let ditutup = false;
  return { isi, fokus, tutup() {
    if (ditutup) return; ditutup = true;
    document.removeEventListener('keydown', tekan); lepasLangganan(); keluarLapisan(id); tirai.remove(); lepasGulir();
    const atas = lapisanAtas();
    const elAtas = atas ? document.querySelector(`[data-lapisan="${CSS.escape(atas)}"]`) : null;
    const ada = !!pemicu && document.contains(pemicu);
    const target = pilihTargetPemulihan(ada, ada ? pemicu.closest('[data-lapisan]')?.dataset.lapisan ?? null : null, atas);
    if (elAtas) elAtas.inert = false;
    if (target === 'pemicu') pemicu.focus();
    else if (target === 'pertamaAtas' && elAtas) (elAtas.querySelector(SELEKTOR_FOKUS) ?? elAtas).focus();
  } };
}
