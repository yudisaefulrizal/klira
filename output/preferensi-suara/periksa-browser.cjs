const {chromium}=require('/home/nuscode/projek/- nuscode/video-3d/node_modules/playwright-core');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/home/nuscode/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 try {
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const mode=localStorage.getItem('qa-mode-suara')||'normal';window.__ucapan=[];let versi=0;let diizinkan=false;
   document.addEventListener('pointerdown',e=>{if(e.isTrusted)diizinkan=true},true);
   document.addEventListener('keydown',e=>{if(e.isTrusted)diizinkan=true},true);
   class Ucapan { constructor(text){this.text=text} }
   Object.defineProperty(window,'SpeechSynthesisUtterance',{value:Ucapan,configurable:true});
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:mode==='unsupported'?undefined:{
    cancel(){versi++},getVoices(){return [{lang:'id-ID'}]},
    speak(u){window.__ucapan.push(u.text);const v=versi;const ditolak=mode==='blocked'&&!diizinkan;
     if(mode==='silent')return;
     setTimeout(()=>{if(v!==versi)return;if(ditolak){u.onerror?.({error:'not-allowed'});return}u.onstart?.();setTimeout(()=>{if(v===versi)u.onend?.()},20)},0);
    }
   }});
  });
  const base='http://127.0.0.1:8074',key='klira.panggilan.suara.1';
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.evaluate(k=>localStorage.removeItem(k),key);
  await page.goto(base+'/layar-panggilan/1',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Aktifkan suara',exact:true}).click();
  await page.getByRole('button',{name:'Suara aktif · Nonaktifkan',exact:true}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'aktif');
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Suara aktif · Nonaktifkan',exact:true}).waitFor();assert((await page.evaluate(()=>window.__ucapan.length))>0);
  await page.getByRole('button',{name:'Suara aktif · Nonaktifkan',exact:true}).click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'nonaktif');
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Klinik Bhakti Rahayu',exact:true}).waitFor();await page.getByRole('button',{name:'Aktifkan suara',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__ucapan.length),0);
  await page.evaluate(k=>{localStorage.setItem(k,'aktif');localStorage.setItem('qa-mode-suara','blocked')},key);
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Aktifkan suara · ketuk sekali',exact:true}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'aktif');
  await page.locator('.lp-judul').click();await page.getByRole('button',{name:'Suara aktif · Nonaktifkan',exact:true}).waitFor();
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Aktifkan suara · ketuk sekali',exact:true}).click();await page.getByRole('button',{name:'Suara aktif · Nonaktifkan',exact:true}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'aktif');
  await page.evaluate(()=>localStorage.removeItem('qa-mode-suara'));
  await page.goto(base+'/layar-panggilan?fasyankes=2',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Aktifkan suara',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__ucapan.length),0);
  await page.evaluate(()=>localStorage.setItem('qa-mode-suara','silent'));
  await page.goto(base+'/layar-panggilan/1',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Menyiapkan suara…',exact:true}).waitFor();await page.getByRole('button',{name:'Aktifkan suara · ketuk sekali',exact:true}).waitFor({timeout:12000});
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'aktif');
  await page.evaluate(()=>localStorage.setItem('qa-mode-suara','unsupported'));await page.reload({waitUntil:'domcontentloaded'});const tombol=page.getByRole('button',{name:'Suara tidak didukung',exact:true});await tombol.waitFor();assert(await tombol.isDisabled());assert.equal(await page.evaluate(()=>window.__ucapan.length),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: preferensi tersimpan melewati reload, nonaktif tetap nonaktif, scope fasilitas, autoplay diblokir tanpa menghapus pilihan, pemulihan dengan ketukan/tombol tanpa toggle ganda, watchdog mesin diam, dan browser tanpa dukungan suara. Mesin suara disimulasikan; tidak memverifikasi speaker perangkat.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
