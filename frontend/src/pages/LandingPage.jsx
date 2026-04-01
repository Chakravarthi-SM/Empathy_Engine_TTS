import { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPage from "./ChatPage";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Geist+Mono:wght@300;400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root{
  --bg:#020305;
  --s1:#05070c;
  --s2:#080c14;
  --b1:#0f1520;
  --b2:#172030;
  --b3:#1e2d42;
  --txt:#eef2f7;
  --txt-dim:#8a9bb5;
  --muted:#3d5068;
  --dim:#1a2535;

  --ac:#5eb8e0;
  --ac-dk:#2a6f92;
  --ac-glow:rgba(94,184,224,0.18);
  --ac-glow-soft:rgba(94,184,224,0.06);
  --ac-line:rgba(94,184,224,0.12);

  --gold:#c8a96e;
  --gold-dim:rgba(200,169,110,0.08);
}

/* GRAIN TEXTURE */
.root::before {
  content:'';
  position:fixed;
  inset:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  opacity:0.028;
  pointer-events:none;
  z-index:100;
}

.root{
  background:var(--bg);
  color:var(--txt);
  font-family:'Geist Mono',monospace;
  width:100vw; height:100vh; overflow:hidden;
  display:grid; grid-template-rows:auto 1fr auto;
  position:relative;
}

/* MULTI-LAYER AMBIENT */
.ambient{
  position:absolute;
  border-radius:50%;
  pointer-events:none;
  width:1100px; height:1100px;
  top:40%; left:62%;
  transform:translate(-50%,-50%);
  background:radial-gradient(
    ellipse,
    rgba(94,184,224,0.055) 0%,
    rgba(94,184,224,0.022) 30%,
    transparent 68%
  );
  animation:breathe 8s ease-in-out infinite;
  filter:blur(1px);
}
.ambient::after{
  content:'';
  position:absolute;
  inset:-200px;
  border-radius:50%;
  background:radial-gradient(
    ellipse,
    rgba(42,111,146,0.04) 0%,
    transparent 60%
  );
  animation:breathe 12s 2s ease-in-out infinite reverse;
}

/* DIAGONAL GRID LINES */
.root::after{
  content:'';
  position:fixed;
  inset:0;
  background-image:
    linear-gradient(var(--ac-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--ac-line) 1px, transparent 1px);
  background-size:80px 80px;
  opacity:0.35;
  pointer-events:none;
  mask-image:radial-gradient(ellipse 80% 80% at 70% 50%, rgba(0,0,0,0.15) 0%, transparent 70%);
  z-index:1;
}

@keyframes breathe{0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}}

/* ── NAV ───────────────────────────────────── */
.nav{
  display:flex; align-items:center; justify-content:space-between;
  padding:20px 56px;
  border-bottom:1px solid var(--b1);
  position:relative; z-index:10;
  background:linear-gradient(180deg, rgba(2,3,5,0.95) 0%, transparent 100%);
  animation:dn .8s cubic-bezier(.16,1,.3,1) both;
}
.nav::after{
  content:'';
  position:absolute;
  bottom:-1px; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, var(--ac-dk), transparent);
  opacity:0.6;
}

.brand{display:flex; align-items:center; gap:12px;}
.brand-dot{
  width:7px; height:7px; border-radius:50%;
  background:var(--ac);
  box-shadow:0 0 10px var(--ac), 0 0 20px rgba(94,184,224,0.4);
  animation:dp 3s ease-in-out infinite;
}
@keyframes dp{0%,100%{opacity:.4;transform:scale(1);box-shadow:0 0 6px var(--ac)}50%{opacity:1;transform:scale(1.3);box-shadow:0 0 14px var(--ac),0 0 28px rgba(94,184,224,0.5)}}

.brand-name{
  font-size:10px; color:var(--txt);
  letter-spacing:.22em; font-weight:400;
}
.brand-name span{color:var(--ac); opacity:0.8;}

.nav-r{display:flex; align-items:center; gap:16px;}

.nav-badge{
  font-size:8.5px; color:var(--muted); letter-spacing:.12em;
  padding:5px 12px;
  border:1px solid var(--b2);
  border-radius:2px;
  background:var(--s1);
}

