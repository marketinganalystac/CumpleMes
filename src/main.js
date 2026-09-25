import { createClient } from '@supabase/supabase-js' 
const sb=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY)
const D={dias:14,sem:3,mes:12,medio:1,aviso:7,semana:7,modo:'mes',ref:'',marks:'42d, 2m, 4m, 6m, 9m, 12m, 15m, 18m, 24m'};
const AREAS=['Motor grueso','Motor fino','Lenguaje','Cognitivo','Social y emocional'];
let S={kids:[],sel:null,cfgOpen:false,ask:false,msg:'',user:null,ready:false,err:'',em:''};
let cfg={...D};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pl=(n,s,p)=>n+' '+(n===1?s:p);
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return {y,m,d,date:new Date(y,m-1,d,12)}};
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const fd=d=>d.toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'});
const dd=(a,b)=>Math.round((b-a)/864e5);
const now=()=>{const t=cfg.ref?pd(cfg.ref).date:new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate(),12)};
const fail=e=>{S.err=(e&&e.message)||'No se pudo guardar.';render()};
const chk=r=>{if(r.error)fail(r.error)};
const toRow=k=>({id:k.id,cupo:k.cupo||null,nombre:k.nm,sexo:k.sx,modulo:k.modulo||null,fecha_nacimiento:k.bs||null,proxima_visita:k.visit||null,hora_visita:k.hv||null});
const saveKid=k=>sb.from('ninos').upsert(toRow(k)).then(chk);
const saveCfg=()=>sb.from('configuracion').upsert({user_id:S.user.id,datos:cfg,actualizado:new Date().toISOString()}).then(chk);
async function load(){const [a,b]=await Promise.all([sb.from('ninos').select('*, sesiones(*)').order('creado'),sb.from('configuracion').select('datos').maybeSingle()]);
  if(a.error)return fail(a.error);
  S.kids=a.data.map(r=>({id:r.id,cupo:r.cupo||'',nm:r.nombre,sx:r.sexo,modulo:r.modulo||'',bs:r.fecha_nacimiento||'',visit:r.proxima_visita||'',hv:(r.hora_visita||'').slice(0,5),log:(r.sesiones||[]).map(x=>({id:x.id,d:x.fecha,a:x.area,n:x.nota}))}));
  cfg={...D,...(b.data&&b.data.datos)};render()}
async function auth(a){const c={email:$('em').value.trim(),password:$('pw').value};S.em=c.email;
  const r=a==='login'?await sb.auth.signInWithPassword(c):await sb.auth.signUp(c);
  S.err=r.error?r.error.message:(a==='signup'&&!r.data.session?'Revisa tu correo para confirmar la cuenta.':'');render()}
function loginHtml(){return `<section class="card"><h2>Inicia sesión</h2><div class="g2"><div><label for="em">Correo</label><input id="em" type="email" autocomplete="email" value="${esc(S.em)}"></div><div><label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="current-password"></div></div><div class="btns" style="margin-top:14px"><button data-act="login">Entrar</button><button class="sec" data-act="signup">Crear cuenta</button></div>${S.err?`<div class="msg" style="color:var(--bad)" role="alert">${esc(S.err)}</div>`:''}</section>`}
function addMonths(b,n){const t=b.m-1+n,y=b.y+Math.floor(t/12),m=((t%12)+12)%12;return new Date(y,m,Math.min(b.d,dim(y,m)),12)}
function diff(b,r){let tm=(r.y-b.y)*12+r.m-b.m;if(addMonths(b,tm)>r.date)tm--;return {y:Math.floor(tm/12),m:tm%12,d:dd(addMonths(b,tm),r.date)}}
function clinical(days,x){const tm=x.y*12+x.m;
  if(days<cfg.dias)return pl(days,'día','días');
  if(tm<cfg.sem){const w=Math.floor(days/7),r=days%7;return pl(w,'semana','semanas')+(r?', '+pl(r,'día','días'):'')}
  if(tm<cfg.mes){const w=Math.floor(x.d/7);return pl(tm,'mes','meses')+(w?', '+pl(w,'semana','semanas'):'')}
  return pl(x.y,'año','años')+(x.m?', '+pl(x.m,'mes','meses'):'')}
function informal(x){const tm=x.y*12+x.m;if(!cfg.medio||tm<cfg.sem)return '';
  const h=Math.round((tm+x.d/30.44)*2)/2;return '≈ '+pl(Math.floor(h),'mes','meses')+(h%1?' y medio':'')}
