import { Braces, FileText, Play, Subtitles } from "lucide-react";
import { useMemo, useState } from "react";

type DemoFormat = "txt" | "srt" | "json";

type DemoSegment = {
  text: string;
  start: number;
  duration: number;
};

const DEMO_SEGMENTS: DemoSegment[] = [
  { start: 0, duration: 5.8, text: "At first light, the valley begins to change." },
  { start: 5.8, duration: 5.4, text: "A cool current moves through the grass, carrying the sound of water downhill." },
  { start: 11.2, duration: 6.1, text: "Small movements become easier to notice when the world is still." },
  { start: 17.3, duration: 5.7, text: "The pattern is simple: observe carefully, keep the useful detail, and return to the source." },
  { start: 23, duration: 6.4, text: "That is what a practical transcript makes possible for reading, research, and creative work." },
];

function timestamp(seconds: number, separator = ",") {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remaining = whole % 60;
  const millis = Math.round((seconds - whole) * 1000).toString().padStart(3, "0");
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}${separator}${millis}`;
}

function renderDemo(format: DemoFormat) {
  if (format === "srt") return DEMO_SEGMENTS.map((segment, index) => `${index + 1}\n${timestamp(segment.start)} --> ${timestamp(segment.start + segment.duration)}\n${segment.text}\n`).join("\n");
  if (format === "json") return JSON.stringify(DEMO_SEGMENTS, null, 2);
  return DEMO_SEGMENTS.map((segment) => segment.text).join(" ");
}

export default function InteractiveDemo() {
  const [format, setFormat] = useState<DemoFormat>("txt");
  const output = useMemo(() => renderDemo(format), [format]);
  const formats = [
    { id: "txt" as const, label: "View TXT", icon: FileText },
    { id: "srt" as const, label: "View SRT", icon: Subtitles },
    { id: "json" as const, label: "View JSON", icon: Braces },
  ];

  return (
    <section className="interactive-demo" aria-labelledby="interactive-demo-heading">
      <div className="interactive-demo-copy">
        <p className="eyebrow"><Play size={13} aria-hidden="true" /> Try a demo</p>
        <h2 id="interactive-demo-heading">See a transcript become a working document.</h2>
        <p>This instant, anonymized 30-second example is already loaded. Switch formats to see the difference between readable text, timed subtitles, and structured data—no link or network request required.</p>
      </div>
      <div className="interactive-demo-preview">
        <div className="interactive-demo-toolbar" role="group" aria-label="Choose demo transcript format">
          {formats.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={format === id ? "demo-format-button active" : "demo-format-button"} onClick={() => setFormat(id)} aria-pressed={format === id}><Icon size={15} aria-hidden="true" />{label}</button>)}
        </div>
        <pre className="interactive-demo-output" aria-live="polite"><code>{output}</code></pre>
        <p className="interactive-demo-footnote">Representative public-domain-style sample for preview only.</p>
      </div>
    </section>
  );
}
