// Web Audio helpers — used by the mindfulness screen to generate ambient
// sounds and gentle bell tones without any external audio files (which
// Cerevision doesn't accept).

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export interface SoundHandle {
  stop: () => void
  fadeOut: (seconds?: number) => void
}

// A soft bell — sine + a bit of harmonic, exponential decay. Good for a
// meditation start/end chime.
export function playBell(baseHz = 528): void {
  const c = getCtx()
  const now = c.currentTime
  const master = c.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(0.35, now + 0.05)
  master.gain.exponentialRampToValueAtTime(0.001, now + 4)
  master.connect(c.destination)

  const partials = [
    { hz: baseHz, gain: 1 },
    { hz: baseHz * 2, gain: 0.35 },
    { hz: baseHz * 3, gain: 0.12 },
  ]
  for (const p of partials) {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = p.hz
    const g = c.createGain()
    g.gain.value = p.gain
    o.connect(g).connect(master)
    o.start(now)
    o.stop(now + 4.2)
  }
}

// Filtered white-noise "rain" texture — infinite loop until stop.
export function playRain(): SoundHandle {
  const c = getCtx()
  const bufferSize = 2 * c.sampleRate
  const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const output = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1

  const source = c.createBufferSource()
  source.buffer = noiseBuffer
  source.loop = true

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  filter.Q.value = 0.6

  const gain = c.createGain()
  gain.gain.value = 0.22

  source.connect(filter).connect(gain).connect(c.destination)
  source.start()

  return {
    stop() { try { source.stop() } catch {} },
    fadeOut(seconds = 2) {
      const t = c.currentTime
      gain.gain.setValueAtTime(gain.gain.value, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + seconds)
      setTimeout(() => { try { source.stop() } catch {} }, seconds * 1000 + 100)
    },
  }
}

// A slow evolving pad — two detuned sines with a gentle LFO on the filter.
export function playPad(rootHz = 220): SoundHandle {
  const c = getCtx()
  const master = c.createGain()
  master.gain.value = 0.18
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 800
  filter.Q.value = 1
  filter.connect(master).connect(c.destination)

  const voices = [rootHz, rootHz * 1.5, rootHz * 2].map(hz => {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = hz
    const g = c.createGain()
    g.gain.value = 1 / 3
    o.connect(g).connect(filter)
    o.start()
    return { o, g }
  })

  const lfo = c.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = c.createGain()
  lfoGain.gain.value = 250
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()

  return {
    stop() {
      for (const v of voices) { try { v.o.stop() } catch {} }
      try { lfo.stop() } catch {}
    },
    fadeOut(seconds = 2) {
      const t = c.currentTime
      master.gain.setValueAtTime(master.gain.value, t)
      master.gain.exponentialRampToValueAtTime(0.001, t + seconds)
      setTimeout(() => {
        for (const v of voices) { try { v.o.stop() } catch {} }
        try { lfo.stop() } catch {}
      }, seconds * 1000 + 100)
    },
  }
}

// Filtered pink-ish noise for a shhh/waves feel — slower LFO on volume.
export function playOcean(): SoundHandle {
  const c = getCtx()
  const bufferSize = 2 * c.sampleRate
  const buf = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buf.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5
  }
  const source = c.createBufferSource()
  source.buffer = buf
  source.loop = true

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 800

  const gain = c.createGain()
  gain.gain.value = 0.05

  const lfo = c.createOscillator()
  lfo.frequency.value = 0.15
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.15
  lfo.connect(lfoGain).connect(gain.gain)
  lfo.start()

  source.connect(filter).connect(gain).connect(c.destination)
  source.start()

  return {
    stop() { try { source.stop() } catch {}; try { lfo.stop() } catch {} },
    fadeOut(seconds = 2) {
      const t = c.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.001), t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + seconds)
      setTimeout(() => {
        try { source.stop() } catch {}
        try { lfo.stop() } catch {}
      }, seconds * 1000 + 100)
    },
  }
}

export type AmbientKind = 'rain' | 'pad' | 'ocean'
export function playAmbient(kind: AmbientKind): SoundHandle {
  if (kind === 'rain') return playRain()
  if (kind === 'ocean') return playOcean()
  return playPad()
}
