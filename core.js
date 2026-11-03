import { initial } from './seed.js';
export const KEY='my-grocery-app-v3';
export const stores=[['Canteen',null],['Blinkit','https://blinkit.com/'],['Zepto','https://www.zepto.com/'],['BigBasket','https://www.bigbasket.com/'],['JioMart','https://www.jiomart.com/'],['Amazon Fresh','https://www.amazon.in/fresh'],['Flipkart Grocery','https://www.flipkart.com/grocery-supermart-store'],['Swiggy Instamart','https://www.swiggy.com/instamart']];
export const units={kg:['kg',1],g:['kg',.001],L:['L',1],ml:['L',.001],piece:['piece',1]};
export const id=()=>crypto.randomUUID();
const str=x=>typeof x==='string'&&x.trim().length>0&&x.length<=500;
export function migrate(items){
 if(!Array.isArray(items)||!items.every(x=>x&&str(x.name)&&str(x.category)))throw Error('Invalid legacy checklist');
 const catalog=items.map(x=>({id:id(),name:x.name,category:x.category}));
 return {version:3,catalog,lists:[{id:id(),name:'My Grocery List',items:items.map((x,i)=>({productId:catalog[i].id,done:!!x.done,quantity:1}))}],quotes:[]};
}
export function fresh(){return migrate(Object.entries(initial).flatMap(([category,names])=>names.map(name=>({name,category,done:false}))));}
export function normalize(price,quantity,unit){if(!Number.isFinite(price)||price<=0||!Number.isFinite(quantity)||quantity<=0||!Object.hasOwn(units,unit))throw Error('Enter a positive price and pack size');const amount=price/(quantity*units[unit][1]);if(!Number.isFinite(amount)||amount<=0)throw Error('Price or pack size is too large or too small');return {amount,unit:units[unit][0]};}
export function validate(s){
 if(!s||s.version!==3||!Array.isArray(s.catalog)||!Array.isArray(s.lists)||!s.lists.length||!Array.isArray(s.quotes))throw Error('Invalid backup structure');
 const unique=a=>new Set(a).size===a.length;
 if(!s.catalog.every(p=>p&&str(p.id)&&str(p.name)&&str(p.category))||!unique(s.catalog.map(p=>p.id)))throw Error('Invalid catalog');
 const ids=new Set(s.catalog.map(p=>p.id));
 if(!s.lists.every(l=>l&&str(l.id)&&str(l.name)&&Array.isArray(l.items)&&unique(l.items.map(i=>i.productId))&&l.items.every(i=>ids.has(i.productId)&&typeof i.done==='boolean'&&Number.isInteger(i.quantity)&&i.quantity>0))||!unique(s.lists.map(l=>l.id)))throw Error('Invalid lists');
 if(!s.quotes.every(q=>{try{normalize(q.price,q.quantity,q.unit);return ids.has(q.productId)&&stores.some(([n])=>n===q.store)&&['in','out','unknown'].includes(q.stock)&&q.source==='manual'&&str(q.location)&&typeof q.updatedAt==='string'&&Number.isFinite(Date.parse(q.updatedAt))&&Date.parse(q.updatedAt)<=Date.now()+60000;}catch{return false;}})||!unique(s.quotes.map(q=>q.productId+'|'+q.store+'|'+q.location.toLowerCase())))throw Error('Invalid prices');
 return s;
}
export function restore(data){return data?.version===2?migrate(data.items):validate(data);}
export function load(storage){const current=storage.getItem(KEY);if(current!==null)return validate(JSON.parse(current));const old=storage.getItem('my-grocery-app-v2');return old!==null?migrate(JSON.parse(old)):fresh();}
export function compare(quotes,productId,location,now=Date.now()){
 return quotes.filter(q=>q.productId===productId&&q.location.toLowerCase()===location.trim().toLowerCase()).map(q=>({...q,packUnit:q.unit,...normalize(q.price,q.quantity,q.unit),stale:now-Date.parse(q.updatedAt)>86400000})).sort((a,b)=>a.unit.localeCompare(b.unit)||a.amount-b.amount);
}
