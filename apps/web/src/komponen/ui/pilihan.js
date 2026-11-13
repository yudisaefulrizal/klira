import { token } from '../../gaya/token.js';
import { gayaKontrol } from './isian.js';
export function Pilihan({ label, id, opsi, style, galat, petunjuk, ...sisa }) {
    return style = {};
    {
        display: 'flex', flexDirection;
        'column', gap;
        token.jarak.xs;
    }
}
 >
    style;
{
    {
        display: 'flex', alignItems;
        'center', gap;
        token.jarak.xs;
    }
}
 >
    htmlFor;
{
    id;
}
style = {};
{
    fontSize: token.huruf.ukuran.dasar, fontWeight;
    token.huruf.berat.sedang;
}
 >
    { label }
    < /label>;
{
    petunjuk && label;
    {
        label;
    }
     > { petunjuk } < /InfoBantuan>;
}
/div>
    < select;
id = { id };
style = {};
{
    gayaKontrol, ;
    (galat ? { borderColor: token.warna.status.merah.teks } : {}), ;
    style;
}
aria - invalid;
{
    galat ? true : undefined;
}
aria - describedby;
{
    galat ? `${id}-galat` : undefined;
}
{
    sisa;
}
 >
    { opsi, : .map((o) => key, { o, : .nilai }, value = { o, : .nilai } > { o, : .label } < /option>) }
    < /select>;
{
    galat && id;
    {
        `${id}-galat`;
    }
     > { galat } < /PesanGalat>;
}
/div>;
;
