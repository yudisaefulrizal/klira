const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const names = ['cari','tanggal','hari-ini','pasien-baru','kunjungan-baru','semua','skrining','periksa','resep','bayar','selesai','batal','panggil','panggil-ulang','mulai','buka','edit','riwayat','keluarga','persetujuan','order-lab','spesimen','hasil-lab','telaah','tutup-kunjungan','whatsapp','instagram','sebelumnya','berikutnya','filter'];
const columns = [22,270,519,768,1017,1266];
const rows = [109,284,470,649,831];
const heights = [111,116,113,116,113];
(async () => {
 const source = path.join(__dirname,'klira-ikon-daftar-pasien-v1.png');
 const out = path.resolve(__dirname,'../../apps/web/public/asset/icon/pasien');
 fs.mkdirSync(out,{recursive:true});
 for(let i=0;i<names.length;i++) {
  const left=columns[i%6]+42, top=rows[Math.floor(i/6)];
  const {data, info} = await sharp(source).extract({left,top,width:164,height:heights[Math.floor(i/6)]}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let j=0;j<data.length;j+=4) {
   const ink = Math.min(data[j],data[j+1],data[j+2]);
   data[j+3]=Math.round(Math.max(0,Math.min(1,(215-ink)/100))*255);
   data[j]=data[j+1]=data[j+2]=0;
  }
  await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).trim().resize(96,96,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile(path.join(out,names[i]+'.png'));
 }
})();
