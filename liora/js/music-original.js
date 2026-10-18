// Liora Studio · base musical instrumental integrada, sin servicios externos.
// Composición original programática para La Reina del Eclipse. NO es voz cantada
// ni sustituye la maqueta MP3 elaborada fuera de la aplicación.
import { sliceToWav } from './media.js';

export const ECLIPSE_TITLE = 'La Reina del Eclipse — instrumental integrado';
export async function buildEclipseInstrumental() {
  const rate = 32000, seconds = 28, bpm = 112;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Offline) throw new Error('Safari no admite síntesis de audio sin conexión.');
  const ctx = new Offline(1, Math.ceil(seconds * rate), rate);
  const master = ctx.createGain(); master.gain.value = 0.53; master.connect(ctx.destination);
  const beat = 60 / bpm;
  function note(freq, start, duration, volume, kind='sine') {
    const end = Math.min(seconds, start + duration);
    if (start >= seconds || end <= start) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = kind; osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    // Para percusión de 25 ms, el ataque nunca debe sobrepasar el fin de la nota.
    const attackEnd = start + Math.min(0.012, (end - start) * 0.35);
    const decayStart = Math.min(end - 0.002, Math.max(attackEnd, end - 0.22));
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), attackEnd);
    gain.gain.setTargetAtTime(0.0001, decayStart, Math.max(0.004, (end - decayStart) / 5));
    osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(end);
  }
  const chords = [[174.61,220,261.63],[130.81,164.81,196],[155.56,196,233.08],[116.54,146.83,174.61]];
  const bass = [87.31,65.41,77.78,58.27];
  for (let i=0;i<Math.ceil(seconds/(beat*4));i++) {
    const start = i*beat*4, chord=chords[i%4];
    for (const f of chord) { note(f,start,beat*3.85,.095,'triangle'); note(f*2,start+beat*2,beat*1.7,.028,'sine'); }
    for (let j=0;j<4;j++) {
      const at=start+j*beat;
      note(bass[i%4],at,beat*.65,.20,'sine');
      note(57,at,.12,.13,'sine');
      if(j%2===1) note(185,at,.075,.047,'square');
      note(7000,at,.025,.006,'triangle');
      note(2500,at+beat/2,.025,.005,'triangle');
    }
    const melody=[0,2,1,2,0,1,2,1];
    for(let k=0;k<8;k++) {
      const t=start+k*beat/2, f=chord[melody[k]]* (k%4===3?4:2);
      note(f,t,beat*.4,.068,'sine');
    }
  }
  const buffer = await ctx.startRendering();
  return sliceToWav(buffer, 0, seconds, rate);
}