.nav-btn{
  font-size:9.5px; color:var(--ac); letter-spacing:.12em;
  padding:7px 20px;
  border:1px solid var(--ac-dk);
  border-radius:3px;
  background:var(--ac-glow-soft);
  cursor:pointer; transition:all .25s;
  font-family:'Geist Mono',monospace;
  position:relative; overflow:hidden;
}
.nav-btn::before{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(135deg, transparent 40%, rgba(94,184,224,0.08) 100%);
  opacity:0; transition:opacity .25s;
}
.nav-btn:hover{
  background:rgba(94,184,224,0.1);
  border-color:var(--ac);
  box-shadow:0 0 16px rgba(94,184,224,0.2), inset 0 0 16px rgba(94,184,224,0.04);
  color:#a8d8ee;
}
.nav-btn:hover::before{opacity:1;}

.nav-btn2{
  font-size:11px; color:var(--ac); letter-spacing:.08em;
  padding:11px 28px;
  border:1px solid var(--ac-dk);
  border-radius:3px;
  cursor:pointer; transition:all .25s;
  font-family:'Geist Mono',monospace;
  background:var(--ac-glow-soft);
  position:relative; overflow:hidden;
  margin-top:36px;
}
.nav-btn2::after{
  content:'';
  position:absolute;
  bottom:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, var(--ac), transparent);
  transform:scaleX(0); transition:transform .3s;
}
.nav-btn2:hover{
  background:rgba(94,184,224,0.1);
  border-color:var(--ac);
  box-shadow:0 0 20px rgba(94,184,224,0.18), 0 4px 30px rgba(94,184,224,0.08);
  color:#a8d8ee;
}
.nav-btn2:hover::after{transform:scaleX(1);}

/* ── BODY ──────────────────────────────────── */
.body{
  display:grid; grid-template-columns:1fr 1px 1fr;
  overflow:hidden; position:relative; z-index:5;
}
.vline{
  background:linear-gradient(
    180deg,
    transparent 0%,
    var(--b2) 20%,
    var(--ac-dk) 50%,
    var(--b2) 80%,
    transparent 100%
  );
  opacity:0.5;
}

/* ── LEFT ──────────────────────────────────── */
.left{
  display:flex; flex-direction:column; justify-content:center;
  padding:0 64px 0 56px;
  animation:up .9s .08s cubic-bezier(.16,1,.3,1) both;
}

.eyebrow{display:flex; align-items:center; gap:12px; margin-bottom:32px;}
.ey-line{
  width:28px; height:1px;
  background:linear-gradient(90deg, transparent, var(--ac-dk));
}
.ey-txt{
  font-size:8.5px; color:var(--ac); letter-spacing:.28em;
  text-transform:uppercase; opacity:0.85;
}

.h1{
  font-family:'Cormorant Garamond',serif;
  font-weight:300;
  font-size:clamp(50px,5vw,82px);
  line-height:.9;
  letter-spacing:-.025em;
  color:var(--txt);
  margin-bottom:28px;
}
.h1 span{
  color:transparent;
  -webkit-text-stroke:1px rgba(238,242,247,0.18);
  font-style:italic;
  display:block;
}

.sub{
  font-size:10.5px; color:var(--txt-dim);
  max-width:360px;
  line-height:2.1; letter-spacing:.03em;
  margin-bottom:32px; font-weight:300;
}

.chips{display:flex; gap:7px; flex-wrap:wrap;}
.chip{
  display:inline-flex; align-items:center; gap:6px;
  padding:5px 12px; border-radius:2px; border:1px solid;
  font-size:8.5px; letter-spacing:.12em; text-transform:uppercase;
  transition:all .22s; cursor:default;
  backdrop-filter:blur(4px);
}
.chip:hover{
  transform:translateY(-1px);
  box-shadow:0 4px 16px rgba(0,0,0,0.3);
}
.cdot{width:4px; height:4px; border-radius:50%; flex-shrink:0;}

/* ── RIGHT ─────────────────────────────────── */
.right{
  display:flex; flex-direction:column; justify-content:center;
  padding:0 56px 0 64px; gap:20px;
  animation:up .9s .2s cubic-bezier(.16,1,.3,1) both;
}