function marks(){return cfg.marks.split(/[,;]/).map(t=>t.trim().toLowerCase().match(/^(\d+)\s*(d|s|m|a)?/)).filter(Boolean).map(m=>({n:+m[1],u:m[2]||'m'}))}
const mDate=(b,{n,u})=>u==='d'?new Date(b.y,b.m-1,b.d+n,12):u==='s'?new Date(b.y,b.m-1,b.d+7*n,12):addMonths(b,u==='a'?12*n:n);
const mLabel=({n,u})=>u==='d'?pl(n,'día','días'):u==='s'?pl(n,'semana','semanas'):u==='a'?pl(n,'año','años'):(n>=24&&n%12===0?pl(n/12,'año','años'):pl(n,'mes','meses'));
const PLAN=[
[3,'0 a 3 meses',[['Motor','Boca abajo supervisado, unos minutos varias veces al día.'],['Cognitivo','Seguimiento visual de un objeto de alto contraste a 20-30 cm.'],['Lenguaje','Hablarle, cantarle e imitar sus sonidos.'],['Social','Contacto piel con piel y responder a su sonrisa.']]],
[6,'3 a 6 meses',[['Motor','Boca abajo apoyado en antebrazos; ayudarle a rodar.'],['Motor fino','Ofrecer sonajeros para que los alcance y agarre.'],['Lenguaje','Turnos de balbuceo: repetir lo que dice.'],['Cognitivo','Juego frente al espejo y causa y efecto (sacudir, sonar).']]],
[9,'6 a 9 meses',[['Motor','Sentado con apoyo; incentivar el gateo con juguetes a distancia.'],['Motor fino','Pasar objetos de una mano a otra.'],['Lenguaje','Repetir sílabas (ba, ma, pa) y nombrar lo que ve.'],['Cognitivo','Esconder un juguete bajo una tela y buscarlo juntos.']]],
[12,'9 a 12 meses',[['Motor','Ponerse de pie con apoyo y desplazarse agarrado de muebles.'],['Motor fino','Pinza con objetos grandes y seguros; meter y sacar de una caja.'],['Lenguaje','Gestos de adiós, señalar y nombrar objetos.'],['Social','Juegos de esconder la cara y turnos.']]],
[18,'12 a 18 meses',[['Motor','Primeros pasos; empujar un juguete con ruedas.'],['Motor fino','Torres de 2 o 3 bloques.'],['Lenguaje','Libros con imágenes; nombrar objetos cotidianos.'],['Social','Imitar tareas del hogar: hablar por teléfono, barrer.']]],
[24,'18 a 24 meses',[['Motor','Correr, patear una pelota, subir escalones con ayuda.'],['Motor fino','Garabatear con crayones gruesos.'],['Lenguaje','Frases de dos palabras y canciones con gestos.'],['Cognitivo','Juego simbólico: muñecos, cocinita, cuidar un peluche.']]],
[36,'2 a 3 años',[['Motor','Saltar, subir escaleras, caminar sobre una línea.'],['Motor fino','Encajes, ensartar cuentas grandes, trazos.'],['Lenguaje','Frases cortas, preguntas y cuentos.'],['Social','Turnos, compartir y reglas sencillas.']]],
[999,'3 años o más',[['Motor','Pedalear, saltar en un pie, atrapar una pelota.'],['Motor fino','Recortar con tijeras, dibujar figuras, copiar trazos.'],['Lenguaje','Contar historias y explicar lo que hizo.'],['Cognitivo','Clasificar por color y tamaño, contar hasta 10, rompecabezas.']]]];
const planFor=tm=>PLAN.find(p=>tm<p[0]);
const mlab=n=>{const y=Math.floor(n/12),m=n%12;return pl(n,'mes','meses')+(n>=12?' ('+pl(y,'año','años')+(m?', '+pl(m,'mes','meses'):'')+')':'')};
function ctl(i){if(cfg.modo==='lista')return marks().map(m=>({dt:mDate(i.b,m),lb:mLabel(m)}));const o=[];for(let n=Math.max(1,i.tm);n<=i.tm+6;n++)o.push({dt:addMonths(i.b,n),lb:mlab(n)});return o}
function week(){const o=[];S.kids.forEach(k=>{const nm=k.nm||'Sin nombre';
  if(k.visit){const v=visit(k);if(v.l<=cfg.semana){const a=k.bs?info(k,k.visit):null;o.push({l:v.l,t:`Visita de ${nm}: ${v.t.toLowerCase()}, ${fd(pd(k.visit).date)}`+(a&&!a.bad?` (edad ese día: ${a.cl})`:'')})}}
  const i=info(k);if(i&&!i.bad){let n=i.tm,d=addMonths(i.b,n);if(dd(i.r.date,d)<0||n===0){n=i.tm+1;d=addMonths(i.b,n)}
    const l=dd(i.r.date,d);if(l<=cfg.semana)o.push({l,t:`${nm} cumple ${mlab(n)} ${l===0?'hoy':l===1?'mañana':'en '+pl(l,'día','días')}, ${fd(d)}`})}});
  return o.sort((a,b)=>a.l-b.l)}
