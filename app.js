import {KEY,stores,id,load,validate,restore,compare} from './core.js';
const $=s=>document.getElementById(s);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const message=text=>$('message').textContent=text;
let state,active,hidden=false;
try{state=load(localStorage);active=state.lists[0].id;}catch(e){message('Saved data could not be read. It has not been overwritten. Restore a valid backup to continue.');document.querySelectorAll('button,input,select').forEach(n=>{if(n.id!=='restore')n.disabled=true;});}
function persist(next=state){try{validate(next);localStorage.setItem(KEY,JSON.stringify(next));state=next;return true;}catch(e){message('Could not save: '+e.message+'. Keep this page open and download a backup.');return false;}}
function change(fn){const next=structuredClone(state);fn(next);if(persist(next))render();}
const option=(value,text)=>{const n=el('option',text);n.value=value;return n;};
const button=(text,action)=>{const b=el('button',text);b.type='button';b.onclick=action;return b;};
function render(){
 const list=state.lists.find(l=>l.id===active)||state.lists[0];active=list.id;
 $('lists').replaceChildren(...state.lists.map(l=>option(l.id,l.name)));$('lists').value=active;
 $('deleteList').disabled=state.lists.length===1;
 $('progress').textContent=`${list.items.filter(i=>i.done).length} of ${list.items.length} purchased`;
 $('hide').textContent=hidden?'Show purchased':'Hide purchased';
 $('shopping').replaceChildren();
 for(const i of list.items.filter(i=>!hidden||!i.done)){
  const p=state.catalog.find(p=>p.id===i.productId),row=el('div',undefined,'row'),check=el('input');check.type='checkbox';check.checked=i.done;check.setAttribute('aria-label','Purchased '+p.name);check.onchange=()=>change(s=>s.lists.find(l=>l.id===active).items.find(x=>x.productId===p.id).done=check.checked);
  const label=el('span',p.name+' · '+p.category,'text'+(i.done?' done':''));
  const quantity=el('input');quantity.type='number';quantity.min='1';quantity.step='1';quantity.value=i.quantity;quantity.setAttribute('aria-label','Desired packs of '+p.name);quantity.onchange=()=>{const n=Number(quantity.value);if(!Number.isInteger(n)||n<=0){quantity.value=i.quantity;return;}change(s=>s.lists.find(l=>l.id===active).items.find(x=>x.productId===p.id).quantity=n);};
  row.append(check,label,quantity,button('Remove',()=>change(s=>{const l=s.lists.find(l=>l.id===active);l.items=l.items.filter(x=>x.productId!==p.id);})));$('shopping').append(row);
 }
 renderCatalog();const selected=$('product').value;$('product').replaceChildren(...state.catalog.map(p=>option(p.id,p.name)));if(state.catalog.some(p=>p.id===selected))$('product').value=selected;renderComparison();
}
function renderCatalog(){const list=state.lists.find(l=>l.id===active),term=$('search').value.toLowerCase();$('catalog').replaceChildren();for(const p of state.catalog.filter(p=>(p.name+' '+p.category).toLowerCase().includes(term))){const row=el('div',undefined,'row');row.append(el('span',p.name+' · '+p.category,'text'));const exists=list.items.some(i=>i.productId===p.id);const b=button(exists?'In list':'Add to list',()=>change(s=>s.lists.find(l=>l.id===active).items.push({productId:p.id,done:false,quantity:1})));b.disabled=exists;row.append(b);$('catalog').append(row);}}
function renderComparison(){
 const root=$('comparison');root.replaceChildren();const area=$('location').value.trim();if(!area){root.append(el('p','Enter a delivery area / PIN to compare observations for that location.'));return;}
 const quotes=compare(state.quotes,$('product').value,area);if(!quotes.length){root.append(el('p','No saved prices for this product and delivery area.'));return;}
 const best=new Map();for(const q of quotes.filter(q=>q.stock==='in'&&!q.stale))best.set(q.unit,Math.min(best.get(q.unit)??Infinity,q.amount));
 const table=el('table'),head=el('tr');for(const h of ['Store','Pack price','Per unit','Stock / recorded','Action'])head.append(el('th',h));table.append(head);
 for(const q of quotes){const row=el('tr');const win=!q.stale&&q.stock==='in'&&q.amount===best.get(q.unit);for(const text of [q.store+(win?' · Best saved price':''),`₹${q.price.toFixed(2)} / ${q.quantity} ${q.packUnit}`,`₹${q.amount.toFixed(2)} / ${q.unit}`,`${{in:'In stock',out:'Out of stock',unknown:'Stock unknown'}[q.stock]} · Manual · ${new Date(q.updatedAt).toLocaleString()}${q.stale?' · Stale (>24h)':''}`])row.append(el('td',text));const td=el('td');td.append(button('Edit',()=>{const form=$('price');for(const k of ['store','price','quantity','stock'])form.elements[k].value=q[k];form.elements.unit.value=q.packUnit;form.scrollIntoView({block:'center'});}),button('Delete',()=>change(s=>{s.quotes=s.quotes.filter(x=>!(x.productId===q.productId&&x.store===q.store&&x.location===q.location));})));row.append(td);table.append(row);}
 const wrap=el('div',undefined,'scroll');wrap.append(table);root.append(wrap,el('p','Best saved price is compared within each compatible unit only. Desired list quantities count packs, not a cross-store basket estimate.'));
}
$('lists').onchange=()=>{active=$('lists').value;render();};$('search').oninput=renderCatalog;$('product').onchange=renderComparison;$('location').oninput=renderComparison;
$('newList').onsubmit=e=>{e.preventDefault();const n=e.target.elements.name.value.trim();if(!n)return;const nextId=id();change(s=>s.lists.push({id:nextId,name:n,items:[]}));if(state.lists.some(l=>l.id===nextId)){active=nextId;e.target.reset();render();}};
$('newProduct').onsubmit=e=>{e.preventDefault();const name=e.target.elements.name.value.trim(),category=e.target.elements.category.value.trim();if(name&&category){change(s=>s.catalog.push({id:id(),name,category}));e.target.reset();}};
$('hide').onclick=()=>{hidden=!hidden;render();};$('reset').onclick=()=>{if(confirm('Uncheck all items in this list?'))change(s=>s.lists.find(l=>l.id===active).items.forEach(i=>i.done=false));};$('deleteList').onclick=()=>{if(state.lists.length>1&&confirm('Delete this shopping list? Catalog items and prices will remain.'))change(s=>s.lists=s.lists.filter(l=>l.id!==active));};
$('stores').replaceChildren(...stores.map(([name])=>option(name,name)));
$('price').onsubmit=e=>{e.preventDefault();const area=$('location').value.trim();if(!area){message('Enter a delivery area / PIN first.');$('location').focus();return;}const f=e.target.elements;const q={productId:$('product').value,store:f.store.value,price:Number(f.price.value),quantity:Number(f.quantity.value),unit:f.unit.value,stock:f.stock.value,source:'manual',location:area,updatedAt:new Date().toISOString()};change(s=>{s.quotes=s.quotes.filter(x=>!(x.productId===q.productId&&x.store===q.store&&x.location.toLowerCase()===area.toLowerCase()));s.quotes.push(q);});};
for(const [name,url] of stores.filter(s=>s[1])){const a=el('a',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';$('retailers').append(a);}
$('backup').onclick=()=>{if(!state)return;const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='grocery-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
$('restore').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5000000)throw Error('Backup is too large (maximum 5 MB)');const next=restore(JSON.parse(await file.text()));if(confirm(`Replace current data with ${next.lists.length} lists, ${next.catalog.length} products and ${next.quotes.length} prices? Download a backup first if needed.`)&&persist(next)){location.reload();}}catch(err){message('Restore rejected: '+err.message+'. Existing data was kept.');}finally{e.target.value='';}};
const connection=()=>{$('connection').textContent=navigator.onLine?'Online · manual prices':'Offline · saved data available';};window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
let prompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;$('install').hidden=false;});$('install').onclick=async()=>{await prompt.prompt();prompt=null;$('install').hidden=true;};
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>message('Offline setup failed. Reconnect and reload to try again.'));
if(state){persist();render();setInterval(renderComparison,60000);}
