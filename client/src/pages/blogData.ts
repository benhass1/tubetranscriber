export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  accent: string;
  intro: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "extract-download-youtube-transcripts",
    title: "How to Extract and Download YouTube Transcripts in Seconds",
    excerpt: "A practical workflow for turning available YouTube captions into clean, searchable text without losing the context that makes a video useful.",
    date: "August 22, 2026",
    readTime: "5 min read",
    category: "Workflow guide",
    accent: "blue",
    intro: "A good transcript workflow should get out of the way. Once a public video has captions available, the useful work is turning those time-based lines into text you can scan, search, share, and revisit.",
    sections: [
      {
        heading: "Start with the source you already have",
        paragraphs: [
          "Copy the standard YouTube URL, a Shorts link, or an embed link. Keeping the original address makes it easier to return to the video later and preserves a direct path back to the creator.",
          "Before you begin, confirm that the video is public and that captions are available. A transcript tool can organize an existing caption track, but it cannot create captions for a video that exposes none."
        ]
      },
      {
        heading: "Choose the format that matches the next step",
        paragraphs: [
          "Plain text is ideal for reading, searching, and pasting into notes. JSON keeps the structured segments and timing data available for a more technical workflow. SRT is the practical choice when the transcript is moving into a video editor.",
          "The best format is the one that keeps your next action simple. For research, start with plain text; for editing, keep the timed subtitle file close at hand."
        ]
      },
      {
        heading: "Make the transcript useful after extraction",
        paragraphs: [
          "Search for names, themes, and repeated phrases instead of reading every line from the beginning. Mark the moments that need a second look, then return to the original video for tone, visuals, and context.",
          "A transcript is a starting point for understanding, not a replacement for the source. Keep the creator’s link with your notes and respect the permissions that apply to anything you publish."
        ]
      }
    ]
  },
  {
    slug: "convert-youtube-videos-to-srt",
    title: "How to Convert YouTube Videos to SRT Subtitles for Video Editing",
    excerpt: "Learn when an SRT export is the right handoff for an editor, how timing helps, and what to check before placing subtitles on a timeline.",
    date: "August 18, 2026",
    readTime: "6 min read",
    category: "Editing basics",
    accent: "violet",
    intro: "SRT subtitles sit at the useful intersection of readable text and timing. They are lightweight enough to share and structured enough to place over a video timeline with very little friction.",
    sections: [
      {
        heading: "Why SRT is useful in an editing workflow",
        paragraphs: [
          "An SRT file stores numbered subtitle cues with a start time, an end time, and the words that should appear on screen. That simple structure makes it easy to review captions outside the editor and import them when the cut is ready.",
          "Compared with a plain transcript, SRT preserves the rhythm of the original caption track. That makes it a better handoff for caption review, translation, accessibility checks, and rough subtitle placement."
        ]
      },
      {
        heading: "Check timing before you style the captions",
        paragraphs: [
          "Open the exported file and scan for cues that are unusually long, crowded, or out of step with the spoken words. Small timing adjustments are normal when a video has been trimmed, re-cut, or combined with new intro material.",
          "Do the content review before changing fonts, colors, or animation. A clean cue list gives the editor a stable foundation for visual decisions later."
        ]
      },
      {
        heading: "Keep a plain-text version too",
        paragraphs: [
          "The SRT file is built for playback, while plain text is better for searching and editing language. Keeping both versions means you can make copy changes without manually stripping timestamps from the subtitle file.",
          "When the final video is ready, compare the captions against the exported audio and keep the source link with the project notes."
        ]
      }
    ]
  },
  {
    slug: "youtube-transcripts-content-creation",
    title: "Top 5 Uses for YouTube Transcripts in Content Creation",
    excerpt: "From research notes to repurposed ideas, discover five focused ways transcripts can make a content pipeline faster and more searchable.",
    date: "August 12, 2026",
    readTime: "7 min read",
    category: "Content strategy",
    accent: "green",
    intro: "Content teams often have more valuable material than they can comfortably review. A clean transcript turns a video into a working document that can be searched, outlined, and compared with other sources.",
    sections: [
      {
        heading: "1. Build faster research notes",
        paragraphs: [
          "Search the transcript for the exact topic you are exploring, then save only the passages that support your brief. This keeps a research session focused instead of turning it into a long replay of the entire video."
        ]
      },
      {
        heading: "2. Find moments to repurpose",
        paragraphs: [
          "Look for concise explanations, strong openings, useful questions, and memorable phrases. These moments can become the starting point for a newsletter section, a short-form outline, or a discussion prompt."
        ]
      },
      {
        heading: "3. Compare themes across videos",
        paragraphs: [
          "Once several videos are in text form, recurring language becomes easier to spot. Comparing transcripts can reveal shared questions, disagreements, and gaps worth exploring in a new piece."
        ]
      },
      {
        heading: "4. Create a first-draft outline",
        paragraphs: [
          "Use headings, repeated terms, and the order of ideas to sketch an outline. The transcript provides raw structure; your editorial judgment adds the point of view, audience focus, and original framing."
        ]
      },
      {
        heading: "5. Make review and collaboration easier",
        paragraphs: [
          "Plain text is easier to annotate than a video timeline when a team is reviewing ideas. Share the relevant excerpt, link to the source, and keep notes about what is inspiration, what is quotation, and what needs original development."
        ]
      }
    ]
  }
];

export const featuredPost = blogPosts[0];

export function findBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
