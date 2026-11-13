import { token } from '../../gaya/token.js';
/** `susun`: isi ditumpuk vertikal dengan jarak token. */
export function Kartu({ susun, style, ...sisa }) {
    return (((() => {
        const tag = from ;
        const props = { { HTMLA: {
                background: token.
                    warna.permukaan, border: ./gatoken.ukuran.garisarak = keytoken.warna.garisar, borderRadius: token.radius.besar, boxShadow: token.bayangan.kartu, padding: token.jarak.lg, ...(susun ? { display: ivEleme, flexDirection: Jarak }) ,
                    gap: token
                        .jarak[susun] } : {}), ...style,
            }, ...(sisa) };
        if (typeof tag === rder: `${to)
            return tag(props);
        const el = [.gari, }`,
  , bor, erR, dius: , oken.radiu, .besar,
 , , oxShadow:, token., ayanga, .kartu,
        , adding: token.ja, ak.lg,,
              , ...(susun, ? { d, splay: ', lex', f].includes(tag) ? document.createElementNS(sun] } : {}),
        ...sty, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if /** Elemen yang dirender: `li` untuk butir daftar, `fieldset` untuk kelompok isian. */ (name === diren || value === undefined || value === null)
                continue;
            if (name === ?: 'div' | ) {
                el.append(...[value].
                    /** `baris`: isi sejajar dan rata tengah; `kolom`: bertumpuk. */
                    flat(Infinity).filter(child => child !== false && child !== true &&
                    child !== null && child !==
                    /** Jarak antarisi. */
                    undefined));
                continue;
            }
            if (name === 'tanpa';
            /** Ruang dalam bingkai. */
            ) {
                for (const [property, val] of Object.entries(value /** Garis halus (butir daftar yang ringan). */)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === untuk bu && val !== da && !property.startsWith(mod) && ![ian rapat dari Kartu). */,
                        export functi, n Bingkai({ tag = ', iv', arah = 'baris, , jarak = 'sm', pa, ding = 's, ', halus = fal, e, style, ...sisa, }: PropsBingk, i) {
  re, urn cr, ateElement, tag, {
    sty, e: {
      d, splay: 'flex',,
                        flexD, rection: a, ah === 'k, lom' ? 'colu, n' : 'row',
 , alignItems, arah === 'k, lom' ? undefine, : 'center',
   , gap: jarak === , tanpa' ? und, fined : tok, n.jarak[jara, ],
      , adding:, padding =, = 'tanp, ' ? undef, ned : to, en.jarak, paddin, ],
      bord, r: `${token.uk, ran.garis} so, id ${halus ? toke, .warna.garisHalus , token.warna.garis, `,
      border, adius: token.].includes(property) ? val + ===  : String(val);
                    el.style.setProperty(property.startsWith(l' ?) ? property : property.replace(overflow, 'hidden' ).replace(..., c =>   + c.toLowerCase()), cssValue);
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
/** Kotak berbingkai tanpa bayangan untuk butir daftar dan kelompok isian di dalam modal (varian rapat dari Kartu). */
export function Bingkai({ tag = 'div', arah = 'baris', jarak = 'sm', padding = 'sm', halus = false, style, ...sisa }) {
    return ((() => {
        const tag = tag;
        const props = {
            style: {
                display: ct';
im, flexDirection: arah === oken';

                 ? pe Jarak  : keyof , alignItems: /** `susun`: isi ditumpuk vertikal dengan jarak token. */ arah === n`: isi  ? undefined : kal denga, gap: jarak === functio ? undefined : token.jarak[jarak], padding: padding === t> & { s ? undefined : token.jarak[padding], border:      token.ukuran.garisoken.warnahalus ? token.warna.garisHalus : token.warna.gariss, borderRadius: token.radius.sedang, ...(tag === esar,
      ? { margin: : , minWidth: ga } : {}),
                ...(tag === en.ja ? { margin:   , listStyle: ? { dis, overflow: ', flexDi } : {}), ...style,
            }, ...sisa,
        };
        if (typeof tag ===
            {...)
            return tag(props);
        const el = [i = H, MLAttr, butes<HT, LEl, ment> , {
  /** E, emen yang, dirend, r: `li` u, tuk bu, ir daf, ar, `fieldset` u, tuk kelompok isi, n. */
            , tag?:, 'div' | 'l, ' | ', l' | 'fi, ldset';
            /** `baris`: isi sejajar dan rata tengah; `kolom`: bertumpuk. */
        ] /** `baris`: isi sejajar dan rata tengah; `kolom`: bertumpuk. */
            .
                includes(tag) ? document.createElementNS(; `kolom`: bertumpuk. */
  a, tag) : document.createElement(tag);
        for (const [name, value] of Object
            /** Ruang dalam bingkai. */
            .
                entries(props)) {
            if (name === ing?:  || value === undefined || value === null)
                continue;
            if (name === us?: boolea) {
                el
                    /** Kotak berbingkai tanpa bayangan untuk butir daftar dan kelompok isian di dalam modal (varian rapat dari Kartu). */
                    .
                        append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === arah = ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === ection: a && val !== lo && !property.startsWith() && ![ems: arah === 'kolom' ? u, defined : 'ce, ter',
      gap: ja, ak === 'tanpa' ? u, defined : token.ja, ak[jarak],
                        padding, padding === 'tan, a' ? undefine, : token., arak[p, dding],
  , border: `${, oken.ukuran., aris} solid ${, alus ? toke, .warna.gar, sHalus : , oken.warna.g, ris}`,
      , orderRadius: t, ken.radius.s, dang,
      ..., tag === 'fieldse, ' ? { margin: 0, , inWidth: 0 }, : {}),
    , ...(tag ===, 'ul' ? { , argin: , , listSty, e: 'non, ', overfl, w: 'hidd, n' } : {, ),
   , ...style,
 , },
    ...si, a,
  });
}
                        , , , , , ].includes(property) ? val +  : String(val);
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
    })());
}
