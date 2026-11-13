import { teksHtml as aman } from '../../util/teks-html.js';

const warna = ['var(--warna-utama)', 'var(--status-kuning-teks)', 'var(--status-biru-teks)', 'var(--status-ungu-teks)'];

/** Grafik garis penumpukan per tahap dan tabel angkanya, sebagai string HTML (semua teks di-escape). */
export function grafikPenumpukan(data) {
  const maks = Math.max(4, ...data.penumpukan.flatMap(r => r.jumlah));
  const x = (i) => 35 + i * 450 / Math.max(1, data.penumpukan.length - 1);
  const y = (n) => 170 - n / maks * 145;
  const garis = [0, 1, 2, 3, 4].map(i => `<g><line x1="35" x2="485" y1="${y(maks * i / 4)}" y2="${y(maks * i / 4)}" stroke="var(--warna-garis-halus)"/><text x="27" y="${y(maks * i / 4) + 4}" text-anchor="end">${Math.round(maks * i / 4)}</text></g>`).join('');
  const seri = data.tahap.map((t, j) => `<g><polyline fill="none" stroke="${warna[j]}" stroke-width="2.5" points="${data.penumpukan.map((r, i) => `${x(i)},${y(r.jumlah[j])}`).join(' ')}"/>${data.penumpukan.map((r, i) => `<circle cx="${x(i)}" cy="${y(r.jumlah[j])}" r="3" fill="${warna[j]}"><title>${aman(r.jam)} WIB · ${aman(t.nama)}: ${aman(r.jumlah[j])} pasien</title></circle>`).join('')}</g>`).join('');
  const waktu = data.penumpukan.map((r, i) => `<text x="${x(i)}" y="193" text-anchor="middle">${aman(r.jam)}</text>`).join('');
  const legenda = data.tahap.map((t, i) => `<span><i style="background:${warna[i]}"></i>${aman(t.nama)}</span>`).join('');
  const tabel = `<details><summary>Lihat angka per jam</summary><div class="stat-tabel"><table><thead><tr><th>Waktu WIB</th>${data.tahap.map(t => `<th>${aman(t.nama)}</th>`).join('')}</tr></thead><tbody>${data.penumpukan.map(r => `<tr><td>${aman(r.jam)}</td>${r.jumlah.map(n => `<td>${aman(n)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  return `<svg viewBox="0 0 520 205" role="img" aria-label="Grafik jumlah pasien dalam setiap tahap pada delapan titik waktu terakhir" class="stat-grafik">${garis}${seri}${waktu}</svg><div class="stat-legenda">${legenda}</div>${tabel}`;
}
