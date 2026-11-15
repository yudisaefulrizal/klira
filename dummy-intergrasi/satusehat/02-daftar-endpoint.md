# SATUSEHAT: daftar endpoint

Semua jalur FHIR relatif terhadap `{base}/fhir-r4/v1`. Header: `Authorization: Bearer {token}`; untuk POST/PUT tambah `Content-Type: application/json`.

## Operasi yang dipakai klien [repo]

| Metode | Jalur | Fungsi | Sukses |
|---|---|---|---|
| GET | `/{ResourceType}/{id}` | Baca satu resource | 200, resource |
| GET | `/{ResourceType}?identifier=https://fhir.kemkes.go.id/id/nik\|{nik}` | Cari menurut NIK (Patient, Practitioner) | 200, `Bundle` `searchset` |
| POST | `/{ResourceType}` | Buat resource | 201, resource dengan `id` |
| POST | `/` (akar FHIR, tanpa nama resource) | Kirim `Bundle` transaksi | 200/201, `Bundle` `transaction-response` |
| PUT | `/{ResourceType}/{id}` | Ganti resource (`id` wajib juga di badan) | 200, resource |

`ResourceType` yang punya builder di repo: Account, AllergyIntolerance, Bundle, CarePlan, ChargeItem(+Definition/Response), Claim, ClaimResponse, ClinicalImpression, Composition, Condition, Coverage(+EligibilityRequest/Response), Device, DiagnosticReport, DocumentReference, Encounter, EpisodeOfCare, FamilyMemberHistory, GenomicStudy, Goal, Group, ImagingStudy, Immunization, Invoice, Location, Medication, MedicationAdministration, MedicationDispense, MedicationRequest, MedicationStatement, MolecularSequence, NutritionOrder, Observation, Organization, Patient, PaymentNotice, PaymentReconciliation, Practitioner, PractitionerRole, Procedure, QuestionnaireResponse, RelatedPerson, RiskAssessment, ServiceRequest, Specimen, Substance, Task.

Prioritas klinik rawat jalan (usulan): Organization, Location, Patient, Practitioner, Encounter, Condition, Observation, Procedure, Medication, MedicationRequest, MedicationDispense, ServiceRequest, Specimen, DiagnosticReport, AllergyIntolerance, Composition.

## Pembuatan Patient: respons khusus [repo]

POST `/Patient` tidak mengembalikan resource FHIR, melainkan:

```json
{ "success": true, "data": { "patient_id": "P02478375538" } }
```

Untuk identifier `nik-ibu` (bayi) respons dibungkus `{ "create_patient": { "success": true, "data": { "patient_id": "..." } } }`. Klien memilih cabang menurut segmen ketiga path `system` identifier (`nik` atau `nik-ibu`).

## Bundle transaksi [repo]

`POST {base}/fhir-r4/v1` dengan badan `Bundle` `type: transaction` (lihat struktur di berkas 03). Respons sukses **[dugaan standar FHIR]**:

```json
{
  "resourceType": "Bundle",
  "type": "transaction-response",
  "entry": [
    { "response": { "status": "201 Created", "location": "Encounter/<uuid>/_history/1", "etag": "W/\"1\"", "lastModified": "2026-11-14T08:00:00+00:00" } },
    { "response": { "status": "201 Created", "location": "Condition/<uuid>/_history/1" } }
  ]
}
```

Referensi `urn:uuid:` antar entri harus diganti dengan id sebenarnya oleh server.

## Pencarian hasil [repo + FHIR standar]

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [ { "fullUrl": ".../Patient/P02478375538", "resource": { "resourceType": "Patient", "id": "P02478375538" } } ]
}
```

Klien menganggap tidak ditemukan bila `resourceType == "OperationOutcome"` atau `total == 0`.

## Respons galat

HTTP 400/401/403/404/422/500 dengan badan **[repo, dari cara klien membaca galat]**:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "details": { "text": "pesan galat" },
      "diagnostics": "keterangan tambahan",
      "expression": ["Encounter.subject"]
    }
  ]
}
```

Klien mengambil pesan dari `issue[].details.text`, lalu `issue[].diagnostics`, lalu `issue[].details.coding[0].display`. Dummy sebaiknya menolak:

- tanpa token atau token kedaluwarsa (401);
- resource tanpa field wajib (400/422);
- referensi ke Patient, Practitioner, Encounter, atau Organization yang tidak ada;
- kode ICD-10, LOINC, atau KFA yang tidak dikenal (lihat berkas 04).

## KFA

| Metode | Jalur | Parameter |
|---|---|---|
| GET | `{base}/kfa-v2/products` | `identifier=kfa\|nie\|lkpp`, `code` |
| GET | `{base}/kfa-v2/products/all` | `page`, `size`, `product_type`, `from_date`, `to_date`, `keyword`, `template_code`, `packaging_code` |

Parameter dari `dokumen/regulasi.md` baris 73 (portal Kemenkes), bukan dari repo.

## Lain-lain

| Metode | Jalur | Fungsi |
|---|---|---|
| POST | `{base}/oauth2/v1/accesstoken?grant_type=client_credentials` | Token (lihat 01) |
| POST | `{base}/kyc/v1/generate-url` | KYC (lihat 01) |
| GET/POST | `{TERMINOLOGY_BASE}/api/...` | Layanan terminologi pihak ketiga milik pembuat repo (`auth.ivanmd.id`), bukan SATUSEHAT resmi; tidak perlu ditiru |
