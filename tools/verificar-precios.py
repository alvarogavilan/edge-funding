# Auditoría de PRECIOS, paso 2: recalcula de forma independiente lo que la app enseña y lo compara con la guía real.
# Uso: python3 tools/verificar-precios.py volcado.json latest.json products.json   (sale con código 1 si hay errores)
# Comprueba: 1) cada precio = guía oficial; 2) el producto de Cardmarket tiene el nombre de la carta; 3) compra, venta,
# coste y beneficio con la fórmula; 4) lo pintado en pantalla = lo calculado y el enlace va al producto; 5) punto de mira;
# 6) chollos por verificar (precio = guía, regla del 30–50 % (V130: por debajo, proxy), fórmula y presupuesto); 7) Top 5 dentro del presupuesto.
import json,re,unicodedata,sys
t=open(sys.argv[1]).read();j=json.loads(t[:t.rindex('}')+1]);d=j['d'];cfg=d['cfg']
L=json.load(open(sys.argv[2]));f=L['fields'];T={r[0]:dict(zip(f,r)) for r in L['rows']}
P={r[0]:r for r in json.load(open(sys.argv[3]))['rows']}
def norm(s):
  s=s.split(' [')[0];s=re.sub(r'\(.*?\)',' ',s);s=unicodedata.normalize('NFD',s);s=''.join(c for c in s if not unicodedata.combining(c));return re.sub(r'[^a-z0-9]','',s.lower())
def eur(v):
  s=f"{abs(v):,.2f}".replace(',','X').replace('.',',').replace('X','.');return s
errs=[];warn=[]
def S_of(t):
  xs=[t[k] for k in ('trend','avg30','avg7') if t.get(k)];return min(xs) if xs else None
for grp in ('sure','pending'):
 for x in d[grp]:
  pid=x['pid'];g=T.get(pid)
  if not g: errs.append(('sin fila guía',x['id']));continue
  # 1. precios = guía
  for k in ('low','trend','avg1','avg7','avg30'):
    a=x['p'].get(k);b=g.get(k)
    if (a or None)!=(b or None) and not (a is None and not b): errs.append(('precio distinto',x['id'],k,a,b))
  # 2. nombre del producto
  pn=P.get(pid);
  if pn:
    if norm(x['name']) not in norm(pn[1]) and norm(pn[1]) not in norm(x['name']): (errs if grp=='sure' else warn).append(('nombre',grp,x['id'],x['name'],pn[1]))
  b=x['best']
  if not b: continue
  S=S_of(g)
  if b['k']=='low':
    exp_buy=g['low'];exp_sale=S
  elif b['k']=='po':
    exp_buy=g['low'];exp_sale=S*cfg['restLow']
  else: continue
  cost=exp_buy+cfg['buyShip'];prof=exp_sale*(1-cfg['feePct']/100)-cfg['sellShip']-cost
  for nm,a,e in (('buy',b['buy'],exp_buy),('sale',b['sale'],exp_sale),('cost',b['cost'],cost),('profit',b['profit'],prof)):
    if abs(a-e)>0.005: errs.append(('cálculo',x['id'],nm,a,e))
  if b['k']=='low' and not exp_buy>=0.75*S: errs.append(('regla buen estado: «desde» < 75 % de la venta',x['id']))
# 3. lo pintado = lo calculado
byid={x['id']:x for x in d['sure']}
for c in d['dom']:
  x=byid.get(c['id'])
  if not x: errs.append(('tarjeta pintada fuera de la lista',c['id']));continue
  b=x['best']
  if x.get('tgt'):
    # V138 · precio objetivo en inglés: máximo = min(venta·(1−comisión) − envío venta − mínimo, compra máxima) − envío compra
    t=x['tgt'];g=T.get(x['pid']);S=S_of(g) if g else None
    if S is None or abs(t['S']-S)>1e-9: errs.append(('objetivo venta',c['id']));continue
    net=S*(1-cfg['feePct']/100)-cfg['sellShip'];m=cfg.get('minMargin',25)
    mp=min(net-cfg['minProfit'],net/(1+m/100),cfg['maxBuy']);mb=int((mp-cfg['buyShip'])*100)/100  # V139: beneficio Y margen mínimos
    if abs(t['maxBuy']-mb)>0.011: errs.append(('objetivo cálculo',c['id'],t['maxBuy'],mb))
    if not t['maxBuy']>=0.6*S: errs.append(('objetivo irreal (< 60 %)',c['id']))
    if eur(t['maxBuy']) not in c['decide'] or eur(S) not in c['decide']: errs.append(('objetivo pintado',c['id'],c['decide'][:120]))
    if f"idProduct={x['pid']}" not in c['tgtHref'] or 'language=1' not in c['tgtHref']: errs.append(('objetivo enlace',c['id'],c['tgtHref']))
    continue
  for v in (b['buy'],b['sale'],b['profit']):
    if eur(v) not in c['money']: errs.append(('pintado',c['id'],v,c['money'][:120]))
  if x['pid'] and f"idProduct={x['pid']}" not in c['href']: errs.append(('enlace',c['id'],c['href']))
