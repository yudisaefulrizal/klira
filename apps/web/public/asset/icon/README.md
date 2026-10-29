# Ikon navigasi Klira

Dibuat menggunakan model gambar melalui tool bawaan imagegen. PNG transparan,
digunakan oleh `apps/web/src/komponen/ikon-menu.tsx` sebagai alpha mask agar
warna mengikuti tema aplikasi. Label menu tetap berupa teks agar mudah dibaca.

Prompt dasar untuk setiap gambar:

> Use case: logo-brand. Asset type: small navigation icon PNG for Klira medical clinic web application. Create ONE standalone icon depicting [subject]. Consistent minimal professional rounded monoline outline style, solid dark teal #0b7470 strokes, uniform bold stroke weight, flat 2D front view, no perspective, no gradients, no shadows, no text, no letters, no numbers, no badge or enclosing tile. Centered square composition, symbol fills 75 percent of canvas with generous equal padding, simple crisp silhouette readable at 20px. Truly transparent background.

| Berkas PNG | Subject |
| --- | --- |
| daftar-pasien | a patient identification card with a simple person bust |
| statistik-pelayanan | three vertical bar chart columns and an upward trend |
| pesan | two overlapping speech bubbles |
| rawat-inap | a hospital bed only, without any cross or plus sign |
| penunjang | a simple laboratory microscope |
| farmasi | a capsule pill diagonally divided in two |
| kasir-klaim | a receipt with a small checkmark |
| rekam-medis | a clipboard with three horizontal record lines, without any cross or plus sign |
| satusehat | three empty connected circular nodes forming a data network, without any cross or plus sign |
| pelindungan-data | a shield with a keyhole |
| pengaturan | a simple six-tooth gear |
| beranda-tugas | a house outline containing a small checklist |

SATUSEHAT menggunakan simbol integrasi, bukan logo resmi layanan.

Revisi tanpa salib menggunakan imagegen bawaan (edit PNG asli):

- Rawat inap: remove the medical cross above the bed completely; keep the hospital bed only.
- Rekam medis: replace the medical cross inside the clipboard with three horizontal record lines.
- SATUSEHAT: remove the medical cross inside the top circle completely, leaving three empty circular network nodes.

Batasan semua revisi: preserve the dark teal rounded monoline style, stroke thickness, centered square composition and transparent background. Absolutely no cross, plus sign, religious symbol, medical cross or intersecting cross-shaped strokes anywhere. No text, no shadow.
