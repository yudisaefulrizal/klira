import { panggilApi, GalatApi } from '../../api-klien/klien.js';
import { kartu, tombol, lencana, peringatan, tab, tabel, baris, sel } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';

const WARNA_METODE = {
    GET: 'biru',
    POST: 'hijau',
    PUT: 'kuning',
    PATCH: 'ungu',
    DELETE: 'merah',
};

const KARTU_L = 216;
const KARTU_T = 128;
const JARAK_MIN_X = 64;
const JARAK_MIN_Y = 52;
const PAD_KANVAS = 64;

function gayaInput(el) {
    Object.assign(el.style, {
        height: token.ukuran.isian,
        padding: `0 ${token.jarak.sm}`,
        borderRadius: token.radius.sedang,
        border: `${token.ukuran.garis} solid ${token.warna.garis}`,
        background: token.warna.permukaan,
        color: token.warna.teks,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.dasar,
        minWidth: '210px',
    });
    return el;
}

/**
 * Hitung tata letak peta grafis fleksibel dengan optimasi global:
 * - Tidak terpaku pada kotak domain: seluruh tabel terhubung dioptimasi secara global (gaya pegas + tolak-menolak).
 * - Rasio aspek lanskap (16:10) agar peta memanfaatkan lebar layar secara optimal.
 * - Resolusi tabrakan AABB ternormalisasi agar 0% kartu saling menutupi.
 */
