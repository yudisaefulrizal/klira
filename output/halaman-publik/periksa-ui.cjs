const {chromium}=require('/home/nuscode/projek/- nuscode/video-3d/node_modules/playwright-core');
const assert=require('node:assert/strict');
const {WEBSITE_KLINIK_BAWAAN}=require('../../packages/shared/dist/website-klinik');
const asal='http://127.0.0.1:35905';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/home/nuscode/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];const permintaan=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>permintaan.push(new URL(r.url()).pathname));
 const res=await page.goto(asal,{waitUntil:'domcontentloaded'});assert.equal(res.status(),200);
 await page.getByRole('link',{name:'Beranda Klinik Contoh',exact:true}).waitFor();
 await page.waitForFunction(()=>{const i=document.querySelector('.publik-hero-gambar img');return i?.complete&&i.naturalWidth>0});
 assert(!permintaan.includes('/api/saya'),'Website publik tidak boleh memeriksa sesi petugas');
 const html=await (await page.request.get(asal)).text();assert(html.includes('application/ld+json'));assert(html.includes('Klinik Contoh'));
 await page.screenshot({path:'output/halaman-publik/root-data-asli-desktop.png',fullPage:true});
 const fixture={...WEBSITE_KLINIK_BAWAAN,nama:'Klinik Bhakti Rahayu',slug:'bhakti-rahayu',aktif:true,alamat:'Jl. Raya Cibungbulang No. 120, Galuga, Kabupaten Bogor, Jawa Barat 16630',whatsapp:'6281234567890',jam_operasional:'Silakan konfirmasi jadwal sebelum berkunjung.',layanan:[{id:1,nama:'Poli Umum'},{id:2,nama:'Gigi & Mulut'},{id:3,nama:'Kesehatan Ibu & Anak'}],jadwal:[{hari:4,jam_mulai:'08:00',jam_selesai:'14:00',poli_id:1,poli_nama:'Poli Umum',praktisi:null},{hari:4,jam_mulai:'09:00',jam_selesai:'12:00',poli_id:2,poli_nama:'Gigi & Mulut',praktisi:null},{hari:1,jam_mulai:'08:00',jam_selesai:'12:00',poli_id:1,poli_nama:'Poli Umum',praktisi:null}]};
 // Data ini hanya fixture browser, tidak ditulis ke database.
 await page.route('**/api/publik/klinik**',r=>r.fulfill({json:{data:fixture}}));
 await page.route('**://maps.google.com/**',r=>r.fulfill({contentType:'text/html',body:'<html><body style="margin:0;height:100vh;display:grid;place-items:center;background:#eef1e8;font:16px sans-serif;color:#0b6b64">Pratinjau peta lokasi</body></html>'}));
 await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('link',{name:'Beranda Klinik Bhakti Rahayu',exact:true}).waitFor();
 await page.getByRole('button',{name:'Kamis',exact:true}).click();assert.equal(await page.locator('.publik-baris-jadwal').count(),2);
 await page.getByLabel('Pilih layanan').selectOption('2');assert.equal(await page.locator('.publik-baris-jadwal').count(),1);
 await page.getByRole('button',{name:'Rabu',exact:true}).click();assert.equal(await page.locator('.publik-baris-jadwal').count(),0);assert(await page.getByText('Belum ada jadwal untuk pilihan ini.',{exact:false}).isVisible());
 await page.getByLabel('Pilih layanan').selectOption('');await page.getByRole('button',{name:'Kamis',exact:true}).click();
 assert((await page.locator('.publik-hero-isi a').first().getAttribute('href')).startsWith('https://wa.me/6281234567890?text='));
 await page.locator('#lokasi iframe').scrollIntoViewIfNeeded();
 const mapFrame=await page.locator('#lokasi iframe').contentFrame();await mapFrame.getByText('Pratinjau peta lokasi').waitFor();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'output/halaman-publik/konsep-data-contoh-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Buka menu',exact:true}).click();assert(await page.locator('#publik-nav-mobile').isVisible());
 await page.locator('#publik-nav-mobile').getByRole('link',{name:'Layanan',exact:true}).click();assert.equal(await page.locator('#publik-nav-mobile').count(),0);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/halaman-publik/konsep-data-contoh-mobile.png',fullPage:true});
 await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 // Halaman operasional tetap wajib masuk.
 await page.unroute('**/api/publik/klinik**');await page.goto(asal+'/pasien',{waitUntil:'domcontentloaded'});await page.waitForURL('**/masuk');
 assert.equal(errors.length,0,errors.join('\n'));
 // Pengaturan website menggunakan API tiruan, bukan menulis data klinik.
 let bolehUbah=true;let tersimpan;
 const konfigurasi={...WEBSITE_KLINIK_BAWAAN,nama:'Klinik Contoh',slug:'klinik-1',aktif:true};
 await page.route('**/api/**',async route=>{
   const u=new URL(route.request().url());let data={};
   if(u.pathname==='/api/kesehatan')return route.fulfill({json:{status:'ok'}});
   if(u.pathname==='/api/saya')data={id:1,nama:'Pengelola',username:'pengelola',fasyankes_id:1,wajib_ganti_kredensial:false,jenis_akun:['Pengelola'],fitur:['profil-klinik'],izin:(bolehUbah?['lihat','perbaikan']:['lihat']).map(aksi=>({fitur:'profil-klinik',aksi,cakupan:'unit'})),halaman_awal:'/beranda'};
   else if(u.pathname==='/api/fasyankes/profil')data={id:1,nama:'Klinik Contoh',jenis:'klinik_pratama_rawat_jalan'};
   else if(u.pathname==='/api/fasyankes/riwayat-profil')data={data:[],halaman:1,total:0,ukuran:10};
   else if(u.pathname==='/api/fasyankes/website'){
    if(route.request().method()==='PUT'){tersimpan=route.request().postDataJSON();Object.assign(konfigurasi,tersimpan)}
    data=konfigurasi;
   }
   await route.fulfill({json:{data}});
 });
 await page.setViewportSize({width:1440,height:1000});await page.goto(asal+'/pengaturan?tab=profil',{waitUntil:'domcontentloaded'});
 await page.getByLabel('Judul utama',{exact:true}).fill('Layanan untuk keluarga Anda.');await page.getByRole('button',{name:'Simpan website',exact:true}).click();
 await page.getByText('Pengaturan website tersimpan.',{exact:true}).waitFor();assert.equal(tersimpan.judul,'Layanan untuk keluarga Anda.');assert(!('nama' in tersimpan));
 await page.screenshot({path:'output/halaman-publik/pengaturan-website.png',fullPage:true});
 bolehUbah=false;await page.reload({waitUntil:'domcontentloaded'});await page.getByLabel('Judul utama',{exact:true}).waitFor();assert.equal(await page.getByLabel('Judul utama',{exact:true}).isEditable(),false);assert.equal(await page.getByRole('button',{name:'Simpan website',exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: root publik dan metadata database asli, tanpa panggilan sesi, ilustrasi termuat, jadwal/filter, menu seluler, lebar 320/390/1440, proteksi halaman internal, simpan pengaturan, dan mode baca saja; tanpa menulis data klinik.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