/* WAVE CARD */
.wcard{
  border:1px solid var(--b2);
  border-radius:6px;
  background:linear-gradient(135deg, var(--s1) 0%, var(--s2) 100%);
  cursor:pointer; transition:all .3s; overflow:hidden;
  position:relative;
  box-shadow:0 0 0 1px rgba(94,184,224,0.04), inset 0 1px 0 rgba(94,184,224,0.06);
}
.wcard::before{
  content:'';
  position:absolute;
  top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent 10%, var(--ac-dk) 50%, transparent 90%);
  opacity:0.7;
}
.wcard:hover{
  border-color:var(--b3);
  box-shadow:0 0 30px rgba(94,184,224,0.07), 0 8px 30px rgba(0,0,0,0.4);
  transform:translateY(-1px);
}

.wtop{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 20px 0;
}
.wstatus{display:flex; align-items:center; gap:8px; font-size:8.5px; color:var(--txt-dim); letter-spacing:.1em;}
.sdot{width:5px; height:5px; border-radius:50%;}
.sdot.live{
  background:var(--ac);
  box-shadow:0 0 6px var(--ac);
  animation:lp 1.8s ease-in-out infinite;
}
.sdot.off{background:var(--muted);}
@keyframes lp{0%,100%{opacity:.2;box-shadow:none}50%{opacity:1;box-shadow:0 0 8px var(--ac)}}

.wdur{font-size:8.5px; color:var(--muted); letter-spacing:.08em;}

.wbars{
  display:flex; align-items:center; gap:2.5px;
  height:60px; padding:10px 20px 16px;
}
.bar{
  flex-shrink:0; width:2px; border-radius:2px;
  transform-origin:center;
  background:linear-gradient(to top, var(--ac-dk), var(--ac));
  filter:drop-shadow(0 0 3px rgba(94,184,224,0.4));
}
.bar.on{animation:bb var(--d) var(--dl) ease-in-out infinite;}
.bar.off{opacity:.1; filter:none;}
@keyframes bb{
  0%,100%{transform:scaleY(1);opacity:.45}
  38%{transform:scaleY(.15);opacity:.8}
  66%{transform:scaleY(1.12);opacity:.6}
}

/* FEATURE LIST */
.feats{
  display:flex; flex-direction:column; gap:1px;
  background:var(--b1);
  border:1px solid var(--b2);
  border-radius:6px; overflow:hidden;
  box-shadow:0 0 0 1px rgba(94,184,224,0.03);
}
.feat{
  display:flex; align-items:flex-start; gap:18px;
  padding:20px 22px;
  background:var(--s1);
  transition:background .25s, border-left-color .25s;
  animation:fi .5s ease both;
  border-left:2px solid transparent;
  position:relative;
}
.feat::after{
  content:'';
  position:absolute;
  right:0; top:50%; transform:translateY(-50%);
  width:1px; height:50%;
  background:linear-gradient(180deg, transparent, var(--ac-dk), transparent);
  opacity:0; transition:opacity .25s;
}
.feat:nth-child(1){animation-delay:.38s}
.feat:nth-child(2){animation-delay:.52s}
.feat:nth-child(3){animation-delay:.66s}
.feat:hover{background:var(--s2); border-left-color:var(--ac-dk);}
.feat:hover::after{opacity:0.5;}

.fnum{
  font-size:8.5px; color:var(--ac-dk); letter-spacing:.12em;
  margin-top:3px; flex-shrink:0; min-width:20px;
  font-weight:500;
}
.ftitle{
  font-family:'Cormorant Garamond',serif;
  font-size:17px; font-weight:400;
  color:var(--txt); margin-bottom:5px;
  letter-spacing:-.01em;
}
.fdesc{
  font-size:9.5px; color:var(--txt-dim);
  line-height:1.9; letter-spacing:.025em; font-weight:300;
}

/* ── FOOTER ────────────────────────────────── */
.footer{
  display:flex; align-items:center; justify-content:space-between;
  padding:13px 56px;
  border-top:1px solid var(--b1);
  position:relative; z-index:10;
  background:linear-gradient(0deg, rgba(2,3,5,0.95) 0%, transparent 100%);
  animation:up .6s .42s cubic-bezier(.16,1,.3,1) both;
}
.footer::before{
  content:'';
  position:absolute;
  top:-1px; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, var(--b3), transparent);
  opacity:0.8;
}

