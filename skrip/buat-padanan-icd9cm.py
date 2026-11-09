"""Buat referensi nama tindakan KPTL; bukan terjemahan nama resmi ICD."""
import hashlib
import json
import re
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'dokumen/referensi tambahan/icd9cm-kptl'
SUMBER = FOLDER / 'mapping-icd9cm-kptl.xlsx'
SHA = 'aeff53051192037b6e0a0c52ae609d1c2009e9e81bf22c7ea718f9a2d56a1a69'
assert hashlib.sha256(SUMBER.read_bytes()).hexdigest() == SHA, 'Checksum sumber berbeda'
primer = json.loads((ROOT / 'apps/api/src/modul/klinis/data/icd9cm-2010.json').read_text())
nama = {x['kode']: x['nama'] for x in primer['kode']}
normal = lambda s: re.sub(r'[^a-z0-9]+', ' ', s.casefold()).strip()
w = openpyxl.load_workbook(SUMBER, read_only=True, data_only=True)
padanan = {}
ditinjau = []
for row in list(w['Mapping Kode ICD9CM ke KPTL'].values)[2:]:
    kode, inggris, indonesia, kode_kptl, *_ = (*row, None, None, None, None)
    if not kode:
        continue
    kode = str(kode).strip()
    if kode not in nama or not inggris or normal(str(inggris)) != normal(nama[kode]) or not indonesia or not kode_kptl:
        ditinjau.append({'kode': kode, 'nama_sumber': inggris, 'nama_primer': nama.get(kode), 'nama_kptl': indonesia, 'kode_kptl': kode_kptl})
        continue
    entri = {'kode': str(kode_kptl).strip(), 'nama': str(indonesia).strip()}
    daftar = padanan.setdefault(kode, [])
    if entri not in daftar:
        daftar.append(entri)
hasil = {'sumber': 'https://satusehat.kemkes.go.id/platform/docs/id/terminology/kptl/icd-9-cm-kptl/',
         'unduhan': 'https://docs.google.com/spreadsheets/d/1nViDXYHksDadE8H7N2j22B8Dwm5qj6PKRBV6kXpT3iM/export?format=xlsx',
         'sha256_sumber': SHA, 'sha256_berkas_primer': primer['sha256_primer'],
         'jenis': 'pemetaan_kptl_bukan_terjemahan_icd', 'jumlah_kode': len(padanan), 'padanan': dict(sorted(padanan.items()))}
(ROOT / 'apps/api/src/modul/klinis/data/icd9cm-kptl-id.json').write_text(json.dumps(hasil, ensure_ascii=False, indent=2) + '\n')
(FOLDER / 'perlu-ditinjau.json').write_text(json.dumps(ditinjau, ensure_ascii=False, indent=2) + '\n')
print(f'{len(padanan)} kode memiliki nama KPTL; {len(ditinjau)} baris disisihkan')