function hitungTataLetakPeta(tabelList, relasiList) {
    const posisiTabel = new Map();
    if (!tabelList.length) {
        return { zona: [], posisiTabel, lebarKanvas: 960, tinggiKanvas: 560 };
    }

    const namaSet = new Set(tabelList.map((t) => t.nama));
    const derajat = new Map();
    const tetangga = new Map();
    const sisiUnik = [];
    const kunciSisi = new Set();

    for (const t of tabelList) {
        derajat.set(t.nama, 0);
        tetangga.set(t.nama, []);
    }
    for (const r of relasiList) {
        if (!namaSet.has(r.dari_tabel) || !namaSet.has(r.ke_tabel) || r.dari_tabel === r.ke_tabel) continue;
        derajat.set(r.dari_tabel, (derajat.get(r.dari_tabel) ?? 0) + 1);
        derajat.set(r.ke_tabel, (derajat.get(r.ke_tabel) ?? 0) + 1);
        const k = r.dari_tabel < r.ke_tabel ? `${r.dari_tabel}|${r.ke_tabel}` : `${r.ke_tabel}|${r.dari_tabel}`;
        if (!kunciSisi.has(k)) {
            kunciSisi.add(k);
            sisiUnik.push([r.dari_tabel, r.ke_tabel]);
            tetangga.get(r.dari_tabel).push(r.ke_tabel);
            tetangga.get(r.ke_tabel).push(r.dari_tabel);
        }
    }

    // Pisahkan graf terhubung dari tabel terisolasi (derajat 0) agar tabel terisolasi tidak mengacaukan pusat graf
    const tabelTerhubung = tabelList.filter((t) => (derajat.get(t.nama) ?? 0) > 0);
    const tabelTerisolasi = tabelList
        .filter((t) => (derajat.get(t.nama) ?? 0) === 0)
        .sort((a, b) => a.domain.localeCompare(b.domain) || a.nama.localeCompare(b.nama));

    const aktifList = tabelTerhubung.length ? tabelTerhubung : tabelList;

    // Urutkan BFS dari hub terbesar agar tabel bertetangga langsung berada dekat sejak posisi awal
    const urutDerajat = aktifList.slice().sort((a, b) => {
        const dB = derajat.get(b.nama) ?? 0;
        const dA = derajat.get(a.nama) ?? 0;
        if (dB !== dA) return dB - dA;
        return a.nama.localeCompare(b.nama);
    });
    const terurut = [];
    const dikunjungi = new Set();
    for (const akar of urutDerajat) {
        if (dikunjungi.has(akar.nama)) continue;
        const antre = [akar];
        dikunjungi.add(akar.nama);
        while (antre.length) {
            const cur = antre.shift();
            terurut.push(cur);
            const tList = (tetangga.get(cur.nama) || [])
                .slice()
                .sort((a, b) => (derajat.get(b) ?? 0) - (derajat.get(a) ?? 0) || a.localeCompare(b));
            for (const nbNama of tList) {
                if (!dikunjungi.has(nbNama)) {
                    dikunjungi.add(nbNama);
                    const obj = aktifList.find((x) => x.nama === nbNama);
                    if (obj) antre.push(obj);
                }
            }
        }
    }

    const simpul = new Map();
    const n = terurut.length;
    const sudutEmas = Math.PI * (3 - Math.sqrt(5));
    terurut.forEach((t, idx) => {
        const r = idx === 0 ? 0 : 210 * Math.sqrt(idx);
        const theta = idx * sudutEmas;
        simpul.set(t.nama, {
            tabel: t,
            cx: r * Math.cos(theta) * 1.55,
            cy: r * Math.sin(theta) * 0.92,
            vx: 0,
            vy: 0,
        });
    });

    const daftarSimpul = [...simpul.values()];
    const butuhX = KARTU_L + JARAK_MIN_X;
    const butuhY = KARTU_T + JARAK_MIN_Y;
    const jarakIdeal = 315;
    const maksIterasi = 260;

    // Optimasi gaya global dengan rasio lanskap
    for (let iter = 0; iter < maksIterasi; iter += 1) {
        const redam = 0.86 * (1 - iter / (maksIterasi * 1.2));

        for (let i = 0; i < n; i += 1) {
            const a = daftarSimpul[i];
            for (let j = i + 1; j < n; j += 1) {
                const b = daftarSimpul[j];
                let dx = b.cx - a.cx;
                let dy = b.cy - a.cy;
                // Normalisasi jarak ke ukuran kartu agar jarak X dan Y seimbang
                const nx = dx / butuhX;
                const ny = dy / butuhY;
                let nd2 = nx * nx + ny * ny;
                if (nd2 < 0.01) {
                    dx = ((i % 3) - 1) * 12 || 9;
                    dy = ((j % 3) - 1) * 12 || -9;
                    nd2 = 0.02;
                }
                const dist = Math.max(1, Math.hypot(dx, dy));
                const tolak = Math.min(34, 1.35 / nd2);
                const fx = (dx / dist) * tolak * 16;
                const fy = (dy / dist) * tolak * 12;
                a.vx -= fx;
                a.vy -= fy;
                b.vx += fx;
                b.vy += fy;
            }
        }

        // Pegas relasi menarik tabel berelasi saling mendekat
        for (const [dari, ke] of sisiUnik) {
            const a = simpul.get(dari);
            const b = simpul.get(ke);
            if (!a || !b) continue;
            const dx = b.cx - a.cx;
            const dy = b.cy - a.cy;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const gaya = (dist - jarakIdeal) * 0.055;
            const fx = (dx / dist) * gaya;
            const fy = (dy / dist) * gaya;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
        }

        // Gravitasi elips ke pusat: sedikit lebih kuat secara vertikal agar peta melebar horizontal
        for (const s of daftarSimpul) {
            s.vx -= s.cx * 0.007;
            s.vy -= s.cy * 0.014;
            s.cx += s.vx * redam;
            s.cy += s.vy * redam;
            s.vx *= 0.42;
            s.vy *= 0.42;
        }
    }

    // Resolusi tabrakan AABB ternormalisasi (overlapX / butuhX vs overlapY / butuhY) agar bentuk lanskap terjaga
    const selesaikanTabrakan = () => {
        for (let pass = 0; pass < 160; pass += 1) {
            let adaTabrakan = false;
            for (let i = 0; i < n; i += 1) {
                const a = daftarSimpul[i];
                for (let j = i + 1; j < n; j += 1) {
                    const b = daftarSimpul[j];
                    const dx = b.cx - a.cx;
                    const dy = b.cy - a.cy;
                    const overlapX = butuhX - Math.abs(dx);
                    const overlapY = butuhY - Math.abs(dy);
                    if (overlapX > 0 && overlapY > 0) {
                        adaTabrakan = true;
                        if (overlapX / butuhX < overlapY / butuhY) {
                            const geser = (overlapX / 2) + 1;
                            const arah = dx >= 0 ? 1 : -1;
                            a.cx -= arah * geser;
                            b.cx += arah * geser;
                        } else {
                            const geser = (overlapY / 2) + 1;
                            const arah = dy >= 0 ? 1 : -1;
                            a.cy -= arah * geser;
                            b.cy += arah * geser;
                        }
                    }
                }
            }
            if (!adaTabrakan) break;
        }
    };

    selesaikanTabrakan();

    // Pemolesan lokal: tarik simpul berderajat rendah lebih dekat ke rata-rata tetangganya tanpa menabrak
    for (let polish = 0; polish < 14; polish += 1) {
        for (const s of daftarSimpul) {
            const nb = tetangga.get(s.tabel.nama) || [];
            if (!nb.length) continue;
            let sx = 0;
            let sy = 0;
            for (const namaNb of nb) {
                const p = simpul.get(namaNb);
                if (p) {
                    sx += p.cx;
                    sy += p.cy;
                }
            }
            s.cx += (sx / nb.length - s.cx) * 0.14;
            s.cy += (sy / nb.length - s.cy) * 0.14;
        }
        selesaikanTabrakan();
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of daftarSimpul) {
        const x = s.cx - KARTU_L / 2;
        const y = s.cy - KARTU_T / 2;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + KARTU_L);
        maxY = Math.max(maxY, y + KARTU_T);
    }

    const geserX = PAD_KANVAS - minX;
    const geserY = PAD_KANVAS - minY;
    for (const s of daftarSimpul) {
        posisiTabel.set(s.tabel.nama, {
            tabel: s.tabel,
            x: Math.round(s.cx - KARTU_L / 2 + geserX),
            y: Math.round(s.cy - KARTU_T / 2 + geserY),
            w: KARTU_L,
            h: KARTU_T,
        });
    }

    let lebarTotal = Math.max(960, Math.round(maxX - minX + PAD_KANVAS * 2));
    let tinggiTotal = Math.max(560, Math.round(maxY - minY + PAD_KANVAS * 2));

    // Jika ada tabel terisolasi (tanpa relasi), susun rapi di baris bawah kanvas
    if (tabelTerhubung.length && tabelTerisolasi.length) {
        const perBaris = Math.max(4, Math.floor((lebarTotal - PAD_KANVAS * 2 + JARAK_MIN_X) / butuhX));
        const awalY = tinggiTotal;
        tabelTerisolasi.forEach((t, idx) => {
            const kol = idx % perBaris;
            const brs = Math.floor(idx / perBaris);
            const x = PAD_KANVAS + kol * butuhX;
            const y = awalY + brs * butuhY;
            posisiTabel.set(t.nama, { tabel: t, x, y, w: KARTU_L, h: KARTU_T });
            lebarTotal = Math.max(lebarTotal, x + KARTU_L + PAD_KANVAS);
            tinggiTotal = Math.max(tinggiTotal, y + KARTU_T + PAD_KANVAS);
        });
    }

    return {
        zona: [],
        posisiTabel,
        lebarKanvas: lebarTotal,
        tinggiKanvas: tinggiTotal,
    };
}

/**
 * Router jalur ortogonal A* di koridor kosong antar kartu tabel
 * agar garis relasi memutari kartu dan tidak pernah menembus tabel lain.
 */
