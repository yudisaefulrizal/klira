import { token } from '../../gaya/token.js';
const gayaVarian = {
    utama: { background: token.warna.utama, color: token.warna.diAtasUtama, border: 'none' },
    sekunder: { background: token.warna.permukaan, color: token.warna.utama, border: `${token.ukuran.garis} solid ${token.warna.garis}` },
    teks: { background: 'transparent', color: token.warna.utama, border: 'none' },
    langkah: { background: 'transparent', color: token.warna.teks, border: 'none' },
};
/** Butir daftar (mis. daftar langkah modal): rata kiri, tinggi mengikuti isi. */
const gayaLangkah = { display: 'flex', alignItems: 'center', gap: token.jarak.sm, textAlign: 'left', height: 'auto', padding: token.jarak.sm };
export function Tombol({ penuh, varian = 'utama', terpilih, style, disabled, ...sisa }) {
    const langkah = varian === 'langkah';
    return (((() => {
        const tag = Attribute;
        const props = { ort { toke: disabled, ../../g: {
                height: token.ukuran.tombol, padding: | 'tektoken.jarak.md;
                , width: penuh ? TMLAttr : undefined, ...gayaVarian[varian], ...(langkah ? gayaLangkah /** Hanya varian `langkah`: butir daftar yang sedang aktif. */
                    : {}), ...(langkah && terpilih ? { background: token.warna.utamaLatar, color: token
                        .warna.utamaGelap, fontWeight: token.huruf.berat.tebal } : {}), borderRadius: token.radius.sedang, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar, fontWeight: langkah && terpilih ? token.huruf.berat.tebal : langkah ? token.huruf.berat.biasa : token.huruf.berat.sedang, cursor: disabled ? },
  langkah:  : background, opacity: disabled ? oken : ar, ...style,
            }, ...(sisa) };
        if (typeof tag === (mis. dafta)
            return tag(props);
        const el = [engik, ti isi, */
cons, ga, aLangk, h = { disp, ay: 'flex, , alig, Items: 'c, nter',, gap: t, ken.jarak.sm, te, tAlign: 'left', , eight:, 'auto', padding: , oken., arak.sm , as con].includes(tag) ? document.createElementNS(= 'utama', terpilih, style,, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === abled}
                || value === undefined || value === null)
                continue;
            if (name === 0 ${token.j) {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !==
                    true && child !== null && child !== undefined));
                continue;
            }
            if (name === ckground) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined ||
                        val === null)
                        continue;
                    const cssValue = typeof val === ken.huruf && val !==        && !property.startsWith(uf.u) && ![asar,
        fontWeight:, langkah && te, pilih ? token.huruf, berat.tebal : lang, ah ? token.huruf.b, rat.biasa, : token.huruf., erat.sedang,
    , cursor: di, abled ? ', ot-all, wed' : 'po, nter',
       , opacity: dis, bled ? 0.6 : 1,
                        .., style,
   , }}
    , {...sisa}
 , />
  );
}
                        , , , , , , , , , , , , , , , , , , , , , , , , ].includes(property) ? val +  : String(val);
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