function weekHtml(){const w=week();return `<section class="card"><h2>Esta semana</h2>`+(w.length?`<ul class="tl">${w.map(x=>`<li><span class="t">${esc(x.t)}</span></li>`).join('')}</ul><div class="btns" style="margin-top:12px"><button class="sec" data-act="copyw">Copiar recordatorios</button></div><div class="msg" role="status">${esc(S.msg)}</div>`:`<p class="note" style="margin:0">Sin visitas ni cumple mes en los próximos ${pl(cfg.semana,'día','días')}.</p>`)+'</section>'}
function copyTxt(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{S.msg='Copiado.';render()},()=>{S.msg=t;render()})}
function info(k,rs){if(!k.bs)return null;const b=pd(k.bs),r=pd(rs||iso(now())),days=dd(b.date,r.date);
  if(days<0)return {bad:1};const x=diff(b,r);return {b,r,days,x,tm:x.y*12+x.m,cl:clinical(days,x),inf:informal(x),
  ex:[x.y?pl(x.y,'año','años'):'',x.m?pl(x.m,'mes','meses'):'',pl(x.d,'día','días')].filter(Boolean).join(', ')}}
function visit(k){if(!k.visit)return {t:'Sin visita',c:''};const l=dd(now(),pd(k.visit).date);
  if(l<0)return {t:'Vencida hace '+pl(-l,'día','días'),c:'late',l};
  return {t:l===0?'Hoy':l===1?'Mañana':'En '+pl(l,'día','días'),c:l<=cfg.aviso?'warn':'',l}}
const sexo={f:'Niña',m:'Niño','':'Sin indicar'};

function cfgHtml(){const n=(k,l,h)=>`<div><label>${l}</label><input type="number" min="0" data-c="${k}" value="${cfg[k]}"><div class="hint">${h}</div></div>`;
return `<section class="card"><h2>Configuración</h2><div class="g2">
${n('dias','Contar en días hasta (días)','Antes de este número de días la edad se muestra en días.')}
${n('sem','Contar en semanas hasta (meses)','Hasta esta edad se muestra en semanas.')}
${n('mes','Contar en meses hasta (meses)','Desde aquí se muestra en años y meses (12 = 1 año).')}
${n('aviso','Avisar visita con (días)','Resalta la visita cuando falten estos días o menos.')}
${n('semana','Recordatorios de la semana (días)','Muestra las visitas y cumple mes que ocurren dentro de estos días.')}
<div><label>Fechas de control</label><select data-c="modo"><option value="mes"${cfg.modo==='mes'?' selected':''}>Cada cumple mes</option><option value="lista"${cfg.modo==='lista'?' selected':''}>Lista personalizada</option></select><div class="hint">Cada cumple mes usa el día de nacimiento en cada mes.</div></div>
<div><label>Regla de medio mes</label><select data-c="medio"><option value="1"${cfg.medio?' selected':''}>Activada</option><option value="0"${cfg.medio?'':' selected'}>Desactivada</option></select><div class="hint">Muestra la edad informal redondeada al medio mes.</div></div>
<div><label>Calcular al día (opcional)</label><input type="date" data-c="ref" value="${esc(cfg.ref)}"><div class="hint">Vacío = hoy.</div></div></div>
<div style="margin-top:12px"><label>Lista personalizada de fechas de control</label><input type="text" data-c="marks" value="${esc(cfg.marks)}"><div class="hint">Separadas por coma. Usa d = días, s = semanas, m = meses, a = años. Ej: 42d, 2m, 6m, 1a.</div></div>
<div class="btns" style="margin-top:14px"><button class="sec" data-act="reset">Restablecer valores</button><button data-act="cfg">Cerrar</button></div></section>`}

