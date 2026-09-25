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
test('Sheet output has exact 32-column contract and preserves literal data for RAW writes',()=>{
 const r=load('src/lib/meta-leads/results.ts');const lead=Object.fromEntries(['name','phone','email','company','industry','business_description','lead_sources','monthly_lead_volume','current_lead_process','crm_or_tool','sales_team','follow_up_speed','pain_points','bettercallz_use_case','interest_level','buying_intent','preferred_next_step','call_summary','notes'].map(k=>[k,'']));lead.name='=IMPORTXML("untrusted")';lead.preferred_next_step='Human sales call';lead.interest_level='Unknown';lead.buying_intent='Unknown';
 const values=r.metaSheetValues({id:'call-1',status:'completed',endedAt:'end'},lead,{created_at:'created',meta_lead_id:'meta_123',called_at:'called'});assert.equal(values.length,32);assert.equal(values[1],'meta_lead_campaign');assert.equal(values[3],lead.name);assert.equal(values[19],'Human sales call');assert.equal(values[20],'call-1');assert.equal(values[23],'end');
});
test('campaign email is distinct while reusing configured recipient',()=>{
 const ex=load('src/lib/demo-leads/extract.ts',{zod});const email=load('src/lib/demo-leads/email.ts',{'./extract':ex},{process:{env:{CONTACT_EMAIL_FROM:'from@example.com',CONTACT_EMAIL_TO:'owner@example.com',RESEND_API_KEY:'test'}}});
 const row=Object.fromEntries(ex.HEADERS.map(k=>[k,'']));row.name='Raj';row.company='XYZ';const result=email.makeMetaLeadEmail(row,'call-1','meta_123','completed');assert.equal(result.subject,'New BetterCallz Meta Lead — Raj / XYZ');assert.ok(result.text.startsWith('BETTERCALLZ META LEAD'));assert.equal(result.to[0],'owner@example.com');assert.equal(email.makeLeadEmail(row,'call-1').subject.startsWith('New BetterCallz demo lead'),true);
});
test('Sheet notes retain prospect requests even when structured extraction is empty',()=>{
 const r=load('src/lib/meta-leads/results.ts');const values=r.metaSheetValues({id:'call',status:'completed',transcript:[{speaker:'prospect',text:'Send me the details on WhatsApp.'},{speaker:'agent',text:'I have sent it.'}]},{notes:''},{created_at:'now',meta_lead_id:'meta',called_at:'now'});
 assert.equal(values.length,32);assert.match(values[25],/Send me the details on WhatsApp/);assert.doesNotMatch(values[25],/I have sent it/);
});

