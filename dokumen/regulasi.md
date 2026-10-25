# Regulasi RME dan Checklist Aplikasi (klira)

Status: 24 Okt 2026. Hanya memuat yang ada sumber primernya: naskah di `referensi primer/` dan portal resmi pemerintah (SATUSEHAT, JDIH).
Singkatan: PMK24 = Permenkes 24/2022; PP28 = PP 28/2024; UU17 = UU 17/2023; UU27 = UU 27/2022; PP33 = PP 33/2026; PP71 = PP 71/2019; K1423 = Kepmenkes 1423/2022; K133 = Kepmenkes 133/2023; SE7093 = SE Dirjen HK.02.02/D/7093/2023.

## 1. Ringkasan
- RME wajib untuk semua fasyankes, termasuk telemedisin, dan wajib terhubung ke SATUSEHAT/SIKN dengan HL7 FHIR.
- Data kesehatan wajib diproses dan disimpan di Indonesia.
- Data kesehatan = data pribadi spesifik: UU27 dan PP33 (efektif 16 Jan 2027).
- Tenggat RME dan integrasi sudah lewat; aplikasi harus patuh sejak rilis pertama.

## 2. Checklist aplikasi
`[ ]` = harus ada di aplikasi.

### A. Cakupan dan alur
- [ ] Semua jenis fasyankes: praktik mandiri, puskesmas, klinik, RS, apotek, lab, balai; termasuk telemedisin (PMK24 P3-4, SE7093 angka 1, PP28 P781 ay2)
- [ ] RME sebagai subsistem terhubung ke sistem informasi fasyankes lain (PMK24 P5)
- [ ] Alur dari pasien masuk sampai pulang/dirujuk/meninggal (PMK24 P7, PP28 P782)
- [ ] 8 kegiatan minimum: registrasi, distribusi data antar unit, pengisian informasi klinis, pengolahan (kode, laporan, analisis), input data klaim, penyimpanan, penjaminan mutu, transfer isi (PMK24 P13)
- [ ] Data set K1423: IGD, Rawat Jalan, Rawat Inap, Laboratorium, Apotek (tiap set: lembar identitas, cara pembayaran, general consent, formulir layanan, pemeriksaan spesialistik/penunjang)
- [ ] Mode darurat saat gangguan teknis (nonelektronik hanya sementara, PP28 P779 ay2)

### B. Registrasi dan identitas pasien
- [ ] Wajib: nomor RM, nama, NIK (PMK24 P14 ay2); NIK 16 digit, bila tidak ada 9999999999999999 (K1423)
- [ ] Tanpa identitas: surat pengantar institusi sosial/kependudukan (PMK24 P14 ay3)
- [ ] Data sosial: agama, pekerjaan, pendidikan, status perkawinan (PMK24 P14 ay4)
- [ ] WNA: nomor paspor/KITAS; nama ibu kandung; tempat/tanggal lahir; alamat dengan kode wilayah Kemendagri (K1423)
- [ ] Nomor IHS pasien 11 digit (K1423, bagian Laboratorium)
- [ ] Cara pembayaran (JKN, mandiri, asuransi lain) dan general consent (K1423)

### C. Isi RME dan pencatatan klinis
- [ ] Isi minimal: identitas, pemeriksaan fisik dan penunjang, diagnosis, pengobatan, rencana tindak lanjut, nama dan tanda tangan nakes; dibuat penanggung jawab pelayanan (PMK24 P26 ay6-7)
- [ ] Dokumentasi administratif (min. pendaftaran) dan klinis (PMK24 P27)
- [ ] Catatan lengkap, jelas, memuat nama, waktu, tanda tangan nakes; berurutan per nakes; koreksi oleh nakes pemberi layanan (PMK24 P16)
- [ ] >1 jenis nakes: satu dokumen terintegrasi, berurutan waktu; faskes tingkat pertama boleh family folder dengan privasi anggota keluarga (PMK24 P17)
- [ ] Persetujuan tindakan tercatat di rekam medis (PP28 P778 ay3)
- [ ] Pengkodean ICD terbaru; pelaporan internal dan eksternal ke Dinkes/Kemenkes; analisis kuantitatif dan kualitatif (PMK24 P18)
- [ ] Input kode penyakit untuk klaim pembiayaan (PMK24 P19)

### D. Hak akses pengguna dan audit
- [ ] Tiga hak akses: input, perbaikan, lihat; diatur pimpinan fasyankes (PMK24 P30)
- [ ] Input oleh nakes pemberi layanan dan petugas administrasi/perekam medis sesuai kewenangan (PMK24 P30 ay4)
- [ ] Perbaikan data dalam 2x24 jam sejak input; setelahnya perlu persetujuan perekam medis/pimpinan (PMK24 P30 ay6-7)
- [ ] Lihat data hanya oleh tenaga internal untuk pelayanan/administrasi (PMK24 P30 ay8)
- [ ] Log riwayat pengelolaan data, termasuk data yang dimusnahkan (PP28 P966 ay7, UU17 P349 ay11)

