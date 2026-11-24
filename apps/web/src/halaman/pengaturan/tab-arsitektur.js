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

const KOLOM_AUDIT = /^(dibuat|diubah|diperbarui|dihapus)_oleh$/;

const hitungTinggiKartu =(t) => Math.max(96, 50 + (t?.kolom?.length || 0) * 17);

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
        // Tabel terpilih (akar) diletakkan di tengah agar relasi menyebar ke kedua sisi, bukan memutar dari pojok
        let tx = idx === 0 && akarUtama ? Math.floor((kolTotal - 1) / 2) : 0;
        let ty = idx === 0 && akarUtama ? Math.floor((brsTotal - 1) / 2) : 0;
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

/** Buang titik ganda & titik kolinear dari polyline ortogonal. */
function rapikanTitik(pts) {
    const bersih = [];
    for (const p of pts) {
        const prev = bersih[bersih.length - 1];
        if (!prev || Math.abs(p.x - prev.x) > 0.5 || Math.abs(p.y - prev.y) > 0.5) bersih.push({ x: p.x, y: p.y });
    }
    if (bersih.length < 3) return bersih;
    const hasil = [bersih[0]];
    for (let i = 1; i < bersih.length - 1; i += 1) {
        const a = hasil[hasil.length - 1];
        const b = bersih[i];
        const c = bersih[i + 1];
        const kolinearX = Math.abs(a.x - b.x) < 0.5 && Math.abs(b.x - c.x) < 0.5;
        const kolinearY = Math.abs(a.y - b.y) < 0.5 && Math.abs(b.y - c.y) < 0.5;
        if (!kolinearX && !kolinearY) hasil.push(b);
    }
    hasil.push(bersih[bersih.length - 1]);
    return hasil;
}

