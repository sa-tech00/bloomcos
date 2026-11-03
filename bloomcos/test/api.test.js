const test=require('node:test'),assert=require('node:assert'),os=require('os'),path=require('path'),fs=require('fs');
const {createApp}=require('../server/server.js');
let srv,base;const file=path.join(os.tmpdir(),'bc-test-'+Date.now()+'.json');
const call=async(p,m='GET',body,tok)=>{const r=await fetch(base+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:body&&JSON.stringify(body)});return{s:r.status,j:await r.json()}};
test.before(()=>new Promise(res=>{srv=createApp({file}).listen(0,()=>{base='http://localhost:'+srv.address().port;res()})}));
test.after(()=>{srv.close();fs.rmSync(file,{force:true})});

test('health',async()=>assert.equal((await call('/api/health')).s,200));
test('register validates input',async()=>{
  assert.equal((await call('/api/register','POST',{email:'bad',password:'secret1'})).s,400);
  assert.equal((await call('/api/register','POST',{email:'a@b.co',password:'123'})).s,400)});
test('register, duplicate, login, wrong password',async()=>{
  const r=await call('/api/register','POST',{name:'T',email:'t@b.co',password:'secret1'});assert.equal(r.s,200);assert.ok(r.j.token);
  assert.equal((await call('/api/register','POST',{email:'t@b.co',password:'secret1'})).s,409);
  assert.equal((await call('/api/login','POST',{email:'t@b.co',password:'secret1'})).s,200);
  assert.equal((await call('/api/login','POST',{email:'t@b.co',password:'nope'})).s,401)});
test('demo account works',async()=>{const r=await call('/api/login','POST',{email:'demo@bloomcos.app',password:'demo123'});assert.equal(r.s,200);assert.equal(r.j.data.periods.length,8)});
test('data is private and persisted; logout kills token',async()=>{
  const a=(await call('/api/register','POST',{email:'a1@b.co',password:'secret1'})).j.token;
  const b=(await call('/api/register','POST',{email:'b1@b.co',password:'secret1'})).j.token;
  await call('/api/data','PUT',{lmp:'2026-01-01'},a);
  assert.equal((await call('/api/data','GET',null,a)).j.lmp,'2026-01-01');
  assert.equal((await call('/api/data','GET',null,b)).j.lmp,'');
  assert.equal((await call('/api/data')).s,401);
  await call('/api/logout','POST',{},a);assert.equal((await call('/api/data','GET',null,a)).s,401)});
test('rate limits repeated auth attempts',async()=>{let last;for(let i=0;i<25;i++)last=await call('/api/login','POST',{email:'x@y.co',password:'bad'});assert.equal(last.s,429)});
