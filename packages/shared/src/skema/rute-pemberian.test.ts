import { ruteDariBentuk } from './farmasi';

describe('ruteDariBentuk', () => {
  it.each([
    ['Tablet Salut Selaput', 'Oral'], ['Sirup Kering', 'Oral'], ['Kapsul Lunak', 'Oral'], ['Tetes Oral (Oral Drops)', 'Oral'],
    ['Krim', 'Topikal'], ['Salep', 'Topikal'], ['Suspensi / Cairan Obat Luar', 'Topikal'],
    ['Salep Mata', 'Mata'], ['Gel Mata', 'Mata'], ['Tetes Telinga', 'Telinga'], ['Semprot Hidung', 'Hidung'],
    ['Suspensi Inhalasi', 'Inhalasi'], ['Aerosol Metered Dose', 'Inhalasi'], ['Serbuk Infus', 'Intravena (IV)'],
    ['Supositoria', 'Rektal'], ['Tablet Vaginal', 'Vaginal'], ['Tablet Sublingual', 'Sublingual'], ['Patch', 'Transdermal'],
    ['Larutan', 'Oral'], ['', 'Oral'], [null, 'Oral'], [undefined, 'Oral'],
  ])('%s -> %s', (bentuk, rute) => expect(ruteDariBentuk(bentuk)).toBe(rute));

  it.each(['Larutan Injeksi', 'Suspensi Injeksi', 'Tetes Mata Dan Telinga', 'Implant'])('tidak pasti: %p', (bentuk) =>
    expect(ruteDariBentuk(bentuk)).toBeNull());
});
