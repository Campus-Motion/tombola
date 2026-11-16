export function parseCSV(text) {
  const rows=[]; let row=[],field='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++) { const c=text[i];
    if(c==='"') { if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted; }
    else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted)throw Error('Le fichier CSV contient une cellule non terminée.');
  if(field||row.length){row.push(field);rows.push(row);}
  return rows;
}
export function participantsFromCSV(text) {
 const rows=parseCSV(text),h=rows.shift();
 if(!h||h[0]!=='Nom'||h[1]!=='Prénom'||h[6]!=='Nbr tckets') throw Error('Colonnes attendues : Nom (A), Prénom (B), Nbr tckets (G). Exportez l’onglet Participations en CSV.');
 const people=[],issues=[];let zero=0;
 rows.forEach((r,i)=>{const name=[r[1],r[0]].map(x=>(x||'').trim()).filter(Boolean).join(' '), raw=(r[6]||'').trim();
   if(!name){if(raw&&raw!=='0')issues.push(`Ligne ${i+2} : tickets sans nom.`);return;}
   const tickets=Number(raw);
   if(!raw||!Number.isSafeInteger(tickets)||tickets<0){issues.push(`Ligne ${i+2} : nombre de tickets invalide pour ${name}.`);return;}
   if(!tickets){zero++;return;}
   people.push({name,tickets,row:i+2});
 });
 const occurrences=new Map();
 for(const p of people){const name=p.name.normalize('NFC').toLocaleLowerCase('fr').replace(/\s+/g,' ');const ordinal=(occurrences.get(name)||0)+1;occurrences.set(name,ordinal);p.id=JSON.stringify([name,ordinal]);}
 const total=people.reduce((s,p)=>s+p.tickets,0);
 if(!Number.isSafeInteger(total)||total>4294967296)issues.push('Le total des tickets dépasse la limite du tirage.');
 return {people,total,issues,zero};
}
export function randomTicket(total, random=()=>crypto.getRandomValues(new Uint32Array(1))[0]) {
 if(!Number.isInteger(total)||total<1||total>4294967296)throw Error('Total invalide.');
 const limit=Math.floor(4294967296/total)*total;let n;do{n=random();}while(n>=limit);return n%total;
}
export function selectWinner(people,ticket){for(const p of people){if(ticket<p.tickets)return p;ticket-=p.tickets;}throw Error('Ticket hors limites.');}
export function withoutWinners(source,excluded){const people=source.people.filter(p=>!excluded.has(p.id));return {...source,people,total:people.reduce((sum,p)=>sum+p.tickets,0)};}
