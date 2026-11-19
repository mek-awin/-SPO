const C=["#35d39a","#5c9dff","#a78bfa"];
const defaults={budget:100000,limit:15,stocks:[["Stock A",12,18],["Stock B",9,12],["Stock C",7,8]]};
const $=id=>document.getElementById(id);
function read(){
 const budget=Number($("budget").value),limit=Number($("riskLimit").value);
 const stocks=["A","B","C"].map(k=>({name:$("name"+k).value.trim()||"Stock "+k,ret:Number($("return"+k).value),risk:Number($("risk"+k).value)}));
 if(!Number.isFinite(budget)||budget<=0)throw Error("กรุณากรอกเงินลงทุนให้มากกว่า 0 บาท");
 if(!Number.isFinite(limit)||limit<0||limit>100)throw Error("ความเสี่ยงสูงสุดต้องอยู่ระหว่าง 0–100%");
 for(const s of stocks){if(!Number.isFinite(s.ret)||!Number.isFinite(s.risk))throw Error("กรุณากรอกข้อมูลหุ้นให้ครบ");if(s.risk<0)throw Error("ความเสี่ยงต้องไม่ติดลบ");}
 return {budget,limit,stocks};
}
function portfolio(stocks,w){
 const ret=stocks.reduce((a,s,i)=>a+w[i]*s.ret,0);
 const risk=Math.sqrt(stocks.reduce((a,s,i)=>a+(w[i]*s.risk)**2,0));
 return {ret,risk,w};
}
function optimize(stocks,limit){
 let best=null;
 for(let a=0;a<=100;a++)for(let b=0;b<=100-a;b++){
  const candidate=portfolio(stocks,[a/100,b/100,(100-a-b)/100]);
  if(candidate.risk<=limit+1e-10&&(!best||candidate.ret>best.ret+1e-10||(Math.abs(candidate.ret-best.ret)<1e-10&&candidate.risk<best.risk)))best=candidate;
 }
 return best;
}
const pct=n=>Number(n).toFixed(2)+"%";
const baht=n=>new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:0}).format(n);
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function message(t,ok=false){$("message").textContent=t;$("message").style.color=ok?"#35d39a":"#fb7185";}
function render(r,x){
 $("metricBudget").textContent=baht(x.budget);$("metricLimit").textContent=pct(x.limit);
 if(!r){$("metricReturn").textContent="—";$("metricRisk").textContent="—";$("analysisReturn").textContent="—";$("analysisRisk").textContent="—";$("analysisStatus").textContent="ไม่พบพอร์ต";$("analysisStatus").style.color="#fb7185";$("analysisStatusText").textContent="ไม่มีสัดส่วนใดผ่านเงื่อนไขความเสี่ยง";$("donut").style.background="#27364a";$("donutTotal").textContent="—";$("legend").textContent="ไม่พบสัดส่วนที่ผ่านเงื่อนไข";$("allocationList").textContent="ลองเพิ่มระดับความเสี่ยงสูงสุด หรือปรับข้อมูลหุ้น";$("resultNote").textContent="ไม่มีพอร์ตที่มีความเสี่ยงไม่เกินค่าที่กำหนด";return;}
 $("metricReturn").textContent=pct(r.ret);$("metricRisk").textContent=pct(r.risk);$("analysisReturn").textContent=pct(r.ret);$("analysisRisk").textContent=pct(r.risk);$("analysisStatus").textContent="ผ่านเงื่อนไข";$("analysisStatus").style.color="#35d39a";$("analysisStatusText").textContent="ความเสี่ยงไม่เกินระดับสูงสุดที่กำหนด";
 let pos=0;const slices=r.w.map((w,i)=>{const start=pos;pos+=w*100;return `${C[i]} ${start}% ${pos}%`;}).join(",");
 $("donut").style.background=`conic-gradient(${slices})`;$("donutTotal").textContent="100%";
 $("legend").innerHTML=x.stocks.map((s,i)=>`<div class="legend-row"><span class="key" style="background:${C[i]}"></span><span>${safe(s.name)}</span><strong>${pct(r.w[i]*100)}</strong></div>`).join("");
 $("allocationList").innerHTML=x.stocks.map((s,i)=>{const w=r.w[i]*100;return `<div class="allocation-row"><span>${safe(s.name)}</span><div class="track"><div class="fill" style="width:${w}%;background:${C[i]}"></div></div><strong>${baht(x.budget*r.w[i])}</strong></div>`}).join("");
 $("resultNote").textContent=`ผลตอบแทนคาดหวัง ${pct(r.ret)} ความเสี่ยง ${pct(r.risk)} ไม่เกินเพดาน ${pct(x.limit)} โดยค้นหาสัดส่วนทีละ 1%`;
}
function calculate(){try{const x=read(),r=optimize(x.stocks,x.limit);render(r,x);message(r?"คำนวณเรียบร้อยแล้ว พบสัดส่วนที่ผ่านเงื่อนไข":"ไม่พบสัดส่วนที่ผ่านเงื่อนไข ลองเพิ่มความเสี่ยงสูงสุด",!!r);}catch(e){message(e.message);}}
function load(){ $("budget").value=defaults.budget;$("riskLimit").value=defaults.limit;["A","B","C"].forEach((k,i)=>{const s=defaults.stocks[i];$("name"+k).value=s[0];$("return"+k).value=s[1];$("risk"+k).value=s[2];});calculate();}
function resetToZero(){
 $("budget").value=0;$("riskLimit").value=0;
 ["A","B","C"].forEach(k=>{$("name"+k).value="Stock "+k;$("return"+k).value=0;$("risk"+k).value=0;});
 $("metricBudget").textContent=baht(0);$("metricLimit").textContent="0.00%";
 $("metricReturn").textContent="—";$("metricRisk").textContent="—";
 $("analysisReturn").textContent="—";$("analysisRisk").textContent="—";
 $("analysisStatus").textContent="รอคำนวณ";$("analysisStatus").style.color="#fbbf24";
 $("analysisStatusText").textContent="กรอกข้อมูลแล้วกดคำนวณ";
 $("donut").style.background="#27364a";$("donutTotal").textContent="0%";
 $("legend").textContent="ยังไม่มีผลการคำนวณ";$("allocationList").textContent="ยังไม่มีผลการคำนวณ";
 $("resultNote").textContent="กรอกข้อมูลการลงทุนเพื่อเริ่มคำนวณ";
 message("รีเซ็ตข้อมูลทั้งหมดเป็น 0 แล้ว",true);
}
$("calculateBtn").addEventListener("click",calculate);
$("sampleBtn").addEventListener("click",load);
$("resetBtn").addEventListener("click",resetToZero);
load();