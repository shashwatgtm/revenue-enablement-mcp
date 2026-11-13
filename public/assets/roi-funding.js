(function(root){
 'use strict';
 function money(value,currency){
  const raw=String(value??'').trim().replace(/\\(?=\$)/g,''),mark=raw.match(/Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€/i);
  const valid=/^(?:(?:Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€)\s*)?-?\d[\d,]*(?:\.\d+)?\s*(?:lakh|crore|million|billion|thousand|k|m)?$/i.test(raw);
  const m=raw.match(/(-?\d[\d,]*(?:\.\d+)?)\s*(lakh|crore|million|billion|thousand|k|m)?/i);
  const codes={'rs':'INR','rs.':'INR','inr':'INR','₹':'INR','$':'USD','usd':'USD','£':'GBP','gbp':'GBP','€':'EUR','eur':'EUR','s$':'SGD','sgd':'SGD','aed':'AED'};
  return {value:valid&&m?Number(m[1].replace(/,/g,''))*({lakh:1e5,crore:1e7,million:1e6,billion:1e9,thousand:1e3,k:1e3,m:1e6}[m[2]?.toLowerCase()]||1):undefined,currency:mark?codes[mark[0].toLowerCase()]:(codes[String(currency||'').toLowerCase()]||''),marked:!!mark,raw};
 }
 function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function inline(s){return escape(s).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>').replace(/(?<!["(])(https:\/\/[^\s<]+)/g,'<a href="$1">Source</a>');}
 function markdown(text){
  let html='',table=false,list=false;
  const close=()=>{if(table){html+='</tbody></table></div>';table=false;}if(list){html+='</ul>';list=false;}};
  for(const line of text.split('\n')){
   if(line.startsWith('|')){if(list){html+='</ul>';list=false;}if(/^\|[ :|-]+$/.test(line))continue;const cells=line.split('|').slice(1,-1);if(!table){html+='<div class="table-scroll"><table><thead><tr>'+cells.map(c=>'<th scope="col">'+inline(c.trim())+'</th>').join('')+'</tr></thead><tbody>';table=true;}else html+='<tr>'+cells.map(c=>'<td>'+inline(c.trim())+'</td>').join('')+'</tr>';continue;}
   if(table){html+='</tbody></table></div>';table=false;}
   if(line.startsWith('- ')){if(!list){html+='<ul>';list=true;}html+='<li>'+inline(line.slice(2))+'</li>';continue;}
   if(list){html+='</ul>';list=false;}
   if(line.startsWith('### '))html+='<h3>'+inline(line.slice(4))+'</h3>';
   else if(line.trim())html+='<p>'+inline(line)+'</p>';
  }close();return html;
 }
 function parseLine(line){if(!line.trim().startsWith('helix-roi-v1;'))throw new Error('Paste a line copied from this check.');const out={};for(const bit of line.split(';').slice(1)){const at=bit.indexOf('=');if(at>0)out[bit.slice(0,at).trim()]=bit.slice(at+1).trim();}return out;}
 root.HelixFunding={money,markdown,parseLine};
 if(typeof document==='undefined')return;
 const form=document.querySelector('#funding-form');if(!form)return;
 const field=k=>form.elements.namedItem(k),status=document.querySelector('#form-status');
 function line(){
  const S=money(field('spend').value,field('currency').value);
  if(S.value===undefined)throw new Error('Give the spend as a number, for example 90 lakh.');
  const A=money(field('per_customer').value,field('currency').value);
  if(!field('unknown').checked&&field('per_customer').value&&A.value===undefined)throw new Error('Give annual revenue per customer as a number, or choose Don’t know.');
  const parts={subject:field('subject').value,spend:field('spend').value,currency:S.currency||field('currency').value};
  for(const k of ['customers','per_customer','limit_months','margin','cycle_months','win_rate','fy_start','start','geo','period','signs']){if(field('unknown').checked&&['customers','per_customer'].includes(k))continue;if(field(k)?.value.trim())parts[k]=field(k).value.trim();}
  return 'helix-roi-v1; '+Object.entries(parts).map(([k,v])=>k+'='+v.replace(/[;\r\n]/g,', ')).join('; ');
 }
 function render(output,example){
  const at=output.indexOf('### What I read'),first=output.split('\n')[0];
  document.querySelector('#verdict').textContent=first;
  document.querySelector('#result-kicker').textContent=example?'Example. Illustrative inputs.':'Your funding check';
  const top=at<0?output.slice(first.length):output.slice(first.length,at);
  document.querySelector('#summary').innerHTML=markdown(top);
  const margin=output.match(/### On gross margin\n([^\n]+)/)?.[1];
  const marginPanel=document.querySelector('#margin-summary');marginPanel.hidden=!margin;marginPanel.querySelector('h2').textContent=margin?'On gross margin: '+margin:'';
  document.querySelector('#result-details').innerHTML=markdown(at<0?'':output.slice(at));
  const routes=output.split('### Routes')[1]?.split('\n\n')[0]||'';
  const links=[...routes.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)];
  const route=links.find(m=>!m[2].includes('calendly.com'));
  const primary=document.querySelector('#related');primary.hidden=!route;if(route){primary.textContent=route[1];primary.href=route[2];}
  document.querySelector('#proof').hidden=!example;
  document.querySelector('#example-caption').hidden=!example;
 }
 field('unknown').addEventListener('change',()=>{for(const k of ['customers','per_customer'])field(k).disabled=field('unknown').checked;});
 form.addEventListener('input',()=>{const S=money(field('spend').value,field('currency').value);document.querySelector('#money-read').textContent=S.value===undefined?'Amounts stay in the currency you use.':'Read as '+(S.currency||field('currency').value)+' '+S.value.toLocaleString(S.currency==='INR'?'en-IN':'en-US')+'. No conversion.';});
 document.querySelector('#copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(line());status.textContent='Inputs copied. Keep the line and paste it back next time.';}catch(error){status.textContent=error.message;}});
 const paste=document.querySelector('#paste-dialog');document.querySelector('#paste')?.addEventListener('click',()=>paste.showModal());
 document.querySelector('#apply-paste').addEventListener('click',()=>{try{const p=parseLine(document.querySelector('#paste-text').value);for(const k of ['subject','spend','currency','customers','per_customer','limit_months','margin','cycle_months','win_rate','fy_start','start','geo','period','signs'])if(p[k]!==undefined&&field(k))field(k).value=p[k];field('unknown').checked=!p.customers||!p.per_customer;field('unknown').dispatchEvent(new Event('change'));paste.close();status.textContent='Your saved inputs are back. Check them before running.';}catch(error){document.querySelector('#paste-status').textContent=error.message;}});
 document.querySelector('#cancel-paste').addEventListener('click',()=>paste.close());
 form.addEventListener('submit',async event=>{
  event.preventDefault();const button=document.querySelector('#check');button.disabled=true;status.textContent='Checking your figures…';
  try{const known_metrics=line(),S=money(field('spend').value,field('currency').value);const response=await fetch('/api/tools/roi_business_case_builder',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({input:{your_solution:field('subject').value,solution_price:S.value,primary_value_driver:'revenue_increase',known_metrics}})});const data=await response.json();if(!response.ok||!data.text)throw new Error(data.error||'The check is unavailable. Try again.');render(data.text,false);status.textContent='Checked on your inputs.';if(matchMedia('(max-width: 700px)').matches)document.querySelector('#result-panel').scrollIntoView({behavior:'smooth',block:'start'});}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
 const example=document.querySelector('#example-output');if(example)render(JSON.parse(example.textContent),true);
})(globalThis);
