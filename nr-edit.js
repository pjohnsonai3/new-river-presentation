(function(){
  const TXT='h1,h2,h3,.eb,.lead,.small,.words li,.seq,.nlist b,.nlist span,figcaption b,figcaption span,figcaption,.team b,.team span,.team h3,.clients li,.nums b,.nums span,.recog li,.cols3 h3,.cols3 p,.gfoot,.gr .l,.gr .d,.drc b,.drc span,.ph b,.ph span,.ph em,.months span,.mk,.cw,.credit,.pstory p';
  const DB='nr-edit', ST='slides';
  const idb=()=>new Promise((res,rej)=>{ const r=indexedDB.open(DB,1); r.onupgradeneeded=()=>r.result.createObjectStore(ST); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
  const tx=(mode,fn)=>idb().then(db=>new Promise((res,rej)=>{ const t=db.transaction(ST,mode); const out=fn(t.objectStore(ST)); t.oncomplete=()=>res(out&&out.result); t.onerror=()=>rej(t.error); }));
  const getAll=()=>idb().then(db=>new Promise(res=>{ const o={}; const c=db.transaction(ST).objectStore(ST).openCursor(); c.onsuccess=()=>{ const k=c.result; if(k){ o[k.key]=k.value; k.continue(); } else res(o); }; c.onerror=()=>res(o); })).catch(()=>({}));
  const slides=()=>[...document.querySelectorAll('.slide')];

  function clean(slide){
    const c=slide.cloneNode(true);
    c.querySelectorAll('.fitw').forEach(w=>{ while(w.firstChild) w.parentNode.insertBefore(w.firstChild,w); w.remove(); });
    c.querySelectorAll('[contenteditable]').forEach(e=>e.removeAttribute('contenteditable'));
    c.querySelectorAll('.ed-hot').forEach(e=>e.classList.remove('ed-hot'));
    c.querySelectorAll('img[src]').forEach(im=>{ im.dataset.src=im.getAttribute('src'); im.removeAttribute('src'); });
    return c.innerHTML;
  }

  function boot(){
    const s=document.createElement('script'); s.src='newriver/nr.js'; s.onload=initUI; document.body.appendChild(s);
  }
  getAll().then(saved=>{
    slides().forEach(sl=>{ const k=sl.dataset.screenLabel; if(saved[k]!=null) sl.innerHTML=saved[k]; });
    boot();
  });

  function initUI(){
    const bar=document.createElement('div'); bar.className='chrome edbar';
    bar.innerHTML='<button type="button" class="ed-ct"></button><button type="button" class="ed-th"></button><button type="button" class="ed-go">Edit</button><span class="ed-tools"><span class="ed-st">Editing</span><button type="button" class="ed-dl">Download</button><button type="button" class="ed-rs">Reset slide</button><button type="button" class="ed-done">Done</button></span>';
    document.body.appendChild(bar);
    const pick=document.createElement('input'); pick.type='file'; pick.accept='image/*'; pick.hidden=true; document.body.appendChild(pick);
    const st=bar.querySelector('.ed-st');
    const THEMES=[['linen','Linen'],['white','Gallery white'],['stone','Stone'],['charcoal','Charcoal']];
    const thb=bar.querySelector('.ed-th');
    let ti=3; try{ const k=THEMES.findIndex(t=>t[0]===localStorage.getItem('nr-paper')); if(k>=0) ti=k; }catch(e){}
    function applyTheme(){ const t=THEMES[ti]; document.documentElement.dataset.pt=t[0]; thb.textContent='Pages: '+t[1]; try{ localStorage.setItem('nr-paper',t[0]); }catch(e){} }
    thb.addEventListener('click',()=>{ ti=(ti+1)%THEMES.length; applyTheme(); });
    applyTheme();
    const CT=[['ink','Ink'],['charcoal','Charcoal'],['stone','Stone'],['linen','Linen'],['white','White']];
    const ctb=bar.querySelector('.ed-ct');
    let ci=0; try{ const k=CT.findIndex(t=>t[0]===localStorage.getItem('nr-collage')); if(k>=0) ci=k; }catch(e){}
    function applyCt(){ const t=CT[ci]; document.documentElement.dataset.ct=t[0]; ctb.textContent='Collage: '+t[1]; try{ localStorage.setItem('nr-collage',t[0]); }catch(e){} }
    ctb.addEventListener('click',()=>{ ci=(ci+1)%CT.length; applyCt(); });
    applyCt();
    let on=false, dirty=new Set(), t=null, target=null;
    const cur=()=>document.querySelector('.slide.on');

    function status(x){ st.textContent=x; }
    function queue(sl){ if(!sl) return; dirty.add(sl); status('Saving…'); clearTimeout(t); t=setTimeout(flush,700); }
    function flush(){ const list=[...dirty]; dirty.clear();
      tx('readwrite',s=>{ list.forEach(sl=>s.put(clean(sl),sl.dataset.screenLabel)); }).then(()=>status('Saved')).catch(e=>status('Save failed — image too large?')); }

    function setOn(v){
      on=v; document.body.classList.toggle('editing',on);
      slides().forEach(sl=>sl.querySelectorAll(TXT).forEach(el=>{
        if(el.querySelector(TXT)) return;           // only leaf text blocks
        if(on) el.setAttribute('contenteditable','true'); else el.removeAttribute('contenteditable'); }));
      if(on) status('Editing'); else if(dirty.size) flush();
    }
    bar.querySelector('.ed-go').addEventListener('click',()=>setOn(true));
    bar.querySelector('.ed-done').addEventListener('click',()=>{ document.activeElement&&document.activeElement.blur(); setOn(false); });

    document.addEventListener('input',e=>{ if(!on) return; const el=e.target.closest('[contenteditable]'); if(!el) return;
      const sl=el.closest('.slide');
      if(el.matches('.wcap .eb')){ const f=sl.querySelector('.gimg.on'); if(f) f.dataset.label=el.textContent; }
      queue(sl); });
    document.addEventListener('keydown',e=>{ if(on&&e.key==='Escape'){ document.activeElement.blur(); } },true);

    /* images: click to choose a file, or drop one on it */
    function imgAt(e){ if(!on) return null; const im=e.target.closest&&e.target.closest('.slide img'); if(im) return im;
      const sl=cur(); const g=e.target.closest&&e.target.closest('.s-work'); return g?sl.querySelector('.gimg.on img'):null; }
    function place(im,file){ if(!file||!/^image\//.test(file.type)) return;
      const r=new FileReader(); r.onload=()=>{ const src=new Image(); src.onload=()=>{
        const k=Math.min(1,2400/Math.max(src.width,src.height)); const c=document.createElement('canvas');
        c.width=Math.round(src.width*k); c.height=Math.round(src.height*k); c.getContext('2d').drawImage(src,0,0,c.width,c.height);
        im.src=c.toDataURL('image/jpeg',.86); im.removeAttribute('data-src'); queue(im.closest('.slide')); }; src.src=r.result; }; r.readAsDataURL(file); }
    document.addEventListener('click',e=>{ if(!on) return; if(e.target.closest('[contenteditable],.edbar,.pnav,.topbar')) return;
      const im=imgAt(e); if(im){ e.preventDefault(); e.stopPropagation(); target=im; pick.value=''; pick.click(); } },true);
    pick.addEventListener('change',()=>{ if(target&&pick.files[0]) place(target,pick.files[0]); });
    let hot=null;
    document.addEventListener('dragover',e=>{ if(!on) return; const im=imgAt(e); e.preventDefault();
      const box=im&&(im.closest('.im,.media,.gimg,.collage')&&im.parentElement||im);
      if(hot!==box){ hot&&hot.classList.remove('ed-hot'); hot=box; hot&&hot.classList.add('ed-hot'); } });
    document.addEventListener('dragleave',e=>{ if(e.target===document.documentElement&&hot){ hot.classList.remove('ed-hot'); hot=null; } });
    document.addEventListener('drop',e=>{ if(!on) return; e.preventDefault(); hot&&hot.classList.remove('ed-hot'); hot=null;
      const im=imgAt(e); if(im) place(im,e.dataTransfer.files[0]); });

    bar.querySelector('.ed-rs').addEventListener('click',()=>{ const sl=cur(); if(!sl) return;
      if(!confirm('Reset this slide to the original text and images?')) return;
      tx('readwrite',s=>s.delete(sl.dataset.screenLabel)).then(()=>location.reload()); });

    bar.querySelector('.ed-dl').addEventListener('click',()=>{ if(dirty.size) flush();
      const d=document.documentElement.cloneNode(true);
      const live=slides(); [...d.querySelectorAll('.slide')].forEach((s,i)=>{ s.innerHTML=clean(live[i]); s.classList.remove('on'); });
      d.querySelectorAll('.edbar,input[type=file],script[src$="nr.js"],link[href*="fonts.googleapis.com/css2?family="]:not([href*="Jost"])').forEach(n=>n.remove());
      ['chaps','count','roCh','roT','pLab'].forEach(id=>{ const n=d.querySelector('#'+id); if(n) n.innerHTML=''; });
      const b=d.querySelector('body'); b.className=''; d.removeAttribute('style');
      const html='<!DOCTYPE html>\n'+d.outerHTML;
      const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
      a.download='New River Presentation (edited).html'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); });
  }
})();
