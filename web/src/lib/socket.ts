import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const rawUrl = (import.meta as any).env?.VITE_API_URL || (window.location.port === '3000' ? 'http://localhost:4000' : window.location.origin);
    const socketUrl = rawUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to live restaurant server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }

  return socket;
}

export function subscribeToEvent(event: string, callback: (...args: any[]) => void): () => void {
  const s = getSocket();
  s.on(event, callback);

  return () => {
    s.off(event, callback);
  };
}

export function playAudioAlert(soundType: 'chime' | 'ready' | 'order' = 'ready') {
  try {
    // Trigger mobile hardware vibration (works on Android & mobile browsers)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 350]);
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    // Master Volume Booster Gain Node
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.95, now); // Very loud, maximum safe headroom
    masterGain.connect(audioCtx.destination);

    if (soundType === 'order') {
      // 3-Tone Loud Urgent Restaurant Order Bell (A5 -> D6 -> G6)
      const notes = [
        { freq: 880.0, overtone: 1760.0, time: 0.0, dur: 0.35, vol: 0.90 },
        { freq: 1174.66, overtone: 2349.32, time: 0.22, dur: 0.35, vol: 0.95 },
        { freq: 1567.98, overtone: 3135.96, time: 0.46, dur: 0.9, vol: 0.98 },
      ];

      notes.forEach(({ freq, overtone, time, dur, vol }) => {
        // Fundamental Tone (Sine)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now + time);
        gain1.gain.setValueAtTime(0.001, now + time);
        gain1.gain.linearRampToValueAtTime(vol, now + time + 0.03);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now + time);
        osc1.stop(now + time + dur);

        // Harmonic Bright Overtone (Triangle)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(overtone, now + time);
        gain2.gain.setValueAtTime(0.001, now + time);
        gain2.gain.linearRampToValueAtTime(vol * 0.5, now + time + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + time + dur * 0.7);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now + time);
        osc2.stop(now + time + dur);
      });
    } else if (soundType === 'ready') {
      // 2-Tone Loud Resonant Kitchen Ready Chime (G5 -> C6)
      const notes = [
        { freq: 783.99, overtone: 1567.98, time: 0.0, dur: 0.4, vol: 0.92 },
        { freq: 1046.5, overtone: 2093.0, time: 0.22, dur: 0.85, vol: 0.95 },
      ];

      notes.forEach(({ freq, overtone, time, dur, vol }) => {
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now + time);
        gain1.gain.setValueAtTime(0.001, now + time);
        gain1.gain.linearRampToValueAtTime(vol, now + time + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now + time);
        osc1.stop(now + time + dur);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(overtone, now + time);
        gain2.gain.setValueAtTime(0.001, now + time);
        gain2.gain.linearRampToValueAtTime(vol * 0.45, now + time + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + time + dur * 0.6);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now + time);
        osc2.stop(now + time + dur);
      });
    } else {
      // Loud Metallic Success Chime (C6)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.90, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.warn('[AudioAlert] Audio playback warning:', e);
  }
}
