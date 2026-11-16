import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Execute only the documented sample with a mocked fetch; never call an IP service.
const doc=await readFile('skills/website-builder/references/form-interactions.md','utf8');
const source=doc.match(/```javascript\s*([\s\S]*?)```/)[1];
let calls=0,reply={ok:true,json:async()=>({country:'BRA'})},fail=false,last;
const context=vm.createContext({location:{hash:''},AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{calls++;last={url,options};if(fail)throw Error('offline');return reply;}});
vm.runInContext(source,context);
vm.runInContext("registrationIP.endpoint='https://s.example.test/ip';registrationIP.supportedCountries=['BRA'];registrationIP.messages={unavailable:'Unavailable',unsupported:'Unsupported'};",context);
const validate=()=>vm.runInContext('validateIP()',context);
context.location.hash='#ignore';assert.equal((await validate()).success,true);assert.equal(calls,0);
context.location.hash='';assert.equal((await validate()).success,true);assert.equal(last.url,'https://s.example.test/ip');
assert.equal(last.options.method,'GET');assert.equal(last.options.mode,'cors');assert.equal(last.options.headers.Accept,'application/json');
reply={ok:true,json:async()=>({country:'VNM'})};assert.equal((await validate()).message,'Unsupported');
reply={ok:true,json:async()=>({})};assert.equal((await validate()).success,false);
reply={ok:false};assert.equal((await validate()).message,'Unavailable');
reply={ok:true,json:async()=>{throw Error('invalid JSON');}};assert.equal((await validate()).success,false);
fail=true;assert.equal((await validate()).message,'Unavailable');
console.log('PASS: registration IP sample supports dynamic config, ignore bypass, allowed/blocked countries and HTTP/JSON/network warnings; all requests mocked');
