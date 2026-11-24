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
const JARAK_MIN_X = 84;
const JARAK_MIN_Y = 68;
const PAD_KANVAS = 64;

const hitungTinggiKartu = (t) => Math.max(96, 50 + (t?.kolom?.length || 0) * 17);

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
function hitungTataLetakPeta(tabelList, relasiList, akarUtama = null) {
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
        if (akarUtama) {
            if (a.nama === akarUtama) return -1;
            if (b.nama === akarUtama) return 1;
        }
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
    const butuhX = KARTU_L + JARAK_MIN_X;
    const kolTotal = Math.max(4, Math.min(14, Math.ceil(Math.sqrt(n * 1.75))));
    const brsTotal = Math.max(2, Math.ceil(n / kolTotal));
    const slotTerisi = new Set();

    // Titik pusat di pojok kiri-atas (0, 0), mengalir ke kanan dan ke bawah mengikuti alur BFS
    terurut.forEach((t, idx) => {
        let tx = 0;
        let ty = 0;
        if (idx > 0) {
            let sumC = 0;
            let sumR = 0;
            let cnt = 0;
            for (const nbNama of tetangga.get(t.nama) || []) {
                const nb = simpul.get(nbNama);
                if (nb) {
                    sumC += nb.col;
                    sumR += nb.row;
                    cnt += 1;
                }
            }
            if (cnt > 0) {
                tx = Math.min(kolTotal - 1, sumC / cnt + 0.55);
                ty = Math.min(brsTotal - 1, sumR / cnt + 0.35);
            } else {
                tx = 0;
                ty = Math.min(brsTotal - 1, Math.floor(idx / kolTotal));
            }
        }

        let bestC = 0;
        let bestR = 0;
        let bestSkor = Infinity;
        for (let r = 0; r < brsTotal; r += 1) {
            for (let c = 0; c < kolTotal; c += 1) {
                if (slotTerisi.has(`${c},${r}`)) continue;
                const dist2 = (c - tx) * (c - tx) + (r - ty) * (r - ty) + 0.06 * (c + r);
                if (dist2 < bestSkor) {
                    bestSkor = dist2;
                    bestC = c;
                    bestR = r;
                }
            }
        }
        slotTerisi.add(`${bestC},${bestR}`);
        simpul.set(t.nama, { tabel: t, col: bestC, row: bestR });
    });

    const daftarSimpul = [...simpul.values()];

    // Optimasi keterbacaan jalur (2-opt): beri ruang napas antar-hub berderajat tinggi dan kurangi jalur menyilang
    const skorKeterbacaanNode = (node, col, row) => {
        const dNode = derajat.get(node.tabel.nama) ?? 0;
        let skor = 0;
        for (const nbNama of tetangga.get(node.tabel.nama) || []) {
            const nb = simpul.get(nbNama);
            if (!nb) continue;
            const dx = Math.abs(col - nb.col);
            const dy = Math.abs(row - nb.row);
            // Penalti lebih besar untuk garis yang melompati banyak baris/kolom, namun tetap beri jarak bagi hub padat
            skor += dx + dy + (dx > 0 && dy > 0 ? 1.5 : 0);
        }
        if (dNode >= 6) {
            for (const lain of daftarSimpul) {
                if (lain === node) continue;
                const dLain = derajat.get(lain.tabel.nama) ?? 0;
                if (dLain >= 6) {
                    const dist = Math.abs(col - lain.col) + Math.abs(row - lain.row);
                    if (dist <= 1) skor += 14;
                    else if (dist === 2) skor += 5;
                }
            }
        }
        return skor;
    };
    for (let putaran = 0; putaran < 3; putaran += 1) {
        let adaTukar = false;
        for (let i = 1; i < n; i += 1) {
            const a = daftarSimpul[i];
            for (let j = i + 1; j < n; j += 1) {
                const b = daftarSimpul[j];
                if (Math.abs(a.col - b.col) + Math.abs(a.row - b.row) > 4) continue;
                const sebelum = skorKeterbacaanNode(a, a.col, a.row) + skorKeterbacaanNode(b, b.col, b.row);
                const sesudah = skorKeterbacaanNode(a, b.col, b.row) + skorKeterbacaanNode(b, a.col, a.row);
                if (sesudah + 0.1 < sebelum) {
                    const tc = a.col;
                    const tr = a.row;
                    a.col = b.col;
                    a.row = b.row;
                    b.col = tc;
                    b.row = tr;
                    adaTukar = true;
                }
            }
        }
        if (!adaTukar) break;
    }

    let minCol = Infinity;
    let minRow = Infinity;
    let maxCol = 0;
    let maxRow = 0;
    for (const s of daftarSimpul) {
        minCol = Math.min(minCol, s.col);
        minRow = Math.min(minRow, s.row);
        maxCol = Math.max(maxCol, s.col);
        maxRow = Math.max(maxRow, s.row);
    }

    const jmlKolAktif = Math.max(1, maxCol - minCol + 1);
    const jmlBrsAktif = Math.max(1, maxRow - minRow + 1);
    const tinggiBaris = new Array(jmlBrsAktif).fill(KARTU_T);
    for (const s of daftarSimpul) {
        const r = s.row - minRow;
        tinggiBaris[r] = Math.max(tinggiBaris[r], hitungTinggiKartu(s.tabel));
    }
    const yBaris = new Array(jmlBrsAktif).fill(PAD_KANVAS);
    for (let r = 1; r < jmlBrsAktif; r += 1) {
        yBaris[r] = yBaris[r - 1] + tinggiBaris[r - 1] + JARAK_MIN_Y;
    }

    for (const s of daftarSimpul) {
        const col = s.col - minCol;
        const row = s.row - minRow;
        posisiTabel.set(s.tabel.nama, {
            tabel: s.tabel,
            x: PAD_KANVAS + col * butuhX,
            y: yBaris[row],
            w: KARTU_L,
            h: hitungTinggiKartu(s.tabel),
        });
    }

    let lebarTotal = Math.max(960, PAD_KANVAS * 2 + (jmlKolAktif - 1) * butuhX + KARTU_L);
    let tinggiTotal = Math.max(560, yBaris[jmlBrsAktif - 1] + tinggiBaris[jmlBrsAktif - 1] + PAD_KANVAS);

    // Jika ada tabel terisolasi (tanpa relasi), susun rata kiri di baris bawah kanvas
    if (tabelTerhubung.length && tabelTerisolasi.length) {
        const perBaris = Math.max(4, jmlKolAktif);
        const jmlBrsIso = Math.ceil(tabelTerisolasi.length / perBaris);
        const tinggiIso = new Array(jmlBrsIso).fill(KARTU_T);
        tabelTerisolasi.forEach((t, idx) => {
            const brs = Math.floor(idx / perBaris);
            tinggiIso[brs] = Math.max(tinggiIso[brs], hitungTinggiKartu(t));
        });
        const yIso = new Array(jmlBrsIso).fill(tinggiTotal);
        for (let r = 1; r < jmlBrsIso; r += 1) {
            yIso[r] = yIso[r - 1] + tinggiIso[r - 1] + JARAK_MIN_Y;
        }
        tabelTerisolasi.forEach((t, idx) => {
            const kol = idx % perBaris;
            const brs = Math.floor(idx / perBaris);
            const x = PAD_KANVAS + kol * butuhX;
            const y = yIso[brs];
            const h = hitungTinggiKartu(t);
            posisiTabel.set(t.nama, { tabel: t, x, y, w: KARTU_L, h });
            lebarTotal = Math.max(lebarTotal, x + KARTU_L + PAD_KANVAS);
            tinggiTotal = Math.max(tinggiTotal, y + h + PAD_KANVAS);
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
    const CELL = 16;
    const PAD_OBS = 10;
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

    const bebasHalangan = (x1, y1, x2, y2) => {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (const pos of posisiTabel.values()) {
            const diUjung1 = x1 >= pos.x - 1 && x1 <= pos.x + pos.w + 1 && y1 >= pos.y - 1 && y1 <= pos.y + pos.h + 1;
            const diUjung2 = x2 >= pos.x - 1 && x2 <= pos.x + pos.w + 1 && y2 >= pos.y - 1 && y2 <= pos.y + pos.h + 1;
            if (diUjung1 || diUjung2) continue;
            if (maxX >= pos.x - 4 && minX <= pos.x + pos.w + 4 && maxY >= pos.y - 4 && minY <= pos.y + pos.h + 4) {
                return false;
            }
        }
        return true;
    };

    return (p1, sisiA, p2, sisiB) => {
        if (((sisiA === 'B' && sisiB === 'T') || (sisiA === 'T' && sisiB === 'B')) && Math.abs(p1.x - p2.x) <= 8 && bebasHalangan(p1.x, p1.y, p2.x, p2.y)) {
            const xLurus = (p1.x + p2.x) / 2;
            return `M ${xLurus} ${p1.y} L ${xLurus} ${p2.y}`;
        }
        if (((sisiA === 'R' && sisiB === 'L') || (sisiA === 'L' && sisiB === 'R')) && Math.abs(p1.y - p2.y) <= 8 && bebasHalangan(p1.x, p1.y, p2.x, p2.y)) {
            const yLurus = (p1.y + p2.y) / 2;
            return `M ${p1.x} ${yLurus} L ${p2.x} ${yLurus}`;
        }

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
        while (heapSize > 0 && ekspansi < 120000) {
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

                const belok = curDir !== -1 && curDir !== d ? 26 : 0;
                const padat = Math.min(44, usage[nIdx] * 22);
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

/** Halaman dinamis Diagram Database (ERD) bergaya peta auto-layout, Alur Layanan, dan Peta Endpoint API. */
export function TabArsitektur() {
    const el = document.createElement('div');
    Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });

    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: token.jarak.sm });
    const kiriH = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = 'Diagram Database & Alur Layanan';
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
        { id: 'alur', label: 'Alur Layanan' },
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
        cariTeks = '';
        subAktif = 'erd';
        butuhFit = true;
        butuhFokus = false;
        subTabs.pilih('erd');
        lukis();
    };

    let tahapTerpilih = null;

    function lukisAlur() {
        const petaTabel = new Map((data.tabel || []).map((t) => [t.nama, t]));
        const petaDomain = new Map((data.domain || []).map((d) => [d.id, d]));

        // Flowchart standar ISO 100% sesuai modul Klira (tanpa penomoran, arah ke bawah)
        const nodeAlur = [
            {
                id: 'start',
                bentuk: 'oval',
                judul: 'Pasien Datang',
                domain: 'pasien',
                ringkas: 'Pasien tiba di fasyankes untuk mendapatkan layanan.',
                tabel: ['pasien'],
                endpoint: ['POST /api/pasien'],
                x: 450,
                y: 24,
                w: 190,
                h: 48,
            },
            {
                id: 'daftar',
                bentuk: 'rect',
                judul: 'Pendaftaran & Kunjungan',
                domain: 'pasien',
                ringkas: 'Registrasi pasien, pembuatan kunjungan, & nomor antrean.',
                tabel: ['pasien', 'kunjungan', 'antrean', 'sesi_antrean'],
                endpoint: ['POST /api/pasien', 'POST /api/kunjungan', 'GET /api/antrean'],
                x: 435,
                y: 124,
                w: 220,
                h: 90,
            },
            {
                id: 'dec_layanan',
                bentuk: 'diamond',
                judul: 'Jenis Layanan?',
                domain: 'klinis',
                ringkas: 'Pemilihan alur kunjungan: Rawat Jalan, UGD, Admisi Ranap, atau Hanya Penunjang.',
                tabel: ['kunjungan', 'antrean', 'ugd_kunjungan', 'rawat_inap'],
                endpoint: ['POST /api/kunjungan', 'POST /api/rawat-inap/admisi'],
                x: 435,
                y: 268,
                w: 220,
                h: 92,
            },
            {
                id: 'skrining',
                bentuk: 'rect',
                judul: 'Skrining Perawat',
                domain: 'klinis',
                ringkas: 'Tanda Vital, Alergi, Keluhan awal, Nyeri & Gizi.',
                tabel: ['pemeriksaan', 'pengesahan_catatan'],
                endpoint: ['GET /api/kunjungan/:id/klinis', 'PUT /api/kunjungan/:id/klinis/:bagian'],
                x: 130,
                y: 420,
                w: 215,
                h: 90,
            },
            {
                id: 'ugd',
                bentuk: 'rect',
                judul: 'Layanan UGD & Observasi',
                domain: 'klinis',
                ringkas: 'Triase gawat darurat, observasi berkala, & stabilisasi.',
                tabel: ['ugd_kunjungan', 'observasi', 'tindakan'],
                endpoint: ['GET /api/kunjungan/:id/ugd', 'PUT /api/kunjungan/:id/ugd'],
                x: 438,
                y: 420,
                w: 215,
                h: 90,
            },
            {
                id: 'lab_saja',
                bentuk: 'rect',
                judul: 'Lab & Penunjang (Langsung)',
                domain: 'penunjang',
                ringkas: 'Kunjungan khusus order lab/penunjang: spesimen, hasil & validasi.',
                tabel: ['order_penunjang', 'hasil_penunjang', 'spesimen'],
                endpoint: ['POST /api/kunjungan/:id/penunjang/order', 'PUT /api/penunjang/order/:id/hasil', 'POST /api/penunjang/order/:id/validasi'],
                x: 750,
                y: 420,
                w: 225,
                h: 90,
            },
            {
                id: 'dec_poli',
                bentuk: 'diamond',
                judul: 'Jenis Poli?',
                domain: 'klinis',
                ringkas: 'Menentukan poli pemeriksaan dokter sesuai kebutuhan klinis.',
                tabel: ['kunjungan', 'lokasi'],
                endpoint: ['GET /api/kunjungan/:id'],
                x: 128,
                y: 568,
                w: 220,
                h: 92,
            },
            {
                id: 'poli_umum',
                bentuk: 'rect',
                judul: 'Poli Umum & Spesialis',
                domain: 'klinis',
                ringkas: 'SOAPIE, Pemeriksaan Fisik, Diagnosis ICD-10, & Tindakan.',
                tabel: ['pemeriksaan', 'diagnosis', 'tindakan'],
                endpoint: ['POST /api/kunjungan/:id/selesai', 'PUT /api/kunjungan/:id/klinis/:bagian'],
                x: 24,
                y: 720,
                w: 196,
                h: 90,
            },
            {
                id: 'poli_gigi',
                bentuk: 'rect',
                judul: 'Poli Gigi & Mulut',
                domain: 'klinis',
                ringkas: 'Odontogram gigi, kondisi karies/restorasi, & tindakan.',
                tabel: ['odontogram_pasien', 'pemeriksaan', 'tindakan'],
                endpoint: ['GET /api/kunjungan/:id/odontogram', 'PUT /api/kunjungan/:id/odontogram'],
                x: 256,
                y: 720,
                w: 196,
                h: 90,
            },
            {
                id: 'poli_kia',
                bentuk: 'rect',
                judul: 'Poli KIA, KB & Imunisasi',
                domain: 'klinis',
                ringkas: 'ANC kehamilan, nifas/PNC, layanan KB, & imunisasi.',
                tabel: ['kia_kunjungan', 'pemeriksaan'],
                endpoint: ['GET /api/kunjungan/:id/kia', 'PUT /api/kunjungan/:id/kia'],
                x: 488,
                y: 720,
                w: 196,
                h: 90,
            },
            {
                id: 'dec_lab',
                bentuk: 'diamond',
                judul: 'Perlu Lab?',
                domain: 'penunjang',
                ringkas: 'Opsional: order pemeriksaan lab/penunjang lalu hasil dikembalikan ke dokter.',
                tabel: ['order_penunjang', 'hasil_penunjang'],
                endpoint: ['POST /api/kunjungan/:id/penunjang/order'],
                x: 244,
                y: 872,
                w: 220,
                h: 92,
            },
            {
                id: 'lab',
                bentuk: 'rect',
                judul: 'Lab & Penunjang',
                domain: 'penunjang',
                ringkas: 'Pengambilan spesimen, input hasil, & validasi oleh analis.',
                tabel: ['order_penunjang', 'hasil_penunjang', 'spesimen'],
                endpoint: ['POST /api/penunjang/order/:id/spesimen', 'PUT /api/penunjang/order/:id/hasil', 'POST /api/penunjang/order/:id/validasi'],
                x: 750,
                y: 872,
                w: 225,
                h: 90,
            },
            {
                id: 'dec_lanjut',
                bentuk: 'diamond',
                judul: 'Tindak Lanjut?',
                domain: 'farmasi',
                ringkas: 'Menentukan tindak lanjut: Farmasi, Rawat Inap, Rujukan, atau langsung Kasir.',
                tabel: ['resep', 'rawat_inap', 'tindak_lanjut'],
                endpoint: ['PUT /api/kunjungan/:id/resep', 'POST /api/kunjungan/:id/selesai'],
                x: 244,
                y: 1024,
                w: 220,
                h: 92,
            },
            {
                id: 'farmasi',
                bentuk: 'rect',
                judul: 'Farmasi & Racikan',
                domain: 'farmasi',
                ringkas: 'Telaah resep, peracikan obat/puyer, & penyerahan ke pasien.',
                tabel: ['resep', 'item_resep', 'stok_obat'],
                endpoint: ['PUT /api/kunjungan/:id/resep'],
                x: 750,
                y: 1024,
                w: 225,
                h: 90,
            },
            {
                id: 'ranap_admisi',
                bentuk: 'rect',
                judul: 'Admisi & Penempatan Bed',
                domain: 'penunjang',
                ringkas: 'Pendaftaran rawat inap, pemilihan DPJP, kamar & bed.',
                tabel: ['rawat_inap', 'tempat_tidur'],
                endpoint: ['POST /api/rawat-inap/admisi', 'GET /api/rawat-inap/papan', 'PUT /api/kunjungan/:id/penempatan'],
                x: 24,
                y: 1178,
                w: 205,
                h: 90,
            },
            {
                id: 'ranap_cppt',
                bentuk: 'rect',
                judul: 'Perawatan Ranap & CPPT',
                domain: 'penunjang',
                ringkas: 'Catatan CPPT harian & ringkasan pemulangan rawat inap.',
                tabel: ['cppt', 'pemeriksaan'],
                endpoint: ['POST /api/kunjungan/:id/cppt', 'POST /api/kunjungan/:id/pemulangan'],
                x: 274,
                y: 1178,
                w: 205,
                h: 90,
            },
            {
                id: 'rujukan',
                bentuk: 'rect',
                judul: 'Rujukan & Kontrol',
                domain: 'pasien',
                ringkas: 'Tindak lanjut rujukan ke RS/FKTL atau jadwal kontrol ulang.',
                tabel: ['tindak_lanjut', 'kunjungan'],
                endpoint: ['POST /api/kunjungan/:id/selesai'],
                x: 564,
                y: 1178,
                w: 200,
                h: 90,
            },
            {
                id: 'kasir',
                bentuk: 'rect',
                judul: 'Kasir, Klaim & Akuntansi',
                domain: 'keuangan',
                ringkas: 'Tagihan kunjungan, pembayaran kasir, klaim JKN, & jurnal.',
                tabel: ['tagihan', 'pembayaran', 'klaim', 'jurnal', 'detail_jurnal', 'akun_keuangan'],
                endpoint: ['GET /api/kunjungan/:id/tagihan', 'POST /api/kunjungan/:id/pembayaran', 'GET /api/keuangan/ringkasan'],
                x: 420,
                y: 1348,
                w: 220,
                h: 90,
            },
            {
                id: 'integrasi',
                bentuk: 'cylinder',
                judul: 'SATUSEHAT & BPJS PCare',
                domain: 'integrasi',
                ringkas: 'Sinkronisasi FHIR & integrasi BPJS PCare / Antrean JKN.',
                tabel: ['kredensial_satusehat', 'kredensial_pcare', 'pemetaan_bpjs', 'log_audit'],
                endpoint: ['GET /api/satusehat/status', 'GET /api/pcare/status'],
                x: 750,
                y: 1348,
                w: 225,
                h: 90,
            },
            {
                id: 'selesai',
                bentuk: 'oval',
                judul: 'Pasien Pulang / Selesai',
                domain: 'keuangan',
                ringkas: 'Kunjungan selesai dan seluruh data pelayanan tersimpan.',
                tabel: ['kunjungan', 'pembayaran'],
                endpoint: ['POST /api/kunjungan/:id/selesai'],
                x: 435,
                y: 1492,
                w: 190,
                h: 48,
            },
        ];

        const petaNode = new Map(nodeAlur.map((n) => [n.id, n]));
        const panahAlur = [
            { dari: 'start', ke: 'daftar', label: '' },
            { dari: 'daftar', ke: 'dec_layanan', label: '' },
            { dari: 'dec_layanan', ke: 'skrining', label: 'Rawat Jalan' },
            { dari: 'dec_layanan', ke: 'ugd', label: 'Darurat (UGD)' },
            { dari: 'dec_layanan', ke: 'lab_saja', label: 'Hanya Lab', jenis: 'opsional' },
            { dari: 'skrining', ke: 'dec_poli', label: '' },
            { dari: 'dec_poli', ke: 'poli_umum', label: 'Umum' },
            { dari: 'dec_poli', ke: 'poli_gigi', label: 'Gigi' },
            { dari: 'dec_poli', ke: 'poli_kia', label: 'KIA / KB' },
            { dari: 'poli_umum', ke: 'dec_lab', label: '' },
            { dari: 'poli_gigi', ke: 'dec_lab', label: '' },
            { dari: 'poli_kia', ke: 'dec_lab', label: '' },
            { dari: 'ugd', ke: 'dec_lab', label: '' },
            { dari: 'dec_lab', ke: 'lab', label: 'Ya (Order)', jenis: 'opsional' },
            { dari: 'lab', ke: 'dec_lab', label: 'Hasil kembali', jenis: 'kembali' },
            { dari: 'dec_lab', ke: 'dec_lanjut', label: 'Tidak / Ada' },
            { dari: 'dec_lanjut', ke: 'farmasi', label: 'Resep', jenis: 'opsional' },
            { dari: 'dec_lanjut', ke: 'ranap_admisi', label: 'Opname', jenis: 'opsional' },
            { dari: 'dec_lanjut', ke: 'rujukan', label: 'Rujuk', jenis: 'opsional' },
            { dari: 'dec_lanjut', ke: 'kasir', label: 'Langsung', jenis: 'opsional' },
            { dari: 'ranap_admisi', ke: 'ranap_cppt', label: 'CPPT' },
            { dari: 'ranap_cppt', ke: 'rujukan', label: 'Rujuk RS', jenis: 'opsional' },
            { dari: 'ranap_cppt', ke: 'kasir', label: 'Pemulangan' },
            { dari: 'lab_saja', ke: 'kasir', label: 'Selesai Lab', jenis: 'opsional' },
            { dari: 'farmasi', ke: 'kasir', label: '' },
            { dari: 'rujukan', ke: 'kasir', label: '' },
            { dari: 'kasir', ke: 'integrasi', label: 'FHIR / PCare', jenis: 'opsional' },
            { dari: 'kasir', ke: 'selesai', label: '' },
        ];

        if (!tahapTerpilih || !petaNode.has(tahapTerpilih)) tahapTerpilih = 'dec_layanan';

        const info = document.createElement('p');
        info.textContent = 'Diagram alur layanan standar flowchart (Oval: Mulai/Selesai, Belah Ketupat: Keputusan, Persegi: Proses, Silinder: Sistem Eksternal). Klik bentuk apa saja untuk melihat detail.';
        Object.assign(info.style, { margin: `0 0 ${token.jarak.md}`, color: token.warna.teksRedup, fontSize: token.huruf.ukuran.dasar });

        const layout = document.createElement('div');
        Object.assign(layout.style, {
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: token.jarak.md,
            alignItems: 'start',
        });

        const kanvasAlur = kartu({
            style: {
                padding: '0',
                overflow: 'auto',
                height: 'calc(100vh - 280px)',
                minHeight: '480px',
                position: 'relative',
                backgroundImage: `radial-gradient(${token.warna.garis} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            },
        });

        const stage = document.createElement('div');
        const lebarStage = 1040;
        const tinggiStage = 1565;
        Object.assign(stage.style, { position: 'relative', width: `${lebarStage}px`, height: `${tinggiStage}px`, margin: '12px auto' });

        // SVG panah antar bentuk flowchart menggunakan router koridor A*
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', String(lebarStage));
        svg.setAttribute('height', String(tinggiStage));
        Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', zIndex: '1' });

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const buatPanah = (id, warna) => {
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
            buatPanah('alur-utama', '#0ea5e9'),
            buatPanah('alur-kembali', '#10b981'),
            buatPanah('alur-normal', '#64748b'),
        );
        svg.append(defs);

        const petaPosAlur = new Map(nodeAlur.map((n) => [n.id, { x: n.x, y: n.y, w: n.w, h: n.h }]));
        const ruteAlur = buatRouterGarisErd(petaPosAlur, lebarStage, tinggiStage);

        const portKeluar = new Map();
        const portMasuk = new Map();
        const daftarPanah = panahAlur.map((e, idx) => {
            const a = petaNode.get(e.dari);
            const b = petaNode.get(e.ke);
            let sisiA = 'B';
            let sisiB = 'T';
            if (e.dari === 'dec_layanan' && e.ke === 'skrining') {
                sisiA = 'L';
                sisiB = 'T';
            } else if (e.dari === 'dec_layanan' && e.ke === 'lab_saja') {
                sisiA = 'R';
                sisiB = 'T';
            } else if (e.dari === 'dec_poli' && e.ke === 'poli_umum') {
                sisiA = 'L';
                sisiB = 'T';
            } else if (e.dari === 'dec_poli' && e.ke === 'poli_kia') {
                sisiA = 'R';
                sisiB = 'T';
            } else if (e.dari === 'dec_lab' && e.ke === 'lab') {
                sisiA = 'R';
                sisiB = 'L';
            } else if (e.dari === 'lab' && e.ke === 'dec_lab') {
                sisiA = 'L';
                sisiB = 'R';
            } else if (e.dari === 'kasir' && e.ke === 'integrasi') {
                sisiA = 'R';
                sisiB = 'L';
            } else if (e.dari === 'dec_lanjut' && e.ke === 'ranap_admisi') {
                sisiA = 'L';
                sisiB = 'T';
            } else if (e.dari === 'dec_lanjut' && e.ke === 'farmasi') {
                sisiA = 'R';
                sisiB = 'L';
            } else if (e.dari === 'dec_lanjut' && e.ke === 'kasir') {
                sisiA = 'R';
                sisiB = 'T';
            } else if (e.dari === 'ranap_admisi' && e.ke === 'ranap_cppt') {
                sisiA = 'R';
                sisiB = 'L';
            } else if (e.dari === 'ranap_cppt' && e.ke === 'rujukan') {
                sisiA = 'R';
                sisiB = 'L';
            } else if (e.dari === 'lab_saja' && e.ke === 'kasir') {
                sisiA = 'R';
                sisiB = 'R';
            } else if (e.dari === 'farmasi' && e.ke === 'kasir') {
                sisiA = 'B';
                sisiB = 'R';
            }
            const kA = `${e.dari}:${sisiA}`;
            const kB = `${e.ke}:${sisiB}`;
            if (!portKeluar.has(kA)) portKeluar.set(kA, []);
            if (!portMasuk.has(kB)) portMasuk.set(kB, []);
            const xEfektifA = e.dari === 'dec_lanjut' ? a.x + a.w + 40 : a.x;
            portKeluar.get(kA).push({ idx, kunciUrut: sisiA === 'B' || sisiA === 'T' ? b.x : b.y });
            portMasuk.get(kB).push({ idx, kunciUrut: sisiB === 'T' || sisiB === 'B' ? xEfektifA : a.y });
            return { e, a, b, sisiA, sisiB, kA, kB, idx };
        });

        for (const arr of portKeluar.values()) arr.sort((u, v) => u.kunciUrut - v.kunciUrut);
        for (const arr of portMasuk.values()) arr.sort((u, v) => u.kunciUrut - v.kunciUrut);

        const titikPortAlur = (n, sisi, daftar, idx) => {
            const posIdx = Math.max(0, daftar.findIndex((x) => x.idx === idx));
            const fraksi = n.bentuk === 'diamond' || daftar.length <= 1 ? 0.5 : 0.25 + (posIdx / (daftar.length - 1)) * 0.5;
            if (sisi === 'R') return { x: n.x + n.w, y: n.y + n.h * fraksi };
            if (sisi === 'L') return { x: n.x, y: n.y + n.h * fraksi };
            if (sisi === 'B') return { x: n.x + n.w * fraksi, y: n.y + n.h };
            return { x: n.x + n.w * fraksi, y: n.y };
        };

        for (const item of daftarPanah) {
            const { e, a, b, sisiA, sisiB, kA, kB, idx } = item;
            if (!a || !b) continue;
            const aktifGaris = e.dari === tahapTerpilih || e.ke === tahapTerpilih;
            const opsional = e.jenis === 'opsional';
            const kembali = e.jenis === 'kembali';

            const p1 = titikPortAlur(a, sisiA, portKeluar.get(kA) || [], idx);
            const p2 = titikPortAlur(b, sisiB, portMasuk.get(kB) || [], idx);
            const dPath = ruteAlur(p1, sisiA, p2, sisiB);

            const warna = kembali ? '#10b981' : aktifGaris ? '#0ea5e9' : '#64748b';
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', dPath);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', warna);
            path.setAttribute('stroke-width', kembali || aktifGaris ? '2.4' : '1.5');
            if (opsional) path.setAttribute('stroke-dasharray', '6 4');
            path.setAttribute('opacity', kembali || aktifGaris ? '0.98' : '0.78');
            path.setAttribute('marker-end', `url(#${kembali ? 'alur-kembali' : aktifGaris ? 'alur-utama' : 'alur-normal'})`);
            svg.append(path);

            if (e.label) {
                const len = path.getTotalLength?.() || 0;
                const ptLabel = len > 0 ? path.getPointAtLength(len * (kembali ? 0.5 : 0.38)) : { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                const lx = ptLabel.x;
                const ly = ptLabel.y - 3;
                const lebarLbl = Math.max(26, e.label.length * 6.2 + 10);
                const bgTxt = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bgTxt.setAttribute('x', String(lx - lebarLbl / 2));
                bgTxt.setAttribute('y', String(ly - 11));
                bgTxt.setAttribute('width', String(lebarLbl));
                bgTxt.setAttribute('height', '15');
                bgTxt.setAttribute('rx', '5');
                bgTxt.setAttribute('fill', token.warna.permukaan);
                bgTxt.setAttribute('stroke', token.warna.garis);
                bgTxt.setAttribute('stroke-width', '0.7');
                bgTxt.setAttribute('opacity', '0.96');
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', String(lx));
                txt.setAttribute('y', String(ly));
                txt.setAttribute('text-anchor', 'middle');
                txt.setAttribute('font-size', '10');
                txt.setAttribute('font-weight', aktifGaris || kembali ? '700' : '600');
                txt.setAttribute('fill', warna);
                txt.textContent = e.label;
                svg.append(bgTxt, txt);
            }
        }
        stage.append(svg);

        // Render bentuk standar flowchart (Oval, Belah Ketupat, Persegi Panjang, Silinder)
        for (const n of nodeAlur) {
            const dom = petaDomain.get(n.domain);
            const w = token.warna.status[dom?.warna || 'biru'];
            const dipilih = n.id === tahapTerpilih;
            const warnaGaris = dipilih ? token.warna.utama : token.warna.garis;

            const card = document.createElement('button');
            card.type = 'button';
            Object.assign(card.style, {
                position: 'absolute',
                zIndex: '2',
                left: `${n.x}px`,
                top: `${n.y}px`,
                width: `${n.w}px`,
                height: `${n.h}px`,
                cursor: 'pointer',
                color: token.warna.teks,
                padding: '0',
                background: 'transparent',
                border: 'none',
            });
            card.addEventListener('click', () => {
                tahapTerpilih = n.id;
                lukisAlur();
            });

            if (n.bentuk === 'oval') {
                Object.assign(card.style, {
                    borderRadius: '999px',
                    background: w.latar,
                    border: `2px solid ${dipilih ? token.warna.utama : w.teks}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: token.huruf.berat.tebal,
                    fontSize: '12.5px',
                    boxShadow: dipilih ? `0 0 0 3px ${token.warna.utamaLatar}` : '0 2px 6px rgba(0,0,0,0.08)',
                });
                card.textContent = n.judul;
            } else if (n.bentuk === 'diamond') {
                const dSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                dSvg.setAttribute('viewBox', `0 0 ${n.w} ${n.h}`);
                Object.assign(dSvg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
                const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                poly.setAttribute('points', `${n.w / 2},2 ${n.w - 2},${n.h / 2} ${n.w / 2},${n.h - 2} 2,${n.h / 2}`);
                poly.setAttribute('fill', token.warna.permukaan);
                poly.setAttribute('stroke', dipilih ? token.warna.utama : w.teks);
                poly.setAttribute('stroke-width', dipilih ? '2.5' : '1.8');
                dSvg.append(poly);
                const lbl = document.createElement('span');
                lbl.textContent = n.judul;
                Object.assign(lbl.style, {
                    position: 'absolute', inset: '0', boxSizing: 'border-box', zIndex: '1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 34px', textAlign: 'center',
                    fontSize: '11px', fontWeight: token.huruf.berat.tebal, lineHeight: '1.2',
                });
                card.append(dSvg, lbl);
            } else if (n.bentuk === 'cylinder') {
                const cSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                cSvg.setAttribute('viewBox', `0 0 ${n.w} ${n.h}`);
                Object.assign(cSvg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
                const ry = 10;
                const pathBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathBody.setAttribute('d', `M 2 ${ry + 2} A ${n.w / 2 - 2} ${ry} 0 0 1 ${n.w - 2} ${ry + 2} L ${n.w - 2} ${n.h - ry - 2} A ${n.w / 2 - 2} ${ry} 0 0 1 2 ${n.h - ry - 2} Z`);
                pathBody.setAttribute('fill', token.warna.permukaan);
                pathBody.setAttribute('stroke', dipilih ? token.warna.utama : w.teks);
                pathBody.setAttribute('stroke-width', dipilih ? '2.5' : '1.8');
                const ellTop = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                ellTop.setAttribute('cx', String(n.w / 2));
                ellTop.setAttribute('cy', String(ry + 2));
                ellTop.setAttribute('rx', String(n.w / 2 - 2));
                ellTop.setAttribute('ry', String(ry));
                ellTop.setAttribute('fill', w.latar);
                ellTop.setAttribute('stroke', dipilih ? token.warna.utama : w.teks);
                ellTop.setAttribute('stroke-width', '1.5');
                cSvg.append(pathBody, ellTop);
                const lblWrap = document.createElement('div');
                Object.assign(lblWrap.style, {
                    position: 'relative', zIndex: '1', padding: '22px 12px 10px', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', gap: '3px',
                });
                const jdl = document.createElement('strong');
                jdl.textContent = n.judul;
                jdl.style.fontSize = '12px';
                const sub = document.createElement('small');
                sub.textContent = `${n.tabel.length} tabel integrasi`;
                sub.style.color = w.teks;
                lblWrap.append(jdl, sub);
                card.append(cSvg, lblWrap);
            } else {
                Object.assign(card.style, {
                    textAlign: 'left',
                    padding: '9px 11px',
                    borderRadius: token.radius.sedang,
                    border: `1.5px solid ${warnaGaris}`,
                    borderTop: `4px solid ${w.teks}`,
                    background: token.warna.permukaan,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '3px',
                    boxShadow: dipilih ? `0 0 0 3px ${token.warna.utamaLatar}` : '0 2px 6px rgba(0,0,0,0.08)',
                });
                const jdl = document.createElement('strong');
                jdl.textContent = n.judul;
                jdl.style.fontSize = '12px';
                const ringkas = document.createElement('div');
                ringkas.textContent = n.ringkas;
                Object.assign(ringkas.style, {
                    fontSize: '10.5px', color: token.warna.teksRedup, lineHeight: '1.3',
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical',
                });
                const kaki = document.createElement('div');
                Object.assign(kaki.style, { fontSize: '10px', color: w.teks, fontWeight: token.huruf.berat.tebal });
                kaki.textContent = `${dom?.label || n.domain} · ${n.tabel.length} tabel`;
                card.append(jdl, ringkas, kaki);
            }
            stage.append(card);
        }

        kanvasAlur.append(stage);

        // Panel kanan: detail bentuk yang dipilih
        const aktifNode = petaNode.get(tahapTerpilih) || nodeAlur[0];
        const domAktif = petaDomain.get(aktifNode.domain);
        const insp = kartu({ susun: 'sm', style: { maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' } });
        const hD = document.createElement('h3');
        hD.textContent = aktifNode.judul;
        hD.style.margin = '0';
        const deskD = document.createElement('p');
        deskD.textContent = aktifNode.ringkas;
        Object.assign(deskD.style, { margin: '0', fontSize: token.huruf.ukuran.dasar, color: token.warna.teksRedup, lineHeight: '1.45' });

        const lblT = document.createElement('strong');
        lblT.textContent = `Tabel Terkait (${aktifNode.tabel.length}):`;
        const chips = document.createElement('div');
        Object.assign(chips.style, { display: 'flex', flexWrap: 'wrap', gap: '6px' });
        for (const namaT of aktifNode.tabel) {
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

        const lblE = document.createElement('strong');
        lblE.textContent = 'Endpoint Kunci:';
        const eps = document.createElement('div');
        Object.assign(eps.style, { display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'monospace', fontSize: '11.5px', color: token.warna.teksRedup });
        for (const ep of aktifNode.endpoint) {
            const d = document.createElement('div');
            d.textContent = ep;
            eps.append(d);
        }

        insp.append(hD, lencana(domAktif?.label || aktifNode.domain, domAktif?.warna || 'biru'), deskD, lblT, chips, lblE, eps);
        layout.append(kanvasAlur, insp);
        isi.replaceChildren(info, layout);
    }

    function lukisErd() {
        const petaDomain = new Map((data.domain || []).map((d) => [d.id, d]));
        const q = cariTeks.trim().toLowerCase();
        let tabelTampil = (data.tabel || []).filter((t) => {
            if (!q) return true;
            return t.nama.toLowerCase().includes(q) || t.kolom.some((c) => c.nama.toLowerCase().includes(q));
        });
        const namaSet = new Set(tabelTampil.map((t) => t.nama));
        if (tabelTerpilih && !namaSet.has(tabelTerpilih)) tabelTerpilih = null;

        let relasiTampil = (data.relasi || []).filter((r) => namaSet.has(r.dari_tabel) && namaSet.has(r.ke_tabel));
        if (tabelTerpilih) {
            const terkaitSet = new Set([tabelTerpilih]);
            for (const r of relasiTampil) {
                if (r.dari_tabel === tabelTerpilih) terkaitSet.add(r.ke_tabel);
                if (r.ke_tabel === tabelTerpilih) terkaitSet.add(r.dari_tabel);
            }
            tabelTampil = tabelTampil.filter((t) => terkaitSet.has(t.nama));
            relasiTampil = relasiTampil.filter((r) => r.dari_tabel === tabelTerpilih || r.ke_tabel === tabelTerpilih);
        }

        const peta = hitungTataLetakPeta(tabelTampil, relasiTampil, tabelTerpilih);

        // Baris kontrol cari, zoom & fit
        const bar = document.createElement('div');
        Object.assign(bar.style, { display: 'flex', flexWrap: 'wrap', gap: token.jarak.sm, alignItems: 'center', marginBottom: token.jarak.md });

        const inCari = document.createElement('input');
        inCari.type = 'search';
        inCari.placeholder = 'Cari tabel atau kolom...';
        inCari.value = cariTeks;
        gayaInput(inCari);
        inCari.style.flex = '1 1 260px';
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
                height: 'calc(100vh - 300px)',
                minHeight: '460px',
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
        // Arahkan pangkal dan ujung panah tepat ke baris kolom yang berelasi
        const yKolom = (pos, namaKolom) => {
            const idx = (pos.tabel?.kolom || []).findIndex((c) => c.nama === namaKolom);
            if (idx < 0) return pos.y + Math.min(42, pos.h / 2);
            return Math.min(pos.y + pos.h - 9, pos.y + 42 + idx * 17);
        };

        const ruteGaris = buatRouterGarisErd(peta.posisiTabel, peta.lebarKanvas, peta.tinggiKanvas);

        for (const r of relasiTampil) {
            const a = peta.posisiTabel.get(r.dari_tabel);
            const b = peta.posisiTabel.get(r.ke_tabel);
            if (!a || !b) continue;
            const keluar = tabelTerpilih && r.dari_tabel === tabelTerpilih;
            const masuk = tabelTerpilih && r.ke_tabel === tabelTerpilih;
            const aktifGaris = keluar || masuk;

            let dPath;
            if (r.dari_tabel === r.ke_tabel) {
                const y1 = yKolom(a, r.dari_kolom);
                const y2 = yKolom(a, r.ke_kolom);
                const lx = a.x + a.w;
                dPath = `M ${lx} ${y1} C ${lx + 42} ${y1}, ${lx + 42} ${y2}, ${lx} ${y2}`;
            } else {
                const samaKolom = Math.abs(a.x - b.x) < 10;
                const sisiA = samaKolom ? 'R' : (b.x > a.x ? 'R' : 'L');
                const sisiB = samaKolom ? 'R' : (b.x > a.x ? 'L' : 'R');
                const p1 = { x: sisiA === 'R' ? a.x + a.w : a.x, y: yKolom(a, r.dari_kolom) };
                const p2 = { x: sisiB === 'R' ? b.x + b.w : b.x, y: yKolom(b, r.ke_kolom) };
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
                butuhFit = true;
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
            Object.assign(kolList.style, { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', lineHeight: '15px', color: token.warna.teksRedup });
            for (const c of t.kolom) {
                const row = document.createElement('div');
                Object.assign(row.style, { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
                row.textContent = `${c.kunci === 'PRI' ? '🔑 ' : c.nama.endsWith('_id') ? '🔗 ' : ''}${c.nama}`;
                kolList.append(row);
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
            skala = Math.max(0.18, Math.min(1.05, Math.min(vw / peta.lebarKanvas, vh / peta.tinggiKanvas)));
            panX = 12;
            panY = 12;
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
        bar.append(inCari, zoomBar);

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
        const insp = kartu({ susun: 'sm', style: { maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' } });
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
