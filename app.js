var leads = JSON.parse(localStorage.getItem('mo-leads') || '[]');
var eid = null;
var filt = 'all';
var genEmail = '';
var akey = localStorage.getItem('mo-akey') || '';

function td() { return new Date().toISOString().split('T')[0]; }
function fd() { var d = new Date(); d.setDate(d.getDate()+4); return d.toISOString().split('T')[0]; }
function save() { localStorage.setItem('mo-leads', JSON.stringify(leads)); }

function toast(m) {
  var t = document.getElementById('toast');
  t.textContent = m; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2500);
}

function bc(s) {
  var m = {sent:'b-sent',noreply:'b-noreply',replied:'b-replied',talks:'b-talks',won:'b-won',nope:'b-nope'};
  return m[s] || 'b-sent';
}
function bl(s) {
  var m = {sent:'Sent',noreply:'No Reply',replied:'Replied',talks:'In Talks',won:'Client Won ✦',nope:'Not Interested'};
  return m[s] || s;
}

function go(name, idx) {
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('on'); });
  document.querySelectorAll('.ni').forEach(function(n){ n.classList.remove('active'); });
  document.getElementById('s-'+name).classList.add('on');
  document.getElementById('n'+idx).classList.add('active');
  document.getElementById('appBody').scrollTop = 0;
  if(name==='dash') renderDash();
  if(name==='all') renderAll();
  if(name==='add' && !eid) clearForm();
}

function clearForm() {
  eid = null;
  document.getElementById('f-biz').value = '';
  document.getElementById('f-own').value = '';
  document.getElementById('f-em').value = '';
  document.getElementById('f-type').value = 'Nail Salon';
  document.getElementById('f-stat').value = 'sent';
  document.getElementById('f-dt').value = td();
  document.getElementById('f-fu').value = fd();
  document.getElementById('f-web').value = '';
  document.getElementById('f-note').value = '';
  document.getElementById('saveBtn').textContent = 'Save lead 🦋';
}

function saveLead() {
  var biz = document.getElementById('f-biz').value.trim();
  var em = document.getElementById('f-em').value.trim();
  if(!biz || !em) { toast('Business name and email are required!'); return; }
  var lead = {
    id: eid || Date.now().toString(),
    biz: biz, em: em,
    own: document.getElementById('f-own').value.trim(),
    type: document.getElementById('f-type').value,
    stat: document.getElementById('f-stat').value,
    dt: document.getElementById('f-dt').value,
    fu: document.getElementById('f-fu').value,
    web: document.getElementById('f-web').value.trim(),
    note: document.getElementById('f-note').value.trim()
  };
  if(eid) {
    var i = leads.findIndex(function(l){ return l.id===eid; });
    leads[i] = lead;
  } else {
    leads.unshift(lead);
  }
  save();
  toast(eid ? 'Lead updated!' : 'Lead saved! 🦋');
  clearForm();
  go('dash', 0);
}

function delLead(id) {
  if(!confirm('Delete this lead?')) return;
  leads = leads.filter(function(l){ return l.id !== id; });
  save(); renderAll(); renderDash();
  toast('Deleted');
}

function editLead(id) {
  var l = leads.find(function(l){ return l.id===id; });
  if(!l) return;
  eid = id;
  document.getElementById('f-biz').value = l.biz;
  document.getElementById('f-own').value = l.own || '';
  document.getElementById('f-em').value = l.em;
  document.getElementById('f-type').value = l.type;
  document.getElementById('f-stat').value = l.stat;
  document.getElementById('f-dt').value = l.dt;
  document.getElementById('f-fu').value = l.fu;
  document.getElementById('f-web').value = l.web || '';
  document.getElementById('f-note').value = l.note || '';
  document.getElementById('saveBtn').textContent = 'Update lead 🦋';
  go('add', 1);
}

function renderDash() {
  var now = td();
  document.getElementById('st0').textContent = leads.length;
  document.getElementById('st1').textContent = leads.filter(function(l){ return l.stat==='won'; }).length;
  document.getElementById('st2').textContent = leads.filter(function(l){ return l.stat==='replied'; }).length;
  document.getElementById('st3').textContent = leads.filter(function(l){ return l.stat==='talks'; }).length;
  document.getElementById('hbadge').textContent = leads.length + (leads.length===1 ? ' lead' : ' leads');

  var due = leads.filter(function(l){ return l.fu && l.fu <= now && l.stat !== 'won' && l.stat !== 'nope'; });
  var fuEl = document.getElementById('fuList');
  if(due.length === 0) {
    fuEl.innerHTML = '<div class="empty" style="padding:12px 0"><p style="font-size:13px">No follow ups due today</p></div>';
  } else {
    fuEl.innerHTML = due.map(function(l){
      var late = l.fu < now;
      return '<div class="fucard'+(late?' late':'')+'" onclick="openModal(\''+l.id+'\',\'fu\')">'
        +'<div class="futag'+(late?' late':'')+'">'+(late?'Overdue':'Due today')+'</div>'
        +'<div class="funame">'+l.biz+'</div>'
        +'<div class="fudue">Tap to write follow up email</div>'
        +'</div>';
    }).join('');
  }

  var rec = leads.slice(0,5);
  var rEl = document.getElementById('recList');
  if(rec.length === 0) {
    rEl.innerHTML = '<div class="empty"><div class="empty-ic">🦋</div><p>No leads yet<br>Add your first lead to get started</p></div>';
  } else {
    rEl.innerHTML = rec.map(function(l){ return cardHtml(l); }).join('');
  }
}

