# SATUSEHAT: struktur resource (request)

Semua dari builder PHP di repo **[repo]**. `{org}` = Organization ID fasyankes. Tanggal waktu memakai format `Y-m-d\TH:i:sP` (contoh `2026-11-14T08:00:00+07:00`).

## Organization

```json
{
  "resourceType": "Organization",
  "identifier": [{ "use": "official", "system": "http://sys-ids.kemkes.go.id/organization/{org}", "value": "KLINIK-A" }],
  "active": true,
  "type": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/organization-type", "code": "dept", "display": "Hospital Department" }] }],
  "name": "Poli Umum",
  "telecom": [{ "system": "phone", "value": "021...", "use": "work" }, { "system": "email", "value": "...", "use": "work" }, { "system": "url", "value": "...", "use": "work" }],
  "address": [{
    "use": "work", "type": "both", "line": ["Jl. ..."], "city": "...", "postalCode": "...", "country": "ID",
    "extension": [{ "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
      "extension": [
        { "url": "province", "valueCode": "31" }, { "url": "city", "valueCode": "3171" },
        { "url": "district", "valueCode": "317101" }, { "url": "village", "valueCode": "3171011001" } ] }]
  }],
  "partOf": { "reference": "Organization/{org}" }
}
```

Kode tipe: `dept` (Hospital Department, bawaan), `prov` (Healthcare Provider). `operationalStatus` dikirim sebagai ekstensi `https://fhir.kemkes.go.id/r4/StructureDefinition/operationalStatus` dengan system `https://fhir.kemkes.go.id/r4/CodeSystem/operational-status`.

## Location

```json
{
  "resourceType": "Location",
  "identifier": [{ "system": "http://sys-ids.kemkes.go.id/location/{org}", "value": "R-001" }],
  "status": "active",
  "name": "Ruang 1",
  "description": "Ruang 1",
  "mode": "instance",
  "telecom": [],
  "address": { "use": "work", "line": ["..."], "city": "...", "postalCode": "...", "country": "ID", "extension": ["(administrativeCode seperti Organization)"] },
  "physicalType": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/location-physical-type", "code": "ro", "display": "Room" }] },
  "position": { "longitude": 106.8, "latitude": -6.2, "altitude": 0 },
  "managingOrganization": { "reference": "Organization/{org}" },
  "partOf": { "reference": "Location/{id}" }
}
```

`operationalStatus` (system `http://terminology.hl7.org/CodeSystem/v2-0116`): `U` Unoccupied, `O` Occupied, `C` Closed, `H` Housekeeping, `I` Isolated, `K` Contaminated. `physicalType`: `bu`, `wi`, `co`, `ro`, `ve`, `ho`, `ca`, `rd`, `area`, `bd`.

## Patient

Wajib menurut builder: `identifier`, `name`, `address`, `telecom`, `multipleBirthInteger`.

```json
{
  "resourceType": "Patient",
  "meta": { "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"] },
  "identifier": [{ "use": "official", "system": "https://fhir.kemkes.go.id/id/nik", "value": "3171..." }],
  "active": true,
  "name": [{ "use": "official", "text": "Nama Pasien" }],
  "telecom": [{ "system": "phone", "value": "08...", "use": "mobile" }],
  "gender": "male",
  "birthDate": "1990-01-31",
  "deceasedBoolean": false,
  "address": [{ "use": "home", "line": ["Jl. ..."], "city": "...", "postalCode": "...", "country": "ID",
    "extension": [{ "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
      "extension": [
        { "url": "province", "valueCode": "31" }, { "url": "city", "valueCode": "3171" },
        { "url": "district", "valueCode": "317101" }, { "url": "village", "valueCode": "3171011001" },
        { "url": "rt", "valueCode": "1" }, { "url": "rw", "valueCode": "2" } ] }] }],
  "maritalStatus": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus", "code": "M", "display": "Married" }], "text": "Married" },
  "multipleBirthInteger": 0,
  "contact": [{ "relationship": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v2-0131", "code": "C" }] }],
    "name": { "use": "official", "text": "..." }, "telecom": [{ "system": "phone", "value": "...", "use": "mobile" }] }],
  "communication": [{ "language": { "coding": [{ "system": "urn:ietf:bcp:47", "code": "id-ID", "display": "Indonesian" }] }, "preferred": true }],
  "extension": [
    { "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace", "valueAddress": { "city": "...", "country": "ID" } },
    { "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus", "valueCode": "WNI" } ]
}
```