function buatRouterGarisErd(posisiTabel, lebarKanvas, tinggiKanvas) {
    const CELL = 18;
    const PAD_OBS = 8;
    const cols = Math.max(4, Math.ceil(lebarKanvas / CELL));
    const rows = Math.max(4, Math.ceil(tinggiKanvas / CELL));
    const total = cols * rows;

    const blocked = new Uint8Array(total);
    const usage = new Uint16Array(total);
    for (const pos of posisiTabel.values()) {
        const c0 = Math.max(0, Math.floor((pos.x - PAD_OBS) / CELL));
        const c1 = Math.min(cols - 1, Math.floor((pos.x + pos.w + PAD_OBS) / CELL));
        const r0 = Math.max(0, Math.floor((pos.y - PAD_OBS) / CELL));
        const r1 = Math.min(rows - 1, Math.floor((pos.y + pos.h + PAD_OBS) / CELL));
        for (let r = r0; r <= r1; r += 1) {
            const off = r * cols;
            for (let c = c0; c <= c1; c += 1) blocked[off + c] = 1;
        }
    }

    const seenStamp = new Int32Array(total);
    const closedStamp = new Int32Array(total);
    const gScore = new Int32Array(total);
    const parent = new Int32Array(total);
    const dirArr = new Int8Array(total);
    const heapIdx = new Int32Array(total);
    const heapF = new Int32Array(total);
    let stamp = 0;

    const dx = [1, -1, 0, 0];
    const dy = [0, 0, 1, -1];

    const cariSelKoridor = (px, py, sisi) => {
        const vx = sisi === 'R' ? 1 : sisi === 'L' ? -1 : 0;
        const vy = sisi === 'B' ? 1 : sisi === 'T' ? -1 : 0;
        for (let step = 1; step <= 4; step += 1) {
            const x = px + vx * (step * 12);
            const y = py + vy * (step * 12);
            const c = Math.max(0, Math.min(cols - 1, Math.floor(x / CELL)));
            const r = Math.max(0, Math.min(rows - 1, Math.floor(y / CELL)));
            if (!blocked[r * cols + c]) return { c, r };
        }
        const c = Math.max(0, Math.min(cols - 1, Math.floor((px + vx * 16) / CELL)));
        const r = Math.max(0, Math.min(rows - 1, Math.floor((py + vy * 16) / CELL)));
        return { c, r };
    };

    const buatKurvaSudut = (pts) => {
        if (pts.length < 2) return '';
        const bersih = [pts[0]];
        for (let i = 1; i < pts.length; i += 1) {
            const prev = bersih[bersih.length - 1];
            if (Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y) > 1) bersih.push(pts[i]);
        }
        // Hapus titik kolinear
        const simpel = [bersih[0]];
        for (let i = 1; i < bersih.length - 1; i += 1) {
            const a = simpel[simpel.length - 1];
            const b = bersih[i];
            const c = bersih[i + 1];
            const kolinearX = Math.abs(a.x - b.x) < 0.5 && Math.abs(b.x - c.x) < 0.5;
            const kolinearY = Math.abs(a.y - b.y) < 0.5 && Math.abs(b.y - c.y) < 0.5;
            if (!kolinearX && !kolinearY) simpel.push(b);
        }
        if (bersih.length > 1) simpel.push(bersih[bersih.length - 1]);
        if (simpel.length < 2) return '';

        const R = 7;
        let d = `M ${simpel[0].x} ${simpel[0].y}`;
        for (let i = 1; i < simpel.length - 1; i += 1) {
            const prev = simpel[i - 1];
            const cur = simpel[i];
            const next = simpel[i + 1];
            const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
            const d2 = Math.hypot(next.x - cur.x, next.y - cur.y);
            const r = Math.min(R, d1 * 0.4, d2 * 0.4);
            if (r < 1.5) {
                d += ` L ${cur.x} ${cur.y}`;
            } else {
                const bx = cur.x - ((cur.x - prev.x) / d1) * r;
                const by = cur.y - ((cur.y - prev.y) / d1) * r;
                const ax = cur.x + ((next.x - cur.x) / d2) * r;
                const ay = cur.y + ((next.y - cur.y) / d2) * r;
                d += ` L ${bx.toFixed(1)} ${by.toFixed(1)} Q ${cur.x} ${cur.y}, ${ax.toFixed(1)} ${ay.toFixed(1)}`;
            }
        }
        const akhir = simpel[simpel.length - 1];
        d += ` L ${akhir.x} ${akhir.y}`;
        return d;
    };

    return (p1, sisiA, p2, sisiB) => {
        const s = cariSelKoridor(p1.x, p1.y, sisiA);
        const e = cariSelKoridor(p2.x, p2.y, sisiB);
        const startIdx = s.r * cols + s.c;
        const endIdx = e.r * cols + e.c;

        stamp += 1;
        let heapSize = 0;
        const push = (idx, f) => {
            let i = heapSize;
            heapSize += 1;
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (heapF[p] <= f) break;
                heapIdx[i] = heapIdx[p];
                heapF[i] = heapF[p];
                i = p;
            }
            heapIdx[i] = idx;
            heapF[i] = f;
        };
        const pop = () => {
            const top = heapIdx[0];
            heapSize -= 1;
            if (heapSize > 0) {
                const lastIdx = heapIdx[heapSize];
                const lastF = heapF[heapSize];
                let i = 0;
                while (true) {
                    const l = i * 2 + 1;
                    if (l >= heapSize) break;
                    const r = l + 1;
                    const best = r < heapSize && heapF[r] < heapF[l] ? r : l;
                    if (heapF[best] >= lastF) break;
                    heapIdx[i] = heapIdx[best];
                    heapF[i] = heapF[best];
                    i = best;
                }
                heapIdx[i] = lastIdx;
                heapF[i] = lastF;
            }
            return top;
        };

        seenStamp[startIdx] = stamp;
        gScore[startIdx] = 0;
        parent[startIdx] = -1;
        dirArr[startIdx] = -1;
        push(startIdx, (Math.abs(e.c - s.c) + Math.abs(e.r - s.r)) * 10);

        let ketemu = false;
        let ekspansi = 0;
        while (heapSize > 0 && ekspansi < 14000) {
            const cur = pop();
            if (closedStamp[cur] === stamp) continue;
            closedStamp[cur] = stamp;
            if (cur === endIdx) {
                ketemu = true;
                break;
            }
            ekspansi += 1;
            const cr = Math.floor(cur / cols);
            const cc = cur - cr * cols;
            const curDir = dirArr[cur];
            const curG = gScore[cur];

            for (let d = 0; d < 4; d += 1) {
                const nc = cc + dx[d];
                const nr = cr + dy[d];
                if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
                const nIdx = nr * cols + nc;
                if (closedStamp[nIdx] === stamp) continue;
                if (blocked[nIdx] && nIdx !== endIdx) continue;

                const belok = curDir !== -1 && curDir !== d ? 18 : 0;
                const padat = Math.min(14, usage[nIdx] * 4);
                const ng = curG + 10 + belok + padat;
                if (seenStamp[nIdx] !== stamp || ng < gScore[nIdx]) {
                    seenStamp[nIdx] = stamp;
                    gScore[nIdx] = ng;
                    parent[nIdx] = cur;
                    dirArr[nIdx] = d;
                    const h = (Math.abs(e.c - nc) + Math.abs(e.r - nr)) * 10;
                    push(nIdx, ng + h);
                }
            }
        }

        if (!ketemu) {
            return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
        }

        const jalurSel = [];
        let cur = endIdx;
        while (cur !== -1) {
            usage[cur] += 1;
            const cr = Math.floor(cur / cols);
            const cc = cur - cr * cols;
            jalurSel.push({ x: cc * CELL + CELL / 2, y: cr * CELL + CELL / 2 });
            cur = parent[cur];
        }
        jalurSel.reverse();

        const titik = [p1];
        const awal = jalurSel[0];
        if (sisiA === 'R' || sisiA === 'L') titik.push({ x: awal.x, y: p1.y });
        else titik.push({ x: p1.x, y: awal.y });
        for (const pt of jalurSel) titik.push(pt);
        const akhirSel = jalurSel[jalurSel.length - 1];
        if (sisiB === 'R' || sisiB === 'L') titik.push({ x: akhirSel.x, y: p2.y });
        else titik.push({ x: p2.x, y: akhirSel.y });
        titik.push(p2);

        return buatKurvaSudut(titik);
    };
}

