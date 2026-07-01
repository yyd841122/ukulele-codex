export function calculateRms(samples) {
  if (!samples.length) {
    return 0;
  }

  let sum = 0;
  for (const sample of samples) {
    sum += sample * sample;
  }

  return Math.sqrt(sum / samples.length);
}

export function removeDcOffset(samples) {
  if (!samples.length) {
    return new Float32Array();
  }

  let mean = 0;
  for (const sample of samples) {
    mean += sample;
  }
  mean /= samples.length;

  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = samples[i] - mean;
  }
  return out;
}

export function generateSineWave({
  frequencyHz,
  sampleRate = 44100,
  durationSec = 0.12,
  amplitude = 0.8
}) {
  const total = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate);
  }
  return samples;
}
