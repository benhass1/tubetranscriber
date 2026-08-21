import { extractWithYtDlp } from "../server/ytdlp.ts";

const segments = await extractWithYtDlp("dQw4w9WgXcQ");
if (segments.length === 0) {
  throw new Error("yt-dlp returned no transcript segments");
}
console.log(`yt-dlp smoke check passed with ${segments.length} transcript segments.`);
