"""Cocokkan padanan komunitas ke ICD-10 primer; tidak mengubah nama/kode resmi."""
import hashlib
import json
import re
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
FOLDER = AKAR / 'dokumen/referensi tambahan/icd10-fendis0709'
SUMBER = FOLDER / 'master_icd_x.json'
PRIMER = AKAR / 'apps/api/src/modul/klinis/data/icd10-2010.json'
REPO = 'https://github.com/fendis0709/icd-10'
COMMIT = 'aae98fb2a455d5c5aac829d1dca7bbc29e70ba45'
SHA_SUMBER = '78e5f7a52d4de330981e800ae74997efaacbdf908f573aaee74e6d86c9b9b49d'
if hashlib.sha256(SUMBER.read_bytes()).hexdigest() != SHA_SUMBER:
    raise ValueError('Sumber padanan berubah; perbarui commit dan checksum setelah ditinjau.')

normal = lambda s: re.sub(r'[^a-z0-9]+', ' ', s.casefold()).strip()
resmi = {b['kode']: b['nama'] for b in json.loads(PRIMER.read_text())['kode']}
rows = json.loads(SUMBER.read_text())
padanan = {}
ditinjau = []
for row in rows:
    kode = row['kode_icd'].strip()
    nama = row['nama_icd'].strip()
    indonesia = row['nama_icd_indo'].strip()
    if kode in padanan:
        raise ValueError(f'Kode duplikat: {kode}')
    alasan = 'kode_tidak_di_referensi_2010' if kode not in resmi else 'nama_inggris_berbeda' if normal(nama) != normal(resmi[kode]) else 'padanan_kosong' if not indonesia else None
    if alasan:
        ditinjau.append({**row, 'nama_resmi_2010': resmi.get(kode), 'alasan': alasan})
    else:
        padanan[kode] = indonesia
output = {
    'sumber': REPO, 'commit': COMMIT, 'versi_disebut_readme': '2019',
    'sha256_sumber': hashlib.sha256(SUMBER.read_bytes()).hexdigest(),
    'sha256_json_primer': hashlib.sha256(PRIMER.read_bytes()).hexdigest(),
    'sha256_berkas_primer': json.loads(PRIMER.read_text())['sha256_primer'],
    'status': 'padanan_komunitas_belum_diverifikasi_klinis',
    'kebijakan': 'Kode ada di referensi 2010 dan nama Inggris cocok setelah normalisasi huruf/tanda baca; nama resmi tidak diganti.',
    'jumlah_sumber': len(rows), 'jumlah_padanan': len(padanan), 'jumlah_ditinjau': len(ditinjau),
    'padanan': dict(sorted(padanan.items())),
}
(PRIMER.parent / 'icd10-padanan-id.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
(FOLDER / 'perlu-ditinjau.json').write_text(json.dumps(ditinjau, ensure_ascii=False, indent=2) + '\n')
print(f'{len(rows)} sumber; {len(padanan)} padanan komunitas; {len(ditinjau)} ditinjau')
