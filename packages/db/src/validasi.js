import { NIK_REGEX, TANGGAL_MINIMAL } from '@klira/shared';
export { NIK_REGEX, TANGGAL_MINIMAL };
export function nikValid(nik) {
    return NIK_REGEX.test(nik);
}
export function pastikanNik(nik) {
    if (!nikValid(nik))
        throw new Error('NIK harus 16 digit angka');
    return nik;
}
export function tanggalValid(tanggal) {
    return !Number.isNaN(tanggal.getTime()) && tanggal.getTime() >= TANGGAL_MINIMAL.getTime();
}
