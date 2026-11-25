// Matenimiento Facilitas V12.5 — red primero, caché solo si no hay conexión + avisos push
const CACHE='matenimiento-v12-5';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png','./logo-facilitas.jpg','./logo-app.png','./apple-touch-icon.png','./jsqr.js','./qrcode.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return; // nunca cachear Supabase ni Google
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});

// ---- Avisos push (tarea asignada, emergencia, pedido de repuestos) ----
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch{d={title:'Matenimiento Facilitas',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Matenimiento Facilitas',{
    body:d.body||'',icon:'./icon-192.png',badge:'./icon-maskable-192.png',tag:d.tag||undefined,
    data:{url:d.url||''},vibrate:[200,100,200],requireInteraction:/URGENTE|Emergencia/i.test(d.title||'')}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const q=(e.notification.data&&e.notification.data.url)||'';
  const view=(new URLSearchParams(q.replace(/^.*\?/,'')).get('v'))||'';
  const target=new URL('./'+(q.startsWith('?')?q:''),self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if(c.url.startsWith(self.registration.scope)){c.postMessage({type:'abrir',view});return c.focus()}}
    return self.clients.openWindow(target);
  }));
});
