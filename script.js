const targetDate = new Date('2026-11-30T23:59:59-07:00').getTime();
const launchStart = new Date('2026-11-11T00:00:00-07:00').getTime();
const timerEls = {days: document.querySelector('#days'), hours: document.querySelector('#hours'), minutes: document.querySelector('#minutes'), seconds: document.querySelector('#seconds')};
const progress = document.querySelector('#progress');
const sequence = document.querySelector('#sequence');
const note = document.querySelector('#countdownNote');
function pad(value, digits=2){return String(Math.max(0, value)).padStart(digits, '0')}
function updateCountdown(){
  const now = Date.now(); const distance = Math.max(0, targetDate - now);
  const totalSeconds = Math.floor(distance / 1000); const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600); const minutes = Math.floor(totalSeconds % 3600 / 60); const seconds = totalSeconds % 60;
  timerEls.days.textContent = pad(days,3); timerEls.hours.textContent = pad(hours); timerEls.minutes.textContent = pad(minutes); timerEls.seconds.textContent = pad(seconds);
  const elapsed = Math.min(1, Math.max(0, (now-launchStart)/(targetDate-launchStart))); progress.style.width = `${Math.max(4, elapsed*100)}%`;
  if(distance <= 0){sequence.textContent='DESPEGUE CONFIRMADO'; note.textContent='La ventana de lanzamiento se ha abierto. ¡Andrómeda 4 despegó!';}
  else if(distance < 60000){sequence.textContent='IGNICIÓN INMINENTE';}
  else if(distance < 3600000){sequence.textContent='SECUENCIA FINAL';}
}
updateCountdown(); setInterval(updateCountdown,1000);

let audioContext; let soundEnabled = false; let lastSecond = -1; let musicTimer; let musicStep = 0;
function tone(frequency, duration=.12, type='sine', volume=.035){
  if(!audioContext || !soundEnabled) return; const oscillator=audioContext.createOscillator(); const gain=audioContext.createGain();
  oscillator.type=type; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(volume,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
  oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration);
}
function playActivationSequence(){
  if(!audioContext || !soundEnabled) return;
  [0, 260, 520].forEach((delay, index)=>setTimeout(()=>tone(index===2?880:520,.22,'square',.055),delay));
}
function musicTone(frequency, duration, type='triangle', volume=.012){
  if(!audioContext || !soundEnabled) return;
  const oscillator=audioContext.createOscillator(); const gain=audioContext.createGain();
  oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,audioContext.currentTime);
  gain.gain.setValueAtTime(.001,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(volume,audioContext.currentTime+.025); gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
  oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration+.03);
}
function musicBeat(){
  if(!soundEnabled) return;
  const scale=[220,261.63,329.63,392,329.63,261.63,246.94,329.63]; const bass=[110,110,130.81,146.83];
  musicTone(scale[musicStep%scale.length],.24,'triangle',.010);
  if(musicStep%2===0) musicTone(bass[(musicStep/2)%bass.length],.34,'sine',.016);
  if(musicStep%4===0) musicTone(55,.08,'square',.025);
  musicStep++; musicTimer=setTimeout(musicBeat,290);
}
function startMusic(){clearTimeout(musicTimer); musicStep=0; musicBeat();}
function stopMusic(){clearTimeout(musicTimer); musicTimer=null;}
function countdownAudio(){
  const remaining=Math.floor((targetDate-Date.now())/1000); if(remaining<0) return;
  const near=remaining%10; if(remaining<11 && near!==lastSecond){tone(near===0?880:440,.18,'square',.04);lastSecond=near;}
}
setInterval(countdownAudio,100);
document.querySelector('#soundToggle').addEventListener('click',async()=>{
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if(!AudioEngine){ note.textContent='Este navegador no permite reproducir audio Web Audio.'; return; }
  audioContext ||= new AudioEngine();
  if(audioContext.state === 'suspended') await audioContext.resume();
  soundEnabled=!soundEnabled;
  const button=document.querySelector('#soundToggle'); button.classList.toggle('active',soundEnabled); button.setAttribute('aria-pressed',soundEnabled); button.innerHTML=soundEnabled?'<span class="sound-icon">◉</span> AUDIO ACTIVO':'<span class="sound-icon">◉</span> ACTIVAR AUDIO';
  note.textContent=soundEnabled?'Audio de cuenta regresiva activo. La señal final sonará durante los últimos 10 segundos.':'Activa el audio para escuchar la señal sonora de la cuenta regresiva.';
  if(soundEnabled){ playActivationSequence(); setTimeout(startMusic,700); }
  else stopMusic();
});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{document.querySelector('#toast').textContent='TRAYECTORIA CARGADA';document.querySelector('#toast').classList.add('show');setTimeout(()=>document.querySelector('#toast').classList.remove('show'),1800)}));