function renderAll() {
  var chips = ['all','sent','noreply','replied','talks','won','nope'];
  var labels = {all:'All',sent:'Sent',noreply:'No Reply',replied:'Replied',talks:'In Talks',won:'Won',nope:'Not Interested'};
  document.getElementById('chipRow').innerHTML = chips.map(function(c){
    return '<button class="chip'+(filt===c?' on':'')+'" onclick="setFilt(\''+c+'\')">'+(labels[c])+'</button>';
  }).join('');

  var q = document.getElementById('srch').value.toLowerCase();
  var list = leads.filter(function(l){
    var mq = !q || l.biz.toLowerCase().indexOf(q)>-1 || l.em.toLowerCase().indexOf(q)>-1;
    var mf = filt==='all' || l.stat===filt;
    return mq && mf;
  });

  var el = document.getElementById('allList');
  if(list.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ic">🔍</div><p>No leads found</p></div>';
  } else {
    el.innerHTML = list.map(function(l){ return cardHtml(l); }).join('');
  }
}

function setFilt(f) { filt = f; renderAll(); }

function cardHtml(l) {
  return '<div class="lcard" onclick="this.classList.toggle(\'open\')">'
    +'<div class="lcard-top">'
    +'<div><div class="lname">'+l.biz+'</div><div class="lmeta">'+l.type+' · '+l.dt+'</div></div>'
    +'<span class="badge '+bc(l.stat)+'">'+bl(l.stat)+'</span>'
    +'</div>'
    +'<div class="lbody">'
    +(l.note ? '<div class="lnotes">'+l.note+'</div>' : '')
    +'<div class="acts">'
    +'<button class="bsm pri" onclick="event.stopPropagation();openModal(\''+l.id+'\',\'cold\')">✉️ Write email</button>'
    +'<button class="bsm" onclick="event.stopPropagation();editLead(\''+l.id+'\')">Edit</button>'
    +'<button class="bsm del" onclick="event.stopPropagation();delLead(\''+l.id+'\')">Delete</button>'
    +'</div>'
    +'</div>'
    +'</div>';
}

function openModal(id, type) {
  if(!akey) { showKeySetup(); return; }
  var l = leads.find(function(l){ return l.id===id; });
  if(!l) return;
  genEmail = '';
  document.getElementById('bcopy').style.display = 'none';
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('mtitle').textContent = type==='cold' ? 'Cold email 🦋' : 'Follow up email 🦋';
  document.getElementById('msub').textContent = l.biz + ' · ' + l.type;
  document.getElementById('mcontent').innerHTML = '<div class="ldots"><div class="dot"></div><div class="dot"></div><div class="dot"></div><span>Claude is writing your email...</span></div>';

  var prompt = type === 'cold'
    ? 'Write a short friendly cold outreach email from Morolake at MO-WEBCO (a Calgary web developer) to '+(l.own||'the owner')+' of "'+l.biz+'", a '+l.type+' in Calgary. The email should: be warm and personal not salesy, mention she noticed their business and thinks a modern website could help get more clients, say MO-WEBCO builds sites from $150, offer a free quote, be under 120 words, end with mowebsiteco@gmail.com.'+(l.web?' She visited their site at '+l.web+' and has ideas to improve it.':'')+' Format: Subject: line first then email body only. No extra commentary.'
    : 'Write a very short friendly follow up email from Morolake at MO-WEBCO to the owner of "'+l.biz+'", a '+l.type+' in Calgary. She emailed them about a website a few days ago and has not heard back. Under 60 words, light and friendly not pushy, just checking if they saw her email, mention mowebsiteco@gmail.com. Format: Subject: line first then email body only. No extra commentary.';

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': akey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    genEmail = (d.content || []).map(function(c){ return c.text||''; }).join('');
    document.getElementById('mcontent').innerHTML = '<div class="ebox">'+genEmail+'</div>';
    document.getElementById('bcopy').style.display = 'block';
  })
  .catch(function(){
    document.getElementById('mcontent').innerHTML = '<div class="ebox">Could not connect. Check your API key in settings.</div>';
  });
}

function showKeySetup() {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('mtitle').textContent = 'Set up AI emails 🦋';
  document.getElementById('msub').textContent = 'One time setup · 2 minutes';
  document.getElementById('bcopy').style.display = 'none';
  document.getElementById('mcontent').innerHTML = ''
    +'<p style="font-size:13px;color:var(--tm);line-height:1.7;margin-bottom:14px;font-weight:300;">'
    +'Get a free Anthropic API key to use AI email writing:<br><br>'
    +'1. Go to <b style="color:var(--ld)">console.anthropic.com</b><br>'
    +'2. Sign up free<br>'
    +'3. Click API Keys → Create Key<br>'
    +'4. Paste it below'
    +'</p>'
    +'<input class="fi" id="keyIn" type="password" placeholder="sk-ant-api03-..." style="margin-bottom:10px">'
    +'<button class="bfull" onclick="saveKey()" style="margin-top:0">Save key</button>';
}

function saveKey() {
  var k = document.getElementById('keyIn').value.trim();
  if(!k || k.length < 20) { toast('Paste a valid API key'); return; }
  akey = k;
  localStorage.setItem('mo-akey', k);
  document.getElementById('modal').style.display = 'none';
  toast('Key saved! Tap Write email to try it 🦋');
}

function doCopy() {
  if(!genEmail) return;
  if(navigator.clipboard) {
    navigator.clipboard.writeText(genEmail).then(function(){
      toast('Copied! Paste into Gmail 🦋');
      document.getElementById('modal').style.display = 'none';
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = genEmail;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Copied! Paste into Gmail 🦋');
    document.getElementById('modal').style.display = 'none';
  }
}

clearForm();
renderDash();
if(!akey) setTimeout(showKeySetup, 800);
