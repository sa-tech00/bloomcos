// BloomCOS API + static server. Zero dependencies. Run: npm start
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PAGE=path.join(__dirname,'..','public','index.html'),DAY=864e5;
const empty=()=>({periods:[],lmp:'',logs:{},kicks:0,pcos:{}});
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');

function createApp({file=path.join(process.env.DATA_DIR||path.join(__dirname,'..'),'db.json')}={}){
  let db={users:{},sessions:{}};try{db=JSON.parse(fs.readFileSync(file,'utf8'))}catch{}
  const persist=()=>{fs.writeFileSync(file+'.tmp',JSON.stringify(db));fs.renameSync(file+'.tmp',file)}; // atomic write
  const send=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json','X-Content-Type-Options':'nosniff'});r.end(JSON.stringify(o))};
  const hits={},limited=ip=>{const n=Date.now(),a=hits[ip]=(hits[ip]||[]).filter(t=>n-t<6e4);a.push(n);return a.length>20};

  const D='demo@bloomcos.app';
  if(!db.users[D]){const salt=crypto.randomBytes(16).toString('hex'),d=n=>new Date(Date.now()-n*DAY).toISOString().slice(0,10);
    db.users[D]={name:'Demo',salt,hash:hash('demo123',salt),data:{...empty(),periods:[d(60),d(59),d(58),d(57),d(30),d(29),d(28),d(27)],lmp:d(100)}};persist()}

  return http.createServer((q,r)=>{
    const u=q.url.split('?')[0];
    if(u==='/api/health')return send(r,200,{ok:true,users:Object.keys(db.users).length});
    if(!u.startsWith('/api/')){
      r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Frame-Options':'SAMEORIGIN','X-Content-Type-Options':'nosniff'});
      return r.end(fs.readFileSync(PAGE));
    }
    let b='';q.on('data',d=>{b+=d;if(b.length>1e6)q.destroy()});
    q.on('end',()=>{
      let j={};try{j=JSON.parse(b||'{}')}catch{return send(r,400,{error:'Invalid JSON'})}
      const email=String(j.email||'').trim().toLowerCase(),pw=String(j.password||'');
      const login=em=>{const t=crypto.randomBytes(24).toString('hex');db.sessions[t]={em,exp:Date.now()+30*DAY};persist();
        send(r,200,{token:t,name:db.users[em].name,data:db.users[em].data})};
      if(u==='/api/register'||u==='/api/login'){
        if(limited(q.socket.remoteAddress))return send(r,429,{error:'Too many attempts, try again in a minute'});
        if(u==='/api/register'){
          if(!/^\S+@\S+\.\S+$/.test(email))return send(r,400,{error:'Enter a valid email'});
          if(pw.length<6)return send(r,400,{error:'Password must be at least 6 characters'});
          if(db.users[email])return send(r,409,{error:'Account already exists'});
          const salt=crypto.randomBytes(16).toString('hex');
          db.users[email]={name:String(j.name||'').slice(0,50),salt,hash:hash(pw,salt),data:empty()};
          return login(email);
        }
        const x=db.users[email];
        if(!x||!crypto.timingSafeEqual(Buffer.from(hash(pw,x.salt)),Buffer.from(x.hash)))return send(r,401,{error:'Wrong email or password'});
        return login(email);
      }
      const tok=(q.headers.authorization||'').slice(7),s=db.sessions[tok];
      if(!s||s.exp<Date.now())return send(r,401,{error:'Unauthorized'});
      if(u==='/api/logout'){delete db.sessions[tok];persist();return send(r,200,{ok:true})}
      if(u==='/api/data'&&q.method==='GET')return send(r,200,db.users[s.em].data);
      if(u==='/api/data'&&q.method==='PUT'){
        if(typeof j!=='object'||Array.isArray(j))return send(r,400,{error:'Invalid data'});
        db.users[s.em].data={...empty(),...j};persist();return send(r,200,{ok:true});
      }
      send(r,404,{error:'Not found'});
    });
  });
}
module.exports={createApp};
if(require.main===module){const P=process.env.PORT||3000;createApp().listen(P,()=>console.log('BloomCOS running at http://localhost:'+P))}
