import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPage from "./ChatPage";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Space+Grotesk:wght@300;400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root{
  --bg:#000000;
  --bg2:#080808;
  --bg3:#0f0f0f;
  --bg4:#161616;
  --line:#1f1f1f;
  --line2:#2a2a2a;
  --muted:#3a3a3a;
  --dim:#5a5a5a;
  --mid:#888888;
  --txt:#f8f8f8;
  --txt2:#cccccc;
  --white:#ffffff;
}

.root{
  background:var(--bg);
  color:var(--txt);
  font-family:'Space Grotesk',sans-serif;
  width:100vw; height:100vh; overflow:hidden;
  display:grid; grid-template-rows:auto 1fr auto;
  position:relative;
}

/* SUBTLE DOT GRID */
.root::before{
  content:'';
  position:fixed; inset:0;
  background-image:radial-gradient(circle, #ffffff08 1px, transparent 1px);
  background-size:40px 40px;
  pointer-events:none;
  z-index:0;
}

/* BIG RADIAL LIGHT */
.ambient{
  position:fixed;
  width:900px; height:900px;
  top:50%; left:65%;
  transform:translate(-50%,-50%);
  background:radial-gradient(ellipse, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 35%, transparent 65%);
  pointer-events:none;
  z-index:1;
  animation:breathe 6s ease-in-out infinite;
}
@keyframes breathe{0%,100%{opacity:.6}50%{opacity:1}}

/* NAV */
.nav{
  display:flex; align-items:center; justify-content:space-between;
  padding:22px 60px;
  border-bottom:1px solid var(--line);
  position:relative; z-index:20;
  animation:dn .7s cubic-bezier(.16,1,.3,1) both;
}

.brand{display:flex; align-items:center; gap:12px;}
.brand-dot{
  width:8px; height:8px; border-radius:50%;
  background:var(--white);
  animation:pulse 2.5s ease-in-out infinite;
}
@keyframes pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}

.brand-name{
  font-size:11px; font-weight:500;
  color:var(--white); letter-spacing:.2em;
  text-transform:uppercase;
}

.nav-r{display:flex; align-items:center; gap:14px;}

.nav-badge{
  font-size:9px; color:var(--dim); letter-spacing:.12em;
  padding:5px 12px;
  border:1px solid var(--line2);
  border-radius:2px;
}

.nav-btn{
  font-size:10px; font-weight:500; letter-spacing:.1em;
  padding:8px 22px;
  border:1px solid var(--white);
  border-radius:2px;
  background:transparent;
  color:var(--white);
  cursor:pointer; transition:all .2s;
  font-family:'Space Grotesk',sans-serif;
  text-transform:uppercase;
}
.nav-btn:hover{
  background:var(--white);
  color:var(--bg);
}

/* BODY */
.body{
  display:grid; grid-template-columns:1fr 1px 1fr;
  overflow:hidden; position:relative; z-index:5;
}

.vline{
  background:linear-gradient(180deg, transparent 0%, var(--line2) 20%, var(--white) 50%, var(--line2) 80%, transparent 100%);
  opacity:0.2;
}

/* LEFT */
.left{
  display:flex; flex-direction:column; justify-content:center;
  padding:0 72px 0 60px;
  animation:up .9s .06s cubic-bezier(.16,1,.3,1) both;
}

.eyebrow{display:flex; align-items:center; gap:14px; margin-bottom:28px;}
.ey-line{width:32px; height:1px; background:var(--white); opacity:0.4;}
.ey-txt{
  font-size:9px; font-weight:400; color:var(--mid);
  letter-spacing:.3em; text-transform:uppercase;
}

.h1{
  font-family:'Cormorant Garamond',serif;
  font-weight:300;
  font-size:clamp(52px,5.2vw,86px);
  line-height:.88;
  letter-spacing:-.03em;
  color:var(--white);
  margin-bottom:30px;
}
.h1 em{
  display:block;
  font-style:italic;
  color:transparent;
  -webkit-text-stroke:1px rgba(255,255,255,0.35);
  letter-spacing:-.02em;
}

.sub{
  font-size:11px; color:var(--mid);
  max-width:380px; line-height:2; letter-spacing:.015em;
  margin-bottom:36px; font-weight:300;
}

.chips{display:flex; gap:8px; flex-wrap:wrap;}
.chip{
  display:inline-flex; align-items:center; gap:7px;
  padding:6px 14px; border-radius:2px;
  border:1px solid var(--line2);
  background:var(--bg2);
  font-size:9px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--mid);
  transition:all .2s;
}
.chip:hover{border-color:var(--muted); color:var(--txt2); background:var(--bg3);}
.cdot{width:4px; height:4px; border-radius:50%; flex-shrink:0; background:var(--white);}

.cta-btn{
  margin-top:38px;
  width:fit-content;
  font-size:10px; font-weight:500; letter-spacing:.12em;
  padding:13px 36px;
  border:1px solid var(--white);
  border-radius:2px;
  background:var(--white);
  color:var(--bg);
  cursor:pointer; transition:all .2s;
  font-family:'Space Grotesk',sans-serif;
  text-transform:uppercase;
  display:flex; align-items:center; gap:10px;
}
.cta-btn:hover{
  background:transparent;
  color:var(--white);
}
.cta-arrow{font-size:13px; transition:transform .2s;}
.cta-btn:hover .cta-arrow{transform:translateX(4px);}

