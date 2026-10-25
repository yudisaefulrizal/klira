# Agent

Agent pembangun dan pemeriksa klira.

## Isi
- `agents/pembuat-kode.md`: membangun satu butir dari `dokumen/progres.md` menjadi kode dan uji.
- `agents/pemeriksa-kode.md`: memeriksa hasilnya secara independen; bila lulus, mencentang `progres.md`.
- `skills/kerjakan-progres/SKILL.md`: siklus bangun, periksa, perbaiki (maksimal 3 putaran), commit per butir.

## Cara pakai
Minta Claude Code menjalankan skill `kerjakan-progres`. Alurnya otomatis sampai tidak ada butir yang siap.

## Aturan
- Satu cabang, `main`; satu commit per butir; push diizinkan.
- Rujukan: `dokumen/rancangan-aplikasi.md` dan `dokumen/progres.md`.
- Laporan agent: `dokumen/laporan/` (pertanyaan, ditolak, ringkasan).
- Rahasia di `.kebutuhan` (tidak ikut git), jangan ditulis di kode.

## Catatan
`.claude/agents` dan `.claude/skills` adalah tautan simbolik ke folder ini, supaya Claude Code tetap membacanya.