Kode status pernikahan dari builder: `unmarried`, `married`, `divorced`, `never`, `widowed`. Jenis identifier: `nik`, `nik-ibu` (bayi), dll. (segmen akhir `https://fhir.kemkes.go.id/id/{jenis}`).

## Practitioner (hanya baca)

Dicari lewat `identifier=https://fhir.kemkes.go.id/id/nik|{nik}`. Klien memakai: `id`, `gender`, `birthDate`, `name[0].text`, `qualification[0]`, `address[0].line[0]`, `address[0].city`, dan kode desa dari ekstensi `administrativeCode`.

```json
{
  "resourceType": "Practitioner", "id": "10009880728",
  "identifier": [{ "system": "https://fhir.kemkes.go.id/id/nik", "value": "..." }, { "system": "https://fhir.kemkes.go.id/id/nakes-his-number", "value": "..." }],
  "name": [{ "use": "official", "text": "dr. Contoh" }],
  "gender": "female", "birthDate": "1980-01-01",
  "address": [{ "use": "home", "line": ["..."], "city": "...", "country": "ID" }],
  "qualification": [{ "code": { "coding": [{ "system": "...", "code": "STR..." }] } }]
}
```

Isi lengkap Practitioner asli: **[dugaan]**.

## Encounter

Wajib menurut builder: `status`, `class`, `subject`, `participant`, `location`; `serviceProvider` terisi otomatis.

```json
{
  "resourceType": "Encounter",
  "identifier": [{ "system": "http://sys-ids.kemkes.go.id/encounter/{org}", "value": "REG-0001" }],
  "status": "finished",
  "class": { "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB", "display": "ambulatory" },
  "subject": { "reference": "Patient/P02478375538", "display": "Nama Pasien" },
  "participant": [{
    "type": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "ATND", "display": "attender" }] }],
    "individual": { "reference": "Practitioner/10009880728", "display": "dr. Contoh" } }],
  "period": { "start": "2026-11-14T08:00:00+07:00", "end": "2026-11-14T08:45:00+07:00" },
  "location": [{ "location": { "reference": "Location/{id}", "display": "Ruang 1" } }],
  "diagnosis": [{
    "condition": { "reference": "Condition/{id}", "display": "Typhoid fever" },
    "use": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/diagnosis-role", "code": "DD", "display": "Discharge diagnosis" }] },
    "rank": 1 }],
  "statusHistory": [
    { "status": "arrived", "period": { "start": "2026-11-14T08:00:00+07:00", "end": "2026-11-14T08:10:00+07:00" } },
    { "status": "in-progress", "period": { "start": "2026-11-14T08:10:00+07:00", "end": "2026-11-14T08:40:00+07:00" } },
    { "status": "finished", "period": { "start": "2026-11-14T08:45:00+07:00", "end": "2026-11-14T08:45:00+07:00" } } ],
  "serviceProvider": { "reference": "Organization/{org}" }
}
```

Nilai `status`: `planned, arrived, triaged, in-progress, onleave, finished, cancelled`. Pemetaan `class` dari builder: `RAJAL`→`AMB ambulatory`, `IGD`→`EMER emergency`, `RANAP`→`IMP inpatient encounter`, `HOMECARE`→`HH home health`, `TELEKONSULTASI`→`TELE teleconsultation`. Di dalam Bundle, referensi memakai `urn:uuid:{uuid}`.

## Condition

Wajib: `subject`, `encounter`, `code`; bawaan terisi: `clinicalStatus`, `category`, `onsetDateTime`, `recordedDate`.

```json
{
  "resourceType": "Condition",
  "clinicalStatus": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active", "display": "Active" }] },
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/condition-category", "code": "encounter-diagnosis", "display": "Encounter Diagnosis" }] }],
  "code": { "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "A01.0", "display": "Typhoid fever" }] },
  "subject": { "reference": "Patient/P02478375538", "display": "Nama Pasien" },
  "encounter": { "reference": "Encounter/{id}", "display": "Kunjungan {id}" },
  "onsetDateTime": "2026-11-14T08:20:00+07:00",
  "recordedDate": "2026-11-14T08:20:00+07:00"
}
```

`clinicalStatus`: `active, recurrence, inactive, remission, resolved`. `category`: `encounter-diagnosis` (diagnosis) atau `problem-list-item` (keluhan). Kode ICD-10 divalidasi ke tabel ICD-10 (builder menolak kode asing).

