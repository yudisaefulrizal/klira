# SATUSEHAT: lingkungan dan autentikasi

## Lingkungan [repo]

| Env | Base URL bawaan | Variabel |
|---|---|---|
| `DEV` | `https://api-satusehat-dev.dto.kemkes.go.id` | `CLIENTID_DEV`, `CLIENTSECRET_DEV`, `ORGID_DEV`, `SATUSEHAT_BASE_URL_DEV` |
| `STG` | `https://api-satusehat-stg.dto.kemkes.go.id` | `CLIENTID_STG`, `CLIENTSECRET_STG`, `ORGID_STG`, `SATUSEHAT_BASE_URL_STG` |
| `PROD` | `https://api-satusehat.kemkes.go.id` | `CLIENTID_PROD`, `CLIENTSECRET_PROD`, `ORGID_PROD`, `SATUSEHAT_BASE_URL_PROD` |

Pilihan lingkungan lewat `SATUSEHAT_ENV` (`DEV|STG|PROD`). Satu klien (client_id) berpasangan dengan satu Organization ID.

Awalan jalur (dapat diubah lewat env):

- Auth: `{base}/oauth2/v1` (`SATUSEHAT_AUTH_ENDPOINT`)
- FHIR: `{base}/fhir-r4/v1` (`SATUSEHAT_FHIR_ENDPOINT`)
- KFA: `{base}/kfa-v2/...`
- KYC: `{base}/kyc/v1/generate-url`

Server dummy cukup menyediakan satu `base` dan klira memakai `STG` atau env baru yang mengarah ke dummy.

## Token OAuth2 [repo]

```
POST {base}/oauth2/v1/accesstoken?grant_type=client_credentials
Content-Type: application/x-www-form-urlencoded

client_id=...&client_secret=...
```

Respons sukses (field yang dibaca klien: `access_token`) **[repo + dugaan format lengkap]**:

```json
{
  "refresh_token_expires_in": "0",
  "api_product_list": "[...]",
  "api_product_list_json": ["..."],
  "organization_name": "...",
  "developer.email": "...",
  "token_type": "BearerToken",
  "issued_at": "1731570000000",
  "client_id": "...",
  "access_token": "....",
  "application_name": "...",
  "scope": "",
  "expires_in": "3599",
  "refresh_count": "0",
  "status": "approved"
}
```

- Klien menyimpan token dan memakainya ulang selama kurang dari **50 menit**; masa berlaku asli kira-kira 1 jam (`expires_in` ~ 3599 detik **[dugaan]**).
- Semua panggilan berikutnya: `Authorization: Bearer {access_token}`.
- Galat kredensial: HTTP 4xx dengan badan `OperationOutcome`; klien membaca `issue[0].details.text`:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    { "severity": "error", "code": "processing", "details": { "text": "Invalid Access Token / invalid client credentials" } }
  ]
}
```

Bila token tidak didapat, klien menghasilkan `[401, "Unauthorized. Token not found"]`.

## Data uji bawaan [repo]

Pengenal pasien sandbox (`patient_dev`): `P02478375538`, `P02428473601`, `P03647103112`, `P01058967035`, `P01836748436`, `P01654557057`, `P00805884304`, `P00883356749`, `P00912894463`.

NIK Practitioner sandbox (`practitioner_dev`): `10009880728`, `10006926841`, `10001354453`, `10010910332`, `10018180913`, `10002074224`, `10012572188`, `10018452434`, `10014058550`, `10001915884`.

Gunakan nilai itu sebagai data awal dummy supaya mirip sandbox asli.

## KFA (katalog farmasi dan alkes) [repo]

```
GET {base}/kfa-v2/products?identifier=kfa&code=93000108
GET {base}/kfa-v2/products/all?page=1&size=10&product_type=farmasi&keyword=...
Authorization: Bearer ...
```

Klien memeriksa: untuk `products/all` ada `total`, untuk `products` ada `result`. Bila kosong dianggap "Not Found". Bentuk respons lengkap: **[dugaan]**. Data awal dummy dapat diambil dari `apps/api/data/kfa.json` klira.

## KYC (verifikasi pengguna SATUSEHAT Mobile) [repo]

`POST {base}/kyc/v1/generate-url`, `Content-Type: text/plain`, `Authorization: Bearer ...`.

Tubuh permintaan bukan JSON polos tapi **pesan terenkripsi**:

1. Buat pasangan kunci RSA 2048 milik klien.
2. Isi: `{ "agent_name": "...", "agent_nik": "...", "public_key": "<PEM publik klien>" }`.
3. Buat kunci AES-256 acak (32 byte). Enkripsi isi dengan AES-256-GCM (nonce 12 byte, tag 16 byte): `nonce || ciphertext || tag`.
4. Bungkus kunci AES dengan kunci publik server (RSA-OAEP).
5. Tubuh = `wrappedKey (256 byte) || nonce || ciphertext || tag`, base64, dibungkus `-----BEGIN ENCRYPTED MESSAGE-----` / `-----END ENCRYPTED MESSAGE-----` (baris 64 karakter, `\r\n`).

Respons dibungkus format yang sama dan didekripsi dengan kunci privat klien. Isi respons asli (URL validasi): **[dugaan]**, tidak ada contoh di repo.

Kunci publik server tertanam di kode klien; dummy harus memakai pasangan kunci sendiri dan klien diatur memakai kunci publik dummy.
