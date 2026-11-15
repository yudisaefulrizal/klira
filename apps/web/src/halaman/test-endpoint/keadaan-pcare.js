import { PENGATURAN_PCARE as P, konfigurasiPcareMasukan } from '@klira/shared';
import { galatSkema } from '../../modal/akun-pengaturan/keadaan-akun.js';

export const formDariPcare = (l) => ({
    environment: l.environment, cons_id: l.cons_id ?? '', secret_key: '', user_key: '', username: l.username ?? '', password: '',
    app_code: l.app_code ?? '', service_name: l.service_name || 'pcare-rest', base_url: l.base_url ?? '',
});
const opsional = (t) => (t.trim() === '' ? undefined : t.trim());
export const bentukPcare = (f) => ({
    environment: f.environment, cons_id: f.cons_id.trim(), secret_key: opsional(f.secret_key), user_key: opsional(f.user_key), username: f.username.trim(),
    password: opsional(f.password), app_code: f.app_code.trim(), service_name: f.service_name.trim(), base_url: opsional(f.base_url),
});

const RAHASIA = [['secret_key', 'secret_key_terisi', P.rahasia.secret_key], ['user_key', 'user_key_terisi', P.rahasia.user_key], ['password', 'password_terisi', P.rahasia.password]];

/** Galat per bidang; lingkungan baru (rahasia belum tersimpan) wajib mengisi ketiga rahasia. */
export function galatPcare(f, l) {
    const g = galatSkema(konfigurasiPcareMasukan, bentukPcare(f));
    for (const [nama, terisi, label] of RAHASIA)
        if (!l[terisi] && f[nama].trim() === '' && !g[nama]) g[nama] = P.galat.rahasiaWajib(label);
    return g;
}
export const pcareBerubah = (awal, f) => Object.keys(awal).some((k) => awal[k].trim() !== f[k].trim());

export function aksiPcare(l, { bolehUbah }) {
    const tersimpan = l.cons_id !== '' && l.secret_key_terisi && l.user_key_terisi && l.password_terisi;
    return { simpan: bolehUbah, uji: bolehUbah && tersimpan, aktifkan: bolehUbah && tersimpan && !l.aktif };
}
