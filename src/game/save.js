// İlerleme kaydı (tarayıcının yerel deposu)
const KEY = 'lumiere-satosu-kayit-v1';

export function freshSave(){
  return {
    version:1, started:false, met:false, finished:false,
    runes:{yakut:false, safir:false, zumrut:false, altin:false, ametist:false},
    coins:[], elapsed:0, best:null, bestCoins:0,
    player:{x:0, y:0, z:-14, yaw:0}, mounted:false, horse:null,
    weather:'gunesli', notes:{yakutRain:false, gateDay:false, captainTries:0},
    sword:{blade:'uzun', guard:'hac', material:'celik', gem:'yakut'},
  };
}
export function loadSettings(){
  try { return Object.assign({music:0.5, sfx:0.8, quality:'yuksek', sens:1}, JSON.parse(localStorage.getItem(KEY + '-ayar') || '{}')); }
  catch { return {music:0.5, sfx:0.8, quality:'yuksek', sens:1}; }
}
export function saveSettings(s){ try { localStorage.setItem(KEY + '-ayar', JSON.stringify(s)); } catch {} }
export function loadGame(){
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.version === 1 ? Object.assign(freshSave(), s) : null; }
  catch { return null; }
}
export function saveGame(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
export function clearGame(){ try { const old = loadGame(); localStorage.removeItem(KEY); return old; } catch { return null; } }
