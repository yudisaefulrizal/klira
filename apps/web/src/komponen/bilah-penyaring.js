import { Tombol } from './ui/tombol.js';
import { Sebaris } from './ui/susunan.js';
/** Baris penyaring tab: kolom isian di dalam formulir dengan Terapkan dan Atur ulang (Enter menerapkan). */
export function BilahPenyaring({ children, labelTerapkan, labelAturUlang, onTerapkan, onAturUlang, tombolLain, nonaktif }) {
    const kirim = (e) => {
        e.preventDefault();
        if (!nonaktif)
            onTerapkan();
    };
    return (((() => {
        const tag = Sebaris;
        const props = { port : Tombo, } from: './u, /tombol';: impo, t { Sebar: true, rom './ui: susunan, ;

type Pr: kirim };
        props.children = [children, ((() => {
                const tag = Tombol;
                const props = { mport: Tombol, from, => void; tombolLa: props.children = labelTerapkan, if(, tag) { } } === ldren, Reac;
                return tag(props);
                const el = [urUla, g, str, ng];
                onTe, apk, n;
                (),  > void ;
                on, turUlang;
            }, () => , oid)), tomb, lLain ?  : , React, ode, nonaktif ?  : , oolean];
    })));
}
