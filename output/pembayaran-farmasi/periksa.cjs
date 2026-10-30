const {chromium}=require('/home/nuscode/projek/- nuscode/video-3d/node_modules/playwright-core');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/home/nuscode/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fitur=['pasien','kunjungan','farmasi','kasir']; let role='semua',shift=true, payments=[], serah=0,requests=[];
 const pasien={id:1,nama:'Pasien Uji',nomor_rm:'QA-001',jenis_kelamin:'perempuan',umur_tahun:30,status_identitas:'lengkap',kunjungan:{id:12,jenis:'AMB',status:'arrived',tahap_layanan:'kasir',cara_pembayaran:'umum',poli_nama:'Umum',dpjp_nama:'Dokter Uji',mulai:new Date().toISOString(),antrean:null,lab:{perlu_spesimen:0,perlu_hasil:0}}};
 const resep=()=>[{id:2,kunjungan_id:12,nomor_resep:'QA-R1',status:serah?'diserahkan':'siap',jenis_pembiayaan:'umum',dpjp_nama:'Dokter Uji',dibuat_pada:new Date().toISOString(),telaah:null,item:[{id:1,nama:'Obat Uji',jumlah:2,satuan:'tablet',aturan_pakai:'2 x 1',stok_tersedia:10}]}];
 const tagihan=()=>({id:1,kunjungan_id:12,status_tagihan:'lengkap',status_pembayaran:payments.length?'sebagian':'belum',total:80000,item:[{id:1,nama:'Konsultasi',jumlah:1,harga:78000},{id:2,nama:'Obat',jumlah:2,harga:1000}],pembayaran:payments,dibayar:payments.reduce((a,b)=>a+b.jumlah,0),sisa:80000-payments.reduce((a,b)=>a+b.jumlah,0),alasan_tutup_belum_lunas:null});
 await page.route('**/api/**',async route=>{
  const req=route.request(),p=new URL(req.url()).pathname;requests.push(req.method()+' '+p);let data=[];
  if(p==='/api/saya'){const fs=role==='semua'?fitur:['pasien',role];data={id:1,nama:'Petugas Uji',username:'qa',fasyankes_id:1,wajib_ganti_kredensial:false,jenis_akun:['Uji'],fitur:fs,izin:fs.flatMap(fitur=>['lihat','input','perbaikan'].map(aksi=>({fitur,aksi,cakupan:'unit'}))),halaman_awal:'/pasien'};}
  else if(p==='/api/pasien')data={data:[pasien],halaman:1,ukuran:20,total:1,jumlah_tahap:{kasir:1}};
  else if(p==='/api/kunjungan/12/kasir')data={kunjungan:{id:12,pasien_id:1,pasien_nama:'Pasien Uji',pasien_nomor_rm:'QA-001',tahap_layanan:'kasir',cara_pembayaran:'umum'},tagihan:tagihan(),resep:resep(),shift_terbuka:shift,syarat:{tahap_kasir:true,tagihan_lengkap:true,resep_diserahkan:!!serah,lunas:false}};
  else if(p==='/api/kunjungan/12/pembayaran'){const m=req.postDataJSON();const applied=Math.min(Number(m.jumlah),tagihan().sisa);const pembayaran={id:payments.length+1,jumlah:applied,metode:m.metode,waktu:new Date().toISOString(),kasir_nama:'Kasir Uji'};payments.push(pembayaran);data={pembayaran,tagihan:tagihan(),kembalian:Number(m.jumlah)-applied};}
  else if(p==='/api/farmasi/riwayat')data={data:[{...resep()[0],pasien_nama:'Pasien Uji',pasien_nomor_rm:'QA-001',jumlah_item:1}],halaman:1,ukuran:20,total:1};
  else if(p==='/api/kunjungan/12/resep')data=resep();
  else if(p==='/api/kunjungan/12/serah-terima-obat'){serah++;data={resep:resep(),kekurangan:[]};}
  else if(p.endsWith('/ringkasan'))data={belum_dibaca:0};
  await route.fulfill({json:{data}});
 });
 const goto=async()=>{await page.goto('http://127.0.0.1:8074/pasien?tahap=kasir');await page.getByText('Pasien Uji',{exact:true}).waitFor();};
 await goto();await page.getByRole('button',{name:'Pembayaran',exact:true}).click();
 let dialog=page.getByRole('dialog',{name:'Pembayaran',exact:true}); await dialog.getByRole('button',{name:'Lanjut',exact:true}).click();
 assert.equal(await dialog.locator('form').count(),1);assert.equal(await dialog.getByText('Serah terima obat',{exact:true}).count(),0);
 await dialog.getByLabel('Jumlah diterima (Rp)').fill(''); await dialog.getByRole('button',{name:'Catat pembayaran',exact:true}).click();assert.equal(payments.length,0);
 await dialog.getByLabel('Jumlah diterima (Rp)').fill('30000'); await dialog.getByLabel('Jumlah diterima (Rp)').press('Enter');
 await page.waitForFunction(()=>document.body.innerText.includes('Kasir Uji')); assert.equal(payments.length,1);assert.equal(payments[0].jumlah,30000);assert.equal(await dialog.getByLabel('Jumlah diterima (Rp)').inputValue(),'50000');
 await dialog.getByLabel('Jumlah diterima (Rp)').fill('100000');await dialog.getByRole('button',{name:'Catat pembayaran',exact:true}).click();await dialog.getByRole('button',{name:'Selesai',exact:true}).waitFor();assert.equal(payments.length,2);assert.equal(serah,0);
 await page.screenshot({path:'output/pembayaran-farmasi/pembayaran.png'});await dialog.getByRole('button',{name:'Selesai',exact:true}).click();
 role='farmasi';await goto();assert.equal(await page.getByRole('button',{name:'Pembayaran',exact:true}).count(),0);await page.getByRole('button',{name:'Serahkan obat',exact:true}).click();dialog=page.getByRole('dialog',{name:'Serah terima obat',exact:true});await dialog.getByRole('button',{name:'Serahkan obat',exact:true}).click();await dialog.getByText('Serah terima tercatat.',{exact:true}).waitFor();assert.equal(serah,1);assert.equal(payments.length,2);assert.equal(await dialog.getByLabel('Jumlah diterima (Rp)').count(),0);await page.screenshot({path:'output/pembayaran-farmasi/farmasi.png'});
 serah=0;await page.goto('http://127.0.0.1:8074/farmasi?tab=riwayat');await page.getByRole('button',{name:'Serahkan obat',exact:true}).click();dialog=page.getByRole('dialog',{name:'Serah terima obat',exact:true});await dialog.getByText('QA-R1',{exact:true}).waitFor();
 role='kasir';shift=false;payments=[];await goto();assert.equal(await page.getByRole('button',{name:'Serahkan obat',exact:true}).count(),0);await page.getByRole('button',{name:'Pembayaran',exact:true}).click();dialog=page.getByRole('dialog',{name:'Pembayaran',exact:true});await dialog.getByRole('button',{name:'Lanjut',exact:true}).click();assert(await dialog.getByRole('button',{name:'Catat pembayaran',exact:true}).isDisabled());await dialog.getByLabel('Jumlah diterima (Rp)').press('Enter');assert.equal(payments.length,0);
 assert.deepEqual(errors,[]); console.log('PASS: form tunggal, validasi, pembayaran parsial via Enter, pelunasan/kembalian, tidak menyerahkan obat, aksi/izin UI terpisah, farmasi tanpa pembayaran, pembayaran tanpa shift dicegah. API disimulasikan; tidak menulis data klinik.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