test('sparse Meta email retains form context separately and exposes prospect responses without qualifying them',()=>{
 const ex=load('src/lib/demo-leads/extract.ts',{zod});
 const email=load('src/lib/demo-leads/email.ts',{'./extract':ex},{process:{env:{CONTACT_EMAIL_FROM:'from@example.com',CONTACT_EMAIL_TO:'owner@example.com',RESEND_API_KEY:'test'}}});
 const row=Object.fromEntries(ex.HEADERS.map(k=>[k,'']));row.buying_intent='Unknown';row.interest_level='Unknown';
 const result=email.makeMetaLeadEmail(row,'call-1','meta-1','completed',{form:{name:'Form Name',email:'prospect@example.com',additional_fields:{approximate_leads_per_month:'under_50'}},durationSeconds:31,transcript:[{speaker:'agent',text:'You have a large company.'},{speaker:'prospect',text:"No, I didn't enquire."}]});
 assert.match(result.subject,/Form Name/);assert.match(result.text,/self-reported; not confirmed/);assert.match(result.text,/prospect@example.com/);assert.match(result.text,/under 50/);assert.match(result.text,/No, I didn't enquire/);assert.match(result.text,/completed does not mean qualified/);
 assert.doesNotMatch(result.text,/You have a large company/);assert.equal(row.name,'');assert.equal(row.buying_intent,'Unknown');assert.deepEqual(Array.from(result.to),['owner@example.com']);
});

test('Meta provider overrides template name and preserves the original context',async()=>{
 let body;
 const Provider=load('src/lib/sarvam/sarvam-provider.ts',{'./config':{getSarvamConfig:()=>({apiKey:'test',appId:'agent',appVersion:4,versionFilter:'specific',orgId:'org',workspaceId:'ws',connectionId:'connection',agentPhoneNumber:'+918000000000',webhookUrl:'https://example.com/webhook'})},'./agent-prompt':{buildAgentInstructions:()=>''},'@/data/publicDemo':{PUBLIC_DEMO_ID:'bettercallz-live'},'@/lib/meta-leads/constants':{META_PROJECT_ID:'bettercallz-meta'}},{process:{env:{NODE_ENV:'production'}},fetch:async(_url,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({attempt_id:'attempt'})};}}).SarvamVoiceProvider;
 for(const name of ['Actual Lead',undefined]) {await new Provider().createCall({projectContext:{projectId:'bettercallz-meta'},phoneNumber:'+919999999999',callId:'call',userName:name,leadContext:'{"name":"Actual Lead"}'});assert.equal(body.app_config.agent_variables.user_name,name||'');assert.equal(body.app_config.agent_variables.lead_context,'{"name":"Actual Lead"}');assert.equal(body.app_config.app_version,4);}
});
test('n8n normalization handles actual unsimplified and simplified Meta payloads',()=>{
 const flow=JSON.parse(fs.readFileSync('automation/meta-instant-call.json','utf8'));
 const code=flow.nodes.find(n=>n.name==='Validate and normalize').parameters.jsCode;
 const run=json=>vm.runInNewContext(`(function(){${code}})()`,{$input:{all:()=>[{json}]}})[0].json;
 const result=run({id:'123',field_data:[{name:'full_name',values:['Raj']},{name:'phone_number',values:['+91 99713 65666']},{name:'company_name',values:['XYZ']},{name:'interest',values:['Lead automation']}],form:{id:'456',name:'BetterCallz enquiry'},page:{id:'789'}});
 assert.equal(result.phone,'+919971365666');assert.equal(result.name,'Raj');assert.equal(result.additional_fields.interest,'Lead automation');assert.equal(result.form_context,'BetterCallz enquiry');
 assert.equal(run({id:'123',data:{phone_number:'9971365666',full_name:'Raj'}}).name,'Raj');
 const generatedForm=run({id:'123',data:{phone_number:'9971365666',first_name:'Chirag',surname:'Sharma',email_address:'lead@example.com'}});
 assert.equal(generatedForm.name,'Chirag Sharma');assert.equal(generatedForm.email,'lead@example.com');
 assert.throws(()=>run({id:'123',data:{phone_number:'123'}}));assert.throws(()=>run({data:{phone_number:'9971365666'}}));
});
test('n8n output refuses to overwrite a different lead and only acknowledges confirmed writes',()=>{
 const flow=JSON.parse(fs.readFileSync('automation/meta-sales-log.json','utf8'));
 const row={call_id:'call-1',meta_lead_id:'meta-1',sheet_row:2};
 const protect=flow.nodes.find(n=>n.name==='Protect previous leads').parameters.jsCode;
 const run=values=>vm.runInNewContext(`(function(){${protect}})()`,{$json:{values},$:()=>({item:{json:row}})});
 assert.equal(run([]).json,row);const existing=Array(26).fill('');existing[2]='meta-1';existing[20]='call-1';assert.equal(run([existing]).json,row);existing[20]='another-call';assert.equal(run([existing]).json,row);existing[2]='another-lead';assert.throws(()=>run([existing]));
 const confirm=flow.nodes.find(n=>n.name==='Confirm Google write').parameters.jsCode;
 assert.throws(()=>vm.runInNewContext(`(function(){${confirm}})()`,{$json:{},$:()=>({item:{json:row}})}));
 assert.ok(flow.nodes.find(n=>n.name==='Write fixed sales row').parameters.url.includes('valueInputOption=RAW'));
});