.fl{display:flex; align-items:center; gap:16px;}
.flabel{font-size:8.5px; color:var(--muted); letter-spacing:.1em; text-transform:uppercase;}
.fsep{width:1px; height:10px; background:var(--b2);}
.fstack{display:flex; gap:8px;}
.fitem{
  font-size:8.5px; color:var(--muted); padding:3px 8px;
  border:1px solid var(--b2); border-radius:2px; letter-spacing:.06em;
}
.fr{font-size:8.5px; color:var(--b3); letter-spacing:.08em;}

/* ── KEYFRAMES ─────────────────────────────── */
@keyframes up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes dn{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
`;

const WAVES = [.28,.55,.85,.45,.75,.38,.95,.58,.68,.28,.88,.48,.72,.38,.65,.55,.28,.75,.95,.45,.38,.85,.55,.65,.28,.75,.45,.95,.35,.55,.65,.28,.85,.45,.75,.38];

const CHIPS = [
  { label:"Happy",      color:"#7ec8a4" },
  { label:"Frustrated", color:"#d08080" },
  { label:"Calm",       color:"#5eb8e0" },
  { label:"Urgent",     color:"#b8a0d8" },
];

const FEATS = [
  { n:"01", title:"Emotion Detection",  desc:"Classifies text across nuanced states — joy, frustration, calm, urgency — with intensity scoring." },
  { n:"02", title:"Vocal Modulation",   desc:"Maps detected emotion to pitch, rate and volume. Synthesis that mirrors human affect." },
  { n:"03", title:"Audio Output",       desc:"High-fidelity .wav or .mp3 output — resonance that builds trust beyond monotonic TTS." },
];

export default function App() {
  const [playing, setPlaying] = useState(true);
  const navigate = useNavigate();
  return (
    <>
      <style>{css}</style>
      <div className="root">
        <div className="ambient" />

        <nav className="nav">
          <div className="brand">
            <div className="brand-dot" />
            <span className="brand-name">EMPATHY <span>ENGINE</span></span>
          </div>
          <div className="nav-r">
            <span className="nav-badge">v1.0 · Beta</span>
            <button className="nav-btn" onClick={() => navigate("/app")}>
              Get Started
            </button>
          </div>
        </nav>

        <div className="body">
          <div className="left">
            <div className="eyebrow">
              <div className="ey-line" />
              <span className="ey-txt">AI Voice Synthesis</span>
            </div>

            <h1 className="h1">
              Voice<br />that<br /><span>understands.</span>
            </h1>

            <p className="sub">
              Speech synthesis that goes beyond words — detecting emotion in text and shaping every vocal nuance to match it.
            </p>

            <div className="chips">
              {CHIPS.map(c => (
                <span key={c.label} className="chip"
                  style={{ borderColor:`${c.color}30`, background:`${c.color}0e`, color:c.color }}>
                  <span className="cdot" style={{ background:c.color, boxShadow:`0 0 5px ${c.color}` }} />
                  {c.label}
                </span>
              ))}
            </div>

            <button className="nav-btn2" onClick={() => navigate("/app")}>
              Get Started
            </button>
          </div>

          <div className="vline" />

          <div className="right">
            <div className="wcard" onClick={() => setPlaying(p => !p)}>
              <div className="wtop">
                <div className="wstatus">
                  <div className={`sdot ${playing ? "live" : "off"}`} />
                  <span>{playing ? "LIVE PREVIEW" : "PAUSED"}</span>
                </div>
                <span className="wdur">2.4s · happy.wav</span>
              </div>
              <div className="wbars">
                {WAVES.map((h, i) => (
                  <div key={i}
                    className={`bar ${playing ? "on" : "off"}`}
                    style={{
                      height:`${Math.round(h * 44)}px`,
                      "--d":`${(1.1 + (i % 6) * 0.14).toFixed(2)}s`,
                      "--dl":`${(i * 0.033).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="feats">
              {FEATS.map(f => (
                <div key={f.n} className="feat">
                  <span className="fnum">{f.n}</span>
                  <div>
                    <p className="ftitle">{f.title}</p>
                    <p className="fdesc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="footer">
          <div className="fl">
            <span className="flabel">Empathy Engine : Real-Time Emotion-Aware Voice System for Support and Sales Automation</span>
            <div className="fsep" />
          </div>
          <span className="fr">© 2026 Empathy Engine. Built by CHAKRAVARTHI. All rights reserved.</span>
        </footer>
      </div>
    </>
  );
}