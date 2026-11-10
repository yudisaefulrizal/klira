"""Ubah CSV KFA dari satusehat-integration (ivanwilliammd) menjadi JSON statis apps/api/data/kfa.json."""
import csv
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'dokumen/referensi tambahan/satusehat-integration-ivanwilliammd'
KELUARAN = ROOT / 'apps/api/data/kfa.json'
COMMIT = 'e4c3667924f707002ae4671e73d79667f6fcb084'
SHA = {'kfa_obat.csv': '873936bd9cb5981c77a7996acb46ce207b81419d387761c752d5f4c6319492ef'}
for berkas, sha in SHA.items():
    assert hashlib.sha256((FOLDER / berkas).read_bytes()).hexdigest() == sha, f'Checksum {berkas} berbeda'

PANJANG_NAMA = 700  # batas kolom master_obat.kfa_nama
rapikan = lambda s: re.sub(r'\s+', ' ', (s or '').strip())

with open(FOLDER / 'kfa_obat.csv', encoding='utf-8-sig', newline='') as f:
    obat = list(csv.DictReader(f, delimiter=';'))

jumlah = {}
for r in obat:
    jumlah[r['kfa_code']] = jumlah.get(r['kfa_code'], 0) + 1

produk, ditinjau = [], []
for r in obat:
    kode, nama = rapikan(r['kfa_code']), rapikan(r['display_name'])
    alasan = None
    if not kode or not nama:
        alasan = 'kode atau nama kosong'
    elif jumlah[r['kfa_code']] > 1:
        alasan = 'kode ganda di sumber untuk produk berbeda'
    elif len(nama) > PANJANG_NAMA:
        alasan = f'nama {len(nama)} karakter, melebihi batas {PANJANG_NAMA}'
    if alasan:
        ditinjau.append({'kode': kode, 'nama': nama, 'alasan': alasan})
        continue
    nonaktif = r['status'].strip().lower() != 'valid' or 'tidak dipakai' in nama.casefold()
    # Tidak dipetakan: `manufacturer` (berisi lokal/import), `izin_edar` (hanya tulisan "NIE"), `brand` (tidak menentukan generik).
    # Kode template tingkat 92 dan bahan zat aktif tingkat 91 tidak dimuat: bukan barang yang diserahkan atau distok.
    produk.append({'kode': kode, 'nama': nama, 'bentuk_sediaan': rapikan(r['medication_form']) or None, 'satuan': rapikan(r['uom_drug_form']) or None, 'status': 'nonaktif' if nonaktif else 'aktif'})

produk.sort(key=lambda p: p['kode'])
hasil = {
    'sumber': 'https://github.com/ivanwilliammd/satusehat-integration (database/seeders/csv/kfa_obat.csv.stub)',
    'commit': COMMIT,
    'sha256_sumber': SHA['kfa_obat.csv'],
    'tingkat': 93,
    'jumlah': len(produk),
    'produk': produk,
}
KELUARAN.write_text(json.dumps(hasil, ensure_ascii=False, separators=(',', ':')) + '\n')
(FOLDER / 'perlu-ditinjau.json').write_text(json.dumps(ditinjau, ensure_ascii=False, indent=2) + '\n')
(FOLDER / 'kfa-impor.csv').unlink(missing_ok=True)
print(f'{len(produk)} produk ({sum(p["status"] == "nonaktif" for p in produk)} nonaktif); {len(ditinjau)} baris disisihkan; {KELUARAN.stat().st_size // 1024} KB')
