import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as zod from 'zod';
import * as crypto from 'node:crypto';
function load(file,deps={},globals={}) {const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>deps[n]??{},...globals});return exports;}
const phone=load('src/lib/phone.ts');
const token='test-secret-with-more-than-32-characters';
const input=load('src/lib/meta-leads/input.ts',{zod,'node:crypto':crypto,'@/lib/phone':phone},{process:{env:{BETTERCALLZ_META_API_TOKEN:token}},Buffer});
const lead={source:'meta_lead_campaign',meta_lead_id:'meta_123',phone:'9971365666',name:'Chirag',company:'BetterCallz'};
test('campaign intake requires exact bearer secret and rejects malformed or injected payloads',()=>{
 assert.equal(input.isMetaAuthorized(null),false);assert.equal(input.isMetaAuthorized(`Bearer ${token}`),true);assert.equal(input.isMetaAuthorized(`bearer ${token}`),false);
 assert.equal(input.metaLeadSchema.parse(lead).phone,'+919971365666');
 for(const patch of [{phone:'123'},{phone:'9999999999<script>'},{meta_lead_id:''},{meta_lead_id:'a/b'},{source:'website_demo'},{extra:'field'}])assert.equal(input.metaLeadSchema.safeParse({...lead,...patch}).success,false);
});
function intakeHarness({fail=false,configured=true,arrayResult=false}={}) {
 let record=null,dispatches=0,params;
 const admin={rpc:async(_,{p_id,p_payload})=>{record??={meta_lead_id:p_id,payload:p_payload,call_id:'call-1',dispatch_state:'reserved',call_status:'created'};return {data:arrayResult?[{...record}]:{...record}};},from(){let patch,filters=[];const q={update(v){patch=v;return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},select(){return q;},maybeSingle:async()=>{if(!filters.every(f=>f(record)))return {data:null};Object.assign(record,patch);return {data:{...record}};},then(resolve){if(filters.every(f=>f(record)))Object.assign(record,patch);resolve({error:null});}};return q;}};
 const api=load('src/lib/meta-leads/intake.ts',{'@/lib/supabase/admin':{getSupabaseAdmin:()=>admin},'@/lib/db/repository':{getCall:async()=>({id:'call-1'})},'@/lib/calls/service':{dispatchStoredCall:async(_,__,p)=>{dispatches++;params=p;await Promise.resolve();if(fail)throw Error('timeout after acceptance');return {status:'ringing'};}},'@/lib/sarvam/sarvam-provider':{SarvamVoiceProvider:class{}},'@/lib/sarvam/config':{getSarvamConfig:()=>configured?{}:null},'./constants':{META_PROJECT_ID:'bettercallz-meta'}},{Date});
 return {run:overrides=>api.startMetaCall(input.metaLeadSchema.parse({...lead,...overrides})),state:()=>({record,dispatches,params})};
}
test('simultaneous retries and later replays dispatch exactly once and preserve first lead context',async()=>{
 const h=intakeHarness();const results=await Promise.all(Array.from({length:20},()=>h.run()));await h.run({name:'Changed',phone:'9876543210'});
 assert.equal(h.state().dispatches,1);assert.equal(results.filter(r=>!r.duplicate).length,1);assert.equal(h.state().params.phoneNumber,'+919971365666');assert.equal(JSON.parse(h.state().params.leadContext).name,'Chirag');assert.equal(h.state().record.dispatch_state,'accepted');
});
test('ambiguous provider failure is held for review and is never redialled by retry',async()=>{
 const h=intakeHarness({fail:true});assert.equal((await h.run()).dispatchState,'review');await h.run();assert.equal(h.state().dispatches,1);assert.equal(h.state().record.dispatch_state,'review');
});
test('PostgREST composite array reservations preserve call identity across replay',async()=>{
 const h=intakeHarness({arrayResult:true});assert.equal((await h.run()).callId,'call-1');assert.equal((await h.run()).duplicate,true);assert.equal(h.state().dispatches,1);
});
test('missing campaign configuration fails before reservation or dispatch',async()=>{const h=intakeHarness({configured:false});await assert.rejects(h.run());assert.equal(h.state().record,null);assert.equal(h.state().dispatches,0);});
test('Sheet output has exact 26-column contract and preserves literal data for RAW writes',()=>{
 const r=load('src/lib/meta-leads/results.ts');const lead=Object.fromEntries(['name','phone','email','company','industry','business_description','lead_sources','monthly_lead_volume','current_lead_process','crm_or_tool','sales_team','follow_up_speed','pain_points','bettercallz_use_case','interest_level','buying_intent','preferred_next_step','call_summary','notes'].map(k=>[k,'']));lead.name='=IMPORTXML("untrusted")';lead.preferred_next_step='Human sales call';lead.interest_level='Unknown';lead.buying_intent='Unknown';
 const values=r.metaSheetValues({id:'call-1',status:'completed',endedAt:'end'},lead,{created_at:'created',meta_lead_id:'meta_123',called_at:'called'});assert.equal(values.length,26);assert.equal(values[1],'meta_lead_campaign');assert.equal(values[3],lead.name);assert.equal(values[19],'Human sales call');assert.equal(values[20],'call-1');assert.equal(values[23],'end');
});
test('campaign email is distinct while reusing configured recipient',()=>{
 const ex=load('src/lib/demo-leads/extract.ts',{zod});const email=load('src/lib/demo-leads/email.ts',{'./extract':ex},{process:{env:{CONTACT_EMAIL_FROM:'from@example.com',CONTACT_EMAIL_TO:'owner@example.com',RESEND_API_KEY:'test'}}});
 const row=Object.fromEntries(ex.HEADERS.map(k=>[k,'']));row.name='Raj';row.company='XYZ';const result=email.makeMetaLeadEmail(row,'call-1','meta_123','completed');assert.equal(result.subject,'New BetterCallz Meta Lead — Raj / XYZ');assert.ok(result.text.startsWith('BETTERCALLZ META LEAD'));assert.equal(result.to[0],'owner@example.com');assert.equal(email.makeLeadEmail(row,'call-1').subject.startsWith('New BetterCallz demo lead'),true);
});
test('n8n normalization handles actual unsimplified and simplified Meta payloads',()=>{
 const flow=JSON.parse(fs.readFileSync('automation/meta-instant-call.json','utf8'));
 const code=flow.nodes.find(n=>n.name==='Validate and normalize').parameters.jsCode;
 const run=json=>vm.runInNewContext(`(function(){${code}})()`,{$input:{all:()=>[{json}]}})[0].json;
 const result=run({id:'123',field_data:[{name:'full_name',values:['Raj']},{name:'phone_number',values:['+91 99713 65666']},{name:'company_name',values:['XYZ']},{name:'interest',values:['Lead automation']}],form:{id:'456',name:'BetterCallz enquiry'},page:{id:'789'}});
 assert.equal(result.phone,'+919971365666');assert.equal(result.name,'Raj');assert.equal(result.additional_fields.interest,'Lead automation');assert.equal(result.form_context,'BetterCallz enquiry');
 assert.equal(run({id:'123',data:{phone_number:'9971365666',full_name:'Raj'}}).name,'Raj');
 assert.throws(()=>run({id:'123',data:{phone_number:'123'}}));assert.throws(()=>run({data:{phone_number:'9971365666'}}));
});
test('n8n output refuses to overwrite a different lead and only acknowledges confirmed writes',()=>{
 const flow=JSON.parse(fs.readFileSync('automation/meta-sales-log.json','utf8'));
 const row={call_id:'call-1',meta_lead_id:'meta-1',sheet_row:2};
 const protect=flow.nodes.find(n=>n.name==='Protect previous leads').parameters.jsCode;
 const run=values=>vm.runInNewContext(`(function(){${protect}})()`,{$json:{values},$:()=>({item:{json:row}})});
 assert.equal(run([]).json,row);const existing=Array(26).fill('');existing[2]='meta-1';existing[20]='call-1';assert.equal(run([existing]).json,row);existing[20]='another-call';assert.throws(()=>run([existing]));
 const confirm=flow.nodes.find(n=>n.name==='Confirm Google write').parameters.jsCode;
 assert.throws(()=>vm.runInNewContext(`(function(){${confirm}})()`,{$json:{},$:()=>({item:{json:row}})}));
 assert.ok(flow.nodes.find(n=>n.name==='Write fixed sales row').parameters.url.includes('valueInputOption=RAW'));
});
