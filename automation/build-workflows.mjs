import fs from 'node:fs/promises';
const dir=new URL('./',import.meta.url);
const node=(name,type,parameters,position,extra={})=>({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,type:`n8n-nodes-base.${type}`,typeVersion:type==='httpRequest'?4.2:type==='code'?2:1,position,parameters,...extra});
const connect=(a,b)=>({[a]:{main:[[{node:b,type:'main',index:0}]]}});
const auth={authentication:'genericCredentialType',genericAuthType:'httpHeaderAuth'};
const http=(name,parameters,pos)=>node(name,'httpRequest',{...auth,...parameters,options:{timeout:60000}},pos,{retryOnFail:true,maxTries:3,waitBetweenTries:3000});
const normalize=`return $input.all().map((item,index)=>{
 const lead=item.json, fields=Object.create(null);
 if(Array.isArray(lead.field_data)) for(const f of lead.field_data) { if(typeof f.name==='string') fields[f.name]=Array.isArray(f.values)?f.values.join(', '):''; }
 else if(lead.data && typeof lead.data==='object') Object.assign(fields,lead.data);
 const str=v=>typeof v==='string'?v.trim():'';
 const id=str(lead.id || lead.meta_lead_id);
 if(!/^[a-zA-Z0-9_-]{1,160}$/.test(id)) throw new Error('Stable Meta lead ID is required; do not use an execution ID');
 let raw=str(fields.phone_number || fields.phone || lead.phone);
 if(!/^[+\\d\\s().-]+$/.test(raw)) throw new Error('Invalid phone format');
 let digits=raw.replace(/\\D/g,'');
 if(digits.length===12 && digits.startsWith('91')) digits=digits.slice(2);
 if(digits.length===11 && digits.startsWith('0')) digits=digits.slice(1);
 if(!/^[6-9]\\d{9}$/.test(digits)) throw new Error('A valid Indian mobile number is required');
 const known=new Set(['phone_number','phone','full_name','first_name','last_name','surname','name','email','email_address','company_name','company']);
 const extras=Object.fromEntries(Object.entries(fields).filter(([k])=>!known.has(k)).slice(0,20).map(([k,v])=>[k.slice(0,100),str(v).slice(0,500)]));
 return {json:{source:'meta_lead_campaign',meta_lead_id:id,phone:'+91'+digits,name:str(fields.full_name || fields.name || [fields.first_name,fields.last_name || fields.surname].filter(Boolean).join(' ')).slice(0,200),email:str(fields.email || fields.email_address),company:str(fields.company_name || fields.company).slice(0,300),form_id:str(lead.form?.id),page_id:str(lead.page?.id),form_context:str(lead.form?.name).slice(0,2000),additional_fields:extras},pairedItem:{item:index}};
});`;
const intake={name:'BetterCallz — Meta Lead → Instant AI Call',active:false,nodes:[
 node('BetterCallz Meta Lead','facebookLeadAdsTrigger',{event:'newLead',page:{__rl:true,mode:'id',value:''},form:{__rl:true,mode:'id',value:''},options:{simplifyOutput:false}},[0,0]),
 node('Validate and normalize','code',{jsCode:normalize},[300,0]),
 http('Trigger existing BetterCallz call',{method:'POST',url:'https://demo.bettercallz.com/api/calls',sendBody:true,specifyBody:'json',jsonBody:'={{ $json }}'},[600,0]),
 node('Check dispatch result','code',{jsCode:`return $input.all().map(item=>{ if(!item.json.callId) throw new Error('No persisted call ID returned'); if(item.json.dispatchState==='review') throw new Error('Dispatch uncertain. Reconcile this call ID in BetterCallz/Sarvam; NEVER create a replacement lead ID to retry. Call: '+item.json.callId); return item; });`},[900,0]),
 node('Setup instructions','stickyNote',{content:'## BetterCallz only\nSelect the BetterCallz Page and new form. Use a separate Meta app from Decoory. Configure an HTTP Header Auth credential: Authorization = Bearer <BETTERCALLZ_META_API_TOKEN>. Select it on the HTTP node. Never change the Meta lead ID on retries. This workflow does not write to Sheets or send email.',height:260,width:600},[0,-320]),
 ],connections:{...connect('BetterCallz Meta Lead','Validate and normalize'),...connect('Validate and normalize','Trigger existing BetterCallz call'),...connect('Trigger existing BetterCallz call','Check dispatch result')},settings:{executionOrder:'v1',timezone:'Asia/Kolkata',saveDataSuccessExecution:'none',saveDataErrorExecution:'all'}};
