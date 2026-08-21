export type TranscriptSegment = {
  start: number;
  duration: number;
  text: string;
};

export type TranscriptGroup = {
  start: number;
  end: number;
  text: string;
};

export function timestamp(seconds: number, includeHours = false) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const base = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return includeHours || hours > 0 ? `${String(hours).padStart(2, "0")}:${base}` : base;
}

function srtTimestamp(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

export function plainTranscript(segments: TranscriptSegment[]) {
  return segments.map(segment => segment.text.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function toTxt(segments: TranscriptSegment[]) {
  return segments.map(segment => `[${timestamp(segment.start, true)}] ${segment.text.trim()}`).join("\n");
}

export function toSrt(segments: TranscriptSegment[]) {
  return segments.map((segment, index) => {
    const end = segment.start + Math.max(segment.duration, 0.5);
    return `${index + 1}\n${srtTimestamp(segment.start)} --> ${srtTimestamp(end)}\n${segment.text.trim()}`;
  }).join("\n\n");
}

export function groupTranscript(segments: TranscriptSegment[]): TranscriptGroup[] {
  return segments.reduce<TranscriptGroup[]>((groups, segment) => {
    const text = segment.text.trim();
    if (!text) return groups;
    const end = segment.start + Math.max(segment.duration, 0.5);
    const last = groups.at(-1);
    const startsNewGroup = !last || segment.start - last.end > 4.5 || last.text.length + text.length > 330;
    if (startsNewGroup) groups.push({ start: segment.start, end, text });
    else { last.end = end; last.text = `${last.text} ${text}`; }
    return groups;
  }, []);
}
