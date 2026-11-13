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
 // Presentation only: every amount and count below is taken from the server answer.
 function resultView(raw){
  const output=raw.replace(/say so in Your solution/g,'say so in What do you want to fund');
  const lines=output.split('\n'),first=lines[0].replace(/^#{1,6}\s*/,'');
  const invalid=/^Check your figures/.test(first),outside=/outside this tool.s scope/.test(first);
  const brand=first==='Not a payback decision',purchase=/^Break-even only/.test(first),undecided=/^Not decided yet|^A spend of 0/.test(first),noVerdict=brand||purchase||undecided;
  const at=output.indexOf('### What I read');
  let summary=at<0?output.slice(lines[0].length):output.slice(lines[0].length,at),next='',question='';
  const inputMissing=label=>new RegExp('^- '+label+': MISSING','m').test(output);
  if(noVerdict){
   const required=lines.filter(l=>/^Required (?:new ARR|annual revenue) at |^Required new customers:|^For scale only:/.test(l));
   let reason=brand?'Hold an amount for a year and track the signs you pick. A quarter cannot establish payback.':purchase?'This is a software or data purchase. Break-even is what the purchase would need to cover; it is not a funding verdict.':'Add the expected new customers and what one pays a year to check your payback limit.';
   if(/^A spend of 0/.test(first))reason='There is no spend to recover. Give a programme cost to check payback.';
   const mixed=lines.find(l=>l.startsWith('Read as '));if(mixed)reason=mixed;
   if(brand){next=!/Period held: (?!MISSING)/.test(output)?'period':'signs';question=next==='period'?'Add the period you can hold this amount':'Add the signs and their values today';}
   else if(inputMissing('Spend')||/^A spend of 0/.test(first)){next='spend';question='Add the programme spend';}
   else if(inputMissing('What one pays a year')){next='per_customer';question='Add annual revenue per customer';}
   else if(inputMissing('Expected new customers')){next='customers';question='Add expected new customers';}
   else if(purchase){next='subject';question='Clarify the programme behind the purchase';}
   else {next='subject';question='Confirm this is your own marketing spend';}
   summary=reason+'\n\n'+required.join('\n');
  }
  const margin=output.match(/### On gross margin\n([^\n]+)/)?.[1]||'';
  let headline=first,note='';
  const ruleAt=headline.indexOf(" (this tool's rule, not a benchmark)");
  if(ruleAt>=0){headline=headline.slice(0,ruleAt)+'.';note="The default limit is this tool's rule, not a benchmark. Give your finance team's limit to change it.";}
  return {headline,note,summaryHTML:markdown(invalid?'Check the named field and run the check again.':summary),detailsHTML:markdown(invalid?'':at<0?'':output.slice(at)),margin:invalid?'':margin,next,question,brand,noVerdict,invalid,outside,output};
 }
 root.HelixFunding={money,markdown,parseLine,resultView};
 if(typeof document==='undefined')return;
 const form=document.querySelector('#funding-form');if(!form)return;
 const field=k=>form.elements.namedItem(k),status=document.querySelector('#form-status');
 const numeric=['customers','limit_months','margin','cycle_months','win_rate','fy_start'];
 const labels={subject:'Programme and location',spend:'Spend',currency:'Currency',customers:'New customers',per_customer:'Annual revenue per customer',limit_months:'Payback limit',margin:'Gross margin',cycle_months:'Sales cycle',win_rate:'Win rate',fy_start:'Financial year start month',start:'Spend start month'};
 function clearErrors(){form.querySelectorAll('.field-error').forEach(e=>e.textContent='');form.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));}
 function fieldError(key,message){const input=field(key);if(!input)return;input.setAttribute('aria-invalid','true');if(!document.querySelector('#error-'+key)){const e=document.createElement('p');e.id='error-'+key;e.className='field-error';input.after(e);input.setAttribute('aria-describedby',e.id);}document.querySelector('#error-'+key).textContent=message;}
 function validation(){
  clearErrors();const errors=[];
  if(!field('subject').value.trim())errors.push(['subject','Say what you want to fund, and where.']);
  for(const key of ['spend','per_customer']){if(field('unknown').checked&&key==='per_customer')continue;const raw=field(key).value.trim();if(!raw&&key==='per_customer')continue;const parsed=money(raw,field('currency').value);if(parsed.value===undefined)errors.push([key,key==='spend'?'Spend must be a number, such as 90 lakh.':'Annual revenue per customer must be a number, such as 30 lakh.']);else if(parsed.value<0)errors.push([key,labels[key]+' cannot be negative.']);}
  const spend=money(field('spend').value,field('currency').value);if(spend.value!==undefined&&!spend.currency)errors.push(['currency','Choose the currency for these figures.']);
  for(const key of numeric){if(field(key).disabled||!field(key).value.trim())continue;const raw=field(key).value.replace(/,/g,'').trim();if(!/^-?\d+(?:\.\d+)?$/.test(raw))errors.push([key,'Write the number, such as 5.']);else {const n=Number(raw);if(n<0)errors.push([key,labels[key]+' cannot be negative.']);else if(['margin','win_rate'].includes(key)&&(n===0||n>100))errors.push([key,labels[key]+' must be above 0 and at most 100 percent.']);else if(key==='limit_months'&&(n<1||n>60))errors.push([key,'Payback limit must be from 1 to 60 months.']);else if(key==='cycle_months'&&n>36)errors.push([key,'Sales cycle cannot exceed 36 months.']);}}
  for(const [key,message]of errors)fieldError(key,message);return errors;
 }
 function line(){
  const errors=validation();if(errors.length){const error=new Error(errors[0][1]);error.field=errors[0][0];throw error;}
  const S=money(field('spend').value,field('currency').value),parts={subject:field('subject').value.trim(),spend:field('spend').value.trim(),currency:S.currency};
  for(const k of ['customers','per_customer','limit_months','margin','cycle_months','win_rate','fy_start','start','geo','period','signs']){if(field('unknown').checked&&['customers','per_customer'].includes(k))continue;if(field(k)?.value.trim())parts[k]=numeric.includes(k)?String(Number(field(k).value.replace(/,/g,''))):field(k).value.trim();}
  return 'helix-roi-v1; '+Object.entries(parts).map(([k,v])=>k+'='+v.replace(/[;\r\n]/g,', ')).join('; ');
 }
 function focusField(key){if(['customers','per_customer'].includes(key)){field('unknown').checked=false;for(const k of ['customers','per_customer'])field(k).disabled=false;}if(field(key)?.closest('details'))field(key).closest('details').open=true;field(key)?.focus({preventScroll:true});field(key)?.scrollIntoView({behavior:'smooth',block:'center'});}
 function showError(message,key){
  document.querySelector('#verdict').textContent=message;document.querySelector('#result-kicker').textContent='Check your figures';document.querySelector('#summary').innerHTML='<p>Correct the named field and run the check again.</p>';
  for(const id of ['margin-summary','proof','example-caption','result-actions','next-input','example-more','use-own'])document.querySelector('#'+id).hidden=true;
  document.querySelector('#result-panel').classList.remove('example');document.querySelector('#result-details').textContent='';document.querySelector('#limit-note').textContent='';
  status.textContent=message;if(key){fieldError(key,message);focusField(key);}else document.querySelector('#verdict').focus();
 }
 function render(output,example){
  const view=resultView(output),panel=document.querySelector('#result-panel');panel.classList.toggle('example',example);
  document.querySelector('#verdict').textContent=view.headline;document.querySelector('#limit-note').textContent=view.note;
  document.querySelector('#result-kicker').textContent=example?'Example. Illustrative inputs.':view.invalid?'Check your figures':'Your funding check';
  document.querySelector('#summary').innerHTML=view.summaryHTML;document.querySelector('#result-details').innerHTML=view.detailsHTML;
  const marginPanel=document.querySelector('#margin-summary');marginPanel.hidden=!view.margin;marginPanel.querySelector('h2').textContent=view.margin?'On gross margin: '+view.margin:'';
  const routes=view.output.split('### Routes')[1]?.split('\n\n')[0]||'',links=[...routes.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)],route=links.find(m=>!m[2].includes('calendly.com'));
  const primary=document.querySelector('#related');primary.hidden=!route;if(route){primary.textContent=route[1];primary.href=route[2];}
  document.querySelector('#result-actions').hidden=view.invalid||view.outside;
  document.querySelector('#proof').hidden=!example;document.querySelector('#example-caption').hidden=!example;
  const more=document.querySelector('#example-more');more.hidden=!example&&!view.margin;more.open=!example||!matchMedia('(max-width: 700px)').matches;
  const next=document.querySelector('#next-input');next.hidden=!view.next||view.invalid;next.textContent=view.question;next.dataset.field=view.next;
  document.querySelector('#use-own').hidden=!example;
  if(view.brand)form.querySelector('details').open=true;
  if(view.invalid){const key=Object.keys(labels).find(k=>view.headline.toLowerCase().includes(labels[k].toLowerCase()));if(key)fieldError(key,view.headline);}
  if(!example){document.querySelector('#verdict').focus({preventScroll:true});if(matchMedia('(max-width: 700px)').matches)panel.scrollIntoView({behavior:'smooth',block:'start'});}
 }
 document.querySelector('#next-input').addEventListener('click',e=>focusField(e.currentTarget.dataset.field));
 document.querySelector('#use-own').addEventListener('click',()=>focusField('subject'));
 field('unknown').addEventListener('change',()=>{for(const k of ['customers','per_customer']){if(field('unknown').checked)field(k).value='';field(k).disabled=field('unknown').checked;}});
 form.addEventListener('input',()=>{const S=money(field('spend').value,field('currency').value);document.querySelector('#money-read').textContent=S.value===undefined?'Amounts stay in the currency you use.':'Read as '+(S.currency||'the currency selected')+' '+S.value.toLocaleString(S.currency==='INR'?'en-IN':'en-US')+'. No conversion.';});
 document.querySelector('#copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(line());status.textContent='Inputs copied. Keep the line and paste it back next time.';}catch(error){showError(error.message,error.field);}});
 const paste=document.querySelector('#paste-dialog');document.querySelector('#paste')?.addEventListener('click',()=>paste.showModal());
 document.querySelector('#apply-paste').addEventListener('click',()=>{try{const p=parseLine(document.querySelector('#paste-text').value);for(const k of ['subject','spend','currency','customers','per_customer','limit_months','margin','cycle_months','win_rate','fy_start','start','geo','period','signs'])if(field(k))field(k).value=p[k]??'';field('unknown').checked=!p.customers&&!p.per_customer;for(const k of ['customers','per_customer'])field(k).disabled=field('unknown').checked;clearErrors();paste.close();status.textContent='Your saved inputs are back. Check them before running.';}catch(error){document.querySelector('#paste-status').textContent=error.message;}});
 document.querySelector('#cancel-paste').addEventListener('click',()=>paste.close());
 function apiError(data){const raw=data.errors?.[0]||data.error||'The check could not complete.';const key=Object.keys(labels).find(k=>raw.includes(k)||raw.includes(({spend:'solution_price',subject:'your_solution'})[k]||'@none'));let message=raw;if(key){message=raw.replace(/solution_price|your_solution|per_customer|limit_months|cycle_months|win_rate|fy_start|known_metrics/g,m=>({solution_price:'Spend',your_solution:'Programme and location',known_metrics:'Programme figures'})[m]||labels[m]||'Figure').replace(/must be 0 or more\.?/,'cannot be negative.');}return {message,key};}
 form.noValidate=true;
 form.addEventListener('submit',async event=>{
  event.preventDefault();const button=document.querySelector('#check');button.disabled=true;
  try{const known_metrics=line(),S=money(field('spend').value,field('currency').value);status.textContent='Checking your figures…';let response;try{response=await fetch('/api/tools/roi_business_case_builder',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({input:{your_solution:field('subject').value,solution_price:S.value,primary_value_driver:'revenue_increase',known_metrics}})});}catch{throw new Error('The check did not answer. Try again.');}
   let data;try{data=await response.json();}catch{throw new Error('The check did not answer. Try again.');}
   if(!response.ok){const problem=apiError(data);const error=new Error(problem.message);error.field=problem.key;throw error;}
   if(!data.text)throw new Error('The check did not answer. Try again.');render(data.text,false);status.textContent=/^Check your figures/.test(data.text)?'Correct the named figure.':'Checked on your inputs.';
  }catch(error){showError(error.message,error.field);}finally{button.disabled=false;}
 });
 const example=document.querySelector('#example-output');if(example)render(JSON.parse(example.textContent),true);
})(globalThis);