/* RIGHT */
.right{
  display:flex; flex-direction:column; justify-content:center;
  padding:0 60px 0 72px; gap:18px;
  animation:up .9s .18s cubic-bezier(.16,1,.3,1) both;
}

/* WAVE CARD */
.wcard{
  border:1px solid var(--line2);
  border-radius:4px;
  background:var(--bg2);
  cursor:pointer; transition:all .25s;
  overflow:hidden; position:relative;
}
.wcard:hover{
  border-color:var(--muted);
  background:var(--bg3);
}
.wcard-top-line{
  position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent 5%, var(--white) 50%, transparent 95%);
  opacity:0.12;
}

.wtop{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 20px 0;
}
.wstatus{display:flex; align-items:center; gap:8px; font-size:9px; color:var(--dim); letter-spacing:.1em;}
.sdot{width:5px; height:5px; border-radius:50%;}
.sdot.live{background:var(--white); animation:lp 1.6s ease-in-out infinite;}
.sdot.off{background:var(--muted);}
@keyframes lp{0%,100%{opacity:.15}50%{opacity:1}}
.wdur{font-size:9px; color:var(--muted); letter-spacing:.08em;}

.wbars{
  display:flex; align-items:center; gap:2.5px;
  height:62px; padding:10px 20px 16px;
}
.bar{
  flex-shrink:0; width:2px; border-radius:2px;
  transform-origin:center;
  background:var(--white);
}
.bar.on{animation:bb var(--d) var(--dl) ease-in-out infinite;}
.bar.off{opacity:.07;}
@keyframes bb{
  0%,100%{transform:scaleY(1);opacity:.35}
  38%{transform:scaleY(.12);opacity:1}
  66%{transform:scaleY(1.1);opacity:.55}
}

/* FEATURES */
.feats{
  display:flex; flex-direction:column;
  border:1px solid var(--line2);
  border-radius:4px; overflow:hidden;
}
.feat{
  display:flex; align-items:flex-start; gap:20px;
  padding:20px 22px;
  background:var(--bg2);
  border-bottom:1px solid var(--line);
  transition:background .2s;
  animation:fi .5s ease both;
  position:relative;
  overflow:hidden;
}
.feat:last-child{border-bottom:none;}
.feat::before{
  content:'';
  position:absolute; left:0; top:0; bottom:0; width:2px;
  background:var(--white);
  transform:scaleY(0); transform-origin:bottom;
  transition:transform .3s cubic-bezier(.16,1,.3,1);
}
.feat:nth-child(1){animation-delay:.35s}
.feat:nth-child(2){animation-delay:.48s}
.feat:nth-child(3){animation-delay:.61s}
.feat:hover{background:var(--bg4);}
.feat:hover::before{transform:scaleY(1);}

.fnum{
  font-size:9px; color:var(--muted); letter-spacing:.1em;
  margin-top:3px; flex-shrink:0; min-width:22px; font-weight:400;
}
.ftitle{
  font-family:'Cormorant Garamond',serif;
  font-size:17px; font-weight:400;
  color:var(--white); margin-bottom:5px; letter-spacing:-.01em;
}
.fdesc{
  font-size:10px; color:var(--dim);
  line-height:1.85; letter-spacing:.02em; font-weight:300;
}

/* FOOTER */
.footer{
  display:flex; align-items:center; justify-content:space-between;
  padding:13px 60px;
  border-top:1px solid var(--line);
  position:relative; z-index:10;
  animation:up .6s .4s cubic-bezier(.16,1,.3,1) both;
}
.flabel{font-size:8.5px; color:var(--muted); letter-spacing:.1em; text-transform:uppercase;}
.fr{font-size:8.5px; color:var(--muted); letter-spacing:.07em;}

@keyframes up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes dn{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
`;

const WAVES = [.28,.55,.85,.45,.75,.38,.95,.58,.68,.28,.88,.48,.72,.38,.65,.55,.28,.75,.95,.45,.38,.85,.55,.65,.28,.75,.45,.95,.35,.55,.65,.28,.85,.45,.75,.38];

const CHIPS = [
  { label:"Happy" },
  { label:"Frustrated" },
  { label:"Calm" },
  { label:"Urgent" },
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
            <span className="brand-name">Empathy Engine</span>
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
              Voice<br />that<br /><em>understands.</em>
            </h1>

            <p className="sub">
              Speech synthesis that goes beyond words — detecting emotion in text and shaping every vocal nuance to match it.
            </p>

            <div className="chips">
              {CHIPS.map(c => (
                <span key={c.label} className="chip">
                  <span className="cdot" />
                  {c.label}
                </span>
              ))}
            </div>

            <button className="cta-btn" onClick={() => navigate("/app")}>
              Get Started <span className="cta-arrow">→</span>
            </button>
          </div>

          <div className="vline" />

          <div className="right">
            <div className="wcard" onClick={() => setPlaying(p => !p)}>
              <div className="wcard-top-line" />
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
          <span className="flabel">Empathy Engine · Real-Time Emotion-Aware Voice System</span>
          <span className="fr">© 2026 Empathy Engine. Built by CHAKRAVARTHI. All rights reserved.</span>
        </footer>
      </div>
    </>
  );
}