### E. Penyimpanan, lokasi, backup, retensi
- [ ] Data center di wilayah Indonesia (UU17 P346 ay6, PP28 P966 ay2); pusat data terhubung ke pusat data nasional (PP28 P966 ay6)
- [ ] Media: server atau cloud "tersertifikasi" (PMK24 P20 ay3); standar sertifikasinya tidak dirinci
- [ ] Backup wajib: lokasi berbeda dari fasyankes, berkala, ada SOP (PMK24 P20 ay4-5, PP28 P966 ay4)
- [ ] Retensi minimal 25 tahun sejak kunjungan terakhir; pemusnahan setelahnya, dikecualikan bila masih dipakai (PMK24 P39)
- [ ] Hosting pihak ketiga: di Indonesia, perjanjian (kerahasiaan, SLA), data dimiliki dan dikendalikan penuh fasyankes, prosesor patuh kewajiban (PP28 P966 ay5); fasyankes punya akses tak terbatas ke datanya (PMK24 P22 ay5)
- [ ] Transfer data ke luar negeri: tujuan spesifik dan terbatas, izin Pemerintah Pusat (UU17 P349 ay7); syarat PDP-nya di bagian J

### F. Integrasi SATUSEHAT
Kewajiban
- [ ] RME terhubung ke platform interoperabilitas Kemenkes; transfer rujukan lewat platform itu (PMK24 P21, P24, PP28 P781, UU17 P345 ay3)
- [ ] Sistem mengikuti K1423, ICD-9-CM, ICD-10, SNOMED CT, LOINC, KFA, HL7 FHIR; protokol interoperabilitas HL7 FHIR (SE7093 angka 2b, 3b)
- [ ] Variabel dan metadata (definisi, format, kodifikasi) sesuai Kemenkes; kompatibel dan interoperabel (PMK24 P10-11, PP28 P780, K1423)
- [ ] Kirim data berkala: RS dan klinik utama tiap bulan; modul Pendaftaran, Diagnostik, Obat, Laboratorium, Radiologi (SE 1669/2025); data kunjungan target 100% terkirim (SE 1030/2023 angka 5b3)
- [ ] Puskesmas: layanan luar gedung lewat ASIK atau sistem daerah yang terintegrasi SATUSEHAT (SE 1030/2023 angka 2b)
- [ ] Pasien akses data sendiri lewat SIKN/SATUSEHAT Mobile (UU17 P348 ay2, K133 KEEMPAT)
Teknis umum (portal resmi: dokumentasi v7.23, rilis 2 Apr 2026; terminologi v11.2)
- [ ] Konfigurasi per fasyankes: Organization ID, Client ID, Client Secret (terenkripsi), sandbox/production; satu pasangan client terikat satu organisasi (desain multi-tenant); tangani error "resource cannot be accessed due to business rule"
- [ ] Kode akses production diambil di SSP (pilih Production, menu Kode Akses API) oleh fasyankes atau partner terverifikasi; partner melihat kode fasyankes mitra bila fasyankes memilih sistemnya di DFO/REGFASYANKES/RS Online
- [ ] OAuth2 client_credentials, POST /oauth2/v1/accesstoken; token ±3599 detik di-cache; maks 1 permintaan token per menit per client
- [ ] Base URL sandbox dan production dapat dikonfigurasi; FHIR di /fhir-r4/v1
- [ ] Sinkronisasi Organization dan Location, lalu simpan lokal IHS Number pasien (cari via NIK; bayi baru lahir: POST Patient) dan praktisi (via NIK), serta id balikan tiap resource (Encounter.id dst) untuk PUT dan referensi
- [ ] Kirim berurutan per kunjungan (Encounter, resource klinis, Encounter finished, Composition) dengan antrean, retry, log status per resource
- [ ] Waktu dikirim UTC+00 (WIB-7, WITA-8, WIT-9); tanggal tidak boleh sebelum 2014-06-03; validasi elemen wajib (*)
- [ ] Versi dan kode: ICD-10 dan ICD-9 CM edisi 2010, ICD-O 3.2, ICD-IM 2026 (iDRG), SNOMED CT (ECL), LOINC, UCUM, KFA 91/92/93/94, Standar Terminologi v11.2 (30 Sep 2026); server memvalidasi kode terminologi
- [ ] Master data: KFA untuk obat (dto.kemkes.go.id/kfa-browser), Master Wilayah Kemendagri untuk alamat, MPI untuk pasien, MSI untuk fasyankes
- [ ] KFA lewat REST API resmi (portal: Master Data > KFA, disunting 2 Okt 2025): autentikasi OAuth2 client_credentials dengan kredensial SATUSEHAT (satu client untuk satu Organization ID); base URL sandbox `api-satusehat-stg.dto.kemkes.go.id` dan production `api-satusehat.kemkes.go.id`, jalur `/kfa` (v1: harga JKN per regional, `farmalkes-price-jkn`), `/kfa-v2` (v2: `products?identifier=kfa|nie|lkpp&code=...` detail produk; `products/all` dengan page, size, product_type, from_date/to_date, keyword, template_code 92xxxxxx, packaging_code 94xxxxxx), `/kfa-v3` (alat kesehatan); respons memuat bentuk sediaan, rute pemberian, UCUM, nomor izin edar, bahan aktif (91), template (92), kemasan (94), status valid/aktif, dan pengganti produk
- [ ] Error validasi berupa OperationOutcome (4xx: duplicate untuk Encounter berulang, format, value; 5xx): simpan RuleNumber dan path, petakan ke Kamus Rule Number
- [ ] Hak akses resource (tab Fasyankes): DELETE tidak pernah diizinkan; Practitioner, ClaimResponse, CoverageEligibilityResponse hanya GET; resource klinis utama GET, PATCH, POST, PUT. Halaman modul menyebut POST Patient untuk bayi baru lahir, sedangkan tabel menulis Patient hanya GET dan PATCH: konfirmasi saat implementasi
- [ ] Monitoring: dashboard Transaksi dan Log FHIR (cocokkan dengan log per resource ID); aduan ke helpdesk@kemkes.go.id
- [ ] KYC: sebelum operator fasyankes memverifikasi pengguna SATUSEHAT Mobile, wajib integrasi "Generate URL Validasi" (library KYC: key-generation, enkripsi, dekripsi); petunjuk teknis v5.0 (23 Jul 2024) diunduh di portal
- [ ] DICOM router ke NIDR bila ada radiologi; 44 resource interoperabilitas
- [ ] Dokumentasi mengenal HTTP 429 (rate limit) dan 413 (payload terlalu besar) tanpa angka; versi FHIR hanya tersirat dari path `fhir-r4`; aturan consent dan frekuensi kirim tidak tertera
Modul pelayanan (RJ disunting 4 Agu 2026, IGD v5.2 30 Okt 2025, RI v6.0 disunting 6 Agu 2026, Kefarmasian disunting 15 Des 2024)
- [ ] Semua modul: tutup kunjungan dengan PUT Encounter finished (period, diagnosis, dischargeDisposition home/aadvice/other-hcf/exp-lt48h/exp-gt48h/oth), tindak lanjut lewat ServiceRequest; keluhan utama masuk Encounter.diagnosis use CC; satu Condition per diagnosis (ICD-10 + SNOMED, kategori encounter-diagnosis); tindakan ICD-9 CM (+KPTL/SNOMED) dengan performer dan waktu; tanda vital LOINC/UCUM 8867-4, 9279-1, 8480-6, 8462-4, 8310-5 (RJ/IGD juga 8302-2, 29463-7; RI kesadaran 67775-7)
- [ ] Rawat Jalan (29 langkah): Encounter class AMB, status arrived/in-progress, statusHistory dan classHistory, identifier `http://sys-ids.kemkes.go.id/encounter/{Organization_ID}`, serviceProvider, location + kelas layanan (reguler/eksekutif) + indikator perubahan kelas, EncounterToFacility new/returning/unknown; anamnesis (keluhan utama SNOMED kategori chief-complaint, keluhan penyerta, riwayat pribadi dan keluarga, alergi, riwayat obat KFA 92/93); Composition resume medis LOINC 88645-7 dengan semua isi dalam satu payload
- [ ] IGD (28 langkah): Encounter class EMER, status arrived/triaged/in-progress, serviceType (sejak v5.2); triase (transportasi kedatangan LOINC 74286-6, surat pengantar rujukan, CTAS LOINC 75910-0); asesmen nyeri, risiko jatuh (Morse, Humpty Dumpty, Edmonson), dekubitus, skrining batuk; Composition LOINC 97663-9
- [ ] Rawat Inap: satu rangkaian = satu Encounter class IMP, status planned (menunggu ruangan), in-progress, finished; wajib: identifier, status, statusHistory, class, classHistory, subject, participant.individual, period, diagnosis.condition, location, serviceProvider; location[] berperiode dengan serviceClass (1/2/3/vip/vvip) dan indikator kelas (kelas-tetap/naik-kelas/turun-kelas/titip-rawat); perbarui Location.operationalStatus (U/O) lewat PATCH/PUT saat pindah ruang; riwayat DPJP dengan participant.period dan type ATND/SPRF; dari RJ/IGD ke RI: ServiceRequest kedua untuk SPRI; pemulangan memuat Condition kondisi pulang (SNOMED) dan period.end semua location/participant
- [ ] Kefarmasian (halaman masih berbanner "hanya Sandbox, dalam pengembangan"): Medication di dalam MedicationRequest.contained satu POST (dua POST terpisah tidak berlaku sejak 2025), KFA 92/93 (racikan: bahan 91/92/93); MedicationDispense wajib KFA 93 + jenis pembiayaan, No SEP, harga (ChargeItemDefinition), data substitusi; DocumentReference resep; apotek: Encounter serviceType 64 Pharmacy, tarik resep via Nomor Resep Nasional, API e-Resep (sisa obat)