function listHtml(){if(!S.kids.length)return '<div class="card empty">Aún no hay niños. Usa «Agregar niño» para empezar.</div>';
  const ks=[...S.kids].sort((a,b)=>(a.visit||'9999')<(b.visit||'9999')?-1:1);
  return weekHtml()+'<h2>Agenda de visitas</h2>'+ks.map(k=>{const i=info(k),v=visit(k);
    return `<button class="kid" data-act="sel" data-id="${k.id}"><b>${k.cupo?'#'+esc(k.cupo)+' · ':''}${esc(k.nm||'Sin nombre')}</b><span class="a">${sexo[k.sx||'']}${k.modulo?' · '+esc(k.modulo):''} · ${i&&!i.bad?i.cl:'Falta fecha de nacimiento'}</span><span class="chip ${v.c}">${v.t}</span></button>`}).join('')}

function detailHtml(k){const i=info(k),v=visit(k),vi=k.visit&&k.bs?info(k,k.visit):null;
  const form=`<section class="card"><h2>Datos</h2><div class="g2">
  <div><label>N.º de cupo</label><input data-f="cupo" value="${esc(k.cupo)}"></div>
  <div><label>Nombre del niño</label><input data-f="nm" value="${esc(k.nm)}"></div>
  <div><label>Sexo</label><select data-f="sx"><option value=""${k.sx?'':' selected'}>Sin indicar</option><option value="f"${k.sx==='f'?' selected':''}>Niña</option><option value="m"${k.sx==='m'?' selected':''}>Niño</option></select></div>
  <div><label>Módulo</label><input data-f="modulo" value="${esc(k.modulo)}"></div>
  <div><label>Fecha de nacimiento</label><input type="date" data-f="bs" value="${esc(k.bs)}"></div>
  <div><label>Fecha de visita</label><input type="date" data-f="visit" value="${esc(k.visit)}"><div class="hint">${k.visit?v.t+' · '+fd(pd(k.visit).date):''}${vi&&!vi.bad?'<br>Edad ese día: '+vi.cl+' ('+vi.ex+')':''}</div></div>
  <div><label>Hora de visita</label><input type="time" data-f="hv" value="${esc(k.hv)}"></div></div></section>`;
  let body='';
  if(i&&i.bad)body='<div class="card empty">La fecha de nacimiento es posterior a la fecha de cálculo.</div>';
  else if(i){let nx=false;
    const items=ctl(i).map(m=>{const dt=m.dt,l=dd(i.r.date,dt);let c='',s;
      if(l<0){c='done';s='Cumplido'}else{if(!nx){c='next';nx=true}s=l===0?'Hoy':l===1?'Mañana':'En '+pl(l,'día','días')}
      return `<li class="${c}"><span class="t">${m.lb}</span><span class="d">${fd(dt)}</span><span class="s">${s}</span></li>`}).join('');
    const wk=Math.floor(i.days/7),wd=i.days%7;
    body=`<section class="card hero"><p>${esc(k.nm||'Edad')}${k.sx?' · '+sexo[k.sx]:''}</p><div class="age">${i.cl}</div><p>${i.inf?i.inf+' · ':''}${i.ex}</p></section>
    <section class="card"><h2>Edad exacta</h2><div class="stats">
    <div class="stat"><b>${i.days}</b><span>días de vida</span></div>
    <div class="stat"><b>${wk}</b><span>semanas${wd?' + '+pl(wd,'día','días'):''}</span></div>
    <div class="stat"><b>${i.tm}</b><span>meses cumplidos</span></div>
    <div class="stat"><b>${i.x.y}</b><span>años cumplidos</span></div></div>
    <div class="btns" style="margin-top:14px"><button data-act="copy">Copiar para el expediente</button></div><div class="msg" role="status">${esc(S.msg)}</div></section>
    <section class="card"><h2>Fechas de control</h2><ul class="tl">${items||'<li class="d">Sin fechas configuradas.</li>'}</ul></section>`}
  const log=[...(k.log||[])].map((e,ix)=>({...e,ix})).sort((a,b)=>a.d<b.d?1:-1);
  const last=log[0]?dd(pd(log[0].d).date,now()):null;
  const pn=i&&!i.bad?planFor(i.tm):null;
  const plan=pn?`<section class="card"><h2>Plan de actividades · ${pn[1]}</h2><ul class="tl">${pn[2].map(a=>`<li><span class="t">${a[0]}</span><span class="d">${a[1]}</span></li>`).join('')}</ul><p class="note">Ideas generales de juego. Adáptalas al ritmo de cada niño y consulta si notas retrasos.</p></section>`:'';
  const est=`<section class="card"><h2>Seguimiento de estimulación</h2>
  <p class="note" style="margin:0 0 10px">${log.length?pl(log.length,'sesión registrada','sesiones registradas')+(last!=null?' · última hace '+pl(last,'día','días'):''):'Aún no hay sesiones registradas.'}</p>
  <div class="g2"><div><label>Fecha</label><input type="date" id="ld" value="${iso(now())}"></div>
  <div><label>Área</label><select id="la">${AREAS.map(a=>`<option>${a}</option>`).join('')}</select></div></div>
  <div style="margin-top:12px"><label>Actividad y observaciones</label><textarea id="ln" rows="3" placeholder="Qué se trabajó, cómo respondió, tarea para casa"></textarea></div>
  <div class="btns" style="margin-top:12px"><button data-act="addlog">Agregar sesión</button></div>
  <ul class="tl" style="margin-top:12px">${log.map(e=>`<li><span class="t">${esc(e.a)} <span class="d">· ${fd(pd(e.d).date)}</span></span><span class="d">${esc(e.n)}</span><button class="sec" data-act="dellog" data-ix="${e.ix}" aria-label="Eliminar sesión">Quitar</button></li>`).join('')}</ul></section>`;
  const del=S.ask?`<button class="bad" data-act="delok">Confirmar: eliminar a ${esc(k.nm||'este niño')}</button><button class="sec" data-act="delno">Cancelar</button>`:'<button class="bad" data-act="del">Eliminar niño</button>';
  return `<div class="btns" style="margin-bottom:14px"><button class="sec" data-act="back">← Todos los niños</button></div>${body}${plan}${est}${form}<div class="btns">${del}</div>`}

