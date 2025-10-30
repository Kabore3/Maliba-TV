// server-secure.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // à adapter
app.use(express.json());

const DATA_FILE = path.join(__dirname,'codes.json');
const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '0011';
const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASS, 10);
const JWT_SECRET = process.env.JWT_SECRET || 'maliba_secret';

// --- Utilitaires ---
async function loadCodes(){
  try{
    const txt = await fs.readFile(DATA_FILE,'utf8');
    return JSON.parse(txt);
  }catch(e){
    if(e.code==='ENOENT') return [];
    throw e;
  }
}

async function saveCodes(codes){
  await fs.writeFile(DATA_FILE, JSON.stringify(codes,null,2),'utf8');
}

function parseDurationToMs(s){
  const m = /^(\d+)(s|m|h|d)$/.exec(String(s).trim());
  if(!m) return null;
  const units={s:1000,m:60000,h:3600000,d:86400000};
  return Number(m[1])*units[m[2]];
}

function isoNowPlus(ms){ return new Date(Date.now()+ms).toISOString(); }

function generateRandomCode(length=12){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code='';
  for(let i=0;i<length;i++) code+=chars.charAt(Math.floor(Math.random()*chars.length));
  return code;
}

async function uniqueCode(length){
  const codes = await loadCodes();
  const set = new Set(codes.map(c=>c.code));
  let tries=0;
  while(tries<10000){
    const candidate = generateRandomCode(length);
    if(!set.has(candidate)) return candidate;
    tries++;
  }
  throw new Error("Impossible de générer un code unique");
}

// --- Middleware Admin ---
function checkAdminAuth(req,res,next){
  const token = req.headers['x-admin-token'] || req.query.token;
  if(!token) return res.status(401).send("Unauthorized");
  try{
    const decoded = jwt.verify(token, JWT_SECRET);
    if(decoded.admin) return next();
    return res.status(401).send("Unauthorized");
  }catch(e){
    return res.status(401).send("Unauthorized");
  }
}

// --- Routes Admin ---
app.post('/admin/login', async (req,res)=>{
  const {password} = req.body||{};
  if(!password) return res.status(400).json({success:false,error:"Mot de passe requis"});
  const match = await bcrypt.compare(password, ADMIN_HASH);
  if(!match) return res.status(401).json({success:false,error:"Mot de passe incorrect"});
  const token = jwt.sign({admin:true}, JWT_SECRET, {expiresIn:'2h'});
  res.json({success:true, token});
});

// --- CRUD codes ---
app.get('/codes', checkAdminAuth, async(req,res)=>{ res.json({codes:await loadCodes()}); });

app.post('/codes', checkAdminAuth, async (req,res)=>{
  try{
    const { count=1, length=12, ttl='1h'} = req.body||{};
    const ms = parseDurationToMs(ttl)||3600000;
    const valid_until = isoNowPlus(ms);
    const codes = await loadCodes();
    const created=[];
    for(let i=0;i<count;i++){
      const code = await uniqueCode(length);
      codes.push({code, valid_until});
      const token = jwt.sign({code, valid_until, permanent:false}, JWT_SECRET, {expiresIn:ttl});
      created.push({code, token, valid_until});
    }
    await saveCodes(codes);
    res.json({success:true, created});
  }catch(err){ console.error(err); res.status(500).json({success:false,error:err.message}); }
});

app.post("/codes/request-token", async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.json({ success: false });

  const codes = await loadCodes();
  const found = codes.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!found) return res.json({ success: false });

  if (found.valid_until && new Date(found.valid_until) <= new Date()) {
    return res.json({ success: false, reason: "expired" });
  }

  const ttl = found.valid_until ? Math.max(1, Math.floor((new Date(found.valid_until)-new Date())/1000)) : 86400;
  const token = jwt.sign({ code: found.code, valid_until: found.valid_until, permanent: found.permanent||false }, JWT_SECRET, { expiresIn: ttl });
  res.json({ success: true, token });
});

app.post('/codes/verify', async(req,res)=>{
  const { token } = req.body||{};
  if(!token) return res.status(400).json({valid:false});
  try{
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({valid:true, permanent:decoded.permanent||false, valid_until:decoded.valid_until});
  }catch(e){ res.json({valid:false}); }
});

app.post('/codes/revoke', checkAdminAuth, async(req,res)=>{
  try{
    let {code} = req.body;
    if(!code) return res.status(400).json({success:false,error:"Pas de code fourni"});
    code=String(code).trim().toUpperCase();
    let codes=await loadCodes();
    const initial=codes.length;
    codes=codes.filter(c=>c.code.toUpperCase()!==code);
    await saveCodes(codes);
    res.json({success: codes.length<initial});
  }catch(err){ console.error(err); res.status(500).json({success:false,error:err.message}); }
});

app.get('/codes/export', checkAdminAuth, async(req,res)=>{
  const codes = await loadCodes();
  let csv = "code;valid_until\n";
  codes.forEach(c=>{csv+=`${c.code};${c.valid_until||''}\n`;});
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="codes.csv"');
  res.send(csv);
});

// --- Servir le front-end ---
app.use(express.static(path.join(__dirname)));

app.get('/admin', checkAdminAuth, (req,res)=>{
  res.sendFile(path.join(__dirname,'admin.html'));
});

// --- Démarrage ---
app.listen(PORT,()=>console.log(`🚀 Serveur MALIBA TV sécurisé en ligne sur http://localhost:${PORT}`));

