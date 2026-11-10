"""Ubah CSV LOINC dari satusehat-integration (ivanwilliammd) menjadi JSON statis apps/api/data/loinc.json (hanya kode laboratorium aktif)."""
import csv
import gzip
import hashlib
import io
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'dokumen/referensi tambahan/satusehat-integration-ivanwilliammd'
SUMBER = FOLDER / 'loinc.csv.gz'
KELUARAN = ROOT / 'apps/api/data/loinc.json'
COMMIT = 'e4c3667924f707002ae4671e73d79667f6fcb084'
SHA = '443f94d9960f94358a016f8bae7f9cefa3ff8bcc938cf03423fb3c1b518e13a4'  # SHA-256 loinc.csv.stub (sebelum dikompres)
HAK_CIPTA = ('This material contains content from LOINC (http://loinc.org). LOINC is copyright Regenstrief Institute, Inc. and the Logical '
             'Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at http://loinc.org/license. '
             'LOINC is a registered United States trademark of Regenstrief Institute, Inc.')

mentah = gzip.open(SUMBER).read()
assert hashlib.sha256(mentah).hexdigest() == SHA, 'Checksum sumber berbeda'
KONSENTRASI = {'MCnc', 'SCnc', 'NCnc', 'ACnc', 'CCnc', 'EntMCnc', 'EntSCnc'}
SPESIMEN_UMUM = {'Bld', 'Ser/Plas', 'Ser', 'Plas', 'Urine', 'BldV', 'BldA', 'BldC', 'BldCo'}
rapikan = lambda s: re.sub(r'\s+', ' ', (s or '').strip())
baris = list(csv.DictReader(io.StringIO(mentah.decode('utf-8-sig'), newline=''), delimiter=';'))

# CLASSTYPE 1 = laboratorium. Baris dengan pemberitahuan hak cipta pihak ketiga (EXTERNAL_COPYRIGHT_NOTICE) tidak dimuat.
kode, ditolak = [], Counter()
for r in baris:
    if r['CLASSTYPE'] != '1':
        ditolak['bukan laboratorium'] += 1
    elif r['STATUS'] != 'ACTIVE':
        ditolak['tidak aktif (' + r['STATUS'].lower() + ')'] += 1
    elif r['EXTERNAL_COPYRIGHT_NOTICE'].strip():
        ditolak['hak cipta pihak ketiga'] += 1
    else:
        # urut (0 paling umum): untuk mengurutkan saran tanpa data peringkat resmi.
        #   0 = konsentrasi kuantitatif, tanpa metode khusus, sekali ambil, komponen sederhana, di darah atau serum/plasma
        #   1 = kriteria yang sama di spesimen lain umum (serum, plasma, urin, dll.); 2 = konsentrasi kuantitatif lainnya; 3 = kuantitatif lainnya; 4 = sisanya
        sederhana = not any(c in r['COMPONENT'] for c in './^')
        konsentrasi = r['SCALE_TYP'] == 'Qn' and r['PROPERTY'] in KONSENTRASI and r['SYSTEM'] in SPESIMEN_UMUM
        umum = konsentrasi and not r['METHOD_TYP'].strip() and r['TIME_ASPCT'] == 'Pt' and sederhana
        urut = 0 if umum and r['SYSTEM'] in ('Bld', 'Ser/Plas') else 1 if umum else 2 if konsentrasi else 3 if r['SCALE_TYP'] == 'Qn' else 4
        kode.append([rapikan(r['LOINC_NUM']), rapikan(r['LONG_COMMON_NAME']), rapikan(r['CLASS']), urut])
kode.sort(key=lambda k: k[0])
versi = max((r['VersionLastChanged'] for r in baris), key=lambda v: tuple(int(x) for x in re.findall(r'\d+', v) or [0]))
hasil = {
    'sumber': 'https://github.com/ivanwilliammd/satusehat-integration (database/seeders/csv/loinc.csv.stub)',
    'commit': COMMIT,
    'sha256_sumber': SHA,
    'versi_loinc_tertinggi': versi,
    'hak_cipta': HAK_CIPTA,
    'kolom': ['kode', 'nama', 'kelas', 'urut'],
    'jumlah': len(kode),
    'kode': kode,
}
KELUARAN.write_text(json.dumps(hasil, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'{len(kode)} kode lab aktif dari {len(baris)} baris; versi tertinggi {versi}; {KELUARAN.stat().st_size // 1024} KB; dikecualikan: {dict(ditolak)}')
