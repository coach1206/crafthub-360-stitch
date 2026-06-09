/**
 * Web Audio API sound utilities — stamp sounds, tones, feedback.
 * Falls back silently on unsupported devices.
 */

function ctx() {
  try { return new (window.AudioContext || window.webkitAudioContext)() } catch { return null }
}

export function playStampSound() {
  try {
    const ac = ctx(); if (!ac) return
    const osc  = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(740, ac.currentTime + 0.09)
    gain.gain.setValueAtTime(0.18, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45)
    osc.start(); osc.stop(ac.currentTime + 0.5)
  } catch { /* silent */ }
}

export function playSuccessTone() {
  try {
    const ac = ctx(); if (!ac) return
    const notes = [440, 554, 659]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.frequency.value = freq; osc.type = 'sine'
      gain.gain.setValueAtTime(0, ac.currentTime + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + i * 0.1 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.35)
      osc.start(ac.currentTime + i * 0.1)
      osc.stop(ac.currentTime + i * 0.1 + 0.4)
    })
  } catch { /* silent */ }
}
