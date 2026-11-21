# SOP Penanganan Insiden Kebocoran atau Kegagalan Pelindungan Data

Nomor: SOP/PDP/03/XI/2026 · Berlaku: sejak disahkan · Penanggung jawab: PPDP (dibantu IT)

## 1. Tujuan

Membatasi kerugian bila data pribadi bocor, hilang, diubah, atau diakses tanpa hak, dan memberitahukan pasien serta lembaga berwenang secara tertulis **paling lambat 3x24 jam sejak insiden diketahui**.

## 2. Contoh insiden

- Akun petugas dipakai orang lain atau diretas.
- Perangkat berisi data hilang atau dicuri; berkas cadangan jatuh ke pihak tak berhak.
- Data pasien terkirim ke penerima yang salah (pesan, email, cetakan).
- Gangguan sistem yang membuat data berubah atau hilang.
- Prosesor atau vendor melaporkan kebocoran di sistemnya.

## 3. Langkah

**A. Lapor (siapa pun, segera).** Petugas yang mencurigai insiden menghubungi PPDP (Yudi Saeful Rizal) secara langsung atau lewat email yudienam666@gmail.com saat itu juga. Jangan menghapus bukti. Tulis apa yang terlihat dan kapan.

**B. Tahan kerusakan (IT, jam pertama).** Nonaktifkan akun atau perangkat yang terlibat, ganti kata sandi dan kunci terkait, putuskan akses yang bocor, simpan log (log audit Klira dan log server).

**C. Catat (PPDP, hari yang sama).** Buka **Pelindungan data > Insiden > Baru** dan isi:
- waktu kejadian (bila diketahui) dan **waktu diketahui** (awal hitungan 3x24 jam),
- jenis: siber atau bukan,
- uraian kejadian dan data yang terungkap,
- pasien yang terdampak,
- kontak PPDP.

**D. Nilai (PPDP dan pimpinan, maksimal 24 jam).** Seberapa banyak pasien terdampak, data apa, adakah risiko nyata bagi pasien (penipuan, diskriminasi, malu). Bila ragu, anggap berisiko.

**E. Beritahu (PPDP, maksimal 3x24 jam sejak diketahui).** Pemberitahuan **tertulis** ke:
1. **pasien terdampak**, dan
2. **lembaga pelindungan data pribadi / Komdigi** serta otoritas sektor yang berlaku (gunakan saluran pelaporan resmi yang berlaku saat itu).

Isi pemberitahuan: data apa yang terungkap, kapan dan bagaimana terjadi, langkah penanganan dan pemulihan, dan kontak PPDP. Catat waktu pemberitahuan di Klira (kolom notifikasi pasien dan notifikasi lembaga). Bila insiden mengganggu pelayanan kepada masyarakat, klinik juga memberitahukan publik.

**F. Pulihkan dan perbaiki (IT).** Pulihkan data dari cadangan bila perlu, tutup celah penyebab, uji ulang. Catat penanganan dan pemulihan di Klira.

**G. Tinjau (PPDP, maksimal 14 hari).** Cari akar masalah, perbarui kebijakan, pelatihan, atau pengamanan, dan perbarui DPIA bila risiko berubah.

## 4. Mitigasi risiko (pencegahan)

- Akses menurut peran dan log audit aktif.
- Kata sandi unik, perangkat dikunci, dan akun mantan petugas dinonaktifkan segera.
- Cadangan disimpan terenkripsi di luar server.
- Perjanjian dengan prosesor mewajibkan mereka melapor kegagalan **pada kesempatan pertama**, dengan batas jam yang disepakati 24 jam agar klinik tetap bisa memenuhi 3x24 jam.
- Latihan simulasi insiden minimal setahun sekali (lihat dokumen 06).

## 5. Dokumentasi

Seluruh insiden, termasuk yang tidak perlu diberitahukan, dicatat di Klira. Pemberitahuan ke lembaga disimpan bersama bukti kirimnya.
