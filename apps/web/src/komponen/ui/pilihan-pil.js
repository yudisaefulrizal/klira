import { token } from '../../gaya/token.js';
import { gayaDiubah, LabelIsian, PesanGalat } from './isian.js';
export function PilihanPil(opsiAwal) {
  let props = opsiAwal;
  const el = document.createElement('div'), label = document.createElement('span'), grup = document.createElement('div'), pesan = document.createElement('div');
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); Object.assign(grup.style, { display: 'flex', flexWrap: 'wrap', gap: token.jarak.xs }); pesan.style.display = 'contents'; grup.setAttribute('role', 'radiogroup'); el.append(label, grup, pesan);
  function pilih(nilai) { props = { ...props, nilai }; perbarui(); props.onUbah(nilai); }
  function perbarui(baru = {}) {
    props = { ...props, ...baru }; const { id, opsi, nilai, disabled, diubah, galat } = props;
    label.id = `${id}-label`; label.replaceChildren(LabelIsian({ tag: 'span', label: props.label, diubah })); grup.id = id; grup.setAttribute('aria-labelledby', label.id);
    if (galat) { grup.setAttribute('aria-invalid', 'true'); grup.setAttribute('aria-describedby', `${id}-galat`); } else { grup.removeAttribute('aria-invalid'); grup.removeAttribute('aria-describedby'); }
    const focus = [...grup.children].indexOf(document.activeElement), terpilih = opsi.findIndex(o => o.nilai === nilai);
    grup.replaceChildren(...opsi.map((o, i) => {
      const aktif = o.nilai === nilai, button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'radio'); button.setAttribute('aria-checked', String(aktif)); button.disabled = !!disabled; button.tabIndex = aktif || terpilih < 0 && i === 0 ? 0 : -1; button.textContent = o.label;
      Object.assign(button.style, { minHeight: token.ukuran.tombol, minWidth: token.ukuran.tombol, padding: `0 ${token.jarak.md}`, borderRadius: token.radius.pil, border: `${token.ukuran.garis} solid ${aktif ? token.warna.utama : galat ? token.warna.status.merah.teks : token.warna.garis}`, background: token.warna.permukaan, color: token.warna.teks, ...(aktif ? diubah ? { ...gayaDiubah, color: token.warna.status.kuning.teks } : { background: token.warna.utamaLatar, color: token.warna.utamaGelap } : {}), fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar, fontWeight: aktif ? token.huruf.berat.tebal : token.huruf.berat.biasa, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? '0.6' : '1' });
      button.addEventListener('click', () => pilih(o.nilai)); button.addEventListener('keydown', e => {
        const arah = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0; if (!arah) return;
        e.preventDefault(); const n = (i + arah + opsi.length) % opsi.length; pilih(opsi[n].nilai); grup.children[n]?.focus();
      }); return button;
    }));
    pesan.replaceChildren(); if (galat) pesan.append(PesanGalat({ id: `${id}-galat`, children: galat })); if (focus >= 0) grup.children[focus]?.focus();
  }
  perbarui(); el.perbarui = perbarui; return el;
}