const sheetId='1mzPVfZFtDDm4qaTCk7asGLItkvxs25VTlHj0K0w0iwg';
const output={name:'BetterCallz — Completed Calls → Sales Log',active:false,nodes:[
 node('Every minute','scheduleTrigger',{rule:{interval:[{field:'minutes',minutesInterval:1}]}},[0,0],{typeVersion:1.2}),
 http('Get pending results',{url:'https://demo.bettercallz.com/api/meta-leads/results'},[250,0]),
 node('Each result','code',{jsCode:`return ($input.first().json.results || []).map(r=>{if(!Number.isSafeInteger(r.sheet_row)||r.sheet_row<2||r.sheet_row>10000||!Array.isArray(r.sheet_payload)||r.sheet_payload.length!==32)throw new Error('Invalid output or sales log capacity reached');return {json:r};});`},[500,0]),
 node('Check existing row','httpRequest',{authentication:'predefinedCredentialType',nodeCredentialType:'googleSheetsOAuth2Api',url:`={{ 'https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A' + $json.sheet_row + ':AF' + $json.sheet_row }}`,options:{timeout:30000}},[750,0],{typeVersion:4.2,retryOnFail:true,maxTries:3}),
 node('Protect previous leads','code',{mode:'runOnceForEachItem',jsCode:`const result=$('Each result').item.json;const existing=$json.values?.[0]||[];if(existing.some(v=>String(v)!=='') && (existing[2]!==result.meta_lead_id))throw new Error('Allocated row belongs to another record. Restore row order; refusing to overwrite a lead.');return {json:result};`},[1000,0]),
 node('Write fixed sales row','httpRequest',{authentication:'predefinedCredentialType',nodeCredentialType:'googleSheetsOAuth2Api',method:'PUT',url:`={{ 'https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A' + $json.sheet_row + ':AF' + $json.sheet_row + '?valueInputOption=RAW' }}`,sendBody:true,specifyBody:'json',jsonBody:'={{ {values: [$json.sheet_payload]} }}',options:{timeout:30000}},[1250,0],{typeVersion:4.2,retryOnFail:true,maxTries:3}),
 node('Confirm Google write','code',{mode:'runOnceForEachItem',jsCode:`if($json.updatedRows!==1 || !$json.updatedRange) throw new Error('Google write not confirmed');return {json:$('Protect previous leads').item.json};`},[1500,0]),
 http('Acknowledge delivered row',{method:'POST',url:'https://demo.bettercallz.com/api/meta-leads/results',sendBody:true,specifyBody:'json',jsonBody:'={{ {call_id:$json.call_id,sheet_row:$json.sheet_row,sheet_revision:$json.sheet_revision} }}'},[1750,0]),
 node('Output setup','stickyNote',{content:'## Output only\nUse BetterCallz API Header Auth on the two BetterCallz HTTP nodes. Use Google Sheets OAuth on both Google HTTP nodes. RAW mode keeps transcript text from becoming formulas. Fixed row writes and conflict checks make retries safe. Keep Leads row order intact; use filter views. Capacity: 9,999 leads, extend the Sheet and guard before reaching it. Resend and extraction run in the existing backend, independently of Sheet acknowledgement.',height:290,width:620},[0,-340]),
 ],connections:Object.assign({},...['Every minute','Get pending results','Each result','Check existing row','Protect previous leads','Write fixed sales row','Confirm Google write'].map((n,i)=>connect(n,['Get pending results','Each result','Check existing row','Protect previous leads','Write fixed sales row','Confirm Google write','Acknowledge delivered row'][i]))),settings:{executionOrder:'v1',timezone:'Asia/Kolkata',saveDataSuccessExecution:'none',saveDataErrorExecution:'all'}};
await fs.writeFile(new URL('meta-instant-call.json',dir),JSON.stringify(intake,null,2)+'\n');
await fs.writeFile(new URL('meta-sales-log.json',dir),JSON.stringify(output,null,2)+'\n');