/** Halaman dinamis Diagram Database (ERD) bergaya peta auto-layout, Alur Data Sistem, dan Peta Endpoint API. */
export function TabArsitektur() {
    const el = document.createElement('div');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });

    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.sm });
    const kiriH = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = 'Diagram Database & Alur Data Sistem';
    Object.assign(h2.style, { margin: '0', fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal });
    const subH = document.createElement('small');
    subH.style.color = token.warna.teksRedup;
    subH.textContent = 'Otomatis membaca skema tabel, relasi, dan endpoint API yang sedang aktif.';
    kiriH.append(h2, subH);

    const kananH = document.createElement('div');
    Object.assign(kananH.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, flexWrap: 'wrap' });
    const ringkasBadge = document.createElement('div');
    Object.assign(ringkasBadge.style, { display: 'flex', gap: token.jarak.xs, flexWrap: 'wrap' });
    const btnMuat = tombol('Muat Ulang dari DB', () => void muat(), 'sekunder');
    kananH.append(ringkasBadge, btnMuat);
    header.append(kiriH, kananH);

    let subAktif = 'alur';
    let domainAktif = 'semua';
    let cariTeks = '';
    let tabelTerpilih = null;
    let skala = 0.72;
    let panX = 16;
    let panY = 16;
    let butuhFit = true;
    let butuhFokus = false;
    let data = null;
    let aktif = true;

    const subTabs = tab([
        { id: 'alur', label: 'Alur Data Sistem' },
        { id: 'erd', label: 'Diagram Database (ERD)' },
        { id: 'api', label: 'Peta Endpoint API' },
    ], 'alur', 'Tampilan Arsitektur', (id) => {
        subAktif = id;
        subTabs.pilih(id);
        if (id === 'erd') butuhFit = true;
        lukis();
    });

    const status = document.createElement('div');
    const isi = document.createElement('div');
    el.append(header, subTabs.el, status, isi);

    const bukaTabelDiErd = (namaTabel) => {
        const t = data?.tabel?.find((x) => x.nama === namaTabel);
        if (!t) return;
        tabelTerpilih = t.nama;
        domainAktif = 'semua';
        cariTeks = '';
        subAktif = 'erd';
        butuhFit = false;
        butuhFokus = true;
        subTabs.pilih('erd');
        lukis();
    };

    function lukisAlur() {
        const petaTabel = new Map((data.tabel || []).map((t) => [t.nama, t]));
        const petaDomain = new Map((data.domain || []).map((d) => [d.id, d]));

        const info = document.createElement('p');
        info.textContent = 'Klik nama tabel pada setiap tahap untuk langsung menyorot posisi, kolom, dan relasinya di Peta Database (ERD).';
        Object.assign(info.style, { margin: `0 0 ${token.jarak.md}`, color: token.warna.teksRedup, fontSize: token.huruf.ukuran.dasar });

        const grid = document.createElement('div');
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: token.jarak.md,
        });

        for (const tahap of data.alur || []) {
            const dom = petaDomain.get(tahap.domain);
            const w = token.warna.status[dom?.warna || 'biru'];
            const k = kartu({ susun: 'sm', style: { borderTop: `4px solid ${w.teks}` } });

            const atas = document.createElement('div');
            Object.assign(atas.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.xs });
            const judul = document.createElement('strong');
            judul.textContent = `${tahap.urutan}. ${tahap.judul}`;
            judul.style.fontSize = token.huruf.ukuran.besar;
            atas.append(judul, lencana(dom?.label || tahap.domain, dom?.warna || 'biru'));

            const desk = document.createElement('div');
            desk.textContent = tahap.ringkas;
            Object.assign(desk.style, { fontSize: token.huruf.ukuran.dasar, color: token.warna.teksRedup, lineHeight: '1.45' });

            const lblT = document.createElement('small');
            lblT.textContent = 'Tabel Terkait:';
            lblT.style.fontWeight = token.huruf.berat.tebal;
            const chips = document.createElement('div');
            Object.assign(chips.style, { display: 'flex', flexWrap: 'wrap', gap: '6px' });
            for (const namaT of tahap.tabel_utama || []) {
                const infoT = petaTabel.get(namaT);
                const btnT = document.createElement('button');
                btnT.type = 'button';
                btnT.textContent = infoT ? `${namaT} (${infoT.estimasi_baris})` : namaT;
                Object.assign(btnT.style, {
                    padding: '4px 9px', borderRadius: token.radius.pil, cursor: 'pointer',
                    border: `${token.ukuran.garis} solid ${token.warna.garis}`,
                    background: token.warna.kepalaTabel, color: token.warna.teks,
                    fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.sedang,
                });
                btnT.addEventListener('click', () => bukaTabelDiErd(namaT));
                chips.append(btnT);
            }

            const lblE = document.createElement('small');
            lblE.textContent = 'Endpoint Kunci:';
            lblE.style.fontWeight = token.huruf.berat.tebal;
            const eps = document.createElement('div');
            Object.assign(eps.style, { display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'monospace', fontSize: '11.5px', color: token.warna.teksRedup });
            for (const ep of tahap.endpoint_kunci || []) {
                const d = document.createElement('div');
                d.textContent = ep;
                eps.append(d);
            }

            k.append(atas, desk, lblT, chips, lblE, eps);
            grid.append(k);
        }

        isi.replaceChildren(info, grid);
    }

    function lukisErd() {
        const petaDomain = new Map((data.domain || []).map((d) => [d.id, d]));
        const q = cariTeks.trim().toLowerCase();
        const tabelTampil = (data.tabel || []).filter((t) => {
            if (domainAktif !== 'semua' && t.domain !== domainAktif) return false;
            if (!q) return true;
            return t.nama.toLowerCase().includes(q) || t.kolom.some((c) => c.nama.toLowerCase().includes(q));
        });
        const namaSet = new Set(tabelTampil.map((t) => t.nama));
        const relasiTampil = (data.relasi || []).filter((r) => namaSet.has(r.dari_tabel) && namaSet.has(r.ke_tabel));

        if (tabelTerpilih && !namaSet.has(tabelTerpilih)) tabelTerpilih = null;

        const peta = hitungTataLetakPeta(tabelTampil, relasiTampil, data.domain);

        // Baris kontrol filter domain, cari, zoom & fit
        const bar = document.createElement('div');
        Object.assign(bar.style, { display: 'flex', flexWrap: 'wrap', gap: token.jarak.sm, alignItems: 'center', marginBottom: token.jarak.md });

        const pills = document.createElement('div');
        Object.assign(pills.style, { display: 'flex', flexWrap: 'wrap', gap: '6px', flex: '1 1 auto' });
        for (const d of [{ id: 'semua', label: `Semua (${data.tabel.length})` }, ...(data.domain || [])]) {
            const on = domainAktif === d.id;
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = d.label;
            Object.assign(b.style, {
                height: '32px', padding: '0 12px', borderRadius: token.radius.pil, cursor: 'pointer',
                border: `${token.ukuran.garis} solid ${on ? token.warna.utama : token.warna.garis}`,
                background: on ? token.warna.utama : token.warna.permukaan,
                color: on ? token.warna.diAtasUtama : token.warna.teks,
                fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.tebal,
            });
            b.addEventListener('click', () => { domainAktif = d.id; butuhFit = true; lukisErd(); });
            pills.append(b);
        }

        const inCari = document.createElement('input');
        inCari.type = 'search';
        inCari.placeholder = 'Cari tabel atau kolom...';
        inCari.value = cariTeks;
        gayaInput(inCari);
        inCari.addEventListener('input', (e) => { cariTeks = e.target.value; butuhFit = true; lukisErd(); });

        const lblZoom = document.createElement('small');
        Object.assign(lblZoom, { textContent: `${Math.round(skala * 100)}%`, style: 'min-width:42px;text-align:center;' });

        const zoomBar = document.createElement('div');
        Object.assign(zoomBar.style, { display: 'inline-flex', gap: '4px', alignItems: 'center' });

        // Layout utama: peta interaktif kiri + inspector kanan
        const layout = document.createElement('div');
        Object.assign(layout.style, {
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: token.jarak.md,
            alignItems: 'start',
        });

        const kanvasBox = kartu({
            style: {
                padding: '0',
                overflow: 'hidden',
                height: '74vh',
                minHeight: '520px',
                position: 'relative',
                cursor: 'grab',
                userSelect: 'none',
                backgroundImage: `radial-gradient(${token.warna.garis} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            },
        });

        const stage = document.createElement('div');
        Object.assign(stage.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            width: `${peta.lebarKanvas}px`,
            height: `${peta.tinggiKanvas}px`,
            transformOrigin: '0 0',
            willChange: 'transform',
        });

        const terhubungSet = new Set();
        if (tabelTerpilih) {
            terhubungSet.add(tabelTerpilih);
            for (const r of relasiTampil) {
                if (r.dari_tabel === tabelTerpilih) terhubungSet.add(r.ke_tabel);
                if (r.ke_tabel === tabelTerpilih) terhubungSet.add(r.dari_tabel);
            }
        }

        // 1. Render SVG Garis Relasi + Panah (di bawah kartu tabel)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', String(peta.lebarKanvas));
        svg.setAttribute('height', String(peta.tinggiKanvas));
        Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', zIndex: '1' });

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const buatMarker = (id, warna) => {
            const mk = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            mk.setAttribute('id', id);
            mk.setAttribute('viewBox', '0 0 10 10');
            mk.setAttribute('refX', '8');
            mk.setAttribute('refY', '5');
            mk.setAttribute('markerWidth', '6');
            mk.setAttribute('markerHeight', '6');
            mk.setAttribute('orient', 'auto-start-reverse');
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', 'M 0 1.5 L 9 5 L 0 8.5 z');
            p.setAttribute('fill', warna);
            mk.append(p);
            return mk;
        };
        defs.append(
            buatMarker('panah-keluar', 'var(--warna-utama)'),
            buatMarker('panah-masuk', '#10b981'),
            buatMarker('panah-redup', '#64748b'),
        );
        svg.append(defs);

        // Distribusi titik sambung di setiap sisi kartu agar garis paralel tidak bertumpuk
        const portSisi = new Map();
        const daftarGaris = [];
        for (const r of relasiTampil) {
            const a = peta.posisiTabel.get(r.dari_tabel);
            const b = peta.posisiTabel.get(r.ke_tabel);
            if (!a || !b) continue;
            const cxA = a.x + a.w / 2;
            const cyA = a.y + a.h / 2;
            const cxB = b.x + b.w / 2;
            const cyB = b.y + b.h / 2;
            const horizontal = Math.abs(cxB - cxA) >= Math.abs(cyB - cyA);
            const sisiA = horizontal ? (cxB >= cxA ? 'R' : 'L') : (cyB >= cyA ? 'B' : 'T');
            const sisiB = horizontal ? (cxB >= cxA ? 'L' : 'R') : (cyB >= cyA ? 'T' : 'B');
            const kA = `${r.dari_tabel}:${sisiA}`;
            const kB = `${r.ke_tabel}:${sisiB}`;
            if (!portSisi.has(kA)) portSisi.set(kA, []);
            if (!portSisi.has(kB)) portSisi.set(kB, []);
            const idxA = portSisi.get(kA).length;
            portSisi.get(kA).push(horizontal ? cyB : cxB);
            const idxB = portSisi.get(kB).length;
            portSisi.get(kB).push(horizontal ? cyA : cxA);
            daftarGaris.push({ r, a, b, horizontal, sisiA, sisiB, kA, kB, idxA, idxB });
        }

        const hitungPort = (pos, sisi, k, idx) => {
            const daftar = portSisi.get(k) || [0];
            const total = daftar.length;
            const fraksi = total <= 1 ? 0.5 : 0.18 + (idx / (total - 1)) * 0.64;
            if (sisi === 'R') return { x: pos.x + pos.w, y: pos.y + pos.h * fraksi };
            if (sisi === 'L') return { x: pos.x, y: pos.y + pos.h * fraksi };
            if (sisi === 'B') return { x: pos.x + pos.w * fraksi, y: pos.y + pos.h };
            return { x: pos.x + pos.w * fraksi, y: pos.y };
        };

        const ruteGaris = buatRouterGarisErd(peta.posisiTabel, peta.lebarKanvas, peta.tinggiKanvas);

        for (const g of daftarGaris) {
            const { r, a, b, sisiA, sisiB, kA, kB, idxA, idxB } = g;
            const keluar = tabelTerpilih && r.dari_tabel === tabelTerpilih;
            const masuk = tabelTerpilih && r.ke_tabel === tabelTerpilih;
            const aktifGaris = keluar || masuk;

            let dPath;
            if (r.dari_tabel === r.ke_tabel) {
                const lx = a.x + a.w;
                const ly = a.y + 24;
                dPath = `M ${lx} ${ly} C ${lx + 38} ${ly - 22}, ${a.x + a.w - 18} ${a.y - 34}, ${a.x + a.w - 28} ${a.y}`;
            } else {
                const p1 = hitungPort(a, sisiA, kA, idxA);
                const p2 = hitungPort(b, sisiB, kB, idxB);
                dPath = ruteGaris(p1, sisiA, p2, sisiB);
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', dPath);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', keluar ? 'var(--warna-utama)' : masuk ? '#10b981' : '#64748b');
            path.setAttribute('stroke-width', aktifGaris ? '2.4' : tabelTerpilih ? '1.25' : '1.45');
            path.setAttribute('stroke-dasharray', r.jenis === 'konvensi' ? '5 4' : '');
            path.setAttribute('opacity', aktifGaris ? '0.96' : tabelTerpilih ? '0.28' : '0.72');
            path.setAttribute('marker-end', `url(#${keluar ? 'panah-keluar' : masuk ? 'panah-masuk' : 'panah-redup'})`);
            svg.append(path);
        }
        stage.append(svg);

        // 2. Render Kartu Tabel pada Posisi Peta
        for (const pos of peta.posisiTabel.values()) {
            const t = pos.tabel;
            const dom = petaDomain.get(t.domain);
            const w = token.warna.status[dom?.warna || 'abu'];
            const dipilih = t.nama === tabelTerpilih;
            const terkait = !tabelTerpilih || terhubungSet.has(t.nama);

            const card = document.createElement('button');
            card.type = 'button';
            Object.assign(card.style, {
                position: 'absolute',
                zIndex: '2',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${pos.w}px`,
                height: `${pos.h}px`,
                textAlign: 'left',
                padding: '9px 11px',
                borderRadius: token.radius.sedang,
                border: `1.5px solid ${dipilih ? token.warna.utama : token.warna.garis}`,
                borderTop: `3.5px solid ${w.teks}`,
                background: token.warna.permukaan,
                color: token.warna.teks,
                cursor: 'pointer',
                opacity: terkait ? '1' : '0.28',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                overflow: 'hidden',
                zIndex: dipilih ? '3' : '2',
                boxShadow: dipilih ? `0 0 0 3px ${token.warna.utamaLatar}` : '0 2px 6px rgba(0,0,0,0.12)',
            });
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                tabelTerpilih = tabelTerpilih === t.nama ? null : t.nama;
                butuhFit = false;
                butuhFokus = false;
                lukisErd();
            });

            const kep = document.createElement('div');
            Object.assign(kep.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' });
            const nm = document.createElement('strong');
            nm.textContent = t.nama;
            Object.assign(nm.style, { fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
            const cnt = document.createElement('small');
            cnt.textContent = `${t.kolom.length}k · ${t.estimasi_baris}b`;
            Object.assign(cnt.style, { color: token.warna.teksRedup, fontSize: '10.5px', flexShrink: '0' });
            kep.append(nm, cnt);

            const kolList = document.createElement('div');
            Object.assign(kolList.style, { display: 'flex', flexDirection: 'column', gap: '1.5px', fontSize: '11px', color: token.warna.teksRedup });
            for (const c of t.kolom.slice(0, 4)) {
                const row = document.createElement('div');
                Object.assign(row.style, { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
                row.textContent = `${c.kunci === 'PRI' ? '🔑 ' : c.nama.endsWith('_id') ? '🔗 ' : ''}${c.nama}`;
                kolList.append(row);
            }
            if (t.kolom.length > 4) {
                const more = document.createElement('small');
                more.textContent = `+ ${t.kolom.length - 4} kolom lainnya`;
                more.style.color = token.warna.utama;
                kolList.append(more);
            }

            card.append(kep, kolList);
            stage.append(card);
        }

        // 4. Minimap & Legenda di pojok kanvas
        const miniW = 168;
        const miniSkala = miniW / peta.lebarKanvas;
        const miniH = Math.max(76, Math.round(peta.tinggiKanvas * miniSkala));
        const minimap = document.createElement('div');
        Object.assign(minimap.style, {
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            width: `${miniW}px`,
            height: `${miniH}px`,
            borderRadius: '8px',
            border: `1px solid ${token.warna.garis}`,
            background: token.warna.permukaan,
            opacity: '0.92',
            zIndex: '10',
            overflow: 'hidden',
            cursor: 'crosshair',
            boxShadow: '0 4px 12px rgba(0,0,0,0.28)',
        });
        for (const pos of peta.posisiTabel.values()) {
            const dom = petaDomain.get(pos.tabel.domain);
            const w = token.warna.status[dom?.warna || 'abu'];
            const mt = document.createElement('div');
            Object.assign(mt.style, {
                position: 'absolute',
                left: `${pos.x * miniSkala}px`,
                top: `${pos.y * miniSkala}px`,
                width: `${Math.max(4, pos.w * miniSkala)}px`,
                height: `${Math.max(3, pos.h * miniSkala)}px`,
                background: w.latar,
                border: `1px solid ${w.teks}`,
                borderRadius: '1px',
            });
            minimap.append(mt);
        }
        if (tabelTerpilih && peta.posisiTabel.has(tabelTerpilih)) {
            const tp = peta.posisiTabel.get(tabelTerpilih);
            const dot = document.createElement('div');
            Object.assign(dot.style, {
                position: 'absolute',
                left: `${(tp.x + tp.w / 2) * miniSkala - 3}px`,
                top: `${(tp.y + tp.h / 2) * miniSkala - 3}px`,
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: token.warna.utama,
            });
            minimap.append(dot);
        }
        const miniViewport = document.createElement('div');
        Object.assign(miniViewport.style, {
            position: 'absolute',
            border: `1.5px solid ${token.warna.utama}`,
            background: 'rgba(14,165,233,0.12)',
            pointerEvents: 'none',
        });
        minimap.append(miniViewport);

        const legenda = document.createElement('div');
        Object.assign(legenda.style, {
            position: 'absolute',
            left: '12px',
            bottom: '12px',
            padding: '6px 10px',
            borderRadius: '8px',
            border: `1px solid ${token.warna.garis}`,
            background: token.warna.permukaan,
            opacity: '0.92',
            zIndex: '10',
            display: 'flex',
            gap: '10px',
            fontSize: '11px',
            color: token.warna.teksRedup,
            pointerEvents: 'none',
        });
        legenda.innerHTML = '<span>🖱️ Geser peta &amp; Scroll zoom</span><span style="color:var(--warna-utama)">● Merujuk ke</span><span style="color:#10b981">● Dirujuk oleh</span>';

        const terapkanTransform = () => {
            stage.style.transform = `translate(${panX}px, ${panY}px) scale(${skala})`;
            lblZoom.textContent = `${Math.round(skala * 100)}%`;
            const vw = kanvasBox.clientWidth || 800;
            const vh = kanvasBox.clientHeight || 520;
            miniViewport.style.left = `${(-panX / skala) * miniSkala}px`;
            miniViewport.style.top = `${(-panY / skala) * miniSkala}px`;
            miniViewport.style.width = `${(vw / skala) * miniSkala}px`;
            miniViewport.style.height = `${(vh / skala) * miniSkala}px`;
        };

        const sesuaikanLayar = () => {
            const vw = (kanvasBox.clientWidth || 900) - 24;
            const vh = (kanvasBox.clientHeight || 540) - 24;
            skala = Math.max(0.24, Math.min(1.05, Math.min(vw / peta.lebarKanvas, vh / peta.tinggiKanvas)));
            panX = Math.round((kanvasBox.clientWidth - peta.lebarKanvas * skala) / 2);
            panY = Math.round(Math.max(12, (kanvasBox.clientHeight - peta.tinggiKanvas * skala) / 2));
            terapkanTransform();
        };

        const fokusKeTabel = (nama) => {
            const p = peta.posisiTabel.get(nama);
            if (!p) return;
            skala = Math.max(skala, 0.85);
            const vw = kanvasBox.clientWidth || 800;
            const vh = kanvasBox.clientHeight || 520;
            panX = Math.round(vw / 2 - (p.x + p.w / 2) * skala);
            panY = Math.round(vh / 2 - (p.y + p.h / 2) * skala);
            terapkanTransform();
        };

        zoomBar.append(
            tombol('-', () => { skala = Math.max(0.24, +(skala - 0.12).toFixed(2)); terapkanTransform(); }, 'sekunder'),
            lblZoom,
            tombol('+', () => { skala = Math.min(1.4, +(skala + 0.12).toFixed(2)); terapkanTransform(); }, 'sekunder'),
            tombol('Sesuaikan', () => sesuaikanLayar(), 'sekunder'),
            tombol('Fokus', () => { if (tabelTerpilih) fokusKeTabel(tabelTerpilih); }, 'sekunder'),
        );
        bar.append(pills, inCari, zoomBar);

        // Interaksi drag/pan & wheel zoom pada kanvas
        let menyeret = false;
        let awalX = 0;
        let awalY = 0;
        kanvasBox.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button') || e.target.closest('[data-minimap]')) return;
            menyeret = true;
            awalX = e.clientX - panX;
            awalY = e.clientY - panY;
            kanvasBox.style.cursor = 'grabbing';
            kanvasBox.setPointerCapture(e.pointerId);
        });
        kanvasBox.addEventListener('pointermove', (e) => {
            if (!menyeret) return;
            panX = e.clientX - awalX;
            panY = e.clientY - awalY;
            terapkanTransform();
        });
        const lepasSeret = () => {
            menyeret = false;
            kanvasBox.style.cursor = 'grab';
        };
        kanvasBox.addEventListener('pointerup', lepasSeret);
        kanvasBox.addEventListener('pointercancel', lepasSeret);
        kanvasBox.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = kanvasBox.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const faktor = e.deltaY < 0 ? 1.1 : 0.9;
            const baru = Math.max(0.24, Math.min(1.4, +(skala * faktor).toFixed(3)));
            panX = mx - ((mx - panX) * baru) / skala;
            panY = my - ((my - panY) * baru) / skala;
            skala = baru;
            terapkanTransform();
        }, { passive: false });

        minimap.dataset.minimap = '1';
        minimap.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = minimap.getBoundingClientRect();
            const mapX = (e.clientX - rect.left) / miniSkala;
            const mapY = (e.clientY - rect.top) / miniSkala;
            panX = Math.round((kanvasBox.clientWidth || 800) / 2 - mapX * skala);
            panY = Math.round((kanvasBox.clientHeight || 520) / 2 - mapY * skala);
            terapkanTransform();
        });

        kanvasBox.append(stage, minimap, legenda);

        // Panel Inspector Detail Tabel di kanan
        const insp = kartu({ susun: 'sm', style: { maxHeight: '74vh', overflowY: 'auto' } });
        const detail = (data.tabel || []).find((t) => t.nama === tabelTerpilih);
        if (!detail) {
            insp.append('Pilih salah satu tabel di peta untuk melihat detail kolom dan relasinya.');
        } else {
            const dom = petaDomain.get(detail.domain);
            const hD = document.createElement('h3');
            hD.textContent = detail.nama;
            hD.style.margin = '0';
            insp.append(hD, lencana(dom?.label || detail.domain, dom?.warna || 'abu'));

            const relKeluar = (data.relasi || []).filter((r) => r.dari_tabel === detail.nama);
            const relMasuk = (data.relasi || []).filter((r) => r.ke_tabel === detail.nama);

            if (relKeluar.length) {
                const s1 = document.createElement('strong'); s1.textContent = `Merujuk ke (${relKeluar.length}):`;
                insp.append(s1);
                const list1 = document.createElement('div');
                Object.assign(list1.style, { display: 'flex', flexDirection: 'column', gap: '4px' });
                for (const r of relKeluar) {
                    const btn = tombol(`${r.dari_kolom} → ${r.ke_tabel}.${r.ke_kolom}`, () => bukaTabelDiErd(r.ke_tabel), 'teks');
                    btn.style.cssText = 'justify-content:flex-start;padding:2px 6px;height:auto;font-size:12px;';
                    list1.append(btn);
                }
                insp.append(list1);
            }

            if (relMasuk.length) {
                const s2 = document.createElement('strong'); s2.textContent = `Dirujuk oleh (${relMasuk.length}):`;
                insp.append(s2);
                const list2 = document.createElement('div');
                Object.assign(list2.style, { display: 'flex', flexDirection: 'column', gap: '4px' });
                for (const r of relMasuk) {
                    const btn = tombol(`${r.dari_tabel}.${r.dari_kolom}`, () => bukaTabelDiErd(r.dari_tabel), 'teks');
                    btn.style.cssText = 'justify-content:flex-start;padding:2px 6px;height:auto;font-size:12px;';
                    list2.append(btn);
                }
                insp.append(list2);
            }

            const s3 = document.createElement('strong'); s3.textContent = `Daftar Kolom (${detail.kolom.length}):`;
            insp.append(s3);
            const kolWrap = document.createElement('div');
            Object.assign(kolWrap.style, { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' });
            for (const c of detail.kolom) {
                const row = document.createElement('div');
                Object.assign(row.style, {
                    display: 'flex', justifyContent: 'space-between', gap: '8px',
                    padding: '4px 6px', borderRadius: '6px', background: token.warna.kepalaTabel,
                });
                const kiriK = document.createElement('span');
                kiriK.textContent = `${c.kunci === 'PRI' ? 'PK ' : ''}${c.nama}`;
                kiriK.style.fontWeight = c.kunci === 'PRI' ? token.huruf.berat.tebal : token.huruf.berat.biasa;
                const kananK = document.createElement('span');
                kananK.textContent = `${c.tipe}${c.nullable ? ' ?' : ''}`;
                kananK.style.color = token.warna.teksRedup;
                row.append(kiriK, kananK);
                kolWrap.append(row);
            }
            insp.append(kolWrap);
        }

        layout.append(kanvasBox, insp);
        isi.replaceChildren(bar, layout);

        requestAnimationFrame(() => {
            if (!kanvasBox.isConnected) return;
            if (butuhFokus && tabelTerpilih) {
                butuhFokus = false;
                fokusKeTabel(tabelTerpilih);
            } else if (butuhFit) {
                butuhFit = false;
                sesuaikanLayar();
            } else {
                terapkanTransform();
            }
        });
    }

    function lukisApi() {
        const q = cariTeks.trim().toLowerCase();
        const daftar = (data.endpoint || []).filter((e) => !q || e.jalur.toLowerCase().includes(q) || e.metode.toLowerCase().includes(q));

        const bar = document.createElement('div');
        Object.assign(bar.style, { display: 'flex', gap: token.jarak.sm, alignItems: 'center', marginBottom: token.jarak.md });
        const inCari = document.createElement('input');
        inCari.type = 'search';
        inCari.placeholder = 'Cari endpoint (mis. /keuangan, /pasien, POST)...';
        inCari.value = cariTeks;
        gayaInput(inCari);
        inCari.style.flex = '1';
        inCari.addEventListener('input', (e) => { cariTeks = e.target.value; lukisApi(); });
        const info = document.createElement('small');
        info.textContent = `${daftar.length} dari ${data.endpoint?.length ?? 0} endpoint`;
        info.style.color = token.warna.teksRedup;
        bar.append(inCari, info);

        const box = kartu({ style: { padding: '0', overflow: 'hidden' } });
        const tbl = tabel(['Metode', 'Jalur Endpoint API', 'Modul'], 'Peta Endpoint API');
        for (const r of daftar) {
            const modul = r.jalur.replace(/^\/api\//, '').split('/')[0] || 'umum';
            const jalurEl = document.createElement('code');
            jalurEl.textContent = r.jalur;
            tbl.tbody.append(baris(sel(lencana(r.metode, WARNA_METODE[r.metode] || 'abu')), sel(jalurEl), sel(modul)));
        }
        box.append(tbl.el);
        isi.replaceChildren(bar, box);
    }

    function lukis() {
        if (!data) return;
        ringkasBadge.replaceChildren(
            lencana(`${data.tabel?.length ?? 0} Tabel`, 'biru'),
            lencana(`${data.relasi?.length ?? 0} Relasi`, 'hijau'),
            lencana(`${data.endpoint?.length ?? 0} Endpoint`, 'ungu'),
        );
        if (subAktif === 'alur') lukisAlur();
        else if (subAktif === 'erd') lukisErd();
        else lukisApi();
    }

    async function muat() {
        status.replaceChildren();
        btnMuat.disabled = true;
        try {
            data = await panggilApi('GET', '/arsitektur/skema');
            if (!aktif) return;
            lukis();
        } catch (e) {
            if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : 'Gagal memuat metadata arsitektur sistem.'));
        } finally {
            btnMuat.disabled = false;
        }
    }

    void muat();
    el.tutup = () => { aktif = false; };
    return el;
}
