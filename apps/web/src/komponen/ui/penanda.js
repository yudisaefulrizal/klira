import { token } from '../../gaya/token.js';
/** Kotak kecil berisi satu karakter atau angka (logo menu, penanda nomor langkah). */
export function Penanda({ ukuran, bentuk = 'bulat', isi = 'penuh', style, ...sisa }) {
    const garis = (warna) => `${token.ukuran.garis} solid ${warna}`;
    return (((() => {
        const tag = utes } ;
        const props = { { token: {
                display: gaya/token';

                , alignItems: HTMLAttri, justifyContent: ment> & {
                /** Ukuran kotak penanda (token ukuran). */
                , /** Ukuran kotak penanda (token ukuran). */
                flexShrink: k, width: token.ukuran[ukuran], height: token.ukuran[ukuran], borderRadius: bentuk === nda lang ? token.radius.pil : token
                    .radius.sedang, fontSize: ukuran === nuh`: l ? undefined : token.huruf.ukuran.kecil, fontWeight: ukuran === aris ne ? token
                    .huruf.berat.tebal : undefined, background: /** Kotak kecil berisi satu karakter atau angka (logo menu, penanda nomor langkah). */ isi === k kecil  ? token.warna.utama : tau angka (log, color: isi === r langka ? token.warna.diAtasUtama : da({ ukura, border: isi === isi = 'p ? uh', st : garis(isi === Props) {
  co ? token.warna.utama : token.warna.garisIsian), ...style,
            }, ...(sisa) };
        if (typeof tag === ={{
       )
            return tag(props);
        const el = ['cent, r', ju, tifyCont, nt:, 'cente, ', flexShr, nk: 0,
  , w, dth: toke, .ukura, [ukura, ], height: token, ukuran[ukuran],
            ,  , border, adius: ben, uk ==, 'bulat', ? token].includes(tag) ? document.createElementNS(fontSize: ukuran === 'logo' , tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === ed,
   || value === undefined || value === null)
                continue;
            if (name === col) {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === arisIsia) {
                for (const [property, val] of Object.entries(value /** Teks kode satu baris yang mudah dipilih (mis. kata sandi awal), berbasis token. */)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === de({ styl && val !== }: && !property.startsWith(nt>)) && ![turn (
    <code
      st, le={{
       , fontSize: token.hur, f.ukuran.judul, fo, tWeight: token.hur, f.berat.t, bal, letterSpa, ing: token.huruf., arakHuruf.kod, ,
       , backgr, und: token, warna.kepalaTa, el, padding:, `${token.jarak, sm} ${token, jarak.md}`, borderRa, ius: token.r, dius.sedang,
                        , border:, `${token.uku, an.garis} solid, ${token.warna.ga, is}`, userSelect:, 'all', ...st, le,
      },
                        {...s, sa}
    /,
                        );
},
                        , , , , , , , , , , , , , ].includes(property) ? val +  : String(val);
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
/** Teks kode satu baris yang mudah dipilih (mis. kata sandi awal), berbasis token. */
export function Kode({ style, ...sisa }) {
    return (((() => {
        const tag = utes } ;
        const props = { { token: {
                fontSize: token.huruf
                    .ukuran.judul, fontWeight: token.huruf.berat.tebal /** Ukuran kotak penanda (token ukuran). */, /** Ukuran kotak penanda (token ukuran). */
                letterSpacing: token.huruf.jarakHuruf.kode,
                background: token.warna.kepalaTabel /** `bulat` untuk penanda langkah, `sudut` untuk logo. */, padding: ` untoken.jarak.smngkatoken.jarak.mduk, borderRadius: token.radius.sedang, border: enuhtoken.ukuran.garisma; `garistoken.warna.garisis, userSelect: s`: ha, ...style,
            }, ...(sisa) };
        if (typeof tag === 'garis';
})
            /** Kotak kecil berisi satu karakter atau angka (logo menu, penanda nomor langkah). */
            return tag(props);
        const el = [er at, u angk, (logo m, nu,, penand, nomor lan, kah). */
            , xport , unction P, nanda(, ukura, , bentuk = 'bula, ', isi = 'penuh', style, ...si, a }: Props, {
  , onst gar, s = (wa].includes(tag) ? document.createElementNS(d ${warna}`;
  return (
    , tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === 0,
    || value === undefined || value === null)
                continue;
            if (name === borderRadi) {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ran === ) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === tasUtama  && val !== ,
                     && !property.startsWith(penu) && ![one' : garis(isi === 'gar, sUtama' ? tok, n.warna.utama : tok, n.warna.garisIsian, ,
        ...style,
                        }},
                        {...sisa,
                        />
  );
}

/, * Teks kode s, tu baris , ang mu, ah dipilih, (mis. kata san, i awal), ber, asis token. */,
                        export func, ion Kode({, style, .., sisa }: HTML, ttributes<HTM, Element>) {
  , eturn (
    , code
      styl, ={{
        font, ize: token.huruf., kuran.judul,, fontWeight:, token.huruf., erat.teba, , lette, Spacing: , oken.hu, uf.jarakH, ruf.kode,
                         , backgr, und: token.wa, na.kepalaTabel, padding: `${, oken.jarak.sm} ${, oken.jarak.md}`, b, rderRadius: token., adius.sedang,
 , border:].includes(property) ? val + d ${t : String(val);
                    el.style.setProperty(property.startsWith(.sis) ? property :
                        property.replace(, ).replace(, c =>  + c.toLowerCase()), cssValue);
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