/** Ubah polyline ortogonal menjadi path SVG dengan sudut membulat hanya pada belokan nyata. */
function jalurSudutBulat(pts, R = 7) {
    const s = rapikanTitik(pts);
    if (s.length < 2) return '';
    let d = `M ${s[0].x} ${s[0].y}`;
    for (let i = 1; i < s.length - 1; i += 1) {
        const prev = s[i - 1];
        const cur = s[i];
        const next = s[i + 1];
        const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
        const d2 = Math.hypot(next.x - cur.x, next.y - cur.y);
        const r = Math.min(R, d1 * 0.45, d2 * 0.45);
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
    const akhir = s[s.length - 1];
    d += ` L ${akhir.x} ${akhir.y}`;
    return d;
}

/**
 * Router jalur ortogonal A* di koridor kosong antar kartu tabel
 * agar garis relasi memutari kartu dan tidak pernah menembus tabel lain.
 * Hasil A* dirapikan: tekukan kecil (jog) akibat pembulatan grid diluruskan bila bebas halangan.
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

    /**
     * Luruskan jog: segmen pendek di antara dua segmen sejajar dihapus dengan menggeser
     * salah satu segmen sejajar ke garis segmen lainnya (titik ujung port tidak pernah digeser).
     */
    const luruskanJog = (ptsAwal) => {
        let p = rapikanTitik(ptsAwal);
        for (let putaran = 0; putaran < 24; putaran += 1) {
            let berubah = false;
            for (let i = 1; i < p.length - 2; i += 1) {
                const a = p[i];
                const b = p[i + 1];
                const vert = Math.abs(a.x - b.x) < 0.5;
                const panjang = vert ? Math.abs(a.y - b.y) : Math.abs(a.x - b.x);
                if (panjang > 56) continue;
                const sumbu = vert ? 'y' : 'x';
                const segBebas = (q) => {
                    for (let k = 0; k < q.length - 1; k += 1) {
                        if (!bebasHalangan(q[k].x, q[k].y, q[k + 1].x, q[k + 1].y)) return false;
                    }
                    return true;
                };
                // Opsi A: geser segmen sesudah jog (b..p[i+2]) ke garis a, bila p[i+2] bukan titik port akhir
                if (i + 2 < p.length - 1) {
                    const q = p.map((t) => ({ ...t }));
                    q[i + 1][sumbu] = a[sumbu];
                    q[i + 2][sumbu] = a[sumbu];
                    if (segBebas(q.slice(i, i + 4))) {
                        p = rapikanTitik(q);
                        berubah = true;
                        break;
                    }
                }
                // Opsi B: geser segmen sebelum jog (p[i-1]..a) ke garis b, bila p[i-1] bukan titik port awal
                if (i - 1 > 0) {
                    const q = p.map((t) => ({ ...t }));
                    q[i - 1][sumbu] = b[sumbu];
                    q[i][sumbu] = b[sumbu];
                    if (segBebas(q.slice(i - 2, i + 2))) {
                        p = rapikanTitik(q);
                        berubah = true;
                        break;
                    }
                }
            }
            if (!berubah) break;
        }
        return p;
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
        // Jalur Z (2 belokan) di tengah celah antar kolom untuk sisi berhadapan R→L / L→R
        if ((sisiA === 'R' && sisiB === 'L' && p2.x > p1.x + 24) || (sisiA === 'L' && sisiB === 'R' && p2.x < p1.x - 24)) {
            const xm = Math.round((p1.x + p2.x) / 2);
            if (bebasHalangan(p1.x, p1.y, xm, p1.y) && bebasHalangan(xm, p1.y, xm, p2.y) && bebasHalangan(xm, p2.y, p2.x, p2.y)) {
                return jalurSudutBulat([p1, { x: xm, y: p1.y }, { x: xm, y: p2.y }, p2]);
            }
        }
        // Jalur L (1 belokan) jika keluar horizontal lalu masuk vertikal (atau sebaliknya) dan bebas halangan
        const keluarHoriz = sisiA === 'L' || sisiA === 'R';
        const masukVert = sisiB === 'T' || sisiB === 'B';
        if (keluarHoriz && masukVert) {
            const cocokArahX = (sisiA === 'R' && p2.x > p1.x + 12) || (sisiA === 'L' && p2.x < p1.x - 12);
            const cocokArahY = (sisiB === 'T' && p2.y > p1.y + 12) || (sisiB === 'B' && p2.y < p1.y - 12);
            if (cocokArahX && cocokArahY && bebasHalangan(p1.x, p1.y, p2.x, p1.y) && bebasHalangan(p2.x, p1.y, p2.x, p2.y)) {
                return jalurSudutBulat([p1, { x: p2.x, y: p1.y }, p2]);
            }
        }
        if (!keluarHoriz && !masukVert) {
            const cocokArahY = (sisiA === 'B' && p2.y > p1.y + 12) || (sisiA === 'T' && p2.y < p1.y - 12);
            const cocokArahX = (sisiB === 'L' && p2.x > p1.x + 12) || (sisiB === 'R' && p2.x < p1.x - 12);
            if (cocokArahX && cocokArahY && bebasHalangan(p1.x, p1.y, p1.x, p2.y) && bebasHalangan(p1.x, p2.y, p2.x, p2.y)) {
                return jalurSudutBulat([p1, { x: p1.x, y: p2.y }, p2]);
            }
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

                const belok = curDir !== -1 && curDir !== d ? 40 : 0;
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

        return jalurSudutBulat(luruskanJog(titik));
    };
}

/**
 * Model tata letak otomatis Sugiyama untuk flowchart alur layanan:
 * 1. Layering topologis (edge 'samping' sejajar sumber, 'kembali' diabaikan).
 * 2. Simpul bantu (dummy) untuk edge lintas >1 lapis agar garis panjang punya jalur sendiri.
 * 3. Minimasi persilangan barycenter (urutan terbaik disimpan).
 * 4. Penempatan X: median tetangga + regresi isotonik berbobot (garis induk-anak lurus, jarak minimum terjaga).
 * 5. Port diselaraskan ke ujung lawan sehingga garis yang bisa lurus benar-benar lurus.
 * 6. Routing kanal antar-lapis dengan penetapan lintasan (track) bebas tumpang tindih.
 * 7. Penempatan label bebas tabrakan terhadap bentuk, label lain, dan garis lain.
 */
function tataLetakAlurOtomatis(nodesInput, edgesInput) {
    const UKURAN_BENTUK = {
        oval: { w: 192, h: 48 },
        diamond: { w: 216, h: 92 },
        cylinder: { w: 218, h: 90 },
        rect: { w: 212, h: 90 },
    };
    const GAP_X = 56;
    const GAP_DUMMY = 20;
    const GAP_DUMMY_NYATA = 40;
    const GAP_SAMPING = 136;
    const PAD = 40;
    const CH_PAD = 28;
    const TRACK = 16;
    const CH_MIN = 70;
    const PORT_GAP = 22;
    const PORT_TEPI = 20;
    const BATAS_PELURUSAN = 150;

    const nodes = nodesInput.map((n, idx) => {
        const uk = UKURAN_BENTUK[n.bentuk] || UKURAN_BENTUK.rect;
        return { ...n, w: uk.w, h: uk.h, _idx: idx };
    });
    const petaNyata = new Map(nodes.map((n) => [n.id, n]));
    const peta = new Map(petaNyata);
    const edges = edgesInput.filter((e) => petaNyata.has(e.dari) && petaNyata.has(e.ke) && e.dari !== e.ke);

    // 1. Layering
    const rank = new Map(nodes.map((n) => [n.id, 0]));
    const maju = edges.filter((e) => e.jenis !== 'kembali' && e.jenis !== 'samping');
    const samping = edges.filter((e) => e.jenis === 'samping');
    const sampingDari = new Map(samping.map((e) => [e.ke, e.dari]));
    for (let iter = 0; iter < nodes.length * 2; iter += 1) {
        let berubah = false;
        for (const e of maju) {
            const rA = rank.get(e.dari);
            if (rank.get(e.ke) < rA + 1) {
                rank.set(e.ke, rA + 1);
                berubah = true;
            }
        }
        for (const e of samping) {
            const rA = rank.get(e.dari);
            if (rank.get(e.ke) !== rA) {
                rank.set(e.ke, rA);
                berubah = true;
            }
        }
        if (!berubah) break;
    }
    // Oval terminal (tanpa edge keluar) selalu di lapis terbawah
    const punyaKeluar = new Set(edges.map((e) => e.dari));
    const terminal = nodes.filter((n) => n.bentuk === 'oval' && !punyaKeluar.has(n.id));
    if (terminal.length) {
        const maksNon = Math.max(0, ...nodes.filter((n) => !terminal.includes(n)).map((n) => rank.get(n.id)));
        for (const n of terminal) rank.set(n.id, maksNon + 1);
    }

    const maksLayer = Math.max(0, ...nodes.map((n) => rank.get(n.id)));
    const layers = Array.from({ length: maksLayer + 1 }, () => []);
    for (const n of nodes) {
        n.layer = rank.get(n.id);
        layers[n.layer].push(n);
    }

    // 2. Simpul bantu untuk edge lintas lapis
    const atasNb = new Map();
    const bawahNb = new Map();
    const tambahNb = (m, k, v) => {
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(v);
    };
    const pasanganDatar = new Set();
    const infoEdge = edges.map((e, idx) => {
        const a = petaNyata.get(e.dari);
        const b = petaNyata.get(e.ke);
        if (a.layer === b.layer) {
            pasanganDatar.add(`${a.id}|${b.id}`);
            pasanganDatar.add(`${b.id}|${a.id}`);
            return { e, a, b, idx, datar: true };
        }
        const terbalik = a.layer > b.layer;
        const atas = terbalik ? b : a;
        const bawah = terbalik ? a : b;
        const rantai = [atas];
        for (let l = atas.layer + 1; l < bawah.layer; l += 1) {
            const d = { id: `~${idx}:${l}`, dummy: true, w: 2, h: 0, layer: l, _idx: atas._idx + 0.5 };
            layers[l].push(d);
            peta.set(d.id, d);
            rantai.push(d);
        }
        rantai.push(bawah);
        for (let k = 0; k < rantai.length - 1; k += 1) {
            tambahNb(bawahNb, rantai[k].id, rantai[k + 1].id);
            tambahNb(atasNb, rantai[k + 1].id, rantai[k].id);
        }
        return { e, a, b, idx, datar: false, terbalik, rantai };
    });

    // 3. Minimasi persilangan (barycenter), simpan urutan dengan persilangan paling sedikit
    const posIdx = new Map();
    const segarkanPos = () => layers.forEach((l) => l.forEach((n, i) => posIdx.set(n.id, i)));
    const tegakkanSamping = (l) => {
        for (const n of [...layers[l]]) {
            const src = sampingDari.get(n.id);
            if (!src || peta.get(src)?.layer !== l) continue;
            const arr = layers[l];
            arr.splice(arr.indexOf(n), 1);
            arr.splice(arr.indexOf(peta.get(src)) + 1, 0, n);
        }
    };
    const hitungSilang = () => {
        let total = 0;
        for (let l = 0; l < maksLayer; l += 1) {
            const pasang = [];
            for (const u of layers[l]) for (const v of bawahNb.get(u.id) || []) pasang.push([posIdx.get(u.id), posIdx.get(v)]);
            for (let i = 0; i < pasang.length; i += 1) {
                for (let j = i + 1; j < pasang.length; j += 1) {
                    const [a1, b1] = pasang[i];
                    const [a2, b2] = pasang[j];
                    if ((a1 - a2) * (b1 - b2) < 0) total += 1;
                }
            }
        }
        return total;
    };
    layers.forEach((l, i) => {
        l.sort((a, b) => a._idx - b._idx);
        tegakkanSamping(i);
    });
    segarkanPos();
    let urutanTerbaik = layers.map((l) => l.slice());
    let silangTerbaik = hitungSilang();
    for (let sweep = 0; sweep < 12; sweep += 1) {
        const turun = sweep % 2 === 0;
        const nb = turun ? atasNb : bawahNb;
        for (let s = 0; s < maksLayer; s += 1) {
            const l = turun ? s + 1 : maksLayer - 1 - s;
            const bary = new Map(layers[l].map((n) => {
                const ids = nb.get(n.id) || [];
                return [n.id, ids.length ? ids.reduce((acc, id) => acc + posIdx.get(id), 0) / ids.length : posIdx.get(n.id)];
            }));
            layers[l].sort((a, b) => bary.get(a.id) - bary.get(b.id));
            tegakkanSamping(l);
            layers[l].forEach((n, i) => posIdx.set(n.id, i));
        }
        const silang = hitungSilang();
        if (silang < silangTerbaik) {
            silangTerbaik = silang;
            urutanTerbaik = layers.map((l) => l.slice());
        }
    }
    urutanTerbaik.forEach((l, i) => { layers[i] = l; });
    segarkanPos();

    // 4. Penempatan X (median tetangga + regresi isotonik berbobot / pool-adjacent-violators)
    const jarakMin = (u, v) => {
        if (pasanganDatar.has(`${u.id}|${v.id}`)) return u.w / 2 + GAP_SAMPING + v.w / 2;
        const g = u.dummy && v.dummy ? GAP_DUMMY : u.dummy || v.dummy ? GAP_DUMMY_NYATA : GAP_X;
        return u.w / 2 + g + v.w / 2;
    };
    // Median berbobot dari daftar target; bila rentang median tidak tunggal, pilih titik terdekat ke posisi sekarang
    const medianBerbobot = (target, sekarang) => {
        if (!target.length) return sekarang;
        const t = target.slice().sort((a, b) => a.x - b.x);
        const total = t.reduce((s, it) => s + it.w, 0);
        let acc = 0;
        for (let i = 0; i < t.length; i += 1) {
            acc += t[i].w;
            if (acc > total / 2 + 1e-9) return t[i].x;
            if (Math.abs(acc - total / 2) < 1e-9) {
                const lo = t[i].x;
                const hi = t[i + 1].x;
                return Math.max(lo, Math.min(hi, sekarang));
            }
        }
        return t[t.length - 1].x;
    };
    // Regresi isotonik L1 (pool-adjacent-violators dengan median berbobot) di bawah batas jarak minimum berurutan
    const aturBaris = (arr, targetPerNode) => {
        const off = [0];
        for (let i = 1; i < arr.length; i += 1) off.push(off[i - 1] + jarakMin(arr[i - 1], arr[i]));
        const blok = [];
        arr.forEach((n, i) => {
            const target = targetPerNode[i].map((t) => ({ x: t.x - off[i], w: t.w }));
            const acuan = n.cx - off[i];
            blok.push({ target, acuan, n: 1, v: medianBerbobot(target, acuan) });
            while (blok.length > 1 && blok[blok.length - 2].v > blok[blok.length - 1].v) {
                const b2 = blok.pop();
                const b1 = blok.pop();
                const target2 = [...b1.target, ...b2.target];
                const acuan2 = (b1.acuan * b1.n + b2.acuan * b2.n) / (b1.n + b2.n);
                blok.push({ target: target2, acuan: acuan2, n: b1.n + b2.n, v: medianBerbobot(target2, acuan2) });
            }
        });
        let i = 0;
        for (const b of blok) {
            for (let k = 0; k < b.n; k += 1, i += 1) arr[i].cx = b.v + off[i];
        }
    };
    for (const arr of layers) {
        let x = 0;
        arr.forEach((n, i) => {
            if (i > 0) x += jarakMin(arr[i - 1], n);
            n.cx = x;
        });
        const geser = x / 2;
        for (const n of arr) n.cx -= geser;
    }
    // Bobot sisi: rantai dummy paling kaku agar garis panjang lurus vertikal
    const bobotSisi = (u, v) => {
        if (u.dummy && v.dummy) return 8;
        if (u.dummy || v.dummy) return 3;
        // Sambungan tunggal (satu-satunya anak & satu-satunya induk) adalah jalur utama: wajib lurus
        const [atas, bawah] = u.layer < v.layer ? [u, v] : [v, u];
        const tunggal = (bawahNb.get(atas.id) || []).length === 1 && (atasNb.get(bawah.id) || []).length === 1;
        return tunggal ? 6 : 1;
    };
    const targetNode = (n, arahList) => {
        const t = [];
        for (const nb of arahList) {
            for (const id of nb.get(n.id) || []) {
                const m = peta.get(id);
                t.push({ x: m.cx, w: bobotSisi(n, m) });
            }
        }
        // Simpul samping menempel tepat di sebelah sumbernya
        const src = sampingDari.get(n.id);
        if (src && peta.get(src)?.layer === n.layer) {
            const s = peta.get(src);
            t.push({ x: s.cx + jarakMin(s, n), w: 2 });
        }
        if (!t.length) t.push({ x: n.cx, w: 0.01 });
        return t;
    };
    const sapuan = (arahList, turun) => {
        for (let s = 0; s <= maksLayer; s += 1) {
            const l = turun ? s : maksLayer - s;
            const arr = layers[l];
            aturBaris(arr, arr.map((n) => targetNode(n, arahList)));
        }
    };
    // Awal: pohon top-down (median induk), lalu turunan koordinat L1 dua arah sampai stabil
    for (let iter = 0; iter < 4; iter += 1) sapuan([atasNb], true);
    for (let iter = 0; iter < 24; iter += 1) sapuan([atasNb, bawahNb], iter % 2 === 0);

    // Pass pelurusan: geser simpul ke posisi yang membuat lebih banyak sambungan bisa lurus, selama jarak minimum terjaga
    const tetap = (n) => n.dummy || n.bentuk === 'diamond';
    const toleransi = (n, m) => {
        if (tetap(n) && tetap(m)) return 0.5;
        if (tetap(n)) return m.w / 2 - PORT_TEPI;
        if (tetap(m)) return n.w / 2 - PORT_TEPI;
        return Math.min(n.w, m.w) / 2 - PORT_TEPI;
    };
    const sisiVertikal = [];
    for (const [id, anakIds] of bawahNb) for (const idAnak of anakIds) sisiVertikal.push([peta.get(id), peta.get(idAnak)]);
    const pasanganSamping = [...sampingDari].map(([t, s]) => [peta.get(s), peta.get(t)]).filter(([s, t]) => s && t && s.layer === t.layer);
    const cocok = (u, v) => Math.abs(u.cx - v.cx) <= toleransi(u, v);
    const skorGlobal = () => {
        let skor = 0;
        for (const [u, v] of sisiVertikal) {
            if (cocok(u, v)) skor += bobotSisi(u, v);
            // Penalti kecil panjang horizontal: pemecah seri agar simpul memilih posisi tengah/ringkas
            skor -= 0.0004 * bobotSisi(u, v) * Math.abs(u.cx - v.cx);
        }
        for (const [s, t] of pasanganSamping) if (Math.abs(t.cx - s.cx - jarakMin(s, t)) < 1) skor += 2;
        return skor;
    };
    const tataLetakSah = () => layers.every((arr) => arr.every((n, i) => i === 0 || n.cx - arr[i - 1].cx >= jarakMin(arr[i - 1], n) - 0.5));
    // Komponen = simpul yang saling terhubung lewat sambungan yang sudah lurus; digeser bersama agar kelurusan terjaga
    // arah: 0 = dua arah, 1 = hanya ke bawah, -1 = hanya ke atas
    const komponenDari = (awal, arah = 0) => {
        const set = new Set([awal]);
        const antre = [awal];
        while (antre.length) {
            const n = antre.pop();
            for (const [u, v] of sisiVertikal) {
                const lain = u === n && arah >= 0 ? v : v === n && arah <= 0 ? u : null;
                if (lain && !set.has(lain) && cocok(u, v)) {
                    set.add(lain);
                    antre.push(lain);
                }
            }
            for (const [s, t] of pasanganSamping) {
                const lain = s === n ? t : t === n ? s : null;
                if (lain && !set.has(lain)) {
                    set.add(lain);
                    antre.push(lain);
                }
            }
        }
        return [...set];
    };
    for (let putaran = 0; putaran < 30; putaran += 1) {
        const skorAwal = skorGlobal();
        let terbaik = null;
        const kandidat = [];
        for (const [u, v] of sisiVertikal) {
            if (cocok(u, v)) continue;
            kandidat.push([v, u.cx - v.cx], [u, v.cx - u.cx]);
        }
        for (const [s, t] of pasanganSamping) kandidat.push([t, s.cx + jarakMin(s, t) - t.cx]);
        for (const [n, delta] of kandidat) {
            // Hanya luruskan tekukan "hampir lurus"; selisih besar adalah percabangan sah yang tidak perlu dipaksa
            if (Math.abs(delta) < 0.5 || Math.abs(delta) > BATAS_PELURUSAN) continue;
            for (const arah of [0, 1, -1]) {
                const komp = komponenDari(n, arah);
                for (const m of komp) m.cx += delta;
                const sah = tataLetakSah();
                const skor = sah ? skorGlobal() : -Infinity;
                for (const m of komp) m.cx -= delta;
                if (skor > skorAwal + 1e-9 && (!terbaik || skor > terbaik.skor + 1e-9)) {
                    terbaik = { skor, komp, delta };
                }
            }
        }
        if (!terbaik) break;
        for (const m of terbaik.komp) m.cx += terbaik.delta;
    }
    let minX = Infinity;
    for (const arr of layers) for (const n of arr) minX = Math.min(minX, n.cx - n.w / 2);
    let maksX = 0;
    for (const arr of layers) {
        for (const n of arr) {
            n.cx = Math.round(n.cx - minX + PAD);
            n.x = n.cx - n.w / 2;
            maksX = Math.max(maksX, n.x + n.w);
        }
    }
    const lebarKanvas = Math.max(640, Math.round(maksX + PAD));

    // 5. Potongan antar-lapis, sisi keluar diamond & penyelarasan port
    const potongan = [];
    for (const info of infoEdge) {
        if (info.datar) continue;
        info.potongan = [];
        for (let k = 0; k < info.rantai.length - 1; k += 1) {
            const p = { u: info.rantai[k], v: info.rantai[k + 1], info, k, sisi: null, xAtas: 0, xBawah: 0 };
            potongan.push(p);
            info.potongan.push(p);
        }
    }
    const sisiDatar = new Set();
    for (const info of infoEdge) {
        if (!info.datar) continue;
        const kanan = info.b.cx > info.a.cx;
        sisiDatar.add(`${info.a.id}:${kanan ? 'R' : 'L'}`);
        sisiDatar.add(`${info.b.id}:${kanan ? 'L' : 'R'}`);
    }
    for (const u of nodes) {
        if (u.bentuk !== 'diamond') continue;
        const keluar = potongan.filter((p) => p.u === u);
        const nyataDiLapis = layers[u.layer].filter((n) => !n.dummy && n !== u);
        const jalurBebas = (x1, x2) => !nyataDiLapis.some((n) => n.x < Math.max(x1, x2) && n.x + n.w > Math.min(x1, x2));
        const kiri = keluar.filter((p) => p.v.cx < u.x + 6).sort((a, b) => a.v.cx - b.v.cx)[0];
        if (kiri && !sisiDatar.has(`${u.id}:L`) && jalurBebas(kiri.v.cx, u.x)) kiri.sisi = 'L';
        const kanan = keluar.filter((p) => p.v.cx > u.x + u.w - 6).sort((a, b) => b.v.cx - a.v.cx)[0];
        if (kanan && !sisiDatar.has(`${u.id}:R`) && jalurBebas(u.x + u.w, kanan.v.cx)) kanan.sisi = 'R';
    }
    const portBebas = (n) => !n.dummy && n.bentuk !== 'diamond';
    const keluarDari = new Map();
    const masukKe = new Map();
    for (const p of potongan) {
        p.xAtas = p.u.cx;
        p.xBawah = p.v.cx;
        if (portBebas(p.u) && !p.sisi) tambahNb(keluarDari, p.u.id, p);
        if (portBebas(p.v)) tambahNb(masukKe, p.v.id, p);
    }
    const sebar = (n, daftar, ambilIngin, simpan) => {
        const lo = n.x + PORT_TEPI;
        const hi = n.x + n.w - PORT_TEPI;
        const item = daftar
            .map((p) => ({ p, raw: ambilIngin(p) }))
            .map((it) => ({ ...it, x: Math.max(lo, Math.min(hi, it.raw)) }))
            .sort((a, b) => a.x - b.x || a.raw - b.raw);
        for (let i = 1; i < item.length; i += 1) item[i].x = Math.max(item[i].x, item[i - 1].x + PORT_GAP);
        if (item.length && item[item.length - 1].x > hi) {
            item[item.length - 1].x = hi;
            for (let i = item.length - 2; i >= 0; i -= 1) item[i].x = Math.min(item[i].x, item[i + 1].x - PORT_GAP);
        }
        if (item.length > 1 && item[0].x < lo) item.forEach((it, i) => { it.x = lo + ((hi - lo) * i) / (item.length - 1); });
        for (const it of item) simpan(it.p, Math.round(it.x));
    };
    for (let putaran = 0; putaran < 3; putaran += 1) {
        for (const [id, daftar] of keluarDari) sebar(peta.get(id), daftar, (p) => p.xBawah, (p, x) => { p.xAtas = x; });
        for (const [id, daftar] of masukKe) sebar(peta.get(id), daftar, (p) => (p.sisi ? p.v.cx : p.xAtas), (p, x) => { p.xBawah = x; });
    }
    for (const p of potongan) if (p.sisi) p.xAtas = p.xBawah;

    // 6. Routing kanal: gabungkan net bertitik sama, susun lintasan sesuai batasan vertikal
    const kanal = Array.from({ length: maksLayer }, () => []);
    for (const p of potongan) kanal[p.u.layer].push(p);
    const jumlahTrack = new Array(maksLayer).fill(1);
    kanal.forEach((daftar, l) => {
        const induk = new Map();
        const cari = (k) => {
            let r = k;
            while (induk.has(r) && induk.get(r) !== r) r = induk.get(r);
            return r;
        };
        const gabung = (a, b) => {
            const ra = cari(a);
            const rb = cari(b);
            if (!induk.has(ra)) induk.set(ra, ra);
            if (!induk.has(rb)) induk.set(rb, rb);
            if (ra !== rb) induk.set(rb, ra);
        };
        daftar.forEach((p, i) => {
            const kAtas = p.sisi ? `S:${p.u.id}:${p.sisi}` : `A:${p.u.id}@${p.xAtas}`;
            gabung(`p${i}`, kAtas);
            gabung(`p${i}`, `B:${p.v.id}@${p.xBawah}`);
        });
        const netMap = new Map();
        daftar.forEach((p, i) => {
            const akar = cari(`p${i}`);
            if (!netMap.has(akar)) netMap.set(akar, { anggota: [], tops: [], bots: [], atas: new Set(), track: null });
            const net = netMap.get(akar);
            net.anggota.push(p);
            net.tops.push(p.xAtas);
            net.bots.push(p.xBawah);
            p.net = net;
        });
        const nets = [...netMap.values()];
        for (const net of nets) {
            const semua = [...net.tops, ...net.bots];
            net.min = Math.min(...semua);
            net.max = Math.max(...semua);
            net.lurus = net.max - net.min < 1;
        }
        const berjalur = nets.filter((n) => !n.lurus);
        const didalam = (x, n) => x > n.min + 1 && x < n.max - 1;
        for (const A of berjalur) {
            for (const B of berjalur) {
                if (A === B) continue;
                if (B.tops.some((x) => didalam(x, A))) A.atas.add(B);
                if (B.bots.some((x) => didalam(x, A))) B.atas.add(A);
            }
        }
        const sisa = new Set(berjalur);
        const urut = [];
        while (sisa.size) {
            let siap = [...sisa].filter((n) => [...n.atas].every((m) => !sisa.has(m)));
            if (!siap.length) {
                siap = [...sisa].sort((a, b) => [...a.atas].filter((m) => sisa.has(m)).length - [...b.atas].filter((m) => sisa.has(m)).length);
            }
            siap.sort((a, b) => a.min - b.min);
            sisa.delete(siap[0]);
            urut.push(siap[0]);
        }
        const tracks = [];
        for (const net of urut) {
            let t = 0;
            for (const m of net.atas) if (m.track !== null) t = Math.max(t, m.track + 1);
            while (tracks[t]?.some((m) => !(m.max + 14 < net.min || net.max + 14 < m.min))) t += 1;
            if (!tracks[t]) tracks[t] = [];
            tracks[t].push(net);
            net.track = t;
        }
        jumlahTrack[l] = Math.max(1, tracks.length);
    });

    // Koordinat Y per lapis & kanal
    const bandTop = [];
    const bandH = [];
    const chH = [];
    let curY = PAD;
    for (let l = 0; l <= maksLayer; l += 1) {
        const nyata = layers[l].filter((n) => !n.dummy);
        bandH[l] = nyata.length ? Math.max(...nyata.map((n) => n.h)) : 0;
        bandTop[l] = curY;
        for (const n of nyata) n.y = Math.round(curY + (bandH[l] - n.h) / 2);
        curY += bandH[l];
        if (l < maksLayer) {
            chH[l] = Math.max(CH_MIN, CH_PAD * 2 + (jumlahTrack[l] - 1) * TRACK);
            curY += chH[l];
        }
    }
    const tinggiKanvas = Math.round(curY + PAD);
    const trackY = (l, t) => {
        const isi = (jumlahTrack[l] - 1) * TRACK;
        return Math.round(bandTop[l] + bandH[l] + (chH[l] - isi) / 2 + t * TRACK);
    };

    // Titik jalur setiap edge
    const titikAtas = (p) => (p.u.dummy ? { x: p.u.cx, y: bandTop[p.u.layer] + bandH[p.u.layer] } : { x: p.xAtas, y: p.u.y + p.u.h });
    const titikBawah = (p) => (p.v.dummy ? { x: p.v.cx, y: bandTop[p.v.layer] } : { x: p.xBawah, y: p.v.y });
    const tepiX = (n, arah, dyOff) => {
        if (n.bentuk === 'diamond') return n.cx + arah * (n.w / 2) * (1 - Math.abs(dyOff) / (n.h / 2));
        return arah > 0 ? n.x + n.w : n.x;
    };
    const grupDatar = new Map();
    for (const info of infoEdge) {
        if (!info.datar) continue;
        const k = [info.a.id, info.b.id].sort().join('|');
        if (!grupDatar.has(k)) grupDatar.set(k, []);
        grupDatar.get(k).push(info);
    }
    for (const grup of grupDatar.values()) {
        grup.forEach((info, i) => {
            const off = grup.length === 1 ? 0 : (i - (grup.length - 1) / 2) * 20;
            const y = Math.round(info.a.y + info.a.h / 2 + off);
            const arah = info.b.cx > info.a.cx ? 1 : -1;
            info.titik = [{ x: Math.round(tepiX(info.a, arah, off)), y }, { x: Math.round(tepiX(info.b, -arah, off)), y }];
        });
    }
    for (const info of infoEdge) {
        if (info.datar) continue;
        let pts = [];
        for (const p of info.potongan) {
            if (p.sisi) {
                const cy = p.u.y + p.u.h / 2;
                const vx = p.sisi === 'L' ? p.u.x : p.u.x + p.u.w;
                pts.push({ x: vx, y: cy }, { x: p.xBawah, y: cy }, titikBawah(p));
                continue;
            }
            const a = titikAtas(p);
            const b = titikBawah(p);
            if (p.net.lurus) {
                pts.push(a, b);
            } else {
                const ty = trackY(p.u.layer, p.net.track);
                pts.push(a, { x: a.x, y: ty }, { x: b.x, y: ty }, b);
            }
        }
        if (info.terbalik) pts = pts.reverse();
        info.titik = rapikanTitik(pts);
    }

    // 7. Penempatan label bebas tabrakan
    const kotakNode = nodes.map((n) => ({ x1: n.x - 3, y1: n.y - 3, x2: n.x + n.w + 3, y2: n.y + n.h + 3 }));
    const segmenDari = (pts) => pts.slice(0, -1).map((p, i) => ({ a: p, b: pts[i + 1] }));
    const semuaSegmen = infoEdge.map((info) => segmenDari(info.titik));
    const tumpang = (k1, k2) => k1.x1 < k2.x2 && k2.x1 < k1.x2 && k1.y1 < k2.y2 && k2.y1 < k1.y2;
    const segKenaKotak = (s, k) => {
        const x1 = Math.min(s.a.x, s.b.x);
        const x2 = Math.max(s.a.x, s.b.x);
        const y1 = Math.min(s.a.y, s.b.y);
        const y2 = Math.max(s.a.y, s.b.y);
        return x1 <= k.x2 && x2 >= k.x1 && y1 <= k.y2 && y2 >= k.y1;
    };
    const labelTerpasang = [];
    const urutLabel = infoEdge
        .filter((info) => info.e.label)
        .sort((p, q) => (p.a.bentuk === 'diamond' ? 0 : 1) - (q.a.bentuk === 'diamond' ? 0 : 1) || p.idx - q.idx);
    for (const info of urutLabel) {
        const w = Math.ceil(info.e.label.length * 6.1 + 14);
        const h = 16;
        const segs = semuaSegmen[info.idx];
        const panjang = segs.map((s) => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y));
        const total = panjang.reduce((a, b) => a + b, 0) || 1;
        let kumulatif = 0;
        let terbaik = null;
        segs.forEach((s, k) => {
            const len = panjang[k];
            const vert = Math.abs(s.a.x - s.b.x) < 0.5;
            const butuh = (vert ? h : w) + 12;
            if (len >= butuh) {
                for (const f of [0.5, 0.35, 0.65, 0.22, 0.78]) {
                    const px = s.a.x + (s.b.x - s.a.x) * f;
                    const py = s.a.y + (s.b.y - s.a.y) * f;
                    const sepanjang = vert ? Math.abs(py - s.a.y) : Math.abs(px - s.a.x);
                    const ekstent = (vert ? h : w) / 2 + 5;
                    if (sepanjang < ekstent || len - sepanjang < ekstent) continue;
                    const kotak = { x1: px - w / 2, y1: py - h / 2, x2: px + w / 2, y2: py + h / 2 };
                    let skor = 0;
                    for (const kn of kotakNode) if (tumpang(kotak, kn)) skor += 1000;
                    for (const kl of labelTerpasang) if (tumpang({ x1: kotak.x1 - 4, y1: kotak.y1 - 3, x2: kotak.x2 + 4, y2: kotak.y2 + 3 }, kl)) skor += 1000;
                    semuaSegmen.forEach((lain, j) => {
                        if (j === info.idx) return;
                        for (const sl of lain) {
                            if (!segKenaKotak(sl, kotak)) continue;
                            const kolinear = vert ? Math.abs(sl.a.x - sl.b.x) < 0.5 && Math.abs(sl.a.x - s.a.x) < 1 : Math.abs(sl.a.y - sl.b.y) < 0.5 && Math.abs(sl.a.y - s.a.y) < 1;
                            skor += kolinear ? 300 : 40;
                        }
                    });
                    if (kotak.x1 < 2 || kotak.x2 > lebarKanvas - 2) skor += 1000;
                    const posRel = (kumulatif + len * f) / total;
                    skor += info.a.bentuk === 'diamond' ? posRel * 30 : Math.abs(posRel - 0.5) * 20;
                    if (!terbaik || skor < terbaik.skor) terbaik = { skor, x: px, y: py };
                }
            }
            kumulatif += len;
        });
        if (!terbaik) {
            const k = panjang.indexOf(Math.max(...panjang));
            terbaik = { x: (segs[k].a.x + segs[k].b.x) / 2, y: (segs[k].a.y + segs[k].b.y) / 2 };
        }
        const kotak = { x1: terbaik.x - w / 2, y1: terbaik.y - h / 2, x2: terbaik.x + w / 2, y2: terbaik.y + h / 2 };
        labelTerpasang.push(kotak);
        info.label = { x: terbaik.x, y: terbaik.y, w, h };
    }

    const rute = infoEdge.map((info) => ({ e: info.e, a: info.a, b: info.b, titik: info.titik, label: info.label || null }));
    return { nodes, peta: petaNyata, rute, lebarKanvas, tinggiKanvas };
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

        // Definisi deklaratif node & relasi alur Klira; posisi & jalur dihitung otomatis oleh tataLetakAlurOtomatis
        const nodeAlurInput = [
            { id: 'start', bentuk: 'oval', judul: 'Pasien Datang', domain: 'pasien', ringkas: 'Pasien tiba di fasyankes untuk mendapatkan layanan.', tabel: ['pasien'], endpoint: ['POST /api/pasien'] },
            { id: 'daftar', bentuk: 'rect', judul: 'Pendaftaran & Kunjungan', domain: 'pasien', ringkas: 'Registrasi pasien, pembuatan kunjungan, & nomor antrean.', tabel: ['pasien', 'kunjungan', 'antrean', 'sesi_antrean'], endpoint: ['POST /api/pasien', 'POST /api/kunjungan', 'GET /api/antrean'] },
            { id: 'dec_layanan', bentuk: 'diamond', judul: 'Jenis Layanan?', domain: 'klinis', ringkas: 'Pemilihan alur kunjungan: Rawat Jalan, UGD, atau Hanya Penunjang.', tabel: ['kunjungan', 'antrean', 'ugd_kunjungan', 'rawat_inap'], endpoint: ['POST /api/kunjungan', 'POST /api/rawat-inap/admisi'] },
            { id: 'skrining', bentuk: 'rect', judul: 'Skrining Perawat', domain: 'klinis', ringkas: 'Tanda Vital, Alergi, Keluhan awal, Nyeri & Gizi.', tabel: ['pemeriksaan', 'pengesahan_catatan'], endpoint: ['GET /api/kunjungan/:id/klinis', 'PUT /api/kunjungan/:id/klinis/:bagian'] },
            { id: 'ugd', bentuk: 'rect', judul: 'Layanan UGD & Observasi', domain: 'klinis', ringkas: 'Triase gawat darurat, observasi berkala, & stabilisasi.', tabel: ['ugd_kunjungan', 'observasi', 'tindakan'], endpoint: ['GET /api/kunjungan/:id/ugd', 'PUT /api/kunjungan/:id/ugd'] },
            { id: 'lab_saja', bentuk: 'rect', judul: 'Lab & Penunjang (Langsung)', domain: 'penunjang', ringkas: 'Kunjungan khusus order lab/penunjang: spesimen, hasil & validasi.', tabel: ['order_penunjang', 'hasil_penunjang', 'spesimen'], endpoint: ['POST /api/kunjungan/:id/penunjang/order', 'PUT /api/penunjang/order/:id/hasil', 'POST /api/penunjang/order/:id/validasi'] },
            { id: 'dec_poli', bentuk: 'diamond', judul: 'Jenis Poli?', domain: 'klinis', ringkas: 'Menentukan poli pemeriksaan dokter sesuai kebutuhan klinis.', tabel: ['kunjungan', 'lokasi'], endpoint: ['GET /api/kunjungan/:id'] },
            { id: 'poli_umum', bentuk: 'rect', judul: 'Poli Umum & Spesialis', domain: 'klinis', ringkas: 'SOAPIE, Pemeriksaan Fisik, Diagnosis ICD-10, & Tindakan.', tabel: ['pemeriksaan', 'diagnosis', 'tindakan'], endpoint: ['POST /api/kunjungan/:id/selesai', 'PUT /api/kunjungan/:id/klinis/:bagian'] },
            { id: 'poli_gigi', bentuk: 'rect', judul: 'Poli Gigi & Mulut', domain: 'klinis', ringkas: 'Odontogram gigi, kondisi karies/restorasi, & tindakan.', tabel: ['odontogram_pasien', 'pemeriksaan', 'tindakan'], endpoint: ['GET /api/kunjungan/:id/odontogram', 'PUT /api/kunjungan/:id/odontogram'] },
            { id: 'poli_kia', bentuk: 'rect', judul: 'Poli KIA, KB & Imunisasi', domain: 'klinis', ringkas: 'ANC kehamilan, nifas/PNC, layanan KB, & imunisasi.', tabel: ['kia_kunjungan', 'pemeriksaan'], endpoint: ['GET /api/kunjungan/:id/kia', 'PUT /api/kunjungan/:id/kia'] },
            { id: 'dec_lab', bentuk: 'diamond', judul: 'Perlu Lab?', domain: 'penunjang', ringkas: 'Opsional: order pemeriksaan lab/penunjang lalu hasil dikembalikan ke dokter.', tabel: ['order_penunjang', 'hasil_penunjang'], endpoint: ['POST /api/kunjungan/:id/penunjang/order'] },
            { id: 'lab', bentuk: 'rect', judul: 'Lab & Penunjang', domain: 'penunjang', ringkas: 'Pengambilan spesimen, input hasil, & validasi oleh analis.', tabel: ['order_penunjang', 'hasil_penunjang', 'spesimen'], endpoint: ['POST /api/penunjang/order/:id/spesimen', 'PUT /api/penunjang/order/:id/hasil', 'POST /api/penunjang/order/:id/validasi'] },
            { id: 'dec_lanjut', bentuk: 'diamond', judul: 'Tindak Lanjut?', domain: 'farmasi', ringkas: 'Menentukan tindak lanjut: Farmasi, Rawat Inap, Rujukan, atau langsung Kasir.', tabel: ['resep', 'rawat_inap', 'tindak_lanjut'], endpoint: ['PUT /api/kunjungan/:id/resep', 'POST /api/kunjungan/:id/selesai'] },
            { id: 'farmasi', bentuk: 'rect', judul: 'Farmasi & Racikan', domain: 'farmasi', ringkas: 'Telaah resep, peracikan obat/puyer, & penyerahan ke pasien.', tabel: ['resep', 'item_resep', 'stok_obat'], endpoint: ['PUT /api/kunjungan/:id/resep'] },
            { id: 'ranap_admisi', bentuk: 'rect', judul: 'Admisi & Penempatan Bed', domain: 'penunjang', ringkas: 'Pendaftaran rawat inap, pemilihan DPJP, kamar & bed.', tabel: ['rawat_inap', 'tempat_tidur'], endpoint: ['POST /api/rawat-inap/admisi', 'GET /api/rawat-inap/papan', 'PUT /api/kunjungan/:id/penempatan'] },
            { id: 'ranap_cppt', bentuk: 'rect', judul: 'Perawatan Ranap & CPPT', domain: 'penunjang', ringkas: 'Catatan CPPT harian & ringkasan pemulangan rawat inap.', tabel: ['cppt', 'pemeriksaan'], endpoint: ['POST /api/kunjungan/:id/cppt', 'POST /api/kunjungan/:id/pemulangan'] },
            { id: 'rujukan', bentuk: 'rect', judul: 'Rujukan & Kontrol', domain: 'pasien', ringkas: 'Tindak lanjut rujukan ke RS/FKTL atau jadwal kontrol ulang.', tabel: ['tindak_lanjut', 'kunjungan'], endpoint: ['POST /api/kunjungan/:id/selesai'] },
            { id: 'kasir', bentuk: 'rect', judul: 'Kasir, Klaim & Akuntansi', domain: 'keuangan', ringkas: 'Tagihan kunjungan, pembayaran kasir, klaim JKN, & jurnal.', tabel: ['tagihan', 'pembayaran', 'klaim', 'jurnal', 'detail_jurnal', 'akun_keuangan'], endpoint: ['GET /api/kunjungan/:id/tagihan', 'POST /api/kunjungan/:id/pembayaran', 'GET /api/keuangan/ringkasan'] },
            { id: 'integrasi', bentuk: 'cylinder', judul: 'SATUSEHAT & BPJS PCare', domain: 'integrasi', ringkas: 'Sinkronisasi FHIR & integrasi BPJS PCare / Antrean JKN.', tabel: ['kredensial_satusehat', 'kredensial_pcare', 'pemetaan_bpjs', 'log_audit'], endpoint: ['GET /api/satusehat/status', 'GET /api/pcare/status'] },
            { id: 'selesai', bentuk: 'oval', judul: 'Pasien Pulang / Selesai', domain: 'keuangan', ringkas: 'Kunjungan selesai dan seluruh data pelayanan tersimpan.', tabel: ['kunjungan', 'pembayaran'], endpoint: ['POST /api/kunjungan/:id/selesai'] },
        ];

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
            { dari: 'dec_lab', ke: 'lab', label: 'Ya (Order)', jenis: 'samping' },
            { dari: 'lab', ke: 'dec_lab', label: 'Hasil kembali', jenis: 'kembali' },
            { dari: 'dec_lab', ke: 'dec_lanjut', label: 'Tidak / Ada' },
            { dari: 'dec_lanjut', ke: 'ranap_admisi', label: 'Opname', jenis: 'opsional' },
            { dari: 'dec_lanjut', ke: 'rujukan', label: 'Rujuk', jenis: 'opsional' },
            { dari: 'dec_lanjut', ke: 'farmasi', label: 'Resep', jenis: 'opsional' },
            { dari: 'dec_lanjut', ke: 'kasir', label: 'Langsung', jenis: 'opsional' },
            { dari: 'ranap_admisi', ke: 'ranap_cppt', label: 'CPPT', jenis: 'samping' },
            { dari: 'ranap_cppt', ke: 'kasir', label: 'Pemulangan' },
            { dari: 'lab_saja', ke: 'kasir', label: 'Selesai Lab', jenis: 'opsional' },
            { dari: 'farmasi', ke: 'kasir', label: '' },
            { dari: 'rujukan', ke: 'kasir', label: '' },
            { dari: 'kasir', ke: 'integrasi', label: 'FHIR / PCare', jenis: 'samping' },
            { dari: 'kasir', ke: 'selesai', label: '' },
        ];

        const hasilLayout = tataLetakAlurOtomatis(nodeAlurInput, panahAlur);
        const { nodes: nodeAlur, peta: petaNode, rute: ruteAlur, lebarKanvas: lebarStage, tinggiKanvas: tinggiStage } = hasilLayout;

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
        Object.assign(stage.style, { position: 'relative', width: `${lebarStage}px`, height: `${tinggiStage}px`, margin: '12px auto' });

        // SVG panah antar bentuk flowchart menggunakan router koridor A* + jalur lurus/1-belokan
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

        // Garis tidak aktif digambar dulu, garis aktif di atasnya; semua label digambar paling akhir agar tidak tertimpa garis
        const aktifRute = (r) => r.e.dari === tahapTerpilih || r.e.ke === tahapTerpilih;
        const urutRute = [...ruteAlur].sort((p, q) => Number(aktifRute(p) || p.e.jenis === 'kembali') - Number(aktifRute(q) || q.e.jenis === 'kembali'));
        const grupLabel = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (const r of urutRute) {
            const { e } = r;
            if (!r.titik || r.titik.length < 2) continue;
            const aktifGaris = aktifRute(r);
            const opsional = e.jenis === 'opsional' || e.jenis === 'samping';
            const kembali = e.jenis === 'kembali';

            const warna = kembali ? '#10b981' : aktifGaris ? '#0ea5e9' : '#64748b';
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', jalurSudutBulat(r.titik, 8));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', warna);
            path.setAttribute('stroke-width', kembali || aktifGaris ? '2.2' : '1.5');
            if (opsional) path.setAttribute('stroke-dasharray', '6 4');
            path.setAttribute('opacity', kembali || aktifGaris ? '0.98' : '0.8');
            path.setAttribute('marker-end', `url(#${kembali ? 'alur-kembali' : aktifGaris ? 'alur-utama' : 'alur-normal'})`);
            svg.append(path);

            if (e.label && r.label) {
                const { x: lx, y: ly, w: lw, h: lh } = r.label;
                const bgTxt = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bgTxt.setAttribute('x', String(lx - lw / 2));
                bgTxt.setAttribute('y', String(ly - lh / 2));
                bgTxt.setAttribute('width', String(lw));
                bgTxt.setAttribute('height', String(lh));
                bgTxt.setAttribute('rx', '5');
                bgTxt.setAttribute('fill', token.warna.permukaan);
                bgTxt.setAttribute('stroke', aktifGaris || kembali ? warna : token.warna.garis);
                bgTxt.setAttribute('stroke-width', '0.8');
                const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                txt.setAttribute('x', String(lx));
                txt.setAttribute('y', String(ly));
                txt.setAttribute('text-anchor', 'middle');
                txt.setAttribute('dominant-baseline', 'central');
                txt.setAttribute('font-size', '10');
                txt.setAttribute('font-weight', aktifGaris || kembali ? '700' : '600');
                txt.setAttribute('fill', warna);
                txt.textContent = e.label;
                grupLabel.append(bgTxt, txt);
            }
        }
        svg.append(grupLabel);
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
        // Kolom audit (dibuat_oleh, dll.) merujuk ke pengguna dari hampir setiap tabel; di ikhtisar disembunyikan
        // agar peta tidak tertutup jaring garis. Tetap tampil saat tabel dipilih.
        const jumlahAuditTersembunyi = tabelTerpilih ? 0 : relasiTampil.filter((r) => KOLOM_AUDIT.test(r.dari_kolom)).length;
        if (!tabelTerpilih) relasiTampil = relasiTampil.filter((r) => !KOLOM_AUDIT.test(r.dari_kolom));

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
        if (jumlahAuditTersembunyi) {
            const catatan = document.createElement('span');
            catatan.textContent = `${jumlahAuditTersembunyi} relasi dibuat_oleh → pengguna disembunyikan (pilih tabel untuk melihat)`;
            legenda.append(catatan);
        }

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
