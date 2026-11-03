const CACHE='my-grocery-shell-v3';
const ASSETS=['./','./index.html','./style.css','./app.js','./core.js','./seed.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if((key.startsWith('my-grocery-shell-')||/^grocery-v\d+$/.test(key))&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const saved=await cache.match(event.request);
  if(saved)return saved;
  try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return await cache.match('./index.html');throw error;}
 })());
});
