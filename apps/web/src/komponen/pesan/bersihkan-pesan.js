import { panggilApi } from '../../api-klien/klien.js';
import { bukaKonfirmasi } from '../modal-1/modal-dom.js';
import { tombol, peringatan } from '../ui/native.js';
import { token } from '../../gaya/token.js';
export function BersihkanPesan({ kanal, onSelesai }) {
  let sibuk = false, konfirmasi, aktif = true;
  const nama = kanal === 'whatsapp' ? 'WhatsApp' : 'Instagram', el = document.createElement('div'), baris = document.createElement('div'), pesan = document.createElement('div');
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm }); pesan.style.display = 'contents';
  const button = tombol('Bersihkan pesan', () => {
    pesan.replaceChildren(); konfirmasi = bukaKonfirmasi({ judul: `Bersihkan semua pesan ${nama}?`, pesan: `Seluruh percakapan dan lampiran ${nama} di Klira akan dihapus dan tidak dapat dikembalikan. Pesan di aplikasi ${nama} dan koneksi akun tetap ada.`, labelYa: 'Bersihkan semua', onYa: () => void bersihkan(), onTidak() { if (!sibuk) { konfirmasi.tutup(); konfirmasi = undefined; } } });
  }, 'sekunder'); baris.append(button); el.append(baris, pesan);
  async function bersihkan() {
    if (sibuk) return; sibuk = true; button.disabled = true; button.textContent = 'Membersihkan…'; pesan.replaceChildren(); konfirmasi?.perbarui({ memproses: true });
    try { const data = await panggilApi('DELETE', `/${kanal}/percakapan`, { konfirmasi: kanal }); if (!aktif) return; onSelesai(); konfirmasi?.tutup(); konfirmasi = undefined; const hasil = document.createElement('span'); hasil.setAttribute('role', 'status'); hasil.textContent = `${data.percakapan} percakapan dan ${data.pesan} pesan ${nama} dibersihkan.`; pesan.append(hasil); }
    catch (e) { if (aktif) { pesan.append(peringatan(e instanceof Error ? e.message : 'Pesan gagal dibersihkan.')); konfirmasi?.tutup(); konfirmasi = undefined; } }
    finally { if (aktif) { sibuk = false; button.disabled = false; button.textContent = 'Bersihkan pesan'; } }
  }
  el.tutup = () => { aktif = false; konfirmasi?.tutup(); }; return el;
}
