import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';

test('service worker caches all shell assets and serves them without network',async()=>{
 const events={},entries=new Map(),deleted=[];let network=0,claimed=false;
 const cache={addAll:async assets=>{for(const a of assets){await access(new URL(a==='./'?'index.html':a,import.meta.url));entries.set(a,{asset:a});}},match:async req=>entries.get(typeof req==='string'?req:req.url)};
 const context={URL,self:{location:{origin:'https://test.example'},addEventListener:(n,f)=>events[n]=f,clients:{claim:async()=>{claimed=true;}}},caches:{open:async()=>cache,keys:async()=>['grocery-v2','my-grocery-shell-v2','unrelated-cache','my-grocery-shell-v3'],delete:async k=>deleted.push(k)},fetch:async()=>{network++;throw Error('Offline');}};
 vm.runInNewContext(await readFile(new URL('sw.js',import.meta.url),'utf8'),context);
 let pending;events.install({waitUntil:p=>pending=p});await pending;
 for(const asset of ['./','./index.html','./app.js','./core.js','./seed.js','./style.css','./manifest.webmanifest','./icon.svg'])assert.ok(entries.has(asset),asset);
 events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['grocery-v2','my-grocery-shell-v2']);assert.equal(claimed,true);
 // Browser Cache API resolves relative asset URLs against the worker scope.
 const original=cache.match;cache.match=async req=>original(typeof req==='string'?req:'./'+new URL(req.url).pathname.replace('/my-grocery-app/',''));
 let response;events.fetch({request:{method:'GET',url:'https://test.example/my-grocery-app/app.js'},respondWith:p=>response=p});assert.equal((await response).asset,'./app.js');assert.equal(network,0);
 events.fetch({request:{method:'GET',mode:'navigate',url:'https://test.example/my-grocery-app/other'},respondWith:p=>response=p});assert.equal((await response).asset,'./index.html');
 let intercepted=false;events.fetch({request:{method:'GET',url:'https://retailer.example/product'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 events.fetch({request:{method:'POST',url:'https://test.example/my-grocery-app/'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
