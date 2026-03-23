import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────
const PRESET_TAGS = ["Work","Home","Personal","Parents","Daughter","Health","Finance","Shopping","Errands"];
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const RECURRENCE = ["None","Daily","Weekly","Fortnightly","Monthly"];
const TAG_COLORS = {
  Work:"#6b8f6b",Home:"#c4853a",Personal:"#8b6fae",Parents:"#c4667a",
  Daughter:"#5a9e8f",Health:"#b05a5a",Finance:"#a08040",Shopping:"#5a7aa0",Errands:"#7a8a5a"
};
const getTagColor = t => TAG_COLORS[t] || "#8a8a7a";

// Cottage decorations shop
const SHOP_ITEMS = [
  { id:"smoke",    label:"Chimney Smoke",  cost:10, emoji:"💨", desc:"A cosy fire inside" },
  { id:"cat",      label:"Window Cat",     cost:15, emoji:"🐱", desc:"A sleepy cat watching the world" },
  { id:"flowers",  label:"Window Boxes",   cost:20, emoji:"🌸", desc:"Pink flowers on every sill" },
  { id:"mailbox",  label:"Garden Mailbox", cost:25, emoji:"📮", desc:"A red mailbox by the gate" },
  { id:"lantern",  label:"Door Lantern",   cost:30, emoji:"🏮", desc:"A warm light by the door" },
  { id:"garden",   label:"Flower Garden",  cost:40, emoji:"🌻", desc:"Sunflowers and lavender" },
  { id:"birdbath", label:"Bird Bath",      cost:50, emoji:"🐦", desc:"Birds visiting daily" },
  { id:"tree",     label:"Apple Tree",     cost:60, emoji:"🍎", desc:"A gnarled old apple tree" },
  { id:"rainbow",  label:"Rainbow",        cost:80, emoji:"🌈", desc:"After the rain, colour" },
  { id:"moon",     label:"Moon & Stars",   cost:100,emoji:"🌙", desc:"A magical night sky" },
];

const BADGES = [
  { id:"firstdump",  label:"First Breath",     emoji:"🌬️", desc:"Completed your first brain dump", check: s => s.totalDumps >= 1 },
  { id:"lettogo3",   label:"Open Hands",        emoji:"🤲", desc:"Let go of 3 tasks",               check: s => s.totalLetGo >= 3 },
  { id:"lettogo10",  label:"The Releaser",      emoji:"🕊️", desc:"Let go of 10 tasks",              check: s => s.totalLetGo >= 10 },
  { id:"streak3",    label:"3-Day Ritual",      emoji:"🕯️", desc:"Brain dumped 3 days in a row",    check: s => s.currentStreak >= 3 },
  { id:"streak7",    label:"Week of Peace",     emoji:"🌿", desc:"Brain dumped 7 days in a row",    check: s => s.currentStreak >= 7 },
  { id:"points50",   label:"Breathing Room",    emoji:"🏡", desc:"Earned 50 breathing points",      check: s => s.totalPoints >= 50 },
  { id:"firstdeco",  label:"Homemaker",         emoji:"🛋️", desc:"Bought your first decoration",   check: s => s.totalPurchases >= 1 },
  { id:"deferred5",  label:"Not Today",         emoji:"📅", desc:"Deferred 5 tasks mindfully",      check: s => s.totalDeferred >= 5 },
];