## Observation (tanda vital)

Wajib: `status`, `category`, `code`, `subject`, `encounter`.

```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs", "display": "Vital Signs" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure" }] },
  "subject": { "reference": "Patient/{id}", "display": "..." },
  "performer": [{ "reference": "Practitioner/{id}", "display": "..." }],
  "encounter": { "reference": "Encounter/{id}", "display": "..." },
  "effectiveDateTime": "2026-11-14T08:15:00+07:00",
  "issued": "2026-11-14T08:15:00+07:00",
  "valueQuantity": { "value": 120, "unit": "mm[Hg]", "system": "http://unitsofmeasure.org", "code": "mm[Hg]" }
}
```

Nilai `status`: `registered, preliminary, final, amended, corrected, cancelled, entered-in-error, unknown`. Kode LOINC tanda vital di builder: `8480-6` sistolik, `8462-4` diastolik, `8867-4` denyut jantung, `8310-5` suhu tubuh, `9279-1` laju napas. `effectiveDateTime`, `issued`, `valueQuantity` tidak diset oleh builder (lewat `setField`); bentuknya FHIR standar **[dugaan]**.

## Procedure

Kode tindakan default ICD-9-CM.

```json
{
  "resourceType": "Procedure",
  "status": "completed",
  "category": { "coding": [{ "system": "http://snomed.info/sct", "code": "...", "display": "..." }] },
  "code": { "coding": [{ "system": "http://hl7.org/fhir/sid/icd-9-cm", "code": "89.03", "display": "..." }] },
  "subject": { "reference": "Patient/{id}", "display": "..." },
  "encounter": { "reference": "Encounter/{id}" },
  "performedPeriod": { "start": "...", "end": "..." },
  "performer": [{ "actor": { "reference": "Practitioner/{id}", "display": "..." } }],
  "reasonCode": [{ "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "...", "display": "..." }] }],
  "bodySite": [{ "coding": [{ "system": "http://snomed.info/sct", "code": "...", "display": "..." }] }],
  "note": [{ "text": "..." }]
}
```

## Medication

```json
{
  "resourceType": "Medication",
  "meta": { "profile": ["https://fhir.kemkes.go.id/r4/StructureDefinition/Medication"] },
  "identifier": [{ "system": "http://sys-ids.kemkes.go.id/medication/{org}", "use": "official", "value": "OBT-001" }],
  "code": { "coding": [{ "system": "http://sys-ids.kemkes.go.id/kfa", "code": "93000108", "display": "..." }] },
  "status": "active",
  "form": { "coding": [{ "system": "http://terminology.kemkes.go.id/CodeSystem/medication-form", "code": "BS023", "display": "Tablet" }] },
  "extension": [{ "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
    "valueCodeableConcept": { "coding": [{ "system": "http://terminology.kemkes.go.id/CodeSystem/medication-type", "code": "NC", "display": "Non-compound" }] } }],
  "ingredient": [{ "itemCodeableConcept": { "coding": [{ "system": "http://sys-ids.kemkes.go.id/kfa", "code": "91000xxx", "display": "..." }] },
    "isActive": true, "strength": { "numerator": { "value": 500, "system": "http://unitsofmeasure.org", "code": "mg" }, "denominator": { "value": 1, "system": "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm", "code": "TAB" } } }],
  "batch": { "lotNumber": "...", "expirationDate": "2028-01-01" }
}
```

Isi `extension` dan `denominator.system` untuk satuan: **[dugaan]** untuk URL ekstensi persisnya; `drug_form` di builder juga memakai `http://snomed.info/sct` untuk sebagian satuan. Tipe obat: `NC` non-racikan, `SD` racikan, `EP` ekstemporan (kode terakhir **[dugaan]**).

## MedicationRequest

Memakai identifier `http://sys-ids.kemkes.go.id/prescription/{org}` dan `.../prescription-item/{org}`.

