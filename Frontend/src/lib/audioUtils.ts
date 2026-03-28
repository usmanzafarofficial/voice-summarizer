/**
 * Voice compression / summarization audio utilities.
 * Used by Dashboard for fallback compression (no AI backend).
 */

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface AudioSegment {
  start: number;
  end: number;
  energy: number;
}

export function findAudioSegments(audioBuffer: AudioBuffer): AudioSegment[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.5);
  const silenceThreshold = 0.02;
  const segments: AudioSegment[] = [];
  let i = 0;

  while (i < channelData.length) {
    let energy = 0;
    const windowEnd = Math.min(i + windowSize, channelData.length);
    for (let j = i; j < windowEnd; j++) {
      energy += Math.abs(channelData[j]);
    }
    energy = energy / (windowEnd - i);

    if (energy > silenceThreshold) {
      let segmentEnd = i + windowSize;
      while (segmentEnd < channelData.length) {
        let nextEnergy = 0;
        const nextWindowEnd = Math.min(segmentEnd + windowSize, channelData.length);
        for (let j = segmentEnd; j < nextWindowEnd; j++) {
          nextEnergy += Math.abs(channelData[j]);
        }
        nextEnergy = nextEnergy / (nextWindowEnd - segmentEnd);
        if (nextEnergy < silenceThreshold) break;
        segmentEnd += windowSize;
      }
      segments.push({
        start: i,
        end: Math.min(segmentEnd, channelData.length),
        energy,
      });
      i = segmentEnd;
    } else {
      i += windowSize;
    }
  }
  return segments;
}

export function bufferToWav(buffer: AudioBuffer): Blob {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const wav = new ArrayBuffer(44 + length);
  const view = new DataView(wav);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }
  return new Blob([wav], { type: "audio/wav" });
}
