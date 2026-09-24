import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
const policy={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/meta-leads/retry-policy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:policy,Date,Intl});
const db=new PGlite();
before(async()=>{
  await db.exec('create role anon;create role authenticated;create role service_role;');
  for(const f of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql') && f<'0008')) await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8').replace('create extension if not exists "pgcrypto";',''));
  await db.exec("create table test_clock(t timestamptz);insert into test_clock values('2026-09-25T10:00:00+05:30');create function test_now() returns timestamptz language sql stable as $$select t from test_clock$$;");
  // Only the time source is substituted. All production locks, constraints and RPC bodies run in PostgreSQL.
  await db.exec(fs.readFileSync('supabase/migrations/0008_meta_retries.sql','utf8').replaceAll('clock_timestamp()','test_now()').replaceAll('now()','test_now()').replaceAll('test_test_now()','test_now()'));
});
after(()=>db.close());
const time=async t=>db.query('update test_clock set t=$1',[t]);
const row=async id=>(await db.query('select * from meta_lead_request where meta_lead_id=$1',[id])).rows[0];
const reserve=async id=>(await db.query('select * from reserve_meta_lead($1,$2)',[id,JSON.stringify({phone:'+919999999999',name:'Synthetic local test'})])).rows[0];
const claim=async id=>(await db.query('select * from claim_meta_attempt($1)',[id])).rows[0];
const begin=async r=>(await db.query('select begin_meta_dispatch($1,$2) as ok',[r.meta_lead_id,r.call_id])).rows[0].ok;
const finish=async(r,outcome)=>{
  await db.query("update call set status=$2,provider_call_id=$1::text,ended_at=test_now() where id=$1",[r.call_id,outcome==='COMPLETED'?'completed':'failed']);
  return (await db.query('select * from finish_meta_attempt($1,$2)',[r.call_id,outcome])).rows[0];
};
test('IST scheduling: first call, delays, midnight, month boundary and quiet-hour edges',async()=>{
  for(const [attempt,input,expected] of [
    [1,'2026-09-25T10:00:00+05:30','2026-09-25T10:00:00+05:30'],
    [1,'2026-09-25T23:00:00+05:30','2026-09-26T10:00:00+05:30'],
    [1,'2026-09-25T07:59:59+05:30','2026-09-25T10:00:00+05:30'],
    [1,'2026-09-25T08:00:00+05:30','2026-09-25T08:00:00+05:30'],
    [1,'2026-09-25T21:00:00+05:30','2026-09-26T10:00:00+05:30'],
    [2,'2026-09-25T10:00:00+05:30','2026-09-25T10:45:00+05:30'],
    [3,'2026-09-25T10:45:00+05:30','2026-09-25T13:45:00+05:30'],
    [2,'2026-09-25T20:30:00+05:30','2026-09-26T10:00:00+05:30'],
    [3,'2026-09-30T20:00:00+05:30','2026-10-01T10:00:00+05:30'],
  ]){
    assert.equal(policy.getNextCallTime(attempt,new Date(input)).toISOString(),new Date(expected).toISOString());
    const sql=(await db.query('select get_next_meta_call_time($1,$2) as t',[attempt,input])).rows[0].t;
    assert.equal(new Date(sql).toISOString(),new Date(expected).toISOString());
  }
});
test('provider evidence: reject DND, wrong numbers, generic failures, timeouts and connection evidence',()=>{
  for(const status of ['COMPLETED','CONNECTED','DO_NOT_CALL','WRONG_NUMBER','UNKNOWN']) assert.equal(policy.shouldRetryCall(status,1).retry,false);
  for(const status of ['BUSY','NO_ANSWER','CONFIRMED_CALL_FAILURE','PROVIDER_TIMEOUT']){assert.equal(policy.shouldRetryCall(status,2).retry,true);assert.equal(policy.shouldRetryCall(status,3).retry,false);}
  for(const [payload,outcome] of [
    [{status:'busy'},'BUSY'],[{status:'no_answer'},'NO_ANSWER'],[{status:'connected'},'COMPLETED'],
    [{status:'failed',failure_reason:'failed'},'UNKNOWN'],[{status:'failed',failure_reason:'provider timeout'},'UNKNOWN'],
    [{status:'failed',failure_reason:'exotel: Phone number is registered under TRAI NDNC'},'DO_NOT_CALL'],
    [{status:'failed',failure_reason:'invalid phone number'},'WRONG_NUMBER'],
    [{status:'failed',failure_reason:'provider timeout; call not connected'},'PROVIDER_TIMEOUT'],
    [{status:'failed',failure_reason:'provider could not place call'},'CONFIRMED_CALL_FAILURE'],
    [{status:'busy',interaction_id:'conversation'},'CONNECTED'],[{status:'no_answer',duration:1},'CONNECTED'],
  ])assert.equal(policy.classifyMetaOutcome(payload),outcome);
});
test('atomic repeated Meta ingestion and racing workers: one lead, one dispatch, maximum three calls',async()=>{
  await time('2026-09-25T10:00:00+05:30');
  const reserved=await Promise.all(Array.from({length:20},()=>reserve('race')));
  assert.equal(new Set(reserved.map(r=>r.call_id)).size,1);
  let r=(await Promise.all(Array.from({length:20},()=>claim('race'))))[0];
  const starts=await Promise.all(Array.from({length:20},()=>begin(r)));
  assert.equal(starts.filter(Boolean).length,1);assert.equal((await row('race')).attempt_count,1);
  r=await finish(r,'NO_ANSWER');assert.equal(r.retry_status,'RETRY_SCHEDULED');assert.equal(new Date(r.next_retry_at).toISOString(),'2026-09-25T05:15:00.000Z');
  const rev=r.sheet_revision;
  r=await finish(r,'NO_ANSWER');assert.equal(r.sheet_revision,rev); // Duplicate callback does not move the schedule.
  assert.equal((await claim('race')).call_id,null);
  await time('2026-09-25T10:45:00+05:30');
  const retries=await Promise.all([claim('race'),claim('race')]);assert.equal(retries[0].call_id,retries[1].call_id);
  r=retries[0];assert.equal(r.attempt_count,2);assert.equal((await Promise.all(retries.map(begin))).filter(Boolean).length,1);
  r=await finish(r,'BUSY');assert.equal(r.retry_status,'RETRY_SCHEDULED');
  await time('2026-09-25T13:45:00+05:30');r=await claim('race');assert.equal(await begin(r),true);
  r=await finish(r,'NO_ANSWER');assert.equal(r.retry_status,'RETRY_EXHAUSTED');assert.equal(r.next_retry_at,null);
  await reserve('race');assert.equal((await claim('race')).call_id,null);
  const counts=(await db.query("select count(*)::int as n from call where lead_id=(select lead_id from call where id=$1)",[r.call_id])).rows[0];assert.equal(counts.n,3);
});
test('initial quiet-hours deferral and overdue worker deferral; prepared crash recovery does not increment twice',async()=>{
  await time('2026-09-25T23:00:00+05:30');let r=await reserve('night');
  assert.equal(new Date(r.next_retry_at).toISOString(),'2026-09-26T04:30:00.000Z');assert.equal((await claim('night')).call_id,null);assert.equal(r.attempt_count,0);
  await time('2026-09-26T10:00:00+05:30');r=await claim('night');assert.equal(r.attempt_count,1);
  const recovered=await claim('night');assert.equal(recovered.call_id,r.call_id);assert.equal(recovered.attempt_count,1);
  await time('2026-09-26T21:00:00+05:30');assert.equal(await begin(r),false);
  await claim('night');assert.equal((await row('night')).attempt_count,1);
  await time('2026-09-27T10:00:00+05:30');r=await claim('night');assert.equal(await begin(r),true);
});
test('completed, DND, wrong number and unknown stop retries; uncertain dispatch never reclaimed',async()=>{
  for(const outcome of ['COMPLETED','DO_NOT_CALL','WRONG_NUMBER','UNKNOWN']){
    await time('2026-09-25T10:00:00+05:30');let r=await reserve(outcome);r=await claim(outcome);await begin(r);r=await finish(r,outcome);
    assert.equal(r.next_retry_at,null);assert.equal((await claim(outcome)).call_id,null);
  }
  let r=await reserve('uncertain');r=await claim('uncertain');await begin(r);
  await time('2026-09-27T10:00:00+05:30');assert.equal((await claim('uncertain')).call_id,null);
  assert.equal(await begin(r),false);
});