const defaultTask = () => ({
  id: `t_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  title:"", notes:"", urgent:false,
  dueDate:"", dueDay:"", recurrence:"None",
  tags:[], reminder:"", done:false,
  createdAt: new Date().toISOString(),
});

const defaultStats = () => ({
  points:0, totalPoints:0, totalLetGo:0, totalDumps:0,
  totalDeferred:0, totalPurchases:0, currentStreak:0,
  lastDumpDate:"", earnedBadges:[], ownedDecos:[], lastToast:"",
});

// ── Local storage ──────────────────────────────────────────────────────────
function useLS(key, init) {
  const [v,setV] = useState(() => {
    try { const s=localStorage.getItem(key); return s?JSON.parse(s):init; } catch { return init; }
  });
  useEffect(()=>{ try{localStorage.setItem(key,JSON.stringify(v));}catch{} },[key,v]);
  return [v,setV];
}

// ── Today helpers ──────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];
const todayDayName = () => DAYS_SHORT[new Date().getDay()===0?6:new Date().getDay()-1];
const weekDates = () => {
  const today = new Date(); today.setHours(0,0,0,0);
  const dow = today.getDay()===0?6:today.getDay()-1;
  return Array.from({length:7},(_,i)=>{
    const d=new Date(today); d.setDate(d.getDate()-dow+i);
    return d.toISOString().split("T")[0];
  });
};

// ── Cottage SVG ────────────────────────────────────────────────────────────
function Cottage({ owned }) {
  const has = id => owned.includes(id);
  return (
    <svg viewBox="0 0 280 200" style={{width:"100%",maxWidth:320,filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.18))"}}>
      {/* Sky */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={has("moon")?"#1a1a3e":"#c8dff7"}/>
          <stop offset="100%" stopColor={has("moon")?"#2d2060":"#e8f4e8"}/>
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ab87a"/><stop offset="100%" stopColor="#5a9a5a"/>
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5ede0"/><stop offset="100%" stopColor="#e8d8c0"/>
        </linearGradient>
      </defs>
      <rect width="280" height="200" fill="url(#sky)" rx="12"/>
      {/* Moon & Stars */}
      {has("moon") && <>
        <circle cx="230" cy="30" r="18" fill="#fffbe6" opacity="0.95"/>
        <circle cx="242" cy="22" r="12" fill="#2d2060" opacity="0.9"/>
        {[200,160,120,250,80,220,140].map((x,i)=>
          <circle key={i} cx={x} cy={[15,25,12,35,20,45,8][i]} r="1.5" fill="#fff" opacity={0.6+i*0.05}/>
        )}
      </>}
      {/* Rainbow */}
      {has("rainbow") && [60,64,68,72,76].map((r,i)=>(
        <path key={i} d={`M 20 160 Q 140 ${160-r*2} 260 160`} fill="none"
          stroke={["#ff6b6b","#ffa94d","#ffd43b","#69db7c","#74c0fc"][i]} strokeWidth="4" opacity="0.7"/>
      ))}
      {/* Ground */}
      <rect x="0" y="155" width="280" height="45" fill="url(#grass)" rx="4"/>
      {/* Path */}
      <ellipse cx="140" cy="175" rx="18" ry="6" fill="#d4b896" opacity="0.6"/>
      <rect x="130" y="158" width="20" height="20" fill="#d4b896" opacity="0.5" rx="2"/>
      {/* Apple tree */}
      {has("tree") && <>
        <rect x="28" y="120" width="8" height="40" fill="#8b6540" rx="3"/>
        <circle cx="32" cy="110" r="22" fill="#5a9e5a" opacity="0.9"/>
        <circle cx="22" cy="118" r="4" fill="#e74c3c" opacity="0.9"/>
        <circle cx="38" cy="108" r="4" fill="#e74c3c" opacity="0.9"/>
        <circle cx="30" cy="122" r="3.5" fill="#e74c3c" opacity="0.9"/>
      </>}
      {/* Flower garden */}
      {has("garden") && <>
        {[20,30,40,48,56].map((x,i)=>(
          <g key={i}>
            <rect x={x+6} y={148} width="3" height="10" fill="#5a8a3a" rx="1"/>
            <circle cx={x+7} cy={148} r={5} fill={["#f4c95d","#e8a0bf","#9b8fd4","#f4a261","#7fc8a9"][i]}/>
          </g>
        ))}
        {[220,232,244,254,264].map((x,i)=>(
          <g key={i}>
            <rect x={x-2} y={148} width="3" height="10" fill="#5a8a3a" rx="1"/>
            <circle cx={x} cy={148} r={5} fill={["#9b8fd4","#f4c95d","#7fc8a9","#e8a0bf","#f4a261"][i]}/>
          </g>
        ))}
      </>}
      {/* Bird bath */}
      {has("birdbath") && <>
        <ellipse cx="248" cy="152" rx="12" ry="4" fill="#b0c8e0"/>
        <rect x="244" y="152" width="8" height="10" fill="#a09080" rx="1"/>
        <text x="242" y="150" fontSize="10">🐦</text>
      </>}
      {/* Main house wall */}
      <rect x="65" y="100" width="150" height="65" fill="url(#wall)" rx="3"/>
      {/* Roof */}
      <polygon points="55,105 140,45 225,105" fill="#c0544a"/>
      <polygon points="55,105 140,45 225,105" fill="#a84040" opacity="0.3"/>
      {/* Roof trim */}
      <line x1="55" y1="105" x2="225" y2="105" stroke="#8b3030" strokeWidth="2.5"/>
      {/* Chimney */}
      <rect x="170" y="55" width="22" height="38" fill="#b06050" rx="2"/>
      <rect x="167" y="52" width="28" height="8" fill="#c07060" rx="2"/>
      {/* Chimney smoke */}
      {has("smoke") && <>
        <path d="M178 50 Q174 38 180 28 Q186 18 182 8" fill="none" stroke="#d0d0c0" strokeWidth="4" strokeLinecap="round" opacity="0.7">
          <animate attributeName="d" values="M178 50 Q174 38 180 28 Q186 18 182 8;M178 50 Q184 38 178 28 Q172 18 178 8;M178 50 Q174 38 180 28 Q186 18 182 8" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="M184 50 Q180 40 186 32 Q192 24 188 14" fill="none" stroke="#d0d0c0" strokeWidth="3" strokeLinecap="round" opacity="0.5">
          <animate attributeName="d" values="M184 50 Q180 40 186 32 Q192 24 188 14;M184 50 Q190 40 184 32 Q178 24 184 14;M184 50 Q180 40 186 32 Q192 24 188 14" dur="4s" repeatCount="indefinite"/>
        </path>
      </>}
      {/* Door */}
      <rect x="118" y="128" width="24" height="37" fill="#8b5e3c" rx="3"/>
      <circle cx="138" cy="148" r="2.5" fill="#d4a040"/>
      <rect x="118" y="128" width="12" height="37" fill="#7a5030" rx="2" opacity="0.3"/>
      {/* Door lantern */}
      {has("lantern") && <>
        <rect x="112" y="124" width="6" height="10" fill="#c0a030" rx="1"/>
        <ellipse cx="115" cy="134" rx="5" ry="7" fill="#fffbe6" opacity="0.85"/>
        <ellipse cx="115" cy="134" rx="5" ry="7" fill="none" stroke="#c0a030" strokeWidth="1.5"/>
        <circle cx="115" cy="134" r="3" fill="#ffd700" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
      </>}
      {/* Windows */}
      <rect x="75" y="112" width="35" height="28" fill="#a8d8f0" rx="3"/>
      <rect x="170" y="112" width="35" height="28" fill="#a8d8f0" rx="3"/>
      <line x1="92" y1="112" x2="92" y2="140" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
      <line x1="75" y1="126" x2="110" y2="126" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
      <line x1="187" y1="112" x2="187" y2="140" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
      <line x1="170" y1="126" x2="205" y2="126" stroke="#fff" strokeWidth="1.5" opacity="0.6"/>
      {/* Window cat */}
      {has("cat") && <text x="172" y="138" fontSize="14">🐱</text>}
      {/* Window boxes */}
      {has("flowers") && <>
        <rect x="73" y="138" width="39" height="6" fill="#8b5e3c" rx="2"/>
        <text x="73" y="138" fontSize="12">🌸🌸🌸</text>
        <rect x="168" y="138" width="39" height="6" fill="#8b5e3c" rx="2"/>
        <text x="168" y="138" fontSize="12">🌸🌸🌸</text>
      </>}
      {/* Mailbox */}
      {has("mailbox") && <>
        <rect x="238" y="150" width="12" height="9" fill="#e03030" rx="2"/>
        <rect x="237" y="149" width="14" height="3" fill="#b02020" rx="1"/>
        <rect x="243" y="159" width="3" height="6" fill="#8b6040" rx="1"/>
        <text x="232" y="158" fontSize="10">📮</text>
      </>}
      {/* Smoke from chimney label */}
    </svg>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3000); return ()=>clearTimeout(t); },[onDone]);
  return (
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
      background:"#3a2a1a",color:"#f5e6c8",padding:"12px 22px",borderRadius:20,
      fontSize:14,fontFamily:"'Lora',Georgia,serif",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
      zIndex:1000,whiteSpace:"nowrap",animation:"fadeup 0.3s ease"}}>
      {msg}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useLS("mc_tasks_v2", []);
  const [stats, setStats] = useLS("mc_stats_v2", defaultStats());
  const [view, setView] = useState("today");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultTask());
  const [brainText, setBrainText] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [sortBy, setSortBy] = useState("urgent");
  const [customTag, setCustomTag] = useState("");
  const [toast, setToast] = useState("");
  const [dragOver, setDragOver] = useState(null);
  const [dragTask, setDragTask] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const titleRef = useRef();

  const showToast = useCallback(msg => setToast(msg), []);

  // Earn points helper
  const earn = useCallback((pts, reason) => {
    setStats(s => {
      const newTotal = s.totalPoints + pts;
      const newStats = { ...s, points: s.points + pts, totalPoints: newTotal };
      // Check badges
      const newBadges = BADGES.filter(b => !s.earnedBadges.includes(b.id) && b.check(newStats))
        .map(b => b.id);
      if (newBadges.length) newStats.earnedBadges = [...s.earnedBadges, ...newBadges];
      return newStats;
    });
    showToast(`+${pts} breathing points — ${reason} 🌿`);
  }, [setStats, showToast]);

  // Reminders
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      tasks.forEach(t => {
        if (t.reminder && !t.done) {
          const rem = new Date(t.reminder);
          if (rem <= now && rem > new Date(now - 60000)) {
            if (Notification.permission === "granted")
              new Notification("MindClear", { body: t.title });
          }
        }
      });
    }, 30000);
    return () => clearInterval(iv);
  }, [tasks]);

  useEffect(() => { if (Notification.permission==="default") Notification.requestPermission(); }, []);

  // ── Task actions ───────────────────────────────────────────────────────
  const openNew = () => { setForm(defaultTask()); setEditId(null); setShowForm(true); setTimeout(()=>titleRef.current?.focus(),60); };
  const openEdit = t => { setForm({...t}); setEditId(t.id); setShowForm(true); };

  const saveTask = () => {
    if (!form.title.trim()) return;
    if (editId) {
      setTasks(p => p.map(t => t.id===editId ? {...form} : t));
    } else {
      setTasks(p => [{...form, id:`t_${Date.now()}`}, ...p]);
    }
    setShowForm(false);
  };

  const toggleDone = id => setTasks(p => p.map(t => t.id===id ? {...t, done:!t.done} : t));
  const toggleUrgent = id => setTasks(p => p.map(t => t.id===id ? {...t, urgent:!t.urgent} : t));

  const letGoTask = id => {
    setTasks(p => p.filter(t => t.id!==id));
    setStats(s => ({ ...s, totalLetGo: s.totalLetGo+1 }));
    earn(8, "you let something go");
  };

  const deferTask = (id, toDate) => {
    setTasks(p => p.map(t => t.id===id ? {...t, dueDate:toDate, dueDay:""} : t));
    setStats(s => ({ ...s, totalDeferred: s.totalDeferred+1 }));
    earn(5, "deferred mindfully");
  };

  const doBrainDump = () => {
    const lines = brainText.split("\n").map(l=>l.trim()).filter(Boolean);
    if (!lines.length) return;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const newTasks = lines.map(title => ({ ...defaultTask(), title, id:`t_${Date.now()}_${Math.random().toString(36).slice(2)}` }));
    setTasks(p => [...newTasks, ...p]);

    // Streak logic
    setStats(s => {
      const last = s.lastDumpDate;
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate()-1);
      const yStr = yesterday.toISOString().split("T")[0];
      const streak = last===yStr ? s.currentStreak+1 : last===today ? s.currentStreak : 1;
      return { ...s, totalDumps: s.totalDumps+1, lastDumpDate: today, currentStreak: streak };
    });
    earn(10, "brain dump done");
    setBrainText("");
    setView("all");
  };

  const buyDeco = item => {
    if (stats.points < item.cost) { showToast("Not enough points yet 🌱"); return; }
    if (stats.ownedDecos.includes(item.id)) { showToast("Already in your cottage!"); return; }
    setStats(s => ({ ...s, points: s.points-item.cost, ownedDecos:[...s.ownedDecos,item.id], totalPurchases:s.totalPurchases+1 }));
    showToast(`${item.emoji} ${item.label} added to your cottage!`);
  };

  // ── Drag to reschedule ─────────────────────────────────────────────────
  const onDragStart = (e, taskId) => { setDragTask(taskId); e.dataTransfer.effectAllowed="move"; };
  const onDragOver = (e, date) => { e.preventDefault(); setDragOver(date); };
  const onDrop = (e, date) => {
    e.preventDefault();
    if (dragTask) { setTasks(p => p.map(t => t.id===dragTask ? {...t, dueDate:date, dueDay:""} : t)); }
    setDragTask(null); setDragOver(null);
  };

  // ── Filtering ──────────────────────────────────────────────────────────
  const today = todayISO();
  const todayDay = todayDayName();
  const wDates = weekDates();

  const activeTasks = tasks.filter(t => !t.done);
  const todayTasks = activeTasks.filter(t =>
    t.dueDate===today || t.dueDay===todayDay || t.recurrence==="Daily" || t.urgent
  );

  const filteredList = (view==="done" ? tasks.filter(t=>t.done) : activeTasks)
    .filter(t => !filterTag || t.tags.includes(filterTag))
    .sort((a,b) => {
      if (sortBy==="urgent") return (b.urgent?1:0)-(a.urgent?1:0);
      if (sortBy==="due") return (a.dueDate||"z").localeCompare(b.dueDate||"z");
      return new Date(b.createdAt)-new Date(a.createdAt);
    });

  const earnedBadges = BADGES.filter(b => stats.earnedBadges.includes(b.id));
  const nextBadges = BADGES.filter(b => !stats.earnedBadges.includes(b.id)).slice(0,3);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;600;700&display=swap');
        @keyframes fadeup { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        * { box-sizing:border-box; margin:0; padding:0; }
        input,select,textarea,button { font-family:'Nunito',sans-serif; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#c8b89a; border-radius:4px; }
        input[type=date],input[type=datetime-local] { color-scheme: light; }
      `}</style>

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div>
            <div style={S.logo}>MindClear</div>
            <div style={S.tagline}>Breathe out. Let it go.</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <div style={S.pointsChip} onClick={()=>setShowShop(true)}>
              🌿 {stats.points} pts
            </div>
            <button style={S.addBtn} onClick={openNew}>+ Task</button>
          </div>
        </div>

        {/* Nav */}
        <div style={S.nav}>
          {[
            {id:"today", label:`Today${todayTasks.length?` (${todayTasks.length})`:""}` },
            {id:"all",   label:"All"},
            {id:"week",  label:"Week"},
            {id:"brain", label:"🧠 Dump"},
            {id:"cottage",label:"🏡 Home"},
            {id:"done",  label:"Done"},
          ].map(v=>(
            <button key={v.id} style={{...S.navBtn,...(view===v.id?S.navActive:{})}} onClick={()=>setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tag strip (not on special views) ── */}
      {!["brain","cottage","week"].includes(view) && (
        <div style={S.tagStrip}>
          <button style={{...S.tagPill,background:!filterTag?"#c8b89a":"#f0ebe0",color:!filterTag?"#fff":"#7a6a5a"}}
            onClick={()=>setFilterTag(null)}>All</button>
          {PRESET_TAGS.map(tag=>(
            <button key={tag} style={{...S.tagPill,background:filterTag===tag?getTagColor(tag):"#f0ebe0",color:filterTag===tag?"#fff":"#6a5a4a"}}
              onClick={()=>setFilterTag(filterTag===tag?null:tag)}>{tag}</button>
          ))}
        </div>
      )}

      {/* ── Sort bar ── */}
      {["today","all","done"].includes(view) && (
        <div style={S.sortBar}>
          <span style={S.sortLabel}>Sort:</span>
          {[["urgent","Urgency"],["due","Due Date"],["created","Added"]].map(([k,l])=>(
            <button key={k} style={{...S.sortBtn,...(sortBy===k?S.sortActive:{})}} onClick={()=>setSortBy(k)}>{l}</button>
          ))}
          {activeTasks.filter(t=>t.urgent).length>0 &&
            <span style={S.urgentBadge}>🔴 {activeTasks.filter(t=>t.urgent).length} urgent</span>}
        </div>
      )}

      {/* ── VIEWS ── */}

      {/* Brain dump */}
      {view==="brain" && (
        <div style={S.brainBox}>
          <div style={S.brainIcon}>🧠</div>
          <h2 style={S.brainTitle}>Morning Brain Dump</h2>
          <p style={S.brainSub}>Don't organise. Don't prioritise. Just empty your mind — one thought per line.<br/>You'll earn <strong>10 points</strong> just for doing this. That's all it takes.</p>
          <textarea style={S.brainArea} rows={12} value={brainText}
            placeholder={"Call Emma's school\nPay the electricity bill\nEmail Sarah re: meeting\nBook Mum's GP appointment\nGet milk\nFix the dripping tap..."} 
            onChange={e=>setBrainText(e.target.value)}/>
          <button style={{...S.saveBtn,marginTop:12}} onClick={doBrainDump} disabled={!brainText.trim()}>
            ✨ Empty my mind & earn 10 points
          </button>
          {stats.currentStreak>0 && (
            <div style={S.streakBanner}>🕯️ {stats.currentStreak}-day ritual streak — keep going</div>
          )}
        </div>
      )}

      {/* Cottage */}
      {view==="cottage" && (
        <div style={S.cottageView}>
          <div style={S.cottageTitle}>Your Cosy Cottage</div>
          <div style={S.cottageSubtitle}>Every task you let go, every brain dump — earns a little more peace.</div>
          <Cottage owned={stats.ownedDecos}/>
          <div style={S.pointsDisplay}>🌿 {stats.points} breathing points to spend</div>
          <button style={S.shopBtn} onClick={()=>setShowShop(true)}>Open Decoration Shop</button>

          {/* Badges */}
          <div style={S.badgesSection}>
            <div style={S.badgesTitle}>Your Badges</div>
            {earnedBadges.length===0 && <p style={S.badgesEmpty}>Complete your first brain dump to earn a badge 🌱</p>}
            <div style={S.badgeGrid}>
              {earnedBadges.map(b=>(
                <div key={b.id} style={S.badgeChip} title={b.desc}>
                  <span style={{fontSize:22}}>{b.emoji}</span>
                  <span style={S.badgeLabel}>{b.label}</span>
                </div>
              ))}
            </div>
            {nextBadges.length>0 && (
              <div style={S.nextBadges}>
                <div style={S.nextBadgesTitle}>Within reach:</div>
                {nextBadges.map(b=>(
                  <div key={b.id} style={S.nextBadge}>{b.emoji} <em>{b.label}</em> — {b.desc}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly view */}
      {view==="week" && (
        <div style={S.weekView}>
          <div style={S.weekHeader}>
            <div style={S.weekTitle}>This Week</div>
            <div style={S.weekSub}>Drag a task card to reschedule it</div>
          </div>
          <div style={S.weekGrid}>
            {wDates.map((date,i)=>{
              const dayLabel = DAYS_SHORT[i];
              const isToday = date===today;
              const dayTasks = activeTasks.filter(t =>
                t.dueDate===date ||
                (!t.dueDate && t.dueDay===dayLabel) ||
                (t.recurrence==="Daily") ||
                (t.recurrence==="Weekly" && t.dueDay===dayLabel)
              );
              const load = dayTasks.length;
              const loadColor = load===0?"#e8f4e8":load<=2?"#d4edda":load<=4?"#fff3cd":load<=6?"#ffe0b2":"#ffcdd2";
              return (
                <div key={date} style={{...S.dayCol,background:dragOver===date?"#e8f0e8":loadColor,border:isToday?"2px solid #7ab87a":"2px solid transparent"}}
                  onDragOver={e=>onDragOver(e,date)} onDrop={e=>onDrop(e,date)} onDragLeave={()=>setDragOver(null)}>
                  <div style={{...S.dayLabel,...(isToday?{color:"#3a7a3a",fontWeight:700}:{})}}>
                    {dayLabel}
                    <span style={S.dayDate}>{date.slice(5).replace("-","/")}</span>
                  </div>
                  <div style={S.dayLoad}>
                    {load===0?"Free 🎉":load===1?"1 task":`${load} tasks`}
                  </div>
                  <div style={S.dayTasks}>
                    {dayTasks.map(t=>(
                      <div key={t.id} draggable style={S.weekTaskChip}
                        onDragStart={e=>onDragStart(e,t.id)}>
                        {t.urgent&&<span style={{color:"#e05050",marginRight:3}}>●</span>}
                        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                        <button style={S.weekLetGo} onClick={()=>letGoTask(t.id)} title="Let go (+8pts)">✕</button>
                      </div>
                    ))}
                  </div>
                  {/* Free time estimate */}
                  <div style={S.freeTime}>
                    {load>=5?"⚠️ Overloaded":load>=3?"🟡 Busy":load>=1?"🟢 Manageable":"✨ Open day"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task list views */}
      {["today","all","done"].includes(view) && (
        <div style={S.list}>
          {filteredList.length===0 && (
            <div style={S.empty}>
              {view==="today"?"Nothing due today — breathe 🌿":view==="done"?"No completed tasks yet":"No tasks. Add something or do a brain dump."}
            </div>
          )}
          {filteredList.map(t=>(
            <TaskCard key={t.id} task={t}
              onToggle={toggleDone} onLetGo={letGoTask} onDefer={deferTask}
              onToggleUrgent={toggleUrgent} onEdit={openEdit} today={today}/>
          ))}
        </div>
      )}

      {/* ── Task Form Modal ── */}
      {showForm && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>{editId?"Edit Task":"New Task"}</span>
              <button style={S.closeBtn} onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <input ref={titleRef} style={S.input} placeholder="What needs to be done?" value={form.title}
              onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveTask()}/>
            <textarea style={{...S.input,...S.textarea}} placeholder="Notes, details, links..." rows={3}
              value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            <label style={S.checkRow}>
              <input type="checkbox" checked={form.urgent} onChange={e=>setForm(f=>({...f,urgent:e.target.checked}))}/>
              <span style={{fontSize:14,fontWeight:600,color:form.urgent?"#c04040":"#5a4a3a"}}>
                {form.urgent?"🔴 Urgent":"Mark as urgent"}
              </span>
            </label>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}>
                <div style={S.fieldLabel}>Due Date</div>
                <input type="date" style={S.input} value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
              </div>
              <div style={{flex:1}}>
                <div style={S.fieldLabel}>Or Day of Week</div>
                <select style={S.input} value={form.dueDay} onChange={e=>setForm(f=>({...f,dueDay:e.target.value}))}>
                  <option value="">— any day —</option>
                  {DAYS_SHORT.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={S.fieldLabel}>Repeats</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {RECURRENCE.map(r=>(
                <button key={r} style={{...S.recBtn,...(form.recurrence===r?S.recActive:{})}} onClick={()=>setForm(f=>({...f,recurrence:r}))}>{r}</button>
              ))}
            </div>
            <div style={S.fieldLabel}>Reminder</div>
            <input type="datetime-local" style={S.input} value={form.reminder} onChange={e=>setForm(f=>({...f,reminder:e.target.value}))}/>
            <div style={S.fieldLabel}>Tags</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {PRESET_TAGS.map(tag=>(
                <button key={tag} onClick={()=>setForm(f=>({...f,tags:f.tags.includes(tag)?f.tags.filter(x=>x!==tag):[...f.tags,tag]}))}
                  style={{...S.tagToggle,background:form.tags.includes(tag)?getTagColor(tag):"#f0ebe0",color:form.tags.includes(tag)?"#fff":"#6a5a4a"}}>
                  {tag}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input style={{...S.input,flex:1,marginBottom:0}} placeholder="Custom tag..." value={customTag}
                onChange={e=>setCustomTag(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(customTag.trim()&&!form.tags.includes(customTag.trim()))setForm(f=>({...f,tags:[...f.tags,customTag.trim()]}));setCustomTag("");}}}/>
              <button style={S.customTagBtn} onClick={()=>{if(customTag.trim()&&!form.tags.includes(customTag.trim()))setForm(f=>({...f,tags:[...f.tags,customTag.trim()]}));setCustomTag("");}}>Add</button>
            </div>
            {form.tags.filter(t=>!PRESET_TAGS.includes(t)).map(t=>(
              <span key={t} style={S.customChip}>{t}
                <button style={{background:"none",border:"none",cursor:"pointer",color:"#8b6040",marginLeft:4}}
                  onClick={()=>setForm(f=>({...f,tags:f.tags.filter(x=>x!==t)}))}>✕</button>
              </span>
            ))}
            <button style={{...S.saveBtn,marginTop:12}} onClick={saveTask}>{editId?"Save Changes":"Add Task"}</button>
          </div>
        </div>
      )}

      {/* ── Shop Modal ── */}
      {showShop && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowShop(false)}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>🏡 Cottage Shop</span>
              <button style={S.closeBtn} onClick={()=>setShowShop(false)}>✕</button>
            </div>
            <div style={{color:"#8a7a6a",fontSize:13,marginBottom:12}}>You have <strong>{stats.points} points</strong>. Earn more by letting go and brain dumping each morning.</div>
            <div style={S.shopGrid}>
              {SHOP_ITEMS.map(item=>{
                const owned = stats.ownedDecos.includes(item.id);
                const canAfford = stats.points >= item.cost;
                return (
                  <div key={item.id} style={{...S.shopItem,...(owned?S.shopOwned:{})}}>
                    <div style={{fontSize:28}}>{item.emoji}</div>
                    <div style={S.shopName}>{item.label}</div>
                    <div style={S.shopDesc}>{item.desc}</div>
                    <div style={S.shopCost}>{item.cost} pts</div>
                    <button style={{...S.shopBuy,...(!canAfford&&!owned?S.shopCantAfford:{}),...(owned?S.shopBuyOwned:{})}}
                      onClick={()=>buyDeco(item)} disabled={owned}>
                      {owned?"✓ Added":"Buy"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}

      {/* Bottom padding for mobile */}
      <div style={{height:40}}/>
    </div>
  );
}

// ── Task Card ──────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onLetGo, onDefer, onToggleUrgent, onEdit, today }) {
  const [expanded, setExpanded] = useState(false);
  const [showDefer, setShowDefer] = useState(false);
  const isOverdue = task.dueDate && task.dueDate < today && !task.done;

  const nextWeek = () => { const d=new Date(); d.setDate(d.getDate()+7); return d.toISOString().split("T")[0]; };
  const tomorrow = () => { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };

  return (
    <div style={{...S.card,...(task.urgent?S.cardUrgent:{}),...(task.done?S.cardDone:{}),...(isOverdue?S.cardOverdue:{})}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <button style={{...S.circle,...(task.done?S.circleDone:{})}} onClick={()=>onToggle(task.id)}>
          {task.done&&<span style={{color:"#fff",fontSize:13,lineHeight:1}}>✓</span>}
        </button>
        <div style={{flex:1,cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
          <div style={{...S.cardTitle,...(task.done?S.cardDone2:{})}}>
            {task.urgent&&!task.done&&<span style={{color:"#d04040",marginRight:4}}>●</span>}
            {task.title}
            {task.recurrence!=="None"&&<span style={S.recChip}>↻ {task.recurrence}</span>}
          </div>
          <div style={S.cardMeta}>
            {task.dueDate&&<span style={{...S.metaChip,...(isOverdue?S.metaOverdue:{})}}>📅 {task.dueDate}</span>}
            {task.dueDay&&!task.dueDate&&<span style={S.metaChip}>📅 {task.dueDay}s</span>}
            {task.reminder&&<span style={S.metaChip}>⏰ {new Date(task.reminder).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"})}</span>}
            {task.tags.map(tag=>(
              <span key={tag} style={{...S.metaTag,color:getTagColor(tag),background:getTagColor(tag)+"18",border:`1px solid ${getTagColor(tag)}33`}}>{tag}</span>
            ))}
          </div>
          {expanded&&task.notes&&<div style={S.cardNotes}>{task.notes}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
          <button style={S.actBtn} onClick={()=>onEdit(task)} title="Edit">✏️</button>
          <button style={S.actBtn} onClick={()=>onToggleUrgent(task.id)} title="Toggle urgent">{task.urgent?"🔕":"🔴"}</button>
          <button style={S.actBtn} onClick={()=>setShowDefer(s=>!s)} title="Defer (+5pts)">📅</button>
          <button style={{...S.actBtn,color:"#c05050"}} onClick={()=>onLetGo(task.id)} title="Let go (+8pts)">🤲</button>
        </div>
      </div>
      {showDefer&&(
        <div style={S.deferPanel}>
          <span style={{fontSize:12,color:"#8a7a6a",fontWeight:600}}>Defer to:</span>
          <button style={S.deferBtn} onClick={()=>{onDefer(task.id,tomorrow());setShowDefer(false);}}>Tomorrow</button>
          <button style={S.deferBtn} onClick={()=>{onDefer(task.id,nextWeek());setShowDefer(false);}}>Next week</button>
          <button style={S.deferBtn} onClick={()=>setShowDefer(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  root:       { fontFamily:"'Lora',Georgia,serif", background:"#f5f0e8", minHeight:"100vh", maxWidth:760, margin:"0 auto", paddingBottom:60 },
  header:     { background:"linear-gradient(160deg,#3a5a3a 0%,#5a8a5a 60%,#7aaa6a 100%)", padding:"24px 20px 0", color:"#fff" },
  headerInner:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 },
  logo:       { fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, color:"#fff", letterSpacing:"-0.3px" },
  tagline:    { fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:13, color:"#c0e0b0", marginTop:2 },
  pointsChip: { background:"rgba(255,255,255,0.2)", color:"#fff", padding:"5px 12px", borderRadius:16, fontSize:13, fontWeight:700, cursor:"pointer", border:"1px solid rgba(255,255,255,0.3)" },
  addBtn:     { background:"#fff", color:"#4a7a4a", border:"none", borderRadius:18, padding:"8px 18px", fontWeight:700, cursor:"pointer", fontSize:13, boxShadow:"0 2px 8px rgba(0,0,0,0.15)" },
  nav:        { display:"flex", gap:2, overflowX:"auto" },
  navBtn:     { background:"none", border:"none", color:"#b0d0a0", padding:"9px 12px", cursor:"pointer", fontSize:12, fontWeight:600, borderRadius:"6px 6px 0 0", whiteSpace:"nowrap" },
  navActive:  { background:"#f5f0e8", color:"#3a5a3a", fontWeight:700 },
  tagStrip:   { display:"flex", gap:6, padding:"10px 14px", overflowX:"auto", background:"#fff", borderBottom:"1px solid #e8e0d0" },
  tagPill:    { border:"none", borderRadius:14, padding:"4px 11px", fontSize:11, cursor:"pointer", whiteSpace:"nowrap", fontWeight:600 },
  sortBar:    { display:"flex", gap:6, alignItems:"center", padding:"8px 14px", background:"#f5f0e8", borderBottom:"1px solid #e8e0d0" },
  sortLabel:  { fontSize:11, color:"#9a8a7a", marginRight:4 },
  sortBtn:    { background:"none", border:"1px solid #d0c8b8", borderRadius:12, padding:"3px 10px", fontSize:11, cursor:"pointer", color:"#7a6a5a" },
  sortActive: { background:"#5a8a5a", color:"#fff", borderColor:"#5a8a5a" },
  urgentBadge:{ marginLeft:"auto", fontSize:11, color:"#c04040", fontWeight:700 },

  // Brain dump
  brainBox:    { padding:"28px 20px", maxWidth:600, margin:"0 auto" },
  brainIcon:   { fontSize:40, marginBottom:8 },
  brainTitle:  { fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:"#3a4a3a", marginBottom:6 },
  brainSub:    { color:"#7a8a7a", fontSize:14, lineHeight:1.6, marginBottom:16 },
  brainArea:   { width:"100%", border:"1.5px solid #c8d8b8", borderRadius:10, padding:14, fontSize:14, lineHeight:1.8, resize:"vertical", outline:"none", color:"#3a4a3a", background:"#fcfaf6", fontFamily:"'Nunito',sans-serif" },
  streakBanner:{ marginTop:12, background:"#e8f4e0", color:"#4a7a4a", padding:"10px 16px", borderRadius:10, fontSize:13, textAlign:"center", fontStyle:"italic" },

  // Cottage
  cottageView:   { padding:"20px 16px", maxWidth:500, margin:"0 auto", textAlign:"center" },
  cottageTitle:  { fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:"#3a4a3a", marginBottom:4 },
  cottageSubtitle:{ color:"#8a7a6a", fontSize:13, fontStyle:"italic", marginBottom:16, lineHeight:1.5 },
  pointsDisplay: { fontSize:18, fontWeight:700, color:"#4a7a4a", margin:"12px 0" },
  shopBtn:       { background:"#5a8a5a", color:"#fff", border:"none", borderRadius:20, padding:"10px 24px", fontSize:14, cursor:"pointer", fontWeight:700, marginBottom:20 },
  badgesSection: { textAlign:"left", marginTop:16 },
  badgesTitle:   { fontSize:15, fontWeight:700, color:"#3a4a3a", marginBottom:8 },
  badgesEmpty:   { color:"#9a8a7a", fontSize:13, fontStyle:"italic" },
  badgeGrid:     { display:"flex", flexWrap:"wrap", gap:8 },
  badgeChip:     { background:"#fff", border:"1.5px solid #c8d8b8", borderRadius:12, padding:"8px 12px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:80 },
  badgeLabel:    { fontSize:11, color:"#5a7a5a", fontWeight:700, textAlign:"center" },
  nextBadges:    { marginTop:14, background:"#f0f5ec", borderRadius:10, padding:"10px 14px" },
  nextBadgesTitle:{ fontSize:12, color:"#7a8a7a", fontWeight:700, marginBottom:6 },
  nextBadge:     { fontSize:13, color:"#5a6a5a", marginBottom:4, lineHeight:1.5 },

  // Week
  weekView:  { padding:"12px" },
  weekHeader:{ marginBottom:10 },
  weekTitle: { fontFamily:"'Lora',serif", fontSize:20, fontWeight:700, color:"#3a4a3a" },
  weekSub:   { fontSize:12, color:"#8a7a6a", fontStyle:"italic" },
  weekGrid:  { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 },
  dayCol:    { borderRadius:10, padding:"8px 6px", minHeight:160, transition:"background 0.2s" },
  dayLabel:  { fontSize:12, fontWeight:700, color:"#5a6a5a", textAlign:"center", marginBottom:2 },
  dayDate:   { display:"block", fontSize:10, color:"#9a8a7a", fontWeight:400 },
  dayLoad:   { fontSize:10, color:"#7a8a7a", textAlign:"center", marginBottom:6 },
  dayTasks:  { display:"flex", flexDirection:"column", gap:3 },
  weekTaskChip:{ background:"rgba(255,255,255,0.85)", borderRadius:6, padding:"4px 6px", fontSize:10, cursor:"grab", display:"flex", alignItems:"center", gap:3, boxShadow:"0 1px 3px rgba(0,0,0,0.1)" },
  weekLetGo: { background:"none", border:"none", color:"#c08060", cursor:"pointer", fontSize:10, padding:0, flexShrink:0 },
  freeTime:  { marginTop:6, fontSize:9, textAlign:"center", color:"#7a7a6a" },

  // Task list
  list:  { padding:"10px 12px" },
  empty: { textAlign:"center", padding:40, color:"#9a8a7a", fontSize:15, fontStyle:"italic" },
  card:  { background:"#fff", borderRadius:12, marginBottom:8, padding:"12px 10px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"1.5px solid transparent" },
  cardUrgent: { borderColor:"#f0b0a0", background:"#fff8f6" },
  cardDone:   { opacity:0.5 },
  cardOverdue:{ borderColor:"#e0c060", background:"#fffbf0" },
  circle:     { width:24, height:24, borderRadius:"50%", border:"2px solid #c0c8b0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 },
  circleDone: { background:"#7ab87a", borderColor:"#7ab87a" },
  cardTitle:  { fontSize:14, fontWeight:600, color:"#2a3a2a", lineHeight:1.35, marginBottom:5 },
  cardDone2:  { textDecoration:"line-through", color:"#b0a090" },
  recChip:    { marginLeft:7, fontSize:10, background:"#e8f0e0", color:"#5a8a5a", borderRadius:10, padding:"1px 7px" },
  cardMeta:   { display:"flex", flexWrap:"wrap", gap:4 },
  metaChip:   { fontSize:10, background:"#f0ebe0", borderRadius:10, padding:"2px 8px", color:"#7a6a5a" },
  metaOverdue:{ background:"#fff3c8", color:"#8a6a20" },
  metaTag:    { fontSize:10, borderRadius:10, padding:"2px 8px", fontWeight:600 },
  cardNotes:  { marginTop:8, fontSize:12, color:"#7a6a5a", lineHeight:1.55, background:"#f8f4ec", borderRadius:6, padding:"7px 9px" },
  actBtn:     { background:"none", border:"none", cursor:"pointer", fontSize:13, padding:2, borderRadius:4 },
  deferPanel: { display:"flex", gap:6, alignItems:"center", marginTop:8, paddingTop:8, borderTop:"1px solid #e8e0d0", flexWrap:"wrap" },
  deferBtn:   { background:"#f0ebe0", border:"none", borderRadius:14, padding:"4px 12px", fontSize:12, cursor:"pointer", color:"#5a4a3a" },

  // Form
  overlay:    { position:"fixed", inset:0, background:"rgba(40,30,20,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 },
  modal:      { background:"#fdf9f3", borderRadius:"18px 18px 0 0", padding:"22px 18px 32px", width:"100%", maxWidth:720, maxHeight:"90vh", overflowY:"auto" },
  modalHead:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 },
  modalTitle: { fontFamily:"'Lora',serif", fontSize:18, fontWeight:700, color:"#2a3a2a" },
  closeBtn:   { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9a8a7a" },
  input:      { width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #d8d0c0", fontSize:14, outline:"none", marginBottom:10, color:"#3a3028", background:"#fff", fontFamily:"'Nunito',sans-serif" },
  textarea:   { resize:"vertical" },
  checkRow:   { display:"flex", alignItems:"center", gap:8, marginBottom:12, cursor:"pointer" },
  fieldLabel: { fontSize:11, fontWeight:700, color:"#7a9a7a", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 },
  recBtn:     { border:"1.5px solid #d0c8b8", background:"#f5f0e8", borderRadius:16, padding:"5px 12px", fontSize:12, cursor:"pointer", color:"#5a4a3a" },
  recActive:  { background:"#5a8a5a", color:"#fff", borderColor:"#5a8a5a" },
  tagToggle:  { border:"none", borderRadius:14, padding:"5px 11px", fontSize:12, cursor:"pointer", fontWeight:600 },
  customTagBtn:{ background:"#5a8a5a", color:"#fff", border:"none", borderRadius:8, padding:"0 14px", cursor:"pointer", fontWeight:700 },
  customChip: { display:"inline-flex", alignItems:"center", background:"#e8f0e0", color:"#3a6a3a", borderRadius:12, padding:"3px 10px", fontSize:12, margin:"2px 4px 2px 0" },
  saveBtn:    { width:"100%", background:"linear-gradient(135deg,#4a7a4a,#3a5a3a)", color:"#fff", border:"none", borderRadius:10, padding:14, fontSize:15, cursor:"pointer", fontWeight:700, fontFamily:"'Nunito',sans-serif" },

  // Shop
  shopGrid:   { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 },
  shopItem:   { background:"#fff", borderRadius:12, padding:"12px 10px", textAlign:"center", border:"1.5px solid #e0d8c8" },
  shopOwned:  { background:"#f0f8f0", borderColor:"#a0c8a0" },
  shopName:   { fontSize:13, fontWeight:700, color:"#3a4a3a", marginTop:4 },
  shopDesc:   { fontSize:11, color:"#8a7a6a", margin:"4px 0 6px", lineHeight:1.4 },
  shopCost:   { fontSize:12, fontWeight:700, color:"#5a8a5a", marginBottom:6 },
  shopBuy:    { background:"#5a8a5a", color:"#fff", border:"none", borderRadius:14, padding:"5px 16px", fontSize:12, cursor:"pointer", fontWeight:700 },
  shopCantAfford:{ background:"#c8c0b0", cursor:"default" },
  shopBuyOwned:  { background:"#a0c8a0", cursor:"default" },
};