### G. Registrasi sistem dan legal vendor
- [ ] Sistem buatan Kemenkes, fasyankes, atau PSE lewat kerja sama; PSE terdaftar sebagai PSE sektor kesehatan di Kemkomdigi (PMK24 P9)
- [ ] Registrasi Sistem Elektronik di Kemenkes: nama sistem, dokumentasi sistem, fitur/fungsi, lokasi penyimpanan data, variabel dan metadata, daftar fasyankes pengguna; lapor bila berubah (PMK24 P12)
- [ ] PSE dengan fasilitas data di dalam negeri, rekomendasi unit data Kemenkes, NDA/pakta integritas (PMK24 P22)
- [ ] Registrasi di SATUSEHAT Platform (SSP) untuk vendor dan RME mandiri: kategori institusi, data sistem, survei keamanan (perlindungan data pribadi), lalu verifikasi (Menunggu, Ditolak/Perbaiki, Disetujui); fasyankes hanya boleh memilih sistem yang sudah terverifikasi
- [ ] Syarat registrasi SSP: Nomor PSE Komdigi (format aaaaaa.bb/DJAI.PSE/MM/YYYY, lewat OSS) dan nomor afiliasi lisensi SNOMED CT (SNOMED International MLDS)
- [ ] Bukti uji sandbox sampai Encounter dan Condition/Diagnosis (Postman respons 200/201): screenshot, screen record dikirim ke onboarding.satusehat@dto.kemkes.go.id, screenshot profil SSP dan Ringkasan Transaksi FHIR
- [ ] Berkas PDF maks 10 MB: surat kuasa/tugas, dokumentasi sistem (screenshot seluruh fitur + bukti sandbox), surat pernyataan variabel dan metadata (bermaterai, ditandatangani pimpinan; kedua pihak bila lewat mitra), daftar fasyankes pengguna dengan kode registrasi (template) atau surat pernyataan belum bermitra
- [ ] Form data sistem: nama sistem (huruf, ', ., ,), link PSE, fitur (maks 1028 karakter), lokasi penyimpanan data dan lokasi backup **wajib di Indonesia**, jenis penyimpanan (on-prem/cloud), ada backup, jenis fasyankes pengguna
- [ ] Fasyankes pengguna wajib punya Kode Registrasi Fasyankes (registrasifasyankes.kemkes.go.id; puskesmas: regpus.kemkes.go.id)
- [ ] Portal menyediakan Postman Collection (modul pelayanan dan penerapan) dan 29 use case modul penerapan (ANC, kelahiran, INC, MCU, PNC, gigi, gizi, HIV, imunisasi, imunisasi COVID-19, kematian maternal dan perinatal, MTBS, neonatus, PKPR, klaim asuransi swasta, klaim BPJS, registrasi jantung/stroke/kanker/mata/uronefrologi, rujukan spesimen, SHK, skrining PTM, TB, tumbuh kembang, UBM, rabies, TTE)

### H. Keamanan
- [ ] Kerahasiaan, integritas, ketersediaan (PMK24 P29, PP28 P780)
- [ ] Sistem manajemen keamanan informasi (SMKI) atas data kesehatan pribadi pasien (PP28 P791)
- [ ] Penanganan insiden siber: terima, pantau, tangani laporan (PP28 P792)
- [ ] Keandalan sistem: uji kelaikan, kebijakan hak akses, sertifikasi keandalan sistem, audit berkala (UU17 P347)
- [ ] Keamanan berbasis risiko: pseudonimisasi/enkripsi, ketahanan sistem, backup dan pemulihan tepat waktu, uji berkala; security/privacy by design dan default (PP33 P123-124); kontrol akses, autentikasi, log tidak dirinci PP33 (PP33 P123 ay7, P129-130)

### I. Pembukaan dan penyampaian rekam medis
- [ ] Atas persetujuan pasien: pengobatan, permintaan pasien, administrasi/asuransi; klaim JKN lewat persetujuan umum saat registrasi, tertulis atau elektronik (PMK24 P34, PP28 P783)
- [ ] Tanpa persetujuan hanya: penegakan hukum, etik/disiplin, audit medis, KLB/bencana, pendidikan/penelitian, ancaman keselamatan; tanpa membuka identitas pasien (PMK24 P35)
- [ ] Permintaan tertulis atau elektronik; terbatas sesuai kebutuhan (PMK24 P33)
- [ ] Pasien tidak cakap: keluarga terdekat, pengampu, atau ahli waris (PMK24 P34 ay3-6)
- [ ] Ke pihak lain hanya dengan persetujuan pasien (PMK24 P26 ay5)
- [ ] Beri rekam medis ke pasien rawat inap/darurat saat pulang dan ke faskes rujukan sebagai bagian surat rujukan, elektronik atau cetak (PMK24 P26 ay8-11)
- [ ] Kerahasiaan berlaku setelah pasien meninggal (PMK24 P32, PP28 P785)

### J. Pelindungan data pribadi (PP33, efektif 16 Jan 2027)
Persetujuan dan transparansi
- [ ] Catat dasar pemrosesan per tujuan sebelum memproses (P30)
- [ ] Persetujuan bebas, sadar, spesifik, tidak ambigu; informasi sebelum persetujuan; elektronik/nonelektronik; simpan bukti (siapa, kapan, versi teks, tujuan) (P32-36)
- [ ] Tarik persetujuan mudah; hentikan pemrosesan ≤3x24 jam (P37, P90, P92)
- [ ] Anak: identifikasi, persetujuan orang tua/wali dengan verifikasi (P38); disabilitas: wali, kanal aksesibel (P39)
- [ ] Halaman pemberitahuan PDP: tujuan, jenis data, masa retensi, hak subjek; perubahan diberitahukan sebelum berlaku (P62, P65, P68)
Hak pasien (≤3x24 jam)
- [ ] Kanal permohonan hak elektronik bercap waktu, verifikasi identitas, notifikasi hasil (P20-25)
- [ ] Koreksi ≤3x24 jam; data awal dipertahankan dengan catatan tambahan, tidak ditimpa; propagasi ke prosesor (P70-72)
- [ ] Akses, salinan, dan rekam jejak pemrosesan ≤3x24 jam; salinan tanpa data orang lain (P76-78)
- [ ] Tunda/batasi pemrosesan ≤3x24 jam, flag pada rekaman (P97-103)
- [ ] Keberatan atas keputusan otomatis dengan intervensi manusia, bila ada skoring/triase otomatis (P93-96)
- [ ] Ekspor format terbaca mesin; cakupan untuk RME belum jelas (P111)
Retensi dan penghapusan
- [ ] Dokumen kebijakan masa retensi: periode (RME 25 tahun), dasar hukum (PMK24 P39), metode musnah, deidentifikasi, ketentuan prosesor, penanggung jawab (P75)
- [ ] Alur permintaan hapus/musnah; bila ditolak karena retensi hukum, catat alasan dan beri tahu pasien (P79-89)
- [ ] Hapus/musnah mencakup backup dan salinan di prosesor; notifikasi ke subjek ≤3x24 jam; perintah ke prosesor lebih dulu; prosedur berlangkah dengan berita acara dan audit (P82, P84, P86-88)
- [ ] Risiko tafsir: PP33 tidak punya pengecualian eksplisit untuk retensi hukum; P85 membolehkan pemusnahan sebelum retensi habis atas permintaan subjek. Penolakan hapus RME bertumpu pada PMK24 P39 dan P9 g/P86 ("sesuai peraturan")
Akuntabilitas
- [ ] Rekaman kegiatan pemrosesan (ROPA) 13 butir: pengendali, PPDP, sumber/tujuan, dasar, tujuan, jenis data, kategori subjek, akses pihak lain, pemenuhan hak, aliran data, masa retensi, pengamanan, transfer; dapat diekspor (P74)
- [ ] DPIA sebelum go-live; tinjau ulang saat risiko berubah; catat saran PPDP (UU27 P34, PP33 P120-122)
- [ ] PPDP untuk pelayanan publik atau skala besar data spesifik; "dan/atau" menurut MK 151/2024 (UU27 P53, PP33 P142-147)
- [ ] Verifikasi akurasi dan kelengkapan data berkala (P69); audit PDP (P138)
Insiden
- [ ] Notifikasi tertulis ke pasien dan Lembaga ≤3x24 jam sejak diketahui secara pasti, patut, wajar; isi: data terungkap, kapan dan bagaimana, penanganan dan pemulihan, kontak PPDP (UU27 P46, PP33 P114)
- [ ] Notifikasi publik bila mengganggu pelayanan publik; dokumentasi insiden ke Lembaga (P115-117)
Vendor/prosesor
- [ ] Perjanjian pengendali-prosesor 11 butir termasuk audit dan sub-prosesor (P14); bertindak atas perintah tertulis; sub-prosesor perlu persetujuan tertulis (P15, P139)
- [ ] Vendor lapor kegagalan PDP "pada kesempatan pertama" (P118); tetapkan SLA jam di kontrak agar fasyankes patuh 3x24 jam
- [ ] Vendor punya ROPA, audit, dan menjalankan perintah hapus/koreksi/pembatasan (P140-141)
Transfer luar negeri
- [ ] Rekam transfer; nilai instrumen hukum; informasikan subjek; negara setara/klausul mengikat/persetujuan; enkripsi saat transfer (UU27 P56, PP33 P160-170); data kesehatan tetap tunduk lokalisasi di bagian E

### K. Tanda tangan elektronik dan persetujuan
- [ ] TTE opsional ("dapat"), untuk verifikasi isi RME dan identitas penanda tangan (PMK24 P31). TTE sah bila memenuhi syarat a-f (UU 11/2008 P11, PP71 P59 ay3); TTE tidak tersertifikasi diakui, sertifikat PSrE tidak wajib (PP71 P60 ay2); informasi dan dokumen elektronik sah sebagai alat bukti (UU 1/2024 P5)
- [ ] Catatan klinis wajib memuat "nama dan tanda tangan" nakes (PMK24 P16, P26 ay6); ketentuan resmi tidak menyebut login sebagai tanda tangan dan tidak merinci bentuknya bila TTE tidak dipakai. Di K1423, variabel "Tanda Tangan" (general consent, resep) diisi nama lengkap sesuai identitas. Catatan analisis: login tanpa log audit dan jaminan integritas data berisiko tidak memenuhi syarat c-d TTE (perubahan setelah penandatanganan harus dapat diketahui)
- [ ] Persetujuan tindakan: diberikan setelah penjelasan memadai (diagnosis, indikasi, tindakan dan tujuan, risiko dan komplikasi, alternatif dan risikonya, risiko bila tidak dilakukan, prognosis); boleh tertulis atau lisan; tertulis wajib sebelum tindakan invasif atau berisiko tinggi; ditandatangani pasien atau yang mewakili dan disaksikan satu tenaga medis/kesehatan (UU17 P293 ay2-8)
- [ ] Informed consent elektronik tidak diatur eksplisit. Permenkes 290/2008 berstatus "Berlaku" di JDIH meski UU 29/2004 sudah dicabut UU17; UU17 P293 ay12 mendelegasikan tata cara persetujuan ke Permenkes
- [ ] Modul TTE SATUSEHAT (disunting 13 Okt 2026; **hanya Sandbox, masih dikembangkan**): sertifikat X.509 sesuai Infrastruktur Sertifikat Digital Kesehatan Nasional (ISDK); 22 dokumen fasyankes (general consent, informed consent tindakan/anestesi/aborsi, DNR, APS, hasil lab/radiologi, resep, surat rawat inap, resume medis, dll) dan 4 dokumen asuransi; resource Composition, Consent, Provenance (signature), DocumentReference, DiagnosticReport, ServiceRequest, Task, Location, Device; prasyarat sama dengan modul lain

### L. Klaim JKN/BPJS (FKTP/klinik)
- [ ] Data klaim berdasarkan diagnosis/tindakan di rekam medis; diagnosis RME = data klaim (PMK24 P19); simpan nomor SEP dan kode ICD-10/ICD-9-CM konsisten dengan klaim
- [ ] Batas pengajuan klaim 6 bulan sejak pelayanan selesai; lewat itu tidak bisa diajukan (Perbpjs 7/2018 P40)
- [ ] Berkas klaim FKTP: formulir pengajuan klaim (FPK) ditandatangani pimpinan FKTP atau pejabat berwenang, rekapitulasi pelayanan, kuitansi asli bermaterai, surat tanggung jawab mutlak bermaterai (P12)
- [ ] Klaim rawat inap FKTP: surat perintah rawat inap dari dokter dan ringkasan rekam medis minimal: identitas pasien; diagnosis masuk dan indikasi dirawat; ringkasan pemeriksaan fisik dan penunjang, diagnosis akhir, pengobatan, tindak lanjut; nama dan tanda tangan dokter (P14)
- [ ] Berkas klaim dikembalikan (berita acara pengembalian): ajukan kembali paling lambat pada pengajuan klaim bulan berikutnya (P29 ay3-4); kapitasi dibayar paling lambat tanggal 15 tiap bulan (P29 ay1)
- [ ] BPJS dapat meminta dokumen klaim dalam bentuk softcopy atau transaksi data elektronik (P28), meminta ringkasan rekam medis (identitas, diagnosis, riwayat pemeriksaan dan pengobatan yang ditagihkan) dan melihat rekam medis untuk audit dengan tetap menjaga kerahasiaan (P38)
- [ ] Modul klaim SATUSEHAT "Klaim BPJS" V2 (24 Agu 2026, hanya sandbox): alur SEP/eligibilitas, Encounter, Invoice, Claim dengan Bundle RME bertanda tangan; merujuk Perbpjs 7/2018 dan hanya menyebut FKRTL, FKTP tidak disebut
- Dasar: Perbpjs 7/2018, Perpres 82/2018 (JKN), Permenkes 3/2023 (tarif; masih berlaku)

## 3. Batasan (aplikasi tidak boleh)
- Menyimpan/memproses data kesehatan di luar Indonesia, kecuali transfer terbatas berizin (bagian E)
- Vendor/PSE membuka, mengambil, memanipulasi, merusak, memanfaatkan data fasyankes (PMK24 P22 ay3)
- Mengubah data lewat 2x24 jam tanpa persetujuan perekam medis/pimpinan (PMK24 P30)
- Membuka rekam medis ke pihak lain tanpa persetujuan pasien atau dasar hukum, atau membuka identitas pasien pada pembukaan tanpa persetujuan (PMK24 P26, P33-35)
- Menimpa data awal saat koreksi pasien (PP33 P72) dan menghapus RME sebelum 25 tahun tanpa dasar hukum (risiko tafsir di bagian J)
- Menggantikan platform nasional: SATUSEHAT dikelola Kemenkes (K133 KELIMA)

## 4. Tenggat dan sanksi
| Tanggal | Ketentuan | Sumber |
|---|---|---|
| 31 Des 2023 | Semua fasyankes menyelenggarakan RME; belum: berpengaruh ke akreditasi | PMK24 P45, SE7093 angka 4 |
| 31 Des 2023 | Teguran tertulis: RME belum terintegrasi SATUSEHAT | SE 1030/2023 |
| 31 Mar 2024 | Rekomendasi penyesuaian akreditasi: belum terintegrasi | SE 1030/2023 |
| 31 Jul 2024 | Akreditasi: data kunjungan terkirim <50% | SE 1030/2023 |
| 31 Des 2024 | Akreditasi: data kunjungan <100% | SE 1030/2023 |
| 6 / 12 bulan sejak 27 Mar 2025 | RS kelas A-B / C-D-D Pratama; akreditasi turun satu tingkat atau izin usaha dicabut | SE 1564/2025 |
| 31 Des 2025 | RS dan klinik utama RME 100%, kirim data bulanan | SE 1669/2025 |
| 16 Jan 2027 | PP33 berlaku; denda maks 2% pendapatan tahunan | PP33 P185, P225 |

Sanksi RME: teguran tertulis, rekomendasi pencabutan/pencabutan akreditasi (PMK24 P42); pencabutan izin berusaha dapat diminta (SE 1030/2023 angka 6).

## 5. Peta regulasi
| Dokumen | Status | Peran |
|---|---|---|
| UU 17/2023 | berlaku | SIK, data di Indonesia, integrasi SIKN (P298-299, P345-349) |
| PP 28/2024 | berlaku | Rekam medis P777-792, data kesehatan P966; P787 dan P791 mendelegasikan ke Permenkes; mencabut PP 46/2014 |
| PMK 24/2022 | berlaku (tidak dicabut/diubah) | Aturan RME rinci |
| K1423/2022, K133/2023, K1559/2022 | berlaku | Variabel/metadata; SATUSEHAT; K1559 memuat Cetak Biru Strategi Transformasi Digital Kesehatan 2024: integrasi data berbasis individu (Integrated EHR), integrasi aplikasi pelayanan, ekosistem teknologi; target 100% fasyankes terintegrasi 2024 |
| SE7093/2023, SE 1030/2023, SE 1564/2025, SE 1669/2025 | berlaku | Standar sistem, tenggat, sanksi |
| Permenkes 11/2025 | berlaku | Perizinan berbasis risiko; klinik dan lab wajib RME terintegrasi SIKN |
| PMK 18/2022 | dianggap berlaku (JDIH dan SATUSEHAT masih mencantumkan) | Satu data kesehatan |
| UU 27/2022 + MK 151/2024 | berlaku | PDP; P53 dibaca "dan/atau" |
| PP 33/2026 | berlaku 16 Jan 2027 | Pelaksana UU PDP; banyak ketentuan didelegasikan ke Peraturan Lembaga |
| PP 71/2019, UU 11/2008, UU 19/2016, UU 1/2024 | berlaku | PSE, TTE, PSrE (UU 1/2024 P13A) |
| Perpres 82/2018, Permenkes 3/2023, Perbpjs 7/2018 | berlaku | JKN, tarif, administrasi klaim fasilitas kesehatan |
| Permenkes 290/2008 | "Berlaku" di JDIH | Persetujuan tindakan kedokteran |
| PP 46/2014 | dicabut PP 28/2024 | Hanya pembanding |

## 6. Yang belum dibaca
- Dokumen Standar Terminologi v11.2 (unduhan: s.kemkes.go.id/docStandarTerminologiSATUSEHAT): code system wajib per elemen FHIR
- Daftar Kamus Rule Number Validasi (unduhan di halaman api-catalogue/validasi/kamus-validasi)
- Tabel elemen wajib (*) per resource di halaman Resources, dan sebagian tabel RI/Kefarmasian
- Tab hak akses selain Fasyankes (Asuransi, Laboratorium, Radiologi, Farmasi, Pemerintahan, Institut Pendidikan)
- Profil FHIR Indonesia di Simplifier; versi FHIR (R4) tidak disebut eksplisit di halaman yang dibaca
- Bab lab, radiologi, dan alat kesehatan di modul hanya dibaca ringkas; diagram alur (gambar) tidak terbaca
- Rate limit API FHIR dan batas payload tidak tertera (katalog API dialihkan ke halaman selamat datang)
- PP33 P30-57 tidak punya pasal khusus "kewajiban data spesifik"; dampaknya lewat DPIA (P120) dan PPDP (P142)

## 7. Referensi primer
Folder `referensi primer/` (26 PDF + `link-primer.md`), nama file sesuai pola `jenis-nomor-tahun-judul.pdf`. `pp-33-2026` dan `se-menkes-1030-2023` berupa scan tanpa teks (baca sebagai gambar). `kepmenkes-33-2023-percontohan-deteksi-dini-kanker-leher-rahim` tidak relevan untuk RME (salah unduh).

## 8. Keputusan rancangan
Dasar hukum dan alasan di balik rancangan-aplikasi.md. Rancangan sendiri hanya memuat keputusan teknis.

### 8.1 Cakupan klinik pratama
- Dasar: Permenkes 11/2025. Klinik pratama = fasyankes tingkat pertama, rawat jalan atau rawat inap.
- Kewajiban klinik: registrasi klinik, SIP tenaga, akreditasi paling lambat 2 tahun, RME terintegrasi SATUSEHAT, pemutakhiran data lewat aplikasi Kemenkes, koordinasi dengan Puskesmas wilayah.
- Klinik rawat inap wajib punya instalasi farmasi; laboratorium tidak wajib, tetapi klinik ini menyediakannya.
- SE 1669/2025 (kirim data bulanan) menyebut RS dan klinik utama, bukan klinik pratama.
- Satu fasyankes = satu Organization ID SATUSEHAT (F). Data dan backup di Indonesia (E).

### 8.2 Peta fitur ke checklist
Kegiatan utama klinik:
| Fitur | Checklist |
|---|---|
| Pendaftaran pasien | B |
| Rawat jalan | C |
| Rawat inap | C |
| Laboratorium | C |
| Farmasi | C |
| Dokumen klinis | C |
| Tagihan dan kasir | L |
| Pengkodean dan analisis | C |
| Pengelolaan rekam medis | C, D, K |
| Pengelolaan klinik | D, G |
| Keamanan, audit, dan penyimpanan data | D, E, H |
| PDP internal dan prosesor | E, J |
| Modul program FKTP (tahap 2) | F |

Kebutuhan pihak ketiga:
| Fitur | Checklist |
|---|---|
| Konfigurasi dan kredensial | F |
| Sinkronisasi master | F |
| Sinkronisasi KFA | F |
| Pengiriman data | F |
| Validasi dan galat | F |
| Registrasi dan legalitas sistem | G |
| KYC SATUSEHAT Mobile | F |
| Pelaporan dan pemutakhiran data | C, G |
| Klaim FKTP | L |
| Klaim rawat inap | L |
| Siklus klaim | L |
| Permintaan data BPJS | I, L |
| Klaim elektronik SATUSEHAT (tahap 2) | L |
| Rujukan | A, F, I |
| Koordinasi Puskesmas wilayah | G |
| Persetujuan | I, J, K |
| Penyampaian rekam medis | I |
| Hak data pasien | J |
| Notifikasi kebocoran | J |
| Pembukaan rekam medis tanpa persetujuan | I |
| Pemeriksaan Lembaga PDP | J |

### 8.3 Tenggat yang harus bisa dibuktikan
- Kirim data SATUSEHAT
- Batas klaim 6 bulan (Perbpjs 7/2018 P40); pengembalian berkas diajukan ulang paling lambat pada pengajuan bulan berikutnya (P29)
- Hak pasien 3x24 jam (PP33)
- Notifikasi insiden 3x24 jam (PP33)
- Perbaikan catatan 2x24 jam oleh pembuat, sesudahnya perlu persetujuan (PMK24 P30)
- Retensi RME 25 tahun (PMK24 P39)

### 8.4 Dasar akses dan peringatan
- Hak akses diberikan pimpinan fasyankes kepada tenaga kesehatan dan tenaga lain, menjadi bagian kebijakan SOP (PMK24 P30). Izin dinyatakan sebagai fitur x aksi (input, perbaikan, lihat) x cakupan.
- Aturan hukum tidak memblokir; aplikasi memberi peringatan, pimpinan mengisi alasan, tercatat di audit.

Dasar jenis akun:
| Akun | Dasar |
|---|---|
| Admin vendor | F, G |
| Pimpinan fasyankes | D, I |
| Dokter/DPJP | C |
| Perawat/Bidan/Nakes lain | C |
| Perekam Medis dan Informasi Kesehatan | C, D, I |
| Petugas pendaftaran | B |
| Petugas klaim/kasir | L |
| Apoteker/tenaga kefarmasian | F |
| Analis lab | F |
| Admin IT fasyankes | F |
| Petugas PDP (PPDP) | J |
| Auditor | D |

Dasar peringatan:
| Peringatan | Dasar |
|---|---|


Profil profesi: nomor SIP (kewajiban klinik, Permenkes 11/2025) dan IHS Number praktisi (F). Semua tindakan akun tercatat di audit (D). Hapus data klinis tidak disediakan sebagai izin (E, J).

### 8.5 Catatan keputusan desain
- Tanda tangan nakes: ketentuan resmi mewajibkan "nama dan tanda tangan" tetapi tidak merinci bentuknya tanpa TTE dan tidak menyebut login sebagai tanda tangan. Rancangan memakai Pengesahan catatan plus log audit dan versi perbaikan; ini keputusan desain yang perlu dikonfirmasi ke pihak berwenang.
- Tanda tangan basah pasien pada persetujuan tindakan tertulis (UU17 P293 ay8) memakai cara sementara, mis. pindai dokumen bertanda tangan.
- TTE tidak wajib (PMK24 P31, "dapat"), jadi tidak dimasukkan.
- Klaim: Perbpjs 7/2018 memberi aturan berkas dan batas waktu FKTP; format ICD, SEP, dan teknis bridging (PCare, VClaim) tidak ditemukan di sumber resmi yang bisa dibuka, dan modul klaim SATUSEHAT hanya menyebut FKRTL. Cara mengirim klaim elektronik ke BPJS masih perlu bahan resmi tambahan.
- Pasien tidak punya akun dan tidak ada portal pasien: permintaan pasien dilayani lewat petugas PDP.
- Menunggu bahan: daftar elemen wajib per resource dan code system per elemen (bagian 6).
