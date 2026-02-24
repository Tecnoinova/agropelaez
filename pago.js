(function(){
  const WA_NUMBER = '529932816759'; // +52 993 281 6759
  const toast = (msg)=>{
    const t = document.getElementById('pf-toast'); if(!t) return;
    t.innerHTML = '<span class="icon">✅</span><span>'+msg+'</span>';
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1500);
  };

  // Read cart from localStorage
  let cart = [];
  try{ cart = JSON.parse(localStorage.getItem('agro_cart')||'[]') || []; }catch(e){ cart = []; }
  const money = v=> new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(v||0);

  const sumEl = document.getElementById('pf-summary');
  const totalEl = document.getElementById('pf-total');
  // Sembrar inventario inicial (10 u por producto) si no existe
  (function seedInventory(){
    const INV_KEY = 'agro_inventory';
    const read = (k, def)=>{ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(def)); }catch(_){ return def; } };
    const write = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} };
    const inv = read(INV_KEY, {});
    const products = [
      'basculas',
      'corrales',
      'banos',
      'remolques',
      'prensa',
      'galeras',
      'equipos',
      'fierros',
      'remolques-ganaderos',
      'artesanias',
      'basculas-camioneras'
    ];
    let changed = false;
    products.forEach(k=>{ if (inv[k] === undefined){ inv[k] = 10; changed = true; } });
    if (changed) write(INV_KEY, inv);
  })();
  function renderSummary(){
    if(!sumEl || !totalEl) return;
    let html = '';
    let total = 0;
    cart.forEach((it)=>{
      total += (it.price||0) * (it.qty||0);
      html += '<div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:8px 10px">'
        + '<div>'+ (it.name||it.key) +'</div>'
        + '<div>x'+ (it.qty||0) +'</div>'
        + '<div class="price">'+ money(it.price||0) +'</div>'
        + '</div>';
    });
    sumEl.innerHTML = html || '<em>Carrito vacío</em>';
    totalEl.textContent = money(total);
  }
  renderSummary();

  // Stepper
  let step = 1;
  const stepNum = document.getElementById('step-num');
  const s1 = document.getElementById('step-1');
  const s2 = document.getElementById('step-2');
  const back = document.getElementById('pf-back');
  const next = document.getElementById('pf-next');
  const send = document.getElementById('pf-send');

  function renderStep(){
    // Usamos un solo paso visual; el método de pago está en el resumen
    if (s1) s1.style.display='grid';
    if (s2) s2.style.display='none';
    if (back) back.style.display='none';
    if (next) next.style.display='inline-block';
    if (send) send.style.display='none';
    if (stepNum) stepNum.textContent='1';
  }

  function validateStep1(){
    const req = ['pf-nombre','pf-email','pf-tel','pf-dir'];
    for (const id of req){ const el=document.getElementById(id); if(!el || !el.value.trim()){ toast('Completa los datos de contacto y entrega'); return false; } }
    return true;
  }

  // Toggle payment fields
  document.addEventListener('change', function(e){
    if (e.target && e.target.name === 'pago'){
      const v = e.target.value;
      document.getElementById('pay-tarjeta-fields').style.display = (v==='Tarjeta')? 'grid':'none';
      document.getElementById('pay-trans-fields').style.display = (v==='Transferencia')? 'block':'none';
      document.getElementById('pay-contra-fields').style.display = (v==='Contra entrega')? 'block':'none';
    }
  });

  if (next) next.addEventListener('click', ()=>{ if(validateStep1()){ persistStep1(); if (send) send.style.display='inline-block'; if (next) next.style.display='none'; const focusEl = document.querySelector('input[name="pago"]') || document.getElementById('pf-summary'); if (focusEl){ focusEl.scrollIntoView({behavior:'smooth', block:'center'}); } }});
  if (back) back.addEventListener('click', ()=>{ renderStep(); });
  renderStep();

  // Persist Step 1
  const PERSIST_KEY = 'agro_checkout_v1';
  function persistStep1(){
    const data = {
      nombre: (document.getElementById('pf-nombre').value||'').trim(),
      email: (document.getElementById('pf-email').value||'').trim(),
      tel: (document.getElementById('pf-tel').value||'').trim(),
      dir: (document.getElementById('pf-dir').value||'').trim(),
      rfc: (document.getElementById('pf-rfc').value||'').trim(),
      cfdi: (document.getElementById('pf-cfdi').value||'').trim(),
      razon: (document.getElementById('pf-razon').value||'').trim(),
      notas: (document.getElementById('pf-notas').value||'').trim()
    };
    try{ localStorage.setItem(PERSIST_KEY, JSON.stringify(data)); }catch(e){}
  }
  function restoreStep1(){
    try{
      const raw = localStorage.getItem(PERSIST_KEY); if(!raw) return;
      const d = JSON.parse(raw)||{};
      const set=(id,v)=>{ const el=document.getElementById(id); if(el && v){ el.value=v; } };
      set('pf-nombre', d.nombre); set('pf-email', d.email); set('pf-tel', d.tel);
      set('pf-dir', d.dir); set('pf-rfc', d.rfc); set('pf-cfdi', d.cfdi);
      set('pf-razon', d.razon); set('pf-notas', d.notas);
    }catch(e){}
  }
  restoreStep1();

  // Submit -> WhatsApp fallback
  const form = document.getElementById('pay-form');
  if (form) form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!cart.length){ toast('Carrito vacío'); return; }
    persistStep1();
    const nombre = (document.getElementById('pf-nombre').value||'').trim();
    const email = (document.getElementById('pf-email').value||'').trim();
    const tel = (document.getElementById('pf-tel').value||'').trim();
    const dir = (document.getElementById('pf-dir').value||'').trim();
    const rfc = (document.getElementById('pf-rfc').value||'').trim();
    const razon = (document.getElementById('pf-razon').value||'').trim();
    const cfdi = (document.getElementById('pf-cfdi').value||'').trim();
    const pago = (document.querySelector('input[name="pago"]:checked')?.value||'Tarjeta');
    const notas = (document.getElementById('pf-notas').value||'').trim();
    // Validaciones básicas
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const telOk = /\d{10,}/.test(tel.replace(/\D/g,''));
    if (!emailOk){ toast('Correo electrónico no válido'); return; }
    if (!telOk){ toast('Teléfono inválido (10 dígitos)'); return; }
    if (pago === 'Tarjeta'){
      const num = (document.getElementById('card-number')?.value||'').replace(/\s+/g,'');
      const nm = (document.getElementById('card-name')?.value||'').trim();
      const exp = (document.getElementById('card-exp')?.value||'').trim();
      const cvv = (document.getElementById('card-cvv')?.value||'').trim();
      const luhn = (s)=>{ let sum=0, alt=false; for(let i=s.length-1;i>=0;i--){ let n=+s[i]; if(alt){ n*=2; if(n>9) n-=9;} sum+=n; alt=!alt;} return sum%10===0; };
      const expOk = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp);
      const cvvOk = /^\d{3,4}$/.test(cvv);
      if (!(num.length>=13 && num.length<=19 && luhn(num))){ toast('Tarjeta no válida'); return; }
      if (!nm){ toast('Nombre en la tarjeta requerido'); return; }
      if (!expOk){ toast('MM/AA inválido'); return; }
      if (!cvvOk){ toast('CVV inválido'); return; }
    }
    const detalle = cart.map(it=>`${it.name||it.key} x${it.qty} ${money(it.price)}`).join('%0A');
    const total = document.getElementById('pf-total').textContent;
    const header = 'Solicitud de pago · Agroequipos Pelaez';
    const cliente = `Cliente: ${nombre}%0AEmail: ${email}%0ATeléfono: ${tel}%0ADirección: ${dir}`;
    const fiscal = `RFC: ${rfc}%0ARazón/Domicilio: ${razon}%0AUso CFDI: ${cfdi}%0AForma/Método: ${pago}`;
    const cuerpo = `${header}%0A%0A${cliente}%0A${fiscal}%0A%0AProductos:%0A${detalle}%0A%0ATotal: ${encodeURIComponent(total)}%0A%0ANotas:%0A${encodeURIComponent(notas)}`;
    const wa = `https://wa.me/${WA_NUMBER}?text=${cuerpo}`;
    window.open(wa, '_blank');

    // Persistencia: ventas, inventario y envíos (dashboard)
    const ORDERS_KEY = 'agro_orders';
    const INV_KEY = 'agro_inventory';
    const SHIP_KEY = 'agro_shipments';
    const read = (k, def)=>{ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(def)); }catch(_){ return def; } };
    const write = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} };

    // Construir pedido
    const orderId = 'ORD-' + Date.now();
    const items = cart.map(it=>({ key: it.key, name: it.name||it.key, qty: it.qty||1, price: it.price||0 }));
    const totalNum = Number(String(total).replace(/[^0-9.]/g,''))||0;
    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pagado',
      payment_method: pago,
      customer: { nombre, email, tel, dir, rfc, razon, cfdi },
      items,
      total: totalNum
    };
    const orders = read(ORDERS_KEY, []);
    orders.unshift(order);
    write(ORDERS_KEY, orders);

    // Inventario: decrementar por item (inicializar si no existe)
    const inv = read(INV_KEY, {});
    items.forEach(it=>{
      const k = it.key || it.name;
      const cur = Number(inv[k]||0);
      inv[k] = Math.max(0, (cur||100) - (it.qty||1)); // si no existe, asumir 100 y restar
    });
    write(INV_KEY, inv);

    // Envíos: crear registro pendiente
    const ships = read(SHIP_KEY, []);
    ships.unshift({ id: 'SHP-'+Date.now(), orderId, status: 'pendiente', items: items.length, createdAt: new Date().toISOString() });
    write(SHIP_KEY, ships);

    // Limpiar carrito para próxima sesión
    try{ localStorage.removeItem('agro_cart'); }catch(_){ }

    setTimeout(()=>{ window.location.href = 'pago-exitoso.html'; }, 300);
  });
})();
