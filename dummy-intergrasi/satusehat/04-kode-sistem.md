# SATUSEHAT: URL `system` dan identifier

Daftar semua nilai `system` yang muncul di kode repo **[repo]**. Dummy sebaiknya memvalidasi bahwa `system` dan `code` dikenal.

## Identifier fasyankes (`{org}` = Organization ID)

| `system` | Dipakai di |
|---|---|
| `http://sys-ids.kemkes.go.id/organization/{org}` | Organization |
| `http://sys-ids.kemkes.go.id/location/{org}` | Location |
| `http://sys-ids.kemkes.go.id/encounter/{org}` | Encounter (nomor registrasi) |
| `http://sys-ids.kemkes.go.id/medication/{org}` | Medication |
| `http://sys-ids.kemkes.go.id/prescription/{org}` | MedicationRequest (nomor resep) |
| `http://sys-ids.kemkes.go.id/prescription-item/{org}` | MedicationRequest (item resep) |
| `https://fhir.kemkes.go.id/id/nik` | Patient, Practitioner (NIK) |
| `https://fhir.kemkes.go.id/id/nik-ibu` | Patient bayi (NIK ibu) |

## Sistem kode klinis

| `system` | Isi |
|---|---|
| `http://hl7.org/fhir/sid/icd-10` | Diagnosis (Condition.code, reasonCode); divalidasi ke tabel ICD-10 |
| `http://hl7.org/fhir/sid/icd-9-cm` | Tindakan (Procedure.code) |
| `http://loinc.org` | Observation, ServiceRequest, DiagnosticReport |
| `http://snomed.info/sct` | Kategori, bagian tubuh, spesimen, alasan |
| `http://unitsofmeasure.org` | Satuan UCUM (valueQuantity, kekuatan obat) |
| `http://sys-ids.kemkes.go.id/kfa` | Produk obat (KFA): 91 bahan, 92 template, 93 produk |
| `http://www.whocc.no/atc` | Kelas ATC obat |
| `http://terminology.kemkes.go.id/CodeSystem/medication-form` | Bentuk sediaan (mis. `BS023`) |
| `http://terminology.kemkes.go.id/CodeSystem/medication-type` | Tipe obat (`NC`, dll.) |
| `http://sys-ids.kemkes.go.id/status-reason` | Alasan status MedicationRequest |

## Sistem HL7

| `system` | Nilai yang dipakai builder |
|---|---|
| `http://terminology.hl7.org/CodeSystem/v3-ActCode` | `AMB`, `EMER`, `IMP`, `HH`, `TELE` (Encounter.class) |
| `http://terminology.hl7.org/CodeSystem/v3-ParticipationType` | `ATND` dll. (Encounter.participant) |
| `http://terminology.hl7.org/CodeSystem/diagnosis-role` | `DD` Discharge diagnosis |
| `http://terminology.hl7.org/CodeSystem/condition-clinical` | `active`, `recurrence`, `inactive`, `remission`, `resolved` |
| `http://terminology.hl7.org/CodeSystem/condition-category` | `encounter-diagnosis`, `problem-list-item` |
| `http://terminology.hl7.org/CodeSystem/observation-category` | `vital-signs`, dll. |
| `http://terminology.hl7.org/CodeSystem/organization-type` | `dept`, `prov` |
| `http://terminology.hl7.org/CodeSystem/location-physical-type` | `bu wi co ro ve ho ca rd area bd` |
| `http://terminology.hl7.org/CodeSystem/v2-0116` | Status operasional lokasi `U O C H I K` |
| `http://terminology.hl7.org/CodeSystem/v3-MaritalStatus` | Status pernikahan |
| `http://terminology.hl7.org/CodeSystem/v2-0131` | Kontak darurat (`C`) |
| `urn:ietf:bcp:47` | Bahasa (`id-ID`) |
| `http://terminology.hl7.org/CodeSystem/medicationrequest-category` | `outpatient`, dll. |
| `http://terminology.hl7.org/CodeSystem/medicationrequest-performer-type` | |
| `http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy` | |
| `http://terminology.hl7.org/CodeSystem/v3-substanceAdminSubstitution` | Substitusi obat |
| `http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation` | Frekuensi dosis (`QD`, `BID`, ...) |
| `http://terminology.hl7.org/CodeSystem/dose-rate-type` | Jenis dosis |
| `http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical` / `-verification` | Alergi |
| `http://terminology.hl7.org/CodeSystem/risk-probability` | RiskAssessment |

## URL ekstensi dan profil Kemenkes

| URL | Dipakai di |
|---|---|
| `https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode` | Alamat: sub-ekstensi `province`, `city`, `district`, `village`, `rt`, `rw` |
| `https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace` | Patient |
| `https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus` | Patient (`WNI`/`WNA`) |
| `https://fhir.kemkes.go.id/r4/StructureDefinition/operationalStatus` | Organization |
| `https://fhir.kemkes.go.id/r4/CodeSystem/operational-status` | Nilai status operasional |
| `https://fhir.kemkes.go.id/r4/StructureDefinition/Patient` | `meta.profile` Patient |

## Panjang kode wilayah

Panjang `valueCode` diambil dari awal kode Kemendagri tanpa titik: provinsi 2 digit, kota 4, kecamatan 6, desa 10. Data wilayah klira sudah ada dan bisa dipakai sebagai sumber dummy.

## Sumber data kode untuk dummy

| Perlu | Sumber di klira |
|---|---|
| ICD-10 | berkas primer `dokumen/referensi primer/icd-10-2010-satusehat.xlsx` |
| ICD-9-CM | `apps/api/data/icd9cm-kptl-id.json` |
| KFA | `apps/api/data/kfa.json` |
| LOINC | `apps/api/data/loinc.json` |
| Wilayah | data wilayah klira (modul `wilayah`) |
