(function(){
  /* title font: shares the choice made on the ai3 site (localStorage 'ai3-title') */
  const FONTS=[
    {id:'archivo',fam:'Archivo',w:400,ls:'-.01em'},{id:'space',fam:'Space Grotesk',w:300,ls:'-.015em'},
    {id:'plex',fam:'IBM Plex Sans',w:300,ls:'-.01em'},{id:'redhat',fam:'Red Hat Display',w:400,ls:'-.015em'},
    {id:'hanken',fam:'Hanken Grotesk',w:300,ls:'-.02em'},{id:'chivo',fam:'Chivo',w:400,ls:'-.02em'},
    {id:'instrument',fam:'Instrument Sans',w:400,ls:'-.015em'},{id:'inter',fam:'Inter',w:300,ls:'-.01em'},
    {id:'worksans',fam:'Work Sans',w:300,ls:'-.01em'},{id:'jost',fam:'Jost',w:300,ls:'-.005em'},
    {id:'urbanist',fam:'Urbanist',w:300,ls:'-.015em'},{id:'albert',fam:'Albert Sans',w:300,ls:'-.015em'},
    {id:'manrope-l',fam:'Manrope',w:300,ls:'-.02em'},{id:'figtree',fam:'Figtree',w:400,ls:'-.01em'},
    {id:'publicsans',fam:'Public Sans',w:400,ls:'-.01em'},{id:'karla',fam:'Karla',w:400,ls:'-.01em'},
    {id:'mona',fam:'Mona Sans',w:400,ls:'-.01em'}];
  let fid=null; try{ fid=localStorage.getItem('ai3-title'); }catch(e){}
  const F=FONTS.find(f=>f.id===fid)||FONTS[0];
  const lk=document.createElement('link'); lk.rel='stylesheet';
  lk.href='https://fonts.googleapis.com/css2?family='+F.fam.replace(/ /g,'+')+':wght@300;400;500&display=swap';
  document.head.appendChild(lk);
  const rs=document.documentElement.style;
  rs.setProperty('--title','"'+F.fam+'",system-ui,sans-serif'); rs.setProperty('--title-weight',F.w); rs.setProperty('--title-spacing',F.ls);

  /* gantt bars */
  const day=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d)/864e5;};
  document.querySelectorAll('.gantt').forEach(g=>{
    const y=g.dataset.year, st=day(g.dataset.start), n=+g.dataset.weeks, span=n*7;
    g.style.setProperty('--n',n);
    const wk=g.querySelector('.wk'); if(wk){ wk.innerHTML=''; for(let i=0;i<n;i++){ const d=new Date((st+i*7)*864e5); const s=document.createElement('span'); s.textContent=(d.getUTCMonth()+1)+'/'+d.getUTCDate(); wk.appendChild(s);} }
    g.querySelectorAll('.gr').forEach(r=>{
      const p=x=>{const [m,d]=x.split('/').map(Number); const yy=(g.dataset.roll&&m<6)?+y+1:+y; return day(yy+'-'+m+'-'+d);};
      const a=p(r.dataset.a), b=r.dataset.b?p(r.dataset.b):a;
      const i=r.querySelector('.bar i'); if(!i) return;
      const L=Math.max(0,(a-st)/span*100), W=Math.max(.9,(b-a+1)/span*100);
      i.style.left=L+'%'; i.style.width=(r.classList.contains('m')?0:W)+'%';
      if(r.classList.contains('m')) i.style.left=((a-st+.5)/span*100)+'%';
    });
  });

  /* fit dense text frames to the viewport height: wrap content once, then zoom it down if it overflows */
  document.querySelectorAll('.frame,.split .text').forEach(box=>{
    const w=document.createElement('div'); w.className='fitw';
    while(box.firstChild) w.appendChild(box.firstChild); box.appendChild(w); });
  function fit(s){ if(!s) return; s.querySelectorAll('.fitw').forEach(w=>{
    const box=w.parentElement, cs=getComputedStyle(box);
    const avail=box.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
    w.style.zoom=''; const need=w.offsetHeight;
    if(need>avail&&avail>0) w.style.zoom=Math.max(.5,avail/need*.98); }); }
  addEventListener('resize',()=>fit(slides[cur]));
  const slides=[...document.querySelectorAll('.slide')];
  const chapters=[];
  slides.forEach((s,i)=>{ let c=chapters.find(x=>x.name===s.dataset.ch); if(!c){c={name:s.dataset.ch,start:i};chapters.push(c);} s._ch=chapters.indexOf(c); s._g=0; });
  const chapsEl=document.getElementById('chaps');
  const L=window.__L=(el,t)=>{el.innerHTML=String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/ai3/gi,'<span style="text-transform:none">ai3</span>');};
  chapters.forEach((c,ci)=>{ const a=document.createElement('a'); a.href='#'+(c.start+1); L(a,c.name); a.addEventListener('click',e=>{e.preventDefault();show(c.start);}); chapsEl.appendChild(a); c.el=a; });
  const $=id=>document.getElementById(id);
  const countEl=$('count'), roCh=$('roCh'), roT=$('roT'), prog=$('prog'), bPrev=$('bPrev'), bNext=$('bNext'), lab=$('pLab');
  let cur=-1;
  const pad=n=>String(n).padStart(2,'0');
  function load(i){ const s=slides[i]; if(!s) return; s.querySelectorAll('img[data-src]').forEach(im=>{ im.src=im.dataset.src; im.removeAttribute('data-src'); }); }
  function figs(s){ return [...s.querySelectorAll('.gimg')]; }
  function setG(s,g){
    const f=figs(s); if(!f.length) return; s._g=Math.max(0,Math.min(f.length-1,g));
    f.forEach((x,i)=>x.classList.toggle('on',i===s._g));
    const eb=s.querySelector('.wcap .eb'), gc=s.querySelector('.wcap .gc');
    if(eb) (window.__L||((e,t)=>e.textContent=t))(eb,f[s._g].dataset.label||'');
    if(gc) gc.textContent=pad(s._g+1)+' / '+pad(f.length);
    s.classList.toggle('light-img',f[s._g].classList.contains('pap'));
    ui();
  }
  function ui(){
    const s=slides[cur];
    document.body.classList.toggle('light',s.classList.contains('paper')||s.classList.contains('light-img'));
    countEl.textContent=pad(cur+1)+' / '+pad(slides.length);
    chapters.forEach((c,i)=>c.el.classList.toggle('on',i===s._ch));
    L(roCh,chapters[s._ch].name); L(roT,s.dataset.title||'');
    prog.style.width=((cur+1)/slides.length*100)+'%';
    bPrev.disabled=cur===0&&!s._g; bNext.disabled=cur===slides.length-1&&(!figs(s).length||s._g===figs(s).length-1);
    const f=figs(s); L(lab,f.length?('Images '+pad(s._g+1)+' / '+pad(f.length)):chapters[s._ch].name);
  }
  function show(i,fromEnd){
    i=Math.max(0,Math.min(slides.length-1,i)); if(i===cur) return;
    if(cur>=0) slides[cur].classList.remove('on');
    cur=i; const s=slides[i]; s.classList.add('on');
    [i,i+1,i-1,i+2].forEach(load); fit(s);
    if(figs(s).length) setG(s,fromEnd?figs(s).length-1:0);
    ui();
    try{ localStorage.setItem('nr-pos',i); history.replaceState(null,'','#'+(i+1)); }catch(e){}
  }
  function next(){ const s=slides[cur], f=figs(s); if(f.length&&s._g<f.length-1){ setG(s,s._g+1); return; } show(cur+1); }
  function prev(){ const s=slides[cur], f=figs(s); if(f.length&&s._g>0){ setG(s,s._g-1); return; } show(cur-1,true); }
  window.__nrGo=(i,g)=>{show(i); if(g) setG(slides[i],g);};
  function chap(d){ const c=slides[cur]._ch+d; if(chapters[c]) show(chapters[c].start); }
  bPrev.addEventListener('click',prev); bNext.addEventListener('click',next);
  $('eL').addEventListener('click',prev); $('eR').addEventListener('click',next);
  addEventListener('keydown',e=>{
    if(e.target.closest&&e.target.closest('input,textarea,[contenteditable="true"]')) return;
    const k=e.key;
    if(k==='ArrowRight'||k===' '||k==='PageDown'){e.preventDefault();next();}
    else if(k==='ArrowLeft'||k==='PageUp'){e.preventDefault();prev();}
    else if(k==='ArrowDown'){e.preventDefault();chap(1);}
    else if(k==='ArrowUp'){e.preventDefault();chap(-1);}
    else if(k==='Home'){show(0);} else if(k==='End'){show(slides.length-1);}
  });
  let start=0; const h=parseInt(location.hash.slice(1),10);
  if(h) start=h-1; else { try{ start=+localStorage.getItem('nr-pos')||0; }catch(e){} }
  show(start);
  const refit=()=>requestAnimationFrame(()=>fit(slides[cur]));
  refit(); addEventListener('load',refit);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(refit);
  if(window.ResizeObserver) new ResizeObserver(refit).observe(document.getElementById('deck'));
})();
