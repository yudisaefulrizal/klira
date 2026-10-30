const {buatApp}=require('../../apps/api/dist/app');
const server=buatApp().listen(0,'127.0.0.1',()=>console.log('PUBLIC_PREVIEW_PORT='+server.address().port));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
