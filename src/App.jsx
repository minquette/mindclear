import { useState, useEffect, useRef, useCallback } from "react";

const PRESET_TAGS = ["Work","Home","Personal","Health","Finance","Shopping","Errands","Social","Urgent"];
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const RECURRENCE = ["None","Daily","Weekly","Fortnightly","Monthly"];
const STICKER_EMOJIS = ["⭐","🌟","✅","💜","🌸","🔥","🏆","🌈","💎","🦋","🌻","❤️","🍀","🎯","🧘","💪","🐝","🌙"];
const TAG_COLORS = {
  Work:"#4a9e6a",Home:"#d4813a",Personal:"#9b6fce",Health:"#c05a5a",
  Finance:"#b09040",Shopping:"#4a8ab0",Errands:"#8a9a4a",Social:"#c06a9a",Urgent:"#d04040"
};
const getTagColor = t => TAG_COLORS[t] || "#6a9a8a";

const fmtDate = iso => { if(!iso)return""; const[,m,d]=iso.split("-"); return`${d}/${m}`; };
const fmtDateTime = iso => {
  if(!iso)return"";
  const dt=new Date(iso);
  return`${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
};

const SHOP_TIERS = [
  { tier:"Starter", color:"#4a9e6a", items:[
    {id:"smoke",    label:"Chimney smoke",  cost:8,   emoji:"💨", desc:"A warm fire crackles inside"},
    {id:"cat",      label:"Window cat",     cost:12,  emoji:"🐱", desc:"A sleepy cat on the sill"},
    {id:"doormat",  label:"Welcome mat",    cost:15,  emoji:"🪴", desc:"A little mat by the door"},
    {id:"flowers",  label:"Window boxes",   cost:18,  emoji:"🌸", desc:"Pink flowers on every sill"},
  ]},
  { tier:"Cosy", color:"#b09040", items:[
    {id:"mailbox",  label:"Garden mailbox", cost:25,  emoji:"📮", desc:"A red mailbox by the gate"},
    {id:"lantern",  label:"Door lantern",   cost:30,  emoji:"🏮", desc:"A warm glow by the door"},
    {id:"bench",    label:"Garden bench",   cost:35,  emoji:"🪑", desc:"A spot to sit and breathe"},
    {id:"vegpatch", label:"Veggie patch",   cost:40,  emoji:"🥕", desc:"Carrots, tomatoes, beans"},
  ]},
  { tier:"Established", color:"#4a8ab0", items:[
    {id:"garden",   label:"Flower garden",  cost:50,  emoji:"🌻", desc:"Sunflowers and lavender"},
    {id:"birdbath", label:"Bird bath",      cost:55,  emoji:"🐦", desc:"Birds visiting daily"},
    {id:"tree",     label:"Apple tree",     cost:65,  emoji:"🍎", desc:"A gnarled old apple tree"},
    {id:"pond",     label:"Garden pond",    cost:75,  emoji:"🐸", desc:"Lily pads and a little frog"},
  ]},
  { tier:"Magical", color:"#9b6fce", items:[
    {id:"rainbow",    label:"Rainbow",        cost:90,  emoji:"🌈", desc:"Colour after the rain"},
    {id:"greenhouse", label:"Greenhouse",     cost:100, emoji:"🌱", desc:"Glass walls full of green"},
    {id:"fox",        label:"Visiting fox",   cost:120, emoji:"🦊", desc:"A fox who comes at dusk"},
    {id:"moon",       label:"Moon & stars",   cost:150, emoji:"🌙", desc:"A magical night sky"},
    {id:"aurora",     label:"Aurora borealis",cost:200, emoji:"🌌", desc:"The night sky dances"},
  ]},
];
const ALL_SHOP_ITEMS = SHOP_TIERS.flatMap(t=>t.items);

const BADGES = [
  {id:"firstdump", label:"First breath",   emoji:"🌬️", desc:"Completed your first brain dump",  check:s=>s.totalDumps>=1},
  {id:"lettogo3",  label:"Open hands",     emoji:"🤲", desc:"Let go of 3 tasks",                check:s=>s.totalLetGo>=3},
  {id:"lettogo10", label:"The releaser",   emoji:"🕊️", desc:"Let go of 10 tasks",               check:s=>s.totalLetGo>=10},
  {id:"lettogo25", label:"Unburdened",     emoji:"🌤️", desc:"Let go of 25 tasks",               check:s=>s.totalLetGo>=25},
  {id:"streak3",   label:"3-day ritual",   emoji:"🕯️", desc:"Brain dumped 3 days in a row",     check:s=>s.currentStreak>=3},
  {id:"streak7",   label:"Week of peace",  emoji:"🌿", desc:"Brain dumped 7 days in a row",     check:s=>s.currentStreak>=7},
  {id:"streak30",  label:"Month of calm",  emoji:"🌙", desc:"Brain dumped 30 days in a row",    check:s=>s.currentStreak>=30},
  {id:"points50",  label:"Breathing room", emoji:"🏡", desc:"Earned 50 breathing points",       check:s=>s.totalPoints>=50},
  {id:"points200", label:"Deep exhale",    emoji:"🍃", desc:"Earned 200 breathing points",      check:s=>s.totalPoints>=200},
  {id:"firstdeco", label:"Homemaker",      emoji:"🛋️", desc:"Bought your first decoration",    check:s=>s.totalPurchases>=1},
  {id:"deco5",     label:"Nesting",        emoji:"🪴", desc:"Bought 5 decorations",             check:s=>s.totalPurchases>=5},
  {id:"deferred5", label:"Not today",      emoji:"📅", desc:"Deferred 5 tasks mindfully",       check:s=>s.totalDeferred>=5},
  {id:"magical",   label:"Magical home",   emoji:"🌌", desc:"Unlocked a magical decoration",    check:s=>s.ownedDecos?.some(d=>["aurora","moon","rainbow"].includes(d))},
];

const defaultTask = () => ({
  id:`t_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  title:"",notes:"",urgent:false,dueDate:"",dueDay:"",dueDays:[],recurrence:"None",
  tags:[],reminder:"",done:false,completedDates:[],stickerEmoji:"⭐",showStickerChart:false,createdAt:new Date().toISOString(),
});
const defaultStats = () => ({
  points:0,totalPoints:0,totalLetGo:0,totalDumps:0,totalDeferred:0,
  totalPurchases:0,currentStreak:0,lastDumpDate:"",earnedBadges:[],ownedDecos:[],
});

function useLS(key,init){
  const[v,setV]=useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;}});
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(v));}catch{}},[key,v]);
  return[v,setV];
}

const todayISO=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const todayDayName=()=>DAYS_SHORT[new Date().getDay()===0?6:new Date().getDay()-1];
const localISO=d=>{
  const yr=d.getFullYear();
  const mo=String(d.getMonth()+1).padStart(2,"0");
  const dy=String(d.getDate()).padStart(2,"0");
  return`${yr}-${mo}-${dy}`;
};
const weekDates=()=>{
  const today=new Date();today.setHours(0,0,0,0);
  const dow=today.getDay()===0?6:today.getDay()-1;
  return Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-dow+i);return localISO(d);});
};