test('application dispatch orchestration recovers preflight errors and never repeats ambiguous sends',async()=>{
  await time('2026-09-25T10:00:00+05:30');
  let sends=0, readFails=false, sendFails=false, configured=true;
  const admin={rpc:async(name,args)=>{
    try {const keys=Object.keys(args);return {data:(await db.query(`select * from ${name}(${keys.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(args).map(v=>typeof v==='object'?JSON.stringify(v):v))).rows[0]};}
    catch(error){return {error};}
  },from:()=>{let patch,filters=[];const q={update(v){patch=v;return q;},eq(k,v){filters.push([k,v]);return q;},then:async(resolve,reject)=>{try{const entries=Object.entries(patch);await db.query(`update meta_lead_request set ${entries.map(([k],i)=>`${k}=$${i+1}`).join(',')} where ${filters.map(([k],i)=>`${k}=$${entries.length+i+1}`).join(' and ')}`,[...entries,...filters].map(([,v])=>v));resolve({error:null});}catch(e){reject(e);}}};return q;}};
  const rpc=admin.rpc;admin.rpc=async(name,args)=>{const r=await rpc(name,args);if(name==='begin_meta_dispatch'&&r.data)r.data=r.data.begin_meta_dispatch;return r;};
  const api={};const dependencies={
    '@/lib/supabase/admin':{getSupabaseAdmin:()=>admin},'@/lib/db/repository':{getCall:async id=>{if(readFails)throw Error('temporary read failure');return {id};}},
    '@/lib/calls/service':{dispatchStoredCall:async call=>{sends++;if(sendFails)throw Error('ambiguous acceptance');await db.query("update call set provider_call_id=$1::text,status='ringing' where id=$1",[call.id]);return {status:'ringing'};}},
    '@/lib/sarvam/sarvam-provider':{SarvamVoiceProvider:class{}},'@/lib/sarvam/config':{getSarvamConfig:()=>configured?{}:null},'./constants':{META_PROJECT_ID:'bettercallz-meta'},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/meta-leads/intake.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:api,require:n=>dependencies[n]||{},Date,console,process:{env:{}}});
  const input=id=>({source:'meta_lead_campaign',meta_lead_id:id,phone:'+919999999999'});
  configured=false;await assert.rejects(api.startMetaCall(input('missing-config')));assert.equal(await row('missing-config'),undefined);configured=true;
  readFails=true;await assert.rejects(api.startMetaCall(input('preflight')));assert.equal((await row('preflight')).attempt_count,1);assert.equal(sends,0);
  readFails=false;await api.startMetaCall(input('preflight'));assert.equal(sends,0);
  await api.dispatchMetaAttempt('preflight');assert.equal((await row('preflight')).attempt_count,1);assert.equal(sends,1);
  sendFails=true;await api.startMetaCall(input('ambiguous'));assert.equal((await row('ambiguous')).retry_status,'REVIEW');
  await Promise.all(Array.from({length:10},()=>api.startMetaCall(input('ambiguous'))));assert.equal(sends,2);
});

test('old Sheet acknowledgements cannot hide a newer attempt or overwrite another lead',async()=>{
  await time('2026-09-25T10:00:00+05:30');let r=await reserve('sheet-revision');const revision=r.sheet_revision;
  r=await claim('sheet-revision');await begin(r);
  const stale=await db.query('update meta_lead_request set sheet_delivered_at=test_now() where meta_lead_id=$1 and sheet_revision=$2 returning meta_lead_id',['sheet-revision',revision]);assert.equal(stale.rows.length,0);
  r=await row('sheet-revision');assert.equal(r.sheet_delivered_at,null);
});
