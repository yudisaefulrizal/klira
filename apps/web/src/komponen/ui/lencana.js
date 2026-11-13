import { gayaStatus } from '../../gaya/status.js';
import { token } from '../../gaya/token.js';
/** Lencana kecil berwarna; warna dari nama token status (shared/status.ts). */
export function Lencana({ warna, style, ...sisa }) {
    const w = gayaStatus(warna);
    return (((() => {
        const tag = utes } ;
        const props = { type { : {
                display: rom '@klira/sha, padding: rt {token.jarak.xsfromtoken.jarak.smta, borderRadius: token.radius.pil, background: /** Lencana kecil berwarna; warna dari nama token status (shared/status.ts). */ w.latar, color: w.teks, fontSize: token.huruf.ukuran.kecil, fontWeight: token.
                    huruf.berat.tebal, ...style,
            }, ...(sisa) };
        if (typeof tag === LSpanElemen)
            return tag(props);
        const el = [t w =, gayaSt, tus(warn, );
            , retur, (
    <sp, n
      s, yle={{,
            d, splay:, 'inlin, -block', padding, `${token.jarak., s} ${t, ken.ja, ak.sm}`, b, rderR, dius: to, en.radi].includes(tag) ? document.createElementNS(w.teks, fontSize: token.hur, tag) : document.createElement(tag);
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