```json
{
  "resourceType": "MedicationRequest",
  "identifier": [
    { "system": "http://sys-ids.kemkes.go.id/prescription/{org}", "use": "official", "value": "RESEP-001" },
    { "system": "http://sys-ids.kemkes.go.id/prescription-item/{org}", "use": "official", "value": "RESEP-001-1" } ],
  "status": "completed",
  "intent": "order",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-category", "code": "outpatient", "display": "Outpatient" }] }],
  "priority": "routine",
  "medicationReference": { "reference": "Medication/{id}", "display": "..." },
  "subject": { "reference": "Patient/{id}", "display": "..." },
  "encounter": { "reference": "Encounter/{id}" },
  "authoredOn": "2026-11-14T08:30:00+07:00",
  "requester": { "reference": "Practitioner/{id}", "display": "..." },
  "reasonCode": [{ "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "A01.0", "display": "..." }] }],
  "dosageInstruction": ["(FHIR standar; timing memakai http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation, dose-rate-type)"],
  "dispenseRequest": ["(FHIR standar)"],
  "substitution": ["(system http://terminology.hl7.org/CodeSystem/v3-substanceAdminSubstitution)"]
}
```

`statusReason` memakai `http://sys-ids.kemkes.go.id/status-reason`. `performerType` memakai `medicationrequest-performer-type`. `courseOfTherapyType` memakai `medicationrequest-course-of-therapy`.

## ServiceRequest (lab/radiologi)

```json
{
  "resourceType": "ServiceRequest",
  "identifier": [{ "system": "http://sys-ids.kemkes.go.id/servicerequest/{org}", "value": "SR-001" }],
  "status": "active",
  "intent": "original-order",
  "category": [{ "coding": [{ "system": "http://snomed.info/sct", "code": "108252007", "display": "Laboratory procedure" }] }],
  "priority": "routine",
  "code": { "coding": [{ "system": "http://loinc.org", "code": "2345-7", "display": "Glucose [Mass/volume] in Serum or Plasma" }] },
  "subject": { "reference": "Patient/{id}", "display": "..." },
  "encounter": { "reference": "Encounter/{id}" },
  "occurrenceDateTime": "...", "authoredOn": "...",
  "requester": { "reference": "Practitioner/{id}", "display": "..." },
  "performer": [{ "reference": "Practitioner/{id}", "display": "..." }],
  "reasonCode": [{ "coding": [{ "system": "http://snomed.info/sct", "code": "...", "display": "..." }], "text": "..." }],
  "specimen": [{ "reference": "Specimen/{id}" }],
  "note": [{ "text": "..." }],
  "patientInstruction": "puasa 8 jam"
}
```

URL `identifier.system` servicerequest dan kode kategori persisnya: **[dugaan]** (builder meminta `system` dari pemanggil).

## Specimen, DiagnosticReport

```json
{ "resourceType": "Specimen", "status": "available",
  "type": { "coding": [{ "system": "http://snomed.info/sct", "code": "119297000", "display": "Blood specimen" }] },
  "subject": { "reference": "Patient/{id}" } }

{ "resourceType": "DiagnosticReport",
  "identifier": [{ "system": "...", "value": "..." }],
  "status": "final",
  "category": [{ "coding": [{ "system": "...", "code": "...", "display": "..." }], "text": "..." }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "...", "display": "..." }] },
  "subject": { "reference": "Patient/{id}" },
  "encounter": { "reference": "Encounter/{id}" },
  "effectiveDateTime": "...", "issued": "...",
  "performer": [{ "reference": "Practitioner/{id}" }],
  "resultsInterpreter": [{ "reference": "Practitioner/{id}" }],
  "specimen": [{ "reference": "Specimen/{id}" }],
  "result": [{ "reference": "Observation/{id}" }],
  "imagingStudy": [{ "reference": "ImagingStudy/{id}" }],
  "conclusion": "...",
  "conclusionCode": [{ "coding": [{ "system": "...", "code": "...", "display": "..." }] }] }
```

## Bundle transaksi

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    { "fullUrl": "urn:uuid:{encounterUuid}", "resource": { "resourceType": "Encounter", "...": "..." },
      "request": { "method": "POST", "url": "Encounter" } },
    { "fullUrl": "urn:uuid:{conditionUuid}", "resource": { "resourceType": "Condition", "encounter": { "reference": "urn:uuid:{encounterUuid}" }, "...": "..." },
      "request": { "method": "POST", "url": "Condition" } }
  ]
}
```

`Encounter.diagnosis[].condition.reference` = `urn:uuid:{conditionUuid}`. UUID v4. Dikirim ke akar FHIR (bukan `/Bundle`).

## Resource lain (builder ada, struktur tidak dirinci)

AllergyIntolerance (system `allergyintolerance-clinical` dan `-verification`), CarePlan, Composition, Goal, Claim/ClaimResponse/Coverage/Invoice (untuk klaim BPJS, hanya sandbox), Immunization (CVX), dan seterusnya. Tambahkan bila modulnya dikerjakan di klira.