function render(){const k=S.kids.find(x=>x.id===S.sel);
  $('nav').style.display=S.user?'':'none';
  $('app').innerHTML=!S.ready?'':!S.user?loginHtml():(S.err?`<div class="card msg" style="color:var(--bad)" role="alert">${esc(S.err)}</div>`:'')+(S.cfgOpen?cfgHtml():'')+(k?detailHtml(k):listHtml())}

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,k=S.kids.find(x=>x.id===S.sel);S.msg='';S.err='';
  if(a==='login'||a==='signup'){auth(a);return}
  if(a==='out'){sb.auth.signOut();return}
  if(a==='export'){exportAll();return}
  if(!S.user)return;
  if(a==='add'){const n={id:crypto.randomUUID(),cupo:'',nm:'',sx:'',modulo:'',bs:'',visit:'',hv:'',log:[]};S.kids.push(n);S.sel=n.id;S.ask=false;saveKid(n)}
  else if(a==='sel'){S.sel=b.dataset.id;S.ask=false}
  else if(a==='back'){S.sel=null;S.ask=false}
  else if(a==='cfg')S.cfgOpen=!S.cfgOpen;
  else if(a==='reset'){cfg={...D};saveCfg()}
  else if(a==='del')S.ask=true;
  else if(a==='delno')S.ask=false;
  else if(a==='delok'){sb.from('ninos').delete().eq('id',S.sel).then(chk);S.kids=S.kids.filter(x=>x.id!==S.sel);S.sel=null;S.ask=false}
  else if(a==='addlog'&&k){const n=$('ln').value.trim(),d=$('ld').value;if(n&&d){const e={id:crypto.randomUUID(),d,a:$('la').value,n};(k.log=k.log||[]).push(e);sb.from('sesiones').insert({id:e.id,nino_id:k.id,fecha:d,area:e.a,nota:n}).then(chk)}}
  else if(a==='dellog'&&k){const [e]=k.log.splice(+b.dataset.ix,1);sb.from('sesiones').delete().eq('id',e.id).then(chk)}
  else if(a==='copyw'){copyTxt(week().map(x=>'• '+x.t).join('\n'));return}
  else if(a==='copy'&&k){const i=info(k),t=`${k.nm?k.nm+' — ':''}Nacimiento: ${fd(i.b.date)}. Edad al ${fd(i.r.date)}: ${i.cl} (${i.ex}; ${i.days} días).`;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{S.msg='Copiado.';render()},()=>{S.msg=t;render()});return}
  render()});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.f){const k=S.kids.find(x=>x.id===S.sel);if(k){k[t.dataset.f]=t.value;S.ask=false;saveKid(k);render()}}
  else if(t.dataset.c){const c=t.dataset.c;cfg[c]=(c==='marks'||c==='ref'||c==='modo')?t.value:Math.max(0,parseInt(t.value,10)||0);saveCfg();render()}});
render();
sb.auth.onAuthStateChange((_e,ses)=>{S.user=ses?ses.user:null;S.ready=true;S.sel=null;S.kids=[];S.err='';if(S.user)setTimeout(load,0);else render()});
