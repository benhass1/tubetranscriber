import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

export interface YouTubeTranscriptPlayerHandle {
  seekTo: (seconds: number) => void;
}

interface YouTubeTranscriptPlayerProps {
  videoId: string;
  onTimeUpdate?: (seconds: number) => void;
}

type YouTubePlayerInstance = {
  destroy?: () => void;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime?: () => number;
};

type YouTubeNamespace = {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    playerVars?: Record<string, number | string>;
    events?: { onReady?: () => void };
  }) => YouTubePlayerInstance;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
  return new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => reject(new Error("YouTube player could not be loaded.")), 12000);
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      window.clearTimeout(timeout);
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player API is unavailable."));
    };
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("YouTube player could not be loaded."));
      };
      document.head.appendChild(script);
    } else if (window.YT?.Player) {
      window.clearTimeout(timeout);
      resolve(window.YT);
    }
  });
}

const YouTubeTranscriptPlayer = forwardRef<YouTubeTranscriptPlayerHandle, YouTubeTranscriptPlayerProps>(function YouTubeTranscriptPlayer({ videoId, onTimeUpdate }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const pollRef = useRef<number | undefined>(undefined);
  const [loadError, setLoadError] = useState("");

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => playerRef.current?.seekTo?.(seconds, true),
  }), []);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(YT => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        playerVars: { enablejsapi: 1, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            pollRef.current = window.setInterval(() => {
              const seconds = playerRef.current?.getCurrentTime?.();
              if (typeof seconds === "number") onTimeUpdate?.(seconds);
            }, 250);
          },
        },
      });
    }).catch(error => {
      if (!cancelled) setLoadError(error instanceof Error ? error.message : "The YouTube player is unavailable.");
    });

    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, onTimeUpdate]);

  return <div className="youtube-player-shell">
    <div ref={mountRef} className="youtube-player-frame" aria-label="Embedded YouTube video player" />
    {loadError && <p className="youtube-player-error">The video player could not be loaded. You can still read and download the transcript below.</p>}
  </div>;
});

export default YouTubeTranscriptPlayer;
