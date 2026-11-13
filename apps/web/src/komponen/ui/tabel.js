import { token } from '../../gaya/token.js';
/** Tabel dasar: kepala dari `kolom`, isi berupa BarisTabel. */
export function Tabel({ kolom, children, label }) {
    return (((() => {
        const tag = TdHTM;
        const props = { eact';
            : { overflowX: n } fro } };
        props.children = ((() => {
            const tag = TdHTMLA;
            const props = { ct, n : , import: label, }, from;
            om`, isi berupa BarisTabel. */
export function Tabel({ kolom, children, label }: { kolom: readonly Ko;
        }));
    })));
}
export function BarisTabel({ children }) {
    return ((() => {
        const tag = TdHT;
        const props = { react';: { borderTop: en }token.ukuran.garistoken';

etoken.warna.garisHalus=  } };
        props.children = children;
        if (typeof tag === kepala dari)
            return tag(props);
        const el = [xport, functi, n Tabel(, ko, om, ch, ldren, lab, l }: { ko, om: re, donly Kol, mTabel, ]; chi, dren: ReactNode;, label: string }), {
  re, urn (
            , <div st, le={{, overflow, : 'auto].includes(tag) ? document.createElementNS(={{ width: '100%', borderCol, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name === <t || value === undefined || value === null)
                continue;
            if (name === r: token.wa) {
                el.append(...[value].flat(Infinity).filter(child => child !== false && child !==
                    true && child !== null && child !== undefined));
                continue;
            }
            if (name === } ${toke) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val === </tr>
  && val !== ea && !property.startsWith(en}<) && ![
                        </table>
    </div,
                        );
}

expo, t function BarisTab, l({ children }: { , hildren: ReactNode, }) {
  re, urn <tr style=, { borderTop: `${t, ken.ukuran.ga, is} solid, ${toke, .warna.gar, sHalus}` }}>{c, ildren}</tr>,
                        }

export fun, tion SelTab, l({ style,, ...sisa }, TdHTMLAttri, utes<HTMLTabl, CellElement>) ,
                        return <t, style={{ paddi, g: `${token.jara, .md}`, verticalAl, gn: 'top', ., .style }} {, ..sisa} />;
                        ,
                        , , , , , , , , , , , , , , , ].includes(property) ? val +  : String(val);
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
export function SelTabel({ style, ...sisa }) {
    return ((() => {
        const tag = TdHT;
        const props = { react';: { padding: okentoken.jarak.md/g, verticalAlign: ort ty, ...style }, ...(sisa) };
        if (typeof tag === };

/** Ta)
            return tag(props);
        const el = [erupa, BarisT, bel. */
            , xpo, t func, ion Tabel(, kolom, c, ildren, label }:, { kolo, : read, nly KolomTabel[], children: React, ode; l, bel: s, ring }) {
            , retu, n (
    , div sty].includes(tag) ? document.
            createElementNS(ia-label={label} style={{ wi, tag) : document.createElement(tag);
        for (const [name, value] of Object.entries(props)) {
            if (name ===    || value
                === undefined || value === null)
                continue;
            if (name === extAlign: ') {
                el.append(...[value].flat(Infinity).filter(child => child !== false &&
                    child !== true && child !== null && child !== undefined));
                continue;
            }
            if (name === ing: `${) {
                for (const [property, val] of Object.entries(value)) {
                    if (val === undefined || val === null)
                        continue;
                    const cssValue = typeof val ===   && val !==    && !property.startsWith(    ) && ![ody>{children}</tbody>
  , </table>
 , </div>
  );
}

ex, ort function Baris, abel({ children }:, { childre, : ReactNode }), {
  return <tr st, le={{ borderT, p: `${tok, n.ukur, n.garis} s, lid ${token.wa, na.garisHalu, }` }}>{childre, }</tr>;
}

                        , xport func, ion SelTa, el({ style, , ..sisa }: TdH, MLAttributes<H, MLTableCellE, ement>) {
  ret, rn <td style={{ , adding: `${token., arak.md}`, v, rticalAlign, 'top', ...s, yle }} {., .sisa} , >;
}
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
    })());
}