# 4. punto de mira
for s in d['sn']:
  g=T[s['pid']];S=S_of(g)
  # el punto de mira usa el «desde» EX o mejor (2.ª fuente, no está en la guía): se comprueban venta, fórmula y regla
  if abs(s['S']-S)>1e-9: errs.append(('mira precio de venta',s['id']))
  if abs(s['profit']-(S*(1-cfg['feePct']/100)-cfg['sellShip']-(s['low']+cfg['buyShip'])))>0.005: errs.append(('mira cálculo',s['id']))
  if not s['low']<=0.6*S: errs.append(('mira regla',s['id']))
  if not s['low']>=0.3*S: errs.append(('mira por debajo del 30 % (proxy/falsa)',s['id']))
  if not str(s['id']).startswith('jp-'): errs.append(('mira sin idioma comprobado (V131)',s['id']))
# 5. chollos por verificar: «desde» de la guía, ≤ 50 % del valor, fórmula y lo que pagas ≤ compra máxima
for s in d.get('ch',[]):
  g=T.get(s['pid'])
  if not g: errs.append(('chollo sin fila guía',s['id']));continue
  S=S_of(g)
  if abs(s['low']-g['low'])>1e-9: errs.append(('chollo precio',s['id'],s['low'],g['low']))
  if abs(s['S']-S)>1e-9: errs.append(('chollo venta',s['id']))
  if abs(s['cost']-(s['low']+cfg['buyShip']))>0.005 or abs(s['profit']-(S*(1-cfg['feePct']/100)-cfg['sellShip']-s['cost']))>0.005: errs.append(('chollo cálculo',s['id']))
  if not s['low']<=0.5*S: errs.append(('chollo regla',s['id']))
  if not s['low']>=0.3*S: errs.append(('chollo por debajo del 30 % (proxy/falsa)',s['id']))
  if not str(s['id']).startswith('jp-'): errs.append(('chollo sin idioma comprobado (solo japonesas, V131)',s['id']))
  if s['cost']>cfg['maxBuy']+1e-9: errs.append(('chollo fuera de presupuesto',s['id'],s['cost']))
# 5b. Comprar japonesas (V132): precio = «desde» de la guía para ese producto japonés, coste y enlace al mismo producto
for s in d.get('jp',[]):
  g=T.get(s['pid'])
  if not g: errs.append(('japonesa sin fila guía',s['id']));continue
  if abs(s['low']-g['low'])>1e-9: errs.append(('japonesa precio',s['id'],s['low'],g['low']))
  if abs(s['S']-S_of(g))>1e-9: errs.append(('japonesa venta',s['id']))
  if abs(s['cost']-(s['low']+cfg['buyShip']))>0.005 or abs(s['profit']-(S_of(g)*(1-cfg['feePct']/100)-cfg['sellShip']-s['cost']))>0.005: errs.append(('japonesa cálculo',s['id']))
  if f"idProduct={s['pid']}" not in s['url']: errs.append(('japonesa enlace',s['id'],s['url']))
  pn=P.get(s['pid'])
  if pn is None: warn.append(('japonesa sin nombre en products.json',s['id']))
# 6. Top 5: lo que pagas en total ≤ compra máxima
for t in d.get('top',[]):
  if not t['cost']<=cfg['maxBuy']+1e-9: errs.append(('top5 fuera de presupuesto',t))
print('Comprobadas:',len(d['sure']),'recomendadas ·',len(d['pending']),'pendientes ·',len(d['dom']),'pintadas ·',len(d['sn']),'en punto de mira ·',len(d.get('ch',[])),'chollos ·',len(d.get('jp',[])),'japonesas ·',len(d.get('top',[])),'en el Top 5')
print('ERRORES',len(errs));[print(' ',e) for e in errs[:40]]
print('AVISOS',len(warn));[print(' ',w) for w in warn[:20]]
sys.exit(1 if errs else 0)
