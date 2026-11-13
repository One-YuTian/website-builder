import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const sdk=await readFile('skills/website-builder/assets/commerce/sdk.js','utf8');
const products=[{id:'A',name:'First',category:'Tools',final_price:12.5}];
const fixture=()=>{const window={},context=vm.createContext({window,Intl});const run=source=>vm.runInContext(source,context);run(sdk);return{window,run};};
const sync=fixture();
assert.equal(sync.window.SDK.count(),0,'loading the SDK does not initialize the catalog');
sync.window.productData=products;
assert.equal(sync.window.SDK.count(),0,'data.js is data only');
// The caller generates this app for its chosen template; preparation never emits one.
sync.run('window.commerceConfig={currency:"EUR",locale:"de-DE",storageKey:"site-theme"};window.SDK.init(window.productData,window.commerceConfig);window.websiteReady=Promise.resolve(window.SDK);');
await sync.window.websiteReady;
assert.equal(sync.window.SDK.count(),1,'app initializes before following component definitions');
assert.ok(sync.window.SDK.price(12.5).includes('€'));
assert.equal(sync.window.SDK.account,sync.window.APP.account);assert.equal(sync.window.SDK.cart,sync.window.APP.cart);
const original=sync.window.SDK,app=sync.window.APP;
sync.run(sdk);assert.equal(sync.window.SDK,original);assert.equal(sync.window.APP,app);assert.equal(sync.window.SDK.count(),1);
const async=fixture();let resolveData;
async.window.catalogRequest=new Promise(resolve=>resolveData=resolve);
async.run('window.websiteReady=window.catalogRequest.then(data=>{window.productData=data;window.SDK.init(data,{currency:"USD",locale:"en-US"});return window.SDK;});');
assert.equal(async.window.SDK.count(),0);resolveData(products);await async.window.websiteReady;assert.equal(async.window.SDK.count(),1);
const failed=fixture();failed.window.catalogRequest=Promise.reject(Error('offline'));
failed.run('window.websiteReady=window.catalogRequest.then(data=>window.SDK.init(data,{}));');
await assert.rejects(failed.window.websiteReady,/offline/);assert.equal(failed.window.SDK.count(),0);
console.log('PASS: unified SDK/APP, no implicit catalog initialization, generated caller app/config, delayed API data, failures and repeated SDK loads');
