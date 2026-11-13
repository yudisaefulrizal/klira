import { PENUNJANG } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { daftarMasterPemeriksaan } from '../../api-klien/penunjang.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { peringatan } from '../../komponen/ui/primitif.js';
import { FormOrderLab } from './form-order-lab.js';
export function LangkahPenunjang(awal) {
  let props = awal, actif = true, enfant; const el = document.createElement('div'), fieldset = document.createElement('fieldset'), boleh = izinSaatIni()('klinis', 'input'); Object.assign(fieldset.style, { border: '0', padding: '0', margin: '0', minWidth: '0' }); fieldset.setAttribute('aria-label', PENUNJANG.aksi.order); fieldset.disabled = !!props.disabled;
  if (boleh) { el.append(PENUNJANG.memuat); daftarMasterPemeriksaan({ aktif: true }).then(master => { if (!actif) return; enfant = FormOrderLab({ ringkas: true, awalan: 'langkah-lab', master, k: props.k, onUbah: props.onUbah, cara: props.cara, galat: props.galatPilihan }); fieldset.append(enfant); el.replaceChildren(fieldset); }).catch(e => { if (actif) el.replaceChildren(peringatan(e instanceof GalatApi ? e.message : PENUNJANG.order.gagalMuat)); }); }
  el.perbarui = p => { props = { ...props, ...p }; fieldset.disabled = !!props.disabled; enfant?.perbarui({ k: props.k, onUbah: props.onUbah, cara: props.cara, galat: props.galatPilihan }); }; el.tutup = () => { actif = false; enfant?.tutup(); }; return el;
}
