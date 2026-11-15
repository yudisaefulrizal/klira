# PCare: autentikasi dan amplop respons

## Header setiap permintaan [repo]

| Header | Nilai |
|---|---|
| `X-cons-id` | `cons_id` |
| `X-Timestamp` | detik epoch UTC (`time()`), string |
| `X-Signature` | `base64( HMAC-SHA256( key=secret_key, data="{cons_id}&{timestamp}" ) )` |
| `user_key` | `user_key` |
| `X-Authorization` | `"Basic " + base64("{username}:{password}:{app_code}")`; hanya dikirim bila ketiganya terisi |
| `Content-Type` | GET: `application/json; charset=utf-8`; POST/PUT: `text/plain` (plus `Accept: application/json`); DELETE: `application/json` |

Validasi dummy yang masuk akal:

1. Ketiadaan `X-cons-id`, `X-Timestamp`, `X-Signature`, atau `user_key` menghasilkan penolakan.
2. Hitung ulang signature dari `cons_id` terdaftar; beda berarti ditolak.
3. Timestamp terlalu jauh dari waktu server berarti ditolak **[dugaan]** (jendela waktu asli tidak ada di repo).
4. `X-Authorization` salah berarti ditolak.

## Amplop respons [repo, sebagian dugaan]

```json
{
  "metaData": { "code": 200, "message": "OK" },
  "response": "<string terenkripsi>"
}
```

- `metaData.code` dan `metaData.message` pasti ada. Repo membuat sendiri respons galat dengan bentuk ini:

  ```json
  { "metaData": { "code": 504, "message": "Server BPJS tidak merespons dalam 60 detik. Silakan coba kembali dalam beberapa menit." }, "response": null }
  ```

- Bila badan respons bukan JSON, klien membungkusnya menjadi `{ "metaData": { "message": "<isi>", "code": 201 } }`.
- `response` boleh `null` atau `[]` (tanpa dekripsi). Bila berupa **string**, harus didekripsi. Bila sudah berupa objek atau array, dipakai apa adanya.
- Kode `metaData.code` yang lazim **[dugaan]**: `200` OK, `201` dibuat (POST sukses), `204` tidak ada data, `412` gagal validasi, `401`/`403` autentikasi, `404`, `500`.
- Timeout klien: 60 detik.

## Enkripsi `response` [repo]

Dekripsi di klien, jadi server dummy harus **mengenkripsi**:

1. `key_decrypt = cons_id + secret_key + timestamp` (gabungan string; timestamp dari header permintaan).
2. `kunci = SHA-256(key_decrypt)` sebagai 32 byte biner; `iv` = 16 byte pertama kunci itu.
3. Isi respons asli (JSON) dikompres: `LZString.compressToEncodedURIComponent(json)`.
4. Hasilnya dienkripsi `AES-256-CBC` dengan `OPENSSL_RAW_DATA` (PKCS7), lalu `base64` menjadi string `response`.

Urutan dekripsi di klien adalah kebalikannya: base64, AES-256-CBC, `decompressFromEncodedURIComponent`, JSON.

Pustaka Node yang bisa dipakai nanti: `lz-string` (`compressToEncodedURIComponent`) dan `crypto` bawaan.

## Pola parameter jalur [repo]

- Daftar berhalaman: `/{fitur}[/{kata-kunci}]/{start}/{limit}` (start dan limit sama-sama diisi, atau tidak sama sekali).
- Sub-jalur memakai segmen berpasangan, misalnya `/peserta/{noKartu}`, `/kdPoli/{kode}`.
- DELETE: `/{fitur}/{id}` atau `/{fitur}` plus segmen tambahan.