// ── Sticker Chart ─────────────────────────────────────────────────────────
function StickerChart({ task, compact=false }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert to Mon-first: Sun=6, Mon=0...
  const firstOffset = firstDow === 0 ? 6 : firstDow - 1;
  const completed = task.completedDates || [];
  const monthName = now.toLocaleString("en-AU",{month:"long"});

  // Build grid: blanks + days
  const cells = [];
  for (let i=0; i<firstOffset; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ d, iso, done: completed.includes(iso) });
  }
  // Pad to complete final week
  while (cells.length % 7 !== 0) cells.push(null);

  const total = completed.filter(d=>d.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length;

  if (compact) {
    // Mini inline version — just show this month's dots in a single row wrap
    return (
      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #3e3e3e"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:12,color:"#B39CD0",fontWeight:700}}>{monthName}</span>
          <span style={{fontSize:11,color:"#6a6a7a"}}>{total} this month</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {["M","T","W","T","F","S","S"].map((d,i)=>(
            <div key={i} style={{fontSize:9,color:"#4a4a5a",textAlign:"center",paddingBottom:2}}>{d}</div>
          ))}
          {cells.map((cell,i)=>(
            <div key={i} style={{
              height:20,display:"flex",alignItems:"center",justifyContent:"center",
              borderRadius:4,background:cell?.done?"transparent":"none",fontSize:cell?.done?14:10,
              color:cell?.done?"inherit":"#2a2a3a",
            }}>
              {cell ? (cell.done ? task.stickerEmoji||"⭐" : <span style={{fontSize:8,color:"#2a2a3a"}}>·</span>) : ""}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full version for stats tab
  return (
    <div style={{background:"#222222",borderRadius:12,padding:"14px 12px",marginBottom:12,border:"1px solid #3e3e3e"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#E4E4E4",marginBottom:2}}>{task.title}</div>
          <div style={{fontSize:12,color:"#6a6a7a"}}>↻ {task.recurrence}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:20}}>{task.stickerEmoji||"⭐"}</div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:12,color:"#A8DADC",fontWeight:700}}>{monthName} {year}</span>
        <span style={{fontSize:12,color:"#6a6a7a"}}>{total}/{daysInMonth} days</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>(
          <div key={i} style={{fontSize:9,color:"#4a4a5a",textAlign:"center",paddingBottom:3,fontWeight:700}}>{d}</div>
        ))}
        {cells.map((cell,i)=>(
          <div key={i} style={{
            height:28,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            borderRadius:6,
            background:cell===null?"transparent":cell.done?"#1a3a2a":"#1a1a22",
            border:cell===null?"none":`1px solid ${cell.done?"#2a5a3a":"#2a2a3a"}`,
            position:"relative",
          }}>
            {cell && (
              <>
                <span style={{fontSize:cell.done?14:9,lineHeight:1}}>
                  {cell.done ? (task.stickerEmoji||"⭐") : <span style={{color:"#2a2a3a"}}>{cell.d}</span>}
                </span>
                {!cell.done && <span style={{fontSize:8,color:"#3a3a4a",position:"absolute",bottom:1}}>{cell.d}</span>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cottage({owned}){
  const has=id=>owned.includes(id);
  const night=has("moon")||has("aurora");
  return(
    <svg viewBox="0 0 300 210" style={{width:"100%",maxWidth:340,filter:"drop-shadow(0 8px 32px rgba(0,0,0,0.5))"}}>
      <defs>
        <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={night?"#0a0e2a":has("rainbow")?"#1a4a6a":"#0d2a1a"}/>
          <stop offset="100%" stopColor={night?"#1a2040":"#1a4a2a"}/>
        </linearGradient>
        <linearGradient id="cgrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a5a1a"/><stop offset="100%" stopColor="#0d3a0d"/>
        </linearGradient>
        <linearGradient id="cwall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e2e22"/><stop offset="100%" stopColor="#162018"/>
        </linearGradient>
        {has("aurora")&&(
          <linearGradient id="aurag" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0"/>
            <stop offset="30%" stopColor="#00ffcc" stopOpacity="0.5"/>
            <stop offset="60%" stopColor="#8844ff" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#ff44aa" stopOpacity="0"/>
          </linearGradient>
        )}
      </defs>
      <rect width="300" height="210" fill="url(#csky)" rx="14"/>
      {has("aurora")&&<>
        <ellipse cx="150" cy="40" rx="140" ry="28" fill="url(#aurag)" opacity="0.7">
          <animate attributeName="ry" values="26;38;26" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="4s" repeatCount="indefinite"/>
        </ellipse>
      </>}
      {has("moon")&&<>
        <circle cx="240" cy="32" r="20" fill="#fffbe6" opacity="0.95"/>
        <circle cx="253" cy="24" r="13" fill="#0a0e2a" opacity="0.95"/>
        {[40,80,130,170,210,260,20].map((x,i)=><circle key={i} cx={x} cy={[18,10,22,8,16,28,32][i]} r="1.5" fill="#fff" opacity="0.6"/>)}
      </>}
      {has("rainbow")&&[55,61,67,73,79,85].map((r,i)=>(
        <path key={i} d={`M 10 165 Q 150 ${165-r*2.1} 290 165`} fill="none"
          stroke={["#ff6b6b","#ffa94d","#ffd43b","#69db7c","#74c0fc","#b197fc"][i]} strokeWidth="3.5" opacity="0.75"/>
      ))}
      <rect x="0" y="162" width="300" height="48" fill="url(#cgrass)" rx="4"/>
      {has("vegpatch")&&<text x="13" y="170" fontSize="11">🥕🌿🍅</text>}
      {has("pond")&&<>
        <ellipse cx="258" cy="172" rx="28" ry="10" fill="#0a3a5a" opacity="0.9"/>
        <text x="248" y="170" fontSize="10">🐸</text>
      </>}
      {has("tree")&&<>
        <rect x="26" y="122" width="9" height="44" fill="#4a2a10" rx="3"/>
        <circle cx="31" cy="110" r="24" fill="#1a5a1a" opacity="0.9"/>
        <circle cx="20" cy="120" r="5" fill="#cc3322" opacity="0.9"/>
        <circle cx="38" cy="108" r="5" fill="#cc3322" opacity="0.9"/>
        <circle cx="28" cy="124" r="4" fill="#cc3322" opacity="0.9"/>
      </>}
      {has("fox")&&<text x="60" y="172" fontSize="18">🦊</text>}
      {has("greenhouse")&&<>
        <rect x="242" y="128" width="44" height="34" fill="#0a2a1a" stroke="#2a6a4a" strokeWidth="1.5" rx="2" opacity="0.9"/>
        <polygon points="242,128 264,112 286,128" fill="#071a0e" stroke="#2a6a4a" strokeWidth="1.5"/>
        <text x="250" y="152" fontSize="12">🌱</text>
        <line x1="264" y1="112" x2="264" y2="162" stroke="#2a6a4a" strokeWidth="1" opacity="0.5"/>
      </>}
      {has("garden")&&[220,232,244,254,264,272].map((x,i)=>(
        <g key={i}>
          <rect x={x-1} y={152} width="3" height="12" fill="#1a5a10" rx="1"/>
          <circle cx={x} cy={152} r={5} fill={["#f4c95d","#e8a0bf","#9b8fd4","#f4a261","#7fc8a9","#ff8888"][i]}/>
        </g>
      ))}
      {has("bench")&&<>
        <rect x="220" y="154" width="36" height="5" fill="#4a2a10" rx="2"/>
        <rect x="222" y="159" width="4" height="8" fill="#4a2a10" rx="1"/>
        <rect x="250" y="159" width="4" height="8" fill="#4a2a10" rx="1"/>
      </>}
      {has("birdbath")&&<>
        <ellipse cx="74" cy="156" rx="13" ry="5" fill="#1a4a6a" opacity="0.9"/>
        <rect x="70" y="156" width="8" height="10" fill="#3a2a18" rx="1"/>
        <text x="64" y="154" fontSize="11">🐦</text>
      </>}
      <ellipse cx="150" cy="180" rx="20" ry="7" fill="#0a1a08" opacity="0.5"/>
      <rect x="138" y="163" width="24" height="22" fill="#0a1a08" opacity="0.3" rx="2"/>
      <rect x="68" y="104" width="164" height="68" fill="url(#cwall)" rx="3"/>
      <polygon points="56,108 150,48 244,108" fill="#6a2020"/>
      <polygon points="56,108 150,48 244,108" fill="#3a0a0a" opacity="0.3"/>
      <line x1="56" y1="108" x2="244" y2="108" stroke="#3a0808" strokeWidth="2.5"/>
      <rect x="176" y="58" width="24" height="42" fill="#5a2818" rx="2"/>
      <rect x="173" y="55" width="30" height="9" fill="#6a3828" rx="2"/>
      {has("smoke")&&<>
        <path d="M183 53 Q179 40 185 28 Q191 16 187 4" fill="none" stroke="#3a6a4a" strokeWidth="5" strokeLinecap="round" opacity="0.5">
          <animate attributeName="d" values="M183 53 Q179 40 185 28 Q191 16 187 4;M183 53 Q189 40 183 28 Q177 16 183 4;M183 53 Q179 40 185 28 Q191 16 187 4" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="3s" repeatCount="indefinite"/>
        </path>
      </>}
      <rect x="124" y="130" width="26" height="42" fill="#0a1a0e" rx="3"/>
      <circle cx="146" cy="153" r="3" fill="#a08020"/>
      {has("lantern")&&<>
        <rect x="118" y="127" width="6" height="10" fill="#907010" rx="1"/>
        <ellipse cx="121" cy="137" rx="6" ry="8" fill="#ffe8a0" opacity="0.25"/>
        <ellipse cx="121" cy="137" rx="6" ry="8" fill="none" stroke="#907010" strokeWidth="1.5"/>
        <circle cx="121" cy="137" r="3.5" fill="#ffd700" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
      </>}
      {has("doormat")&&<rect x="120" y="170" width="30" height="6" fill="#4a2a10" rx="2" opacity="0.9"/>}
      <rect x="78" y="114" width="38" height="30" fill="#0a2a20" rx="3"/>
      <rect x="78" y="114" width="38" height="30" fill="#2a6a5a" rx="3" opacity="0.25"/>
      <line x1="97" y1="114" x2="97" y2="144" stroke="#1a4a3a" strokeWidth="1.5" opacity="0.7"/>
      <line x1="78" y1="129" x2="116" y2="129" stroke="#1a4a3a" strokeWidth="1.5" opacity="0.7"/>
      <rect x="184" y="114" width="38" height="30" fill="#0a2a20" rx="3"/>
      <rect x="184" y="114" width="38" height="30" fill="#2a6a5a" rx="3" opacity="0.25"/>
      <line x1="203" y1="114" x2="203" y2="144" stroke="#1a4a3a" strokeWidth="1.5" opacity="0.7"/>
      <line x1="184" y1="129" x2="222" y2="129" stroke="#1a4a3a" strokeWidth="1.5" opacity="0.7"/>
      {has("cat")&&<text x="186" y="140" fontSize="14">🐱</text>}
      {has("flowers")&&<>
        <rect x="76" y="142" width="42" height="6" fill="#3a1808" rx="2"/>
        <text x="76" y="142" fontSize="11">🌸🌸🌸</text>
        <rect x="182" y="142" width="42" height="6" fill="#3a1808" rx="2"/>
        <text x="182" y="142" fontSize="11">🌸🌸🌸</text>
      </>}
      {has("mailbox")&&<text x="44" y="164" fontSize="16">📮</text>}
    </svg>
  );
}

function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[onDone]);
  return(
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
      background:"#1a2a2a",color:"#A8DADC",padding:"12px 22px",borderRadius:20,
      fontSize:14,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",boxShadow:"0 4px 24px rgba(0,0,0,0.6)",
      zIndex:1000,whiteSpace:"nowrap",border:"1px solid #A8DADC44",animation:"fadeup 0.3s ease"}}>
      {msg}
    </div>
  );
}

export default function App(){
  const[tasks,setTasks]=useLS("mc_tasks_v3",[]);
  const[stats,setStats]=useLS("mc_stats_v3",defaultStats());
  const[view,setView]=useState("today");
  const[showForm,setShowForm]=useState(false);
  const[editId,setEditId]=useState(null);
  const[form,setForm]=useState(defaultTask());
  const[brainText,setBrainText]=useState("");
  const[filterTag,setFilterTag]=useState(null);
  const[sortBy,setSortBy]=useState("urgent");
  const[customTag,setCustomTag]=useState("");
  const[toast,setToast]=useState("");
  const[dragOver,setDragOver]=useState(null);
  const[dragTask,setDragTask]=useState(null);
  const[showShop,setShowShop]=useState(false);
  const titleRef=useRef();

  const showToast=useCallback(msg=>setToast(msg),[]);

  const earn=useCallback((pts,reason)=>{
    setStats(s=>{
      const u={...s,points:s.points+pts,totalPoints:s.totalPoints+pts};
      const nb=BADGES.filter(b=>!s.earnedBadges.includes(b.id)&&b.check(u)).map(b=>b.id);
      if(nb.length)u.earnedBadges=[...s.earnedBadges,...nb];
      return u;
    });
    showToast(`+${pts} breathing points — ${reason} 🌿`);
  },[setStats,showToast]);

  useEffect(()=>{
    const iv=setInterval(()=>{
      const now=new Date();
      tasks.forEach(t=>{
        if(t.reminder&&!t.done){
          const rem=new Date(t.reminder);
          if(rem<=now&&rem>new Date(now-60000)&&Notification.permission==="granted")
            new Notification("MindClear",{body:t.title});
        }
      });
    },30000);
    return()=>clearInterval(iv);
  },[tasks]);

  useEffect(()=>{if(Notification.permission==="default")Notification.requestPermission();},[]);

  const openNew=()=>{setForm(defaultTask());setEditId(null);setShowForm(true);setTimeout(()=>titleRef.current?.focus(),60);};
  const openEdit=t=>{setForm({...t});setEditId(t.id);setShowForm(true);};
  const saveTask=()=>{
    if(!form.title.trim())return;
    if(editId){setTasks(p=>p.map(t=>t.id===editId?{...form}:t));}
    else{setTasks(p=>[{...form,id:`t_${Date.now()}`},...p]);}
    setShowForm(false);
  };

  const toggleDone = (id, todayStr) => setTasks(p => p.map(t => {
    if (t.id !== id) return t;
    if (t.recurrence !== "None") {
      // Recurring: toggle today's date in completedDates
      const completed = t.completedDates || [];
      const alreadyDone = completed.includes(todayStr);
      return { ...t, completedDates: alreadyDone ? completed.filter(d => d !== todayStr) : [...completed, todayStr] };
    }
    // Non-recurring: permanent done toggle
    return { ...t, done: !t.done };
  }));
  const toggleUrgent=id=>setTasks(p=>p.map(t=>t.id===id?{...t,urgent:!t.urgent}:t));
  const letGoTask   =id=>{setTasks(p=>p.filter(t=>t.id!==id));setStats(s=>({...s,totalLetGo:s.totalLetGo+1}));earn(8,"you let something go");};
  const deferTask   =(id,toDate)=>{setTasks(p=>p.map(t=>t.id===id?{...t,dueDate:toDate,dueDay:""}:t));setStats(s=>({...s,totalDeferred:s.totalDeferred+1}));earn(5,"deferred mindfully");};

  const doBrainDump=()=>{
    const lines=brainText.split("\n").map(l=>l.trim()).filter(Boolean);
    if(!lines.length)return;
    const newTasks=lines.map(title=>({...defaultTask(),title,id:`t_${Date.now()}_${Math.random().toString(36).slice(2)}`}));
    setTasks(p=>[...newTasks,...p]);
    const today=todayISO();
    setStats(s=>{
      const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
      const yStr=yesterday.toISOString().split("T")[0];
      const streak=s.lastDumpDate===yStr?s.currentStreak+1:s.lastDumpDate===today?s.currentStreak:1;
      return{...s,totalDumps:s.totalDumps+1,lastDumpDate:today,currentStreak:streak};
    });
    earn(10,"brain dump done");
    setBrainText("");setView("all");
  };

  const buyDeco=item=>{
    if(stats.points<item.cost){showToast("Not enough points yet 🌱");return;}
    if(stats.ownedDecos.includes(item.id)){showToast("Already in your cottage!");return;}
    setStats(s=>({...s,points:s.points-item.cost,ownedDecos:[...s.ownedDecos,item.id],totalPurchases:s.totalPurchases+1}));
    showToast(`${item.emoji} ${item.label} added to your cottage!`);
  };

  const onDragStart=(e,id)=>{setDragTask(id);e.dataTransfer.effectAllowed="move";};
  const onDragOver=(e,date)=>{e.preventDefault();setDragOver(date);};
  const onDrop=(e,date)=>{e.preventDefault();if(dragTask)setTasks(p=>p.map(t=>t.id===dragTask?{...t,dueDate:date,dueDay:""}:t));setDragTask(null);setDragOver(null);};

  const today=todayISO();
  const todayDay=todayDayName();
  const wDates=weekDates();

  const isTaskToday=t=>
    t.dueDate===today||
    (!t.dueDate&&(t.dueDay===todayDay||(t.dueDays||[]).includes(todayDay)))||
    t.recurrence==="Daily"||
    (t.recurrence==="Weekly"&&(t.dueDay===todayDay||(t.dueDays||[]).includes(todayDay)));

  const isTodayDone = t => t.recurrence !== "None"
    ? (t.completedDates||[]).includes(today)
    : t.done;
  const activeTasks=tasks.filter(t=>!t.done);
  const listSource=view==="done"
    ? tasks.filter(t => t.done || (t.recurrence!=="None" && (t.completedDates||[]).includes(today)))
    : view==="today"
    ? activeTasks.filter(t => isTaskToday(t) && !isTodayDone(t))
    : activeTasks.filter(t => !isTodayDone(t));
  const filteredList=listSource
    .filter(t=>!filterTag||t.tags.includes(filterTag))
    .sort((a,b)=>sortBy==="urgent"?(b.urgent?1:0)-(a.urgent?1:0):sortBy==="due"?(a.dueDate||"z").localeCompare(b.dueDate||"z"):new Date(b.createdAt)-new Date(a.createdAt));

  const urgentCount=activeTasks.filter(t=>t.urgent).length;
  const todayCount=activeTasks.filter(isTaskToday).length;
  const earnedBadges=BADGES.filter(b=>stats.earnedBadges.includes(b.id));
  const nextBadges=BADGES.filter(b=>!stats.earnedBadges.includes(b.id)).slice(0,3);

  return(
    <div style={S.root}>
      <style>{`
        /* Using system fonts for native feel */
        @keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{overflow-x:hidden;max-width:100vw;}
        body{background:#2C2C2C;}
        input,select,textarea,button{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif;font-size:16px;}
        input[type=date],input[type=datetime-local]{color-scheme:dark;font-size:16px;}
        ::placeholder{color:#5a5a6a;}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#4a4a5a;border-radius:4px}
      `}</style>

      <div style={S.header}>
        <div style={S.headerInner}>
          <div>
            <div style={S.logo}>MindClear</div>
            <div style={S.tagline}>Breathe out. Let it go.</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <div style={S.pointsChip} onClick={()=>setShowShop(true)}>🌿 {stats.points} pts</div>
            <button style={S.addBtn} onClick={openNew}>+ Task</button>
          </div>
        </div>
        <div style={S.nav}>
          {[
            {id:"today", label:`Today${todayCount?` (${todayCount})`:""}`},
            {id:"all",   label:"All tasks"},
            {id:"week",  label:"Week"},
            {id:"brain", label:"🧠 Dump"},
            {id:"cottage",label:"🏡 Home"},
            {id:"done",  label:"Done"},
            {id:"stats", label:"📊 Habits"},
          ].map(v=>(
            <button key={v.id} style={{...S.navBtn,...(view===v.id?S.navActive:{})}} onClick={()=>setView(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>

      {!["brain","cottage","week"].includes(view)&&(
        <div style={S.tagStrip}>
          <button style={{...S.tagPill,background:!filterTag?"#2a3a3a":"transparent",color:!filterTag?"#A8DADC":"#6a6a7a"}} onClick={()=>setFilterTag(null)}>All</button>
          {PRESET_TAGS.map(tag=>(
            <button key={tag} style={{...S.tagPill,background:filterTag===tag?getTagColor(tag)+"33":"transparent",color:filterTag===tag?getTagColor(tag):"#6a6a7a",border:filterTag===tag?`1px solid ${getTagColor(tag)}`:"1px solid #3e3e3e"}}
              onClick={()=>setFilterTag(filterTag===tag?null:tag)}>{tag}</button>
          ))}
        </div>
      )}


      {view==="stats"&&(
        <div style={{padding:"12px 14px"}}>
          <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:20,fontWeight:700,color:"#A8DADC",marginBottom:4}}>Habit tracker</div>
          <div style={{fontSize:13,color:"#6a6a7a",marginBottom:16,fontStyle:"italic"}}>Your recurring tasks this month</div>
          {tasks.filter(t=>t.recurrence!=="None"&&!t.done&&t.showStickerChart).length===0 && (
            <div style={{textAlign:"center",padding:40,color:"#5a5a6a",fontSize:15,fontStyle:"italic"}}>
              No habit charts yet. Edit a recurring task and turn on "Track this habit" to add one.
            </div>
          )}
          {tasks.filter(t=>t.recurrence!=="None"&&!t.done&&t.showStickerChart).map(t=>(
            <StickerChart key={t.id} task={t} compact={false}/>
          ))}
        </div>
      )}

      {["today","all","done"].includes(view)&&(
        <div style={S.sortBar}>
          <span style={S.sortLabel}>Sort:</span>
          {[["urgent","Urgency"],["due","Due"],["created","Added"]].map(([k,l])=>(
            <button key={k} style={{...S.sortBtn,...(sortBy===k?S.sortActive:{})}} onClick={()=>setSortBy(k)}>{l}</button>
          ))}
          {urgentCount>0&&<span style={S.urgentBadge}>🔴 {urgentCount} urgent</span>}
        </div>
      )}

      {view==="brain"&&(
        <div style={S.brainBox}>
          <div style={{fontSize:40,marginBottom:8}}>🧠</div>
          <h2 style={S.brainTitle}>Morning brain dump</h2>
          <p style={S.brainSub}>Don't organise. Don't prioritise. Just empty your mind — one thought per line.<br/>You'll earn <strong style={{color:"#A8DADC"}}>10 points</strong> just for showing up.</p>
          <textarea style={S.brainArea} rows={12} value={brainText}
            placeholder={"Call Emma's school\nPay the electricity bill\nEmail Sarah re: meeting\nBook Mum's GP appointment\nGet milk\nFix the dripping tap..."}
            onChange={e=>setBrainText(e.target.value)}/>
          <button style={{...S.saveBtn,marginTop:12}} onClick={doBrainDump} disabled={!brainText.trim()}>✨ Empty my mind & earn 10 points</button>
          {stats.currentStreak>0&&<div style={S.streakBanner}>🕯️ {stats.currentStreak}-day ritual streak — keep going</div>}
        </div>
      )}

      {view==="cottage"&&(
        <div style={S.cottageView}>
          <div style={S.cottageTitle}>Your cosy cottage</div>
          <div style={S.cottageSubtitle}>Every task you let go, every brain dump — earns a little more peace.</div>
          <Cottage owned={stats.ownedDecos}/>
          <div style={S.pointsDisplay}>🌿 {stats.points} breathing points to spend</div>
          <button style={S.shopBtn} onClick={()=>setShowShop(true)}>Open decoration shop</button>
          <div style={S.badgesSection}>
            <div style={S.badgesTitle}>Your badges</div>
            {earnedBadges.length===0&&<p style={S.badgesEmpty}>Complete your first brain dump to earn a badge 🌱</p>}
            <div style={S.badgeGrid}>
              {earnedBadges.map(b=>(
                <div key={b.id} style={S.badgeChip} title={b.desc}>
                  <span style={{fontSize:22}}>{b.emoji}</span>
                  <span style={S.badgeLabel}>{b.label}</span>
                </div>
              ))}
            </div>
            {nextBadges.length>0&&(
              <div style={S.nextBadges}>
                <div style={S.nextBadgesTitle}>Within reach:</div>
                {nextBadges.map(b=><div key={b.id} style={S.nextBadge}>{b.emoji} <em>{b.label}</em> — {b.desc}</div>)}
              </div>
            )}
          </div>
        </div>
      )}

      {view==="week"&&(
        <div style={S.weekView}>
          <div style={S.weekTitle}>This week</div>
          <div style={S.weekSub}>Drag to reschedule · ✕ to let go (+8pts)</div>
          <div style={S.weekGrid}>
            {[[0,1],[2,3],[4,5],[6]].map((group,gi)=>(
              <div key={gi} style={{...S.weekRow,gridTemplateColumns:group.length===1?"1fr":`repeat(${group.length},1fr)`}}>
                {group.map(i=>{
                  const date=wDates[i];
                  const dayLabel=DAYS_SHORT[i];
                  const isToday=date===today;
                  const dayTasks=activeTasks.filter(t=>
                    t.dueDate===date||(!t.dueDate&&t.dueDay===dayLabel)||t.recurrence==="Daily"||(t.recurrence==="Weekly"&&(t.dueDays||[t.dueDay]).includes(dayLabel))
                  );
                  const load=dayTasks.length;
                  const bg=dragOver===date?"#2a3a3a":load===0?"#222222":load<=2?"#2C2C2C":load<=4?"#2a2a1a":"#2a1a1a";
                  const border=isToday?"#A8DADC":load>=5?"#FFC1CC66":load>=3?"#B39CD066":"#3e3e3e";
                  return(
                    <div key={date} style={{...S.dayCol,background:bg,border:`2px solid ${border}`}}
                      onDragOver={e=>onDragOver(e,date)} onDrop={e=>onDrop(e,date)} onDragLeave={()=>setDragOver(null)}>
                      <div style={{...S.dayLabel,...(isToday?{color:"#A8DADC"}:{})}}>
                        {dayLabel} <span style={S.dayDate}>{fmtDate(date)}</span>
                      </div>
                      <div style={{...S.dayLoad,color:load>=5?"#e07a7a":load>=3?"#c8b840":"#4a8a9a"}}>
                        {load===0?"Free ✨":load===1?"1 task":`${load} tasks`}
                      </div>
                      {dayTasks.map(t=>(
                        <div key={t.id} draggable
                          style={{...S.weekChip,...(t.urgent?{borderLeft:"2px solid #FFC1CC"}:{})}}
                          onDragStart={e=>onDragStart(e,t.id)}>
                          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {t.title.length>18?t.title.slice(0,18)+"…":t.title}
                          </span>
                          <button style={S.weekX} onClick={()=>letGoTask(t.id)}>✕</button>
                        </div>
                      ))}
                      <div style={S.freeTime}>{load>=5?"⚠️ Full":load>=3?"🟡 Busy":""}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}


      {["today","all","done"].includes(view)&&(
        <div style={S.list}>
          {filteredList.length===0&&(
            <div style={S.empty}>
              {view==="today"?"Nothing due today — breathe 🌿":view==="done"?"No completed tasks yet.":"No tasks here. Try a brain dump."}
            </div>
          )}
          {filteredList.map(t=>(
            <TaskCard key={t.id} task={t} onToggle={id=>toggleDone(id,today)} onLetGo={letGoTask}
              onDefer={deferTask} onToggleUrgent={toggleUrgent} onEdit={openEdit} today={today} isTodayDone={isTodayDone}/>
          ))}
        </div>
      )}

      {showForm&&(
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>{editId?"Edit task":"New task"}</span>
              <button style={S.closeBtn} onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <input ref={titleRef} style={S.input} placeholder="What needs to be done?" value={form.title}
              onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveTask()}/>
            <textarea style={{...S.input,...S.textarea}} placeholder="Notes, details, links..." rows={3}
              value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            <label style={S.checkRow}>
              <input type="checkbox" checked={form.urgent} onChange={e=>setForm(f=>({...f,urgent:e.target.checked}))}/>
              <span style={{fontSize:14,fontWeight:600,color:form.urgent?"#e06060":"#4a9e6a"}}>{form.urgent?"🔴 Urgent":"Mark as urgent"}</span>
            </label>
            <div style={S.fieldLabel}>Due date</div>
            <div style={{width:"100%",overflow:"hidden"}}>
              <input type="date" style={{...S.input,appearance:"none",WebkitAppearance:"none"}} value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
            </div>
            {form.dueDate&&(
              <button style={{...S.deferBtn,marginBottom:10,fontSize:13}} onClick={()=>setForm(f=>({...f,dueDate:""}))}
              >✕ Clear date</button>
            )}
            <div style={S.fieldLabel}>Or specific days of the week</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {DAYS_SHORT.map(d=>(
                <button key={d} onClick={()=>setForm(f=>({...f,dueDays:(f.dueDays||[]).includes(d)?(f.dueDays||[]).filter(x=>x!==d):[...(f.dueDays||[]),d],dueDay:(f.dueDays||[]).includes(d)?(f.dueDays||[]).filter(x=>x!==d).join(","):[...(f.dueDays||[]),d].join(",")}))}
                  style={{...S.recBtn,...((form.dueDays||[]).includes(d)?S.recActive:{}),minWidth:44,textAlign:"center"}}>
                  {d}
                </button>
              ))}
            </div>
            {form.recurrence!=="None"&&<>
              <label style={{...S.checkRow,marginBottom:8}}>
                <input type="checkbox" checked={form.showStickerChart||false} onChange={e=>setForm(f=>({...f,showStickerChart:e.target.checked}))}/>
                <span style={{fontSize:14,fontWeight:600,color:form.showStickerChart?"#A8DADC":"#8a8a9a"}}>Track this habit with a sticker chart</span>
              </label>
              {form.showStickerChart&&<>
                <div style={S.fieldLabel}>Sticker</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {STICKER_EMOJIS.map(e=>(
                    <button key={e} onClick={()=>setForm(f=>({...f,stickerEmoji:e}))}
                      style={{fontSize:20,background:form.stickerEmoji===e?"#2a3a3a":"transparent",border:form.stickerEmoji===e?"2px solid #A8DADC":"2px solid transparent",borderRadius:8,padding:"2px 4px",cursor:"pointer"}}>
                      {e}
                    </button>
                  ))}
                </div>
              </>}
            </>}
            <div style={S.fieldLabel}>Repeats</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {RECURRENCE.map(r=><button key={r} style={{...S.recBtn,...(form.recurrence===r?S.recActive:{})}} onClick={()=>setForm(f=>({...f,recurrence:r}))}>{r}</button>)}
            </div>
            <div style={S.fieldLabel}>Reminder</div>
            <div style={{width:"100%",overflow:"hidden"}}>
              <input type="datetime-local" style={{...S.input,appearance:"none",WebkitAppearance:"none"}} value={form.reminder} onChange={e=>setForm(f=>({...f,reminder:e.target.value}))}/>
            </div>
            {form.reminder&&(
              <button style={{...S.deferBtn,marginBottom:10,fontSize:13}} onClick={()=>setForm(f=>({...f,reminder:""}))}
              >✕ Clear reminder</button>
            )}
            <div style={S.fieldLabel}>Tags</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {PRESET_TAGS.map(tag=>(
                <button key={tag} onClick={()=>setForm(f=>({...f,tags:f.tags.includes(tag)?f.tags.filter(x=>x!==tag):[...f.tags,tag]}))}
                  style={{...S.tagToggle,background:form.tags.includes(tag)?getTagColor(tag)+"33":"transparent",color:form.tags.includes(tag)?getTagColor(tag):"#6a6a7a",border:form.tags.includes(tag)?`1px solid ${getTagColor(tag)}`:"1px solid #3e3e3e"}}>
                  {tag}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input style={{...S.input,flex:1,marginBottom:0}} placeholder="Custom tag..." value={customTag}
                onChange={e=>setCustomTag(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&customTag.trim()){if(!form.tags.includes(customTag.trim()))setForm(f=>({...f,tags:[...f.tags,customTag.trim()]}));setCustomTag("");}}}/>
              <button style={S.customTagBtn} onClick={()=>{if(customTag.trim()&&!form.tags.includes(customTag.trim()))setForm(f=>({...f,tags:[...f.tags,customTag.trim()]}));setCustomTag("");}}>Add</button>
            </div>
            {form.tags.filter(t=>!PRESET_TAGS.includes(t)).map(t=>(
              <span key={t} style={S.customChip}>{t}
                <button style={{background:"none",border:"none",cursor:"pointer",color:"#4a9e6a",marginLeft:4}} onClick={()=>setForm(f=>({...f,tags:f.tags.filter(x=>x!==t)}))}>✕</button>
              </span>
            ))}
            <button style={{...S.saveBtn,marginTop:14}} onClick={saveTask}>{editId?"Save changes":"Add task"}</button>
          </div>
        </div>
      )}

      {showShop&&(
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowShop(false)}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>🏡 Decoration shop</span>
              <button style={S.closeBtn} onClick={()=>setShowShop(false)}>✕</button>
            </div>
            <div style={{color:"#8a8a9a",fontSize:13,marginBottom:16}}>You have <strong style={{color:"#FFC1CC"}}>{stats.points} points</strong>. Earn more by letting go and brain dumping each morning.</div>
            {SHOP_TIERS.map(tier=>(
              <div key={tier.tier} style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",color:tier.color,borderBottom:`1px solid ${tier.color}44`,paddingBottom:4,marginBottom:8}}>{tier.tier}</div>
                <div style={S.shopGrid}>
                  {tier.items.map(item=>{
                    const owned=stats.ownedDecos.includes(item.id);
                    const canAfford=stats.points>=item.cost;
                    return(
                      <div key={item.id} style={{...S.shopItem,...(owned?S.shopOwned:{})}}>
                        <div style={{fontSize:26}}>{item.emoji}</div>
                        <div style={S.shopName}>{item.label}</div>
                        <div style={S.shopDesc}>{item.desc}</div>
                        <div style={{...S.shopCost,color:canAfford||owned?"#A8DADC":"#4a4a5a"}}>{item.cost} pts</div>
                        <button style={{...S.shopBuy,...(!canAfford&&!owned?S.shopCant:{}),...(owned?S.shopDone:{})}}
                          onClick={()=>buyDeco(item)} disabled={owned}>
                          {owned?"✓ Added":canAfford?"Buy":"Need more"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast&&<Toast msg={toast} onDone={()=>setToast("")}/>}
      <div style={{height:40}}/>
    </div>
  );
}

function TaskCard({task,onToggle,onLetGo,onDefer,onToggleUrgent,onEdit,today,isTodayDone}){
  const[expanded,setExpanded]=useState(false);
  const[showDefer,setShowDefer]=useState(false);
  const isDone = isTodayDone ? isTodayDone(task) : task.done;
  const isOverdue=task.dueDate&&task.dueDate<today&&!isDone;
  const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().split("T")[0];};
  const nextWeek=()=>{const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().split("T")[0];};
  return(
    <div style={{...S.card,...(task.urgent?S.cardUrgent:{}),...(isDone?S.cardDone:{}),...(isOverdue?S.cardOverdue:{})}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <button style={{...S.circle,...(isDone?S.circleDone:{})}} onClick={()=>onToggle(task.id)}>
          {isDone&&<span style={{color:"#2C2C2C",fontSize:13}}>✓</span>}
        </button>
        <div style={{flex:1,cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
          <div style={{...S.cardTitle,...(isDone?S.strikethru:{})}}>
            {task.urgent&&!isDone&&<span style={{color:"#e06060",marginRight:4}}>●</span>}
            {task.title}
            {task.recurrence!=="None"&&<span style={S.recChip}>↻ {task.recurrence}{(task.completedDates||[]).length>0?` · ${(task.completedDates||[]).length}✓`:""}</span>}
          </div>
          <div style={S.cardMeta}>
            {task.dueDate&&<span style={{...S.metaChip,...(isOverdue?S.metaOverdue:{})}}>{isOverdue?"⚠️ ":""}{fmtDate(task.dueDate)}</span>}
            {(task.dueDays?.length>0?task.dueDays:[task.dueDay].filter(Boolean))&&!task.dueDate&&(task.dueDays?.length>0?task.dueDays:[task.dueDay].filter(Boolean)).length>0&&<span style={S.metaChip}>{(task.dueDays?.length>0?task.dueDays:[task.dueDay].filter(Boolean)).join(', ')}</span>}
            {task.reminder&&<span style={S.metaChip}>⏰ {fmtDateTime(task.reminder)}</span>}
            {task.tags.map(tag=>(
              <span key={tag} style={{...S.metaTag,color:getTagColor(tag),background:getTagColor(tag)+"22",border:`1px solid ${getTagColor(tag)}44`}}>{tag}</span>
            ))}
          </div>
          {expanded&&task.notes&&<div style={S.cardNotes}>{task.notes}</div>}
          {expanded&&task.recurrence!=="None"&&task.showStickerChart&&<StickerChart task={task} compact={true}/>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
          <button style={S.actBtn} onClick={()=>onEdit(task)}>✏️</button>
          <button style={S.actBtn} onClick={()=>onToggleUrgent(task.id)}>{task.urgent?"🔕":"🔴"}</button>
          <button style={S.actBtn} onClick={()=>setShowDefer(s=>!s)}>📅</button>
          <button style={S.actBtn} onClick={()=>onLetGo(task.id)} title="Let go (+8pts)">🤲</button>
        </div>
      </div>
      {showDefer&&(
        <div style={S.deferRow}>
          <span style={{fontSize:11,color:"#B39CD0",fontWeight:700}}>Defer to:</span>
          <button style={S.deferBtn} onClick={()=>{onDefer(task.id,tomorrow());setShowDefer(false);}}>Tomorrow</button>
          <button style={S.deferBtn} onClick={()=>{onDefer(task.id,nextWeek());setShowDefer(false);}}>Next week</button>
          <button style={{...S.deferBtn,color:"#3a5a4a"}} onClick={()=>setShowDefer(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// Palette:
// #2C2C2C — background (charcoal)
// #E4E4E4 — primary text / borders (light grey)
// #A8DADC — teal accent (logo, headings, active)
// #FFC1CC — pink accent (points, urgent, streaks)
// #B39CD0 — lavender accent (labels, secondary buttons)

const S={
  root:       {fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",background:"#2C2C2C",minHeight:"100vh",maxWidth:760,margin:"0 auto",paddingBottom:"max(60px, calc(40px + env(safe-area-inset-bottom)))",color:"#E4E4E4"},
  header:     {background:"linear-gradient(160deg,#1a1a1a 0%,#242424 60%,#2C2C2C 100%)",paddingTop:"max(24px, env(safe-area-inset-top))",paddingLeft:"20px",paddingRight:"20px",paddingBottom:"0",borderBottom:"1px solid #3e3e3e"},
  headerInner:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16},
  logo:       {fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:26,fontWeight:700,color:"#A8DADC",letterSpacing:"-0.3px"},
  tagline:    {fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontStyle:"italic",fontSize:13,color:"#6a9a9c",marginTop:2},
  pointsChip: {background:"#3a2a2e",color:"#FFC1CC",padding:"5px 12px",borderRadius:16,fontSize:13,fontWeight:700,cursor:"pointer",border:"1px solid #5a3a40"},
  addBtn:     {background:"#3a3a50",color:"#B39CD0",border:"none",borderRadius:18,padding:"8px 18px",fontWeight:700,cursor:"pointer",fontSize:13,boxShadow:"0 2px 12px rgba(0,0,0,0.4)"},
  nav:        {display:"flex",gap:2,overflowX:"auto"},
  navBtn:     {background:"none",border:"none",color:"#5a5a6a",padding:"9px 12px",cursor:"pointer",fontSize:12,fontWeight:600,borderRadius:"6px 6px 0 0",whiteSpace:"nowrap"},
  navActive:  {background:"#2C2C2C",color:"#A8DADC",fontWeight:700},
  tagStrip:   {display:"flex",gap:6,padding:"10px 14px",overflowX:"auto",background:"#222222",borderBottom:"1px solid #3e3e3e"},
  tagPill:    {border:"1px solid #3e3e3e",borderRadius:14,padding:"4px 11px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",fontWeight:600,background:"transparent",color:"#8a8a9a"},
  sortBar:    {display:"flex",gap:6,alignItems:"center",padding:"8px 14px",background:"#2C2C2C",borderBottom:"1px solid #3e3e3e"},
  sortLabel:  {fontSize:11,color:"#6a6a7a",marginRight:4},
  sortBtn:    {background:"none",border:"1px solid #3e3e3e",borderRadius:12,padding:"3px 10px",fontSize:11,cursor:"pointer",color:"#8a8a9a"},
  sortActive: {background:"#2a3a3a",color:"#A8DADC",borderColor:"#A8DADC66"},
  urgentBadge:{marginLeft:"auto",fontSize:11,color:"#FFC1CC",fontWeight:700},
  brainBox:   {padding:"28px 20px",maxWidth:600,margin:"0 auto"},
  brainTitle: {fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:22,fontWeight:700,color:"#A8DADC",marginBottom:6},
  brainSub:   {color:"#8a8a9a",fontSize:16,lineHeight:1.6,marginBottom:16},
  brainArea:  {width:"100%",border:"1.5px solid #3e3e3e",borderRadius:10,padding:14,fontSize:16,lineHeight:1.8,resize:"vertical",outline:"none",color:"#E4E4E4",background:"#222222",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif"},
  streakBanner:{marginTop:12,background:"#2a2230",color:"#B39CD0",padding:"10px 16px",borderRadius:10,fontSize:15,textAlign:"center",fontStyle:"italic",border:"1px solid #4a3a5a"},
  cottageView:   {padding:"20px 16px",maxWidth:500,margin:"0 auto",textAlign:"center"},
  cottageTitle:  {fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:22,fontWeight:700,color:"#A8DADC",marginBottom:4},
  cottageSubtitle:{color:"#8a8a9a",fontSize:15,fontStyle:"italic",marginBottom:16,lineHeight:1.5},
  pointsDisplay: {fontSize:18,fontWeight:700,color:"#FFC1CC",margin:"12px 0"},
  shopBtn:       {background:"#2a3a3a",color:"#A8DADC",border:"1px solid #A8DADC66",borderRadius:20,padding:"10px 24px",fontSize:14,cursor:"pointer",fontWeight:700,marginBottom:20},
  badgesSection: {textAlign:"left",marginTop:16},
  badgesTitle:   {fontSize:15,fontWeight:700,color:"#A8DADC",marginBottom:8},
  badgesEmpty:   {color:"#5a5a6a",fontSize:13,fontStyle:"italic"},
  badgeGrid:     {display:"flex",flexWrap:"wrap",gap:8},
  badgeChip:     {background:"#222222",border:"1.5px solid #3e3e3e",borderRadius:12,padding:"8px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:80},
  badgeLabel:    {fontSize:13,color:"#B39CD0",fontWeight:700,textAlign:"center"},
  nextBadges:    {marginTop:14,background:"#222222",borderRadius:10,padding:"10px 14px",border:"1px solid #3e3e3e"},
  nextBadgesTitle:{fontSize:12,color:"#6a6a7a",fontWeight:700,marginBottom:6},
  nextBadge:     {fontSize:15,color:"#8a8a9a",marginBottom:4,lineHeight:1.5},
  weekView:   {padding:"10px 8px"},
  weekTitle:  {fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:18,fontWeight:700,color:"#A8DADC",marginBottom:2},
  weekSub:    {fontSize:10,color:"#6a6a7a",fontStyle:"italic",marginBottom:8},
  weekGrid:   {display:"flex",flexDirection:"column",gap:6},
  weekRow:    {display:"grid",gap:6},
  dayCol:     {borderRadius:8,padding:"5px 3px",minHeight:130,transition:"background 0.2s"},
  dayLabel:   {fontSize:10,fontWeight:700,color:"#8a8a9a",textAlign:"center",marginBottom:1},
  dayDate:    {display:"block",fontSize:9,color:"#5a5a6a",fontWeight:400},
  dayLoad:    {fontSize:9,textAlign:"center",marginBottom:3,fontWeight:700},
  weekChip:   {background:"#333333",borderRadius:4,padding:"2px 3px",fontSize:9,cursor:"grab",display:"flex",alignItems:"center",gap:2,border:"1px solid #4a4a5a",marginBottom:2,borderLeft:"2px solid #B39CD0"},
  weekX:      {background:"none",border:"none",color:"#FFC1CC",cursor:"pointer",fontSize:9,padding:0,flexShrink:0},
  freeTime:   {marginTop:3,fontSize:8,textAlign:"center"},
  list:       {padding:"10px 12px"},
  empty:      {textAlign:"center",padding:40,color:"#5a5a6a",fontSize:16,fontStyle:"italic"},
  card:       {background:"#333333",borderRadius:12,marginBottom:8,padding:"12px 10px",border:"1.5px solid #3e3e3e"},
  cardUrgent: {borderColor:"#FFC1CC66",background:"#3a2a2e"},
  cardDone:   {opacity:0.35},
  cardOverdue:{borderColor:"#c8a84066",background:"#2e2a1a"},
  circle:     {width:24,height:24,borderRadius:"50%",border:"2px solid #4a4a5a",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1},
  circleDone: {background:"#A8DADC",borderColor:"#A8DADC"},
  cardTitle:  {fontSize:16,fontWeight:600,color:"#E4E4E4",lineHeight:1.35,marginBottom:5},
  strikethru: {textDecoration:"line-through",color:"#5a5a6a"},
  recChip:    {marginLeft:7,fontSize:12,background:"#2a3a3a",color:"#A8DADC",borderRadius:10,padding:"1px 7px",border:"1px solid #A8DADC44"},
  cardMeta:   {display:"flex",flexWrap:"wrap",gap:4},
  metaChip:   {fontSize:12,background:"#222222",borderRadius:10,padding:"2px 8px",color:"#8a8a9a",border:"1px solid #3e3e3e"},
  metaOverdue:{background:"#2e2a1a",color:"#c8a840",borderColor:"#6a5a20"},
  metaTag:    {fontSize:12,borderRadius:10,padding:"2px 8px",fontWeight:600},
  cardNotes:  {marginTop:8,fontSize:14,color:"#8a8a9a",lineHeight:1.55,background:"#222222",borderRadius:6,padding:"7px 9px",border:"1px solid #3e3e3e"},
  actBtn:     {background:"none",border:"none",cursor:"pointer",fontSize:13,padding:2,borderRadius:4},
  deferRow:   {display:"flex",gap:6,alignItems:"center",marginTop:8,paddingTop:8,borderTop:"1px solid #3e3e3e",flexWrap:"wrap"},
  deferBtn:   {background:"#222222",border:"1px solid #3e3e3e",borderRadius:14,padding:"4px 12px",fontSize:14,cursor:"pointer",color:"#B39CD0"},
  overlay:    {position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200},
  modal:      {background:"#2C2C2C",borderRadius:"18px 18px 0 0",padding:"22px 18px 32px",width:"100%",maxWidth:720,maxHeight:"92vh",overflowY:"auto",overflowX:"hidden",border:"1px solid #3e3e3e",borderBottom:"none"},
  modalHead:  {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14},
  modalTitle: {fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:18,fontWeight:700,color:"#A8DADC"},
  closeBtn:   {background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#5a5a6a"},
  input:      {width:"100%",maxWidth:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:8,border:"1.5px solid #3e3e3e",fontSize:16,outline:"none",marginBottom:10,color:"#E4E4E4",background:"#222222",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif"},
  textarea:   {resize:"vertical"},
  checkRow:   {display:"flex",alignItems:"center",gap:8,marginBottom:12,cursor:"pointer"},
  fieldLabel: {fontSize:13,fontWeight:700,color:"#B39CD0",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:4},
  recBtn:     {border:"1px solid #3e3e3e",background:"#222222",borderRadius:16,padding:"5px 12px",fontSize:14,cursor:"pointer",color:"#8a8a9a"},
  recActive:  {background:"#2a3a3a",color:"#A8DADC",borderColor:"#A8DADC66"},
  tagToggle:  {border:"1px solid #3e3e3e",borderRadius:14,padding:"5px 11px",fontSize:14,cursor:"pointer",fontWeight:600},
  customTagBtn:{background:"#2a3a3a",color:"#A8DADC",border:"none",borderRadius:8,padding:"0 14px",cursor:"pointer",fontWeight:700},
  customChip: {display:"inline-flex",alignItems:"center",background:"#2a2230",color:"#B39CD0",borderRadius:12,padding:"3px 10px",fontSize:12,margin:"2px 4px 2px 0",border:"1px solid #4a3a5a"},
  saveBtn:    {width:"100%",background:"linear-gradient(135deg,#2a3a3a,#1a2a2a)",color:"#A8DADC",border:"1px solid #A8DADC66",borderRadius:10,padding:14,fontSize:15,cursor:"pointer",fontWeight:700},
  shopGrid:   {display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:4},
  shopItem:   {background:"#222222",borderRadius:12,padding:"12px 10px",textAlign:"center",border:"1.5px solid #3e3e3e"},
  shopOwned:  {background:"#1e2a2a",borderColor:"#A8DADC44"},
  shopName:   {fontSize:15,fontWeight:700,color:"#E4E4E4",marginTop:4},
  shopDesc:   {fontSize:13,color:"#6a6a7a",margin:"4px 0 6px",lineHeight:1.4},
  shopCost:   {fontSize:14,fontWeight:700,marginBottom:6},
  shopBuy:    {background:"#2a3a3a",color:"#A8DADC",border:"1px solid #A8DADC66",borderRadius:14,padding:"5px 16px",fontSize:14,cursor:"pointer",fontWeight:700},
  shopCant:   {background:"#1a1a1a",color:"#3a3a4a",borderColor:"#2a2a2a",cursor:"default"},
  shopDone:   {background:"#1e2a2a",color:"#5a9a9c",borderColor:"#2a4a4a",cursor:"default"},
};
