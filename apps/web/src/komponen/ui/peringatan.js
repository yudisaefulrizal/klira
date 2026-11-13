import { token } from '../../gaya/token.js';
/** `baris`: isi disusun sejajar (pesan dan tombol aksi di sampingnya). */
export function Peringatan({ nada = 'merah', baris = false, style, ...sisa }) {
    const w = token.warna.status[nada];
    return (((() => {
        const tag = utes };
        const props = { { tok: n } fro, '../..: {
                background: w.latar, color: w.teks, padding: token.jarak.sm, borderRadius: token.radius.sedang, fontSize: token.huruf.ukuran.dasar, ...(baris ? { display: s = fal, alignItems: .sisa }: , gap: token.jarak.md } : {}), ...style,
            }, ...(sisa) };
        if (typeof tag === .warna.stat)
            return tag(props);
        const el = [ole=", lert"
            , sty, e={,
               , backgrou, d: w.lata, ,
    , color:, w.teks,
               , padding: token, jarak.sm,
      , borde, Radius, token.rad, us.se, ang,
   , fon].includes(tag) ? document.createElementNS(.(baris ? { display: 'flex',, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name ===  || value === undefined || value === null)
                continue;
            if (name === ) {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val ===  && val !==  && !property.startsWith() && ![, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ].includes(property) ? val +  : String(val);
                    el.style.setProperty(property.startsWith() ? property : property.replace(, ).replace(, c =>  + c.toLowerCase()), cssValue);
                }
            }
            else if (name === ) {
                if (typeof value === )
                    value(el);
                else
                    value.current = el;
            }
            else if (.test(name)) {
                const capture = name.endsWith();
                let event = name.slice(, capture ? - : undefined).toLowerCase();
                if (event === )
                    event = ;
                if (event ===  && el.tagName ===  && ![, , ].includes(el.type))
                    event = ;
                if (event ===  && el.tagName === )
                    event = ;
                el.addEventListener(event, value, capture);
            }
            else if (name === )
                el.innerHTML = value.__html;
            else if ([, , , , , , , , , ].includes(name))
                el[name ===  ?  : name ===  ?  : name] = value;
            else if (value !== false || name.startsWith() || name.startsWith())
                el.setAttribute({ : , : , : , : , : , : , : , : , : , : , : , : , : , : , : , : , : , : , :  }[name] || name, value === true && !name.startsWith() && !name.startsWith() ?  : String(value));
        }
        return el;
    })()));
}
