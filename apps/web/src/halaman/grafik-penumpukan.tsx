import type { StatistikDto } from '@klira/shared';
const warna = ['var(--warna-utama)', 'var(--status-kuning-teks)', 'var(--status-biru-teks)', 'var(--status-ungu-teks)'];
export function GrafikPenumpukan({ data }: {
    data: StatistikDto;
}) {
    const maks = Math.max(4, ...data.penumpukan.flatMap(r => r.jumlah));
    const x = (i: number) => 35 + i * 450 / Math.max(1, data.penumpukan.length - 1);
    const y = (n: number) => 170 - n / maks * 145;
    return <>
    <svg viewBox="0 0 520 205" role="img" aria-label="Grafik jumlah pasien dalam setiap tahap pada delapan titik waktu terakhir" className="stat-grafik">
      {[0, 1, 2, 3, 4].map(i => <g key={i}>
        <line x1="35" x2="485" y1={y(maks * i / 4)} y2={y(maks * i / 4)} stroke="var(--warna-garis-halus)"/>
        <text x="27" y={y(maks * i / 4) + 4} textAnchor="end">{Math.round(maks * i / 4)}</text>
      </g>)}
      {data.tahap.map((t, j) => <g key={t.kode}>
        <polyline fill="none" stroke={warna[j]} strokeWidth="2.5" points={data.penumpukan.map((r, i) => `${x(i)},${y(r.jumlah[j])}`).join(' ')}/>
        {data.penumpukan.map((r, i) => <circle key={i} cx={x(i)} cy={y(r.jumlah[j])} r="3" fill={warna[j]}><title>{r.jam} WIB · {t.nama}: {r.jumlah[j]} pasien</title></circle>)}
      </g>)}
      {data.penumpukan.map((r, i) => <text key={r.jam} x={x(i)} y="193" textAnchor="middle">{r.jam}</text>)}
    </svg>
    <div className="stat-legenda">{data.tahap.map((t, i) => <span key={t.kode}><i style={{ background: warna[i] }}/>{t.nama}</span>)}</div>
    <details><summary>Lihat angka per jam</summary><div className="stat-tabel"><table><thead><tr><th>Waktu WIB</th>{data.tahap.map(t => <th key={t.kode}>{t.nama}</th>)}</tr></thead><tbody>{data.penumpukan.map(r => <tr key={r.jam}><td>{r.jam}</td>{r.jumlah.map((n, i) => <td key={i}>{n}</td>)}</tr>)}</tbody></table></div></details>
  </>;
}
