export type PseoSection = {
  heading: string;
  paragraphs: string[];
};

export type PseoPage = {
  path: string;
  keyword: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  audience: string;
  exampleLabel: string;
  exampleText: string;
  exampleNote: string;
  imageUrl: string;
  imageAlt: string;
  infographicLabel: string;
  sections: PseoSection[];
};

export const pseoPages: PseoPage[] = [
  {
    path: "/transcribe-youtube-podcast-to-srt",
    keyword: "convert YouTube podcast to SRT",
    title: "Transcribe a YouTube Podcast to SRT",
    description: "Convert available YouTube podcast captions into a clean SRT subtitle file for editing, review, accessibility, and content repurposing.",
    eyebrow: "Podcast to subtitle workflow",
    intro: "Turn a public YouTube podcast with available captions into a readable, timed SRT starting point for your editing workflow. TubeTranscriber keeps the words and timing together so you can review the file before importing it into your editor.",
    audience: "For podcasters, video editors, accessibility teams, and researchers who need a practical subtitle handoff.",
    exampleLabel: "Anonymized podcast caption example",
    exampleText: "[00:00:02,000] Welcome back to the show.\n[00:00:06,500] Today we are looking at the three decisions behind a stronger launch.\n[00:00:12,000] Keep the original question visible before you edit the answer.",
    exampleNote: "This short example shows the shape of timed captions; always review names, timing, and wording against the source video.",
    imageUrl: "/blog-images/download-transcript-of-youtube-video-for-editing.png",
    imageAlt: "Podcast transcript prepared as timed SRT subtitles for video editing",
    infographicLabel: "Infographic placeholder: a podcast waveform flows into clean numbered SRT subtitle cues, with a review step before editing.",
    sections: [
      { heading: "Start with the available caption track", paragraphs: ["Paste a public YouTube podcast link into the free transcript generator. The workflow can read standard watch links, Shorts, embeds, and video IDs when the source exposes captions.", "Caption availability is controlled by YouTube and can vary by video. A clean SRT export is a useful starting point, but it should be checked for names, punctuation, speaker changes, and timing before publication."] },
      { heading: "Why SRT helps podcast editors", paragraphs: ["SRT preserves numbered cues and start/end times, which makes it easier to review a long conversation while moving through a video timeline. Editors can use it for a rough subtitle pass, quote selection, or accessibility review.", "For a research-first workflow, download TXT as well. Plain text is faster to search and outline, while SRT keeps the timing needed for a later edit."] },
      { heading: "Review the file before importing it", paragraphs: ["Open the exported SRT and compare a few early, middle, and late cues with the video. Automatic captions may contain homophones, missing punctuation, or lines that depend on what the speaker is showing.", "Keep the original YouTube URL with the project file and add your own editorial judgment. Extracting captions creates a working document; it does not grant permission to republish the entire source."] },
    ],
  },
  {
    path: "/youtube-shorts-transcript-downloader",
    keyword: "get subtitles from YouTube Shorts",
    title: "YouTube Shorts Transcript Downloader",
    description: "Get available subtitles from a YouTube Short as searchable text, JSON data, or timed SRT captions for fast mobile content workflows.",
    eyebrow: "Short-form caption workflow",
    intro: "A YouTube Short can contain a useful hook, explanation, or call to action that is difficult to capture while scrolling. Use TubeTranscriber to turn available Short captions into a clean working document you can search, copy, and download.",
    audience: "For creators, social editors, researchers, and content repurposers working from short-form video.",
    exampleLabel: "Anonymized Shorts caption example",
    exampleText: "[00:00] Three ways to make the first sentence clearer.\n[00:04] Lead with the result, show one example, and remove the extra setup.\n[00:11] Save the full explanation for the longer version.",
    exampleNote: "The example is anonymized for illustration. Verify every important phrase against the original Short before using it in published work.",
    imageUrl: "/blog-images/how-to-read-the-transcript-of-a-youtube-video.jpeg",
    imageAlt: "Mobile-friendly YouTube Shorts transcript workflow with searchable caption text",
    infographicLabel: "Infographic placeholder: a vertical YouTube Short appears beside a clean TXT export, connected by a simple mobile workflow arrow.",
    sections: [
      { heading: "Paste a Shorts link and check captions", paragraphs: ["Use the complete Shorts URL or paste the eleven-character video ID. TubeTranscriber checks the public caption track exposed for that Short and presents it in a focused reader.", "Shorts often move quickly, so captions may include compressed wording or automatic recognition errors. Search the transcript for the hook, key claim, and call to action, then revisit the video for visual context."] },
      { heading: "Choose TXT, JSON, or SRT", paragraphs: ["TXT is ideal for collecting hooks and drafting a follow-up post. JSON keeps structured segments for a developer workflow, and SRT preserves timing when a Short is being edited or reviewed.", "The same available captions can support several outputs. Pick the format that matches the next action instead of manually copying the text into a new document."] },
      { heading: "Turn a Short into an original content brief", paragraphs: ["Use the transcript to identify the viewer problem, the promise, and the proof point. Then add a different example or perspective so the new piece is useful on its own.", "Keep the source URL and date beside your notes. A short transcript is easy to reuse responsibly when context and attribution stay attached to the idea."] },
    ],
  },
  {
    path: "/extract-lecture-captions-to-text",
    keyword: "extract lecture captions to text",
    title: "Extract Lecture Captions to Text",
    description: "Convert available YouTube lecture captions into searchable text for study notes, revision, research, and accessible learning workflows.",
    eyebrow: "Study and research workflow",
    intro: "Long lectures become easier to review when the available captions are available as continuous, searchable text. TubeTranscriber helps you move from a public lecture link to a practical document without changing the original source or requiring an account.",
    audience: "For students, educators, researchers, and teams who need to scan lecture material before revisiting the video.",
    exampleLabel: "Anonymized lecture caption example",
    exampleText: "[00:14:08] The important distinction is between describing a pattern and explaining its cause.\n[00:14:22] Write the observation first, then list the evidence that supports the interpretation.\n[00:14:41] This makes the conclusion easier to review later.",
    exampleNote: "This representative excerpt demonstrates a study-note pattern and is not a transcript of a named lecture.",
    imageUrl: "/blog-images/youtube-video-to-notes-converter.jpg",
    imageAlt: "Lecture captions converted into searchable study notes and text",
    infographicLabel: "Infographic placeholder: lecture caption lines become a structured study outline with headings, evidence, and review questions.",
    sections: [
      { heading: "Make a lecture searchable", paragraphs: ["Paste a public lecture URL and use the reader search to find definitions, examples, names, or topics. Searching the complete text can be faster than scrubbing through a long timeline.", "Use the transcript as a map, not as a replacement for the lecture. Slides, diagrams, demonstrations, and tone can carry information that captions do not capture."] },
      { heading: "Build notes around questions", paragraphs: ["After locating a passage, rewrite it under a question such as what happened, why it matters, or what evidence supports it. This creates notes that are easier to revise than a copied block of speech.", "Keep timestamps in the SRT or JSON export when a visual explanation matters. Use TXT when your next step is reading, outlining, or preparing a study guide."] },
      { heading: "Keep research accurate and responsible", paragraphs: ["Automatic captions can misrecognize technical terms, equations, and proper names. Check important passages against the video or the lecturer’s published materials before citing them.", "Store the source link with your notes and add your own explanation. A transcript supports learning and research; it should not be presented as an official course document unless the rights holder provides it."] },
    ],
  },
  {
    path: "/youtube-video-to-json-data",
    keyword: "extract YouTube video data to JSON",
    title: "Extract YouTube Video Captions to JSON Data",
    description: "Export available YouTube captions as structured JSON segments with timing data for research, developer workflows, and content analysis.",
    eyebrow: "Structured caption data",
    intro: "When plain text is not enough, JSON keeps each available caption segment together with its timing. TubeTranscriber provides a practical structured export for analysis, prototyping, and content workflows while keeping the source video link visible.",
    audience: "For developers, analysts, researchers, and creators who need timestamped caption data without an account.",
    exampleLabel: "Anonymized JSON caption example",
    exampleText: "{\n  \"text\": \"Start with the question your audience is asking.\",\n  \"start\": 18.42,\n  \"duration\": 3.86\n}",
    exampleNote: "The example shows a representative segment shape. Treat exported data as source material and validate important content before using it in an application.",
    imageUrl: "/blog-images/working-with-text-transcripts-youtube.jpg",
    imageAlt: "Structured JSON caption data with timing fields for a YouTube transcript workflow",
    infographicLabel: "Infographic placeholder: available YouTube caption segments transform into a syntax-highlighted JSON block with text, start, and duration fields.",
    sections: [
      { heading: "Use JSON when timing and structure matter", paragraphs: ["Plain text is excellent for reading, but structured JSON is better when each caption needs to remain connected to its start time and duration. This makes it easier to inspect segments in a script or spreadsheet workflow.", "The export contains available captions, not video metadata from a private API. Keep the original URL and treat the result as a source document that may need cleanup."] },
      { heading: "Design a small, reliable analysis workflow", paragraphs: ["Start by filtering empty segments, normalizing whitespace, and preserving the timing fields. Then search for terms, group adjacent ideas, or create a simple index for review.", "Do not assume that every segment is a complete sentence. Caption timing follows speech and display constraints, so combine neighboring segments carefully when building summaries or visualizations."] },
      { heading: "Validate before shipping structured content", paragraphs: ["Check a sample from the beginning, middle, and end of the JSON output. Technical names, numbers, and code-like phrases are especially important to verify against the video.", "If the data becomes part of a published product, document the source, respect creator rights, and add original analysis. Structured output improves your workflow; it does not remove the need for editorial review."] },
    ],
  },
];

export function findPseoPage(path: string) {
  return pseoPages.find((page) => page.path === path);
}
