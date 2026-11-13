import { FARMASI } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { AreaTeks } from '../../komponen/ui/area-teks.js';
import { galatResep } from './keadaan-farmasi.js';
const R = FARMASI.resep;
/**
 * Langkah Resep di Pemeriksaan klinis (P3): dokter menulis resep sebagai teks bebas (merek, racikan). Item obat dari stok diisi apoteker saat telaah.
 * Teks dikelola induk sebagai draf dan diajukan lewat Simpan pemeriksaan.
 */
export function LangkahResep({ teks, onUbah, tampilGalat, disabled }) {
    const boleh = izinSaatIni();
    const bolehResep = boleh('resep', 'input');
    const galat = tampilGalat ? galatResep(teks).teks : undefined;
    return {};
    bolehResep ? nada : ;
    "biru" > { R, : .tanpaIzin } < /Peringatan> : <>
        < AreaTeks;
    id = "resep-teks";
    label = { R, : .label };
    value = { teks };
    maxLength = { 2000:  };
    rows = { 6:  };
    style = {};
    {
        height: 'auto', fontFamily;
        'inherit';
    }
}
disabled = { disabled };
placeholder = { R, : .contoh };
onChange = {}(e);
onUbah(e.target.value);
aria - invalid;
{
    galat ? true : undefined;
}
aria - describedby;
"resep-teks-petunjuk" /  >
    id;
"resep-teks-petunjuk";
style = {};
{
    color: token.warna.teksRedup;
}
 > { R, : .petunjuk };
{
    R.tagihanInfo;
}
/small>;
{
    galat && { galat } < /Peringatan>;
}
/>;
/Kolom>;
;
