const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const AGNES_BASE_URL = process.env.AGNES_BASE_URL || "https://apihub.agnes-ai.com/v1";
const VIDEO_MODEL = "agnes-video-2.5-flash";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "FRUITSTUDIO AI",
    provider: "Agnes AI",
    configured: Boolean(process.env.AGNES_API_KEY)
  });
});

function safeProviderError(data, status) {
  const message = data?.error?.message || data?.message || data?.error || "Le fournisseur IA a refusé la demande.";
  return String(message).slice(0, 500);
}

app.post("/api/generate", async (req, res) => {
  if (!process.env.AGNES_API_KEY) {
    return res.status(503).json({ error: "La clé Agnes AI n'est pas configurée sur le serveur Render." });
  }

  const { character, genre, idea, language, duration } = req.body || {};
  if (!character || !genre || !idea) {
    return res.status(400).json({ error: "Personnage, genre et idée sont obligatoires." });
  }

  const seconds = Math.max(4, Math.min(12, Number(duration) || 8));
  const prompt = [
    "Create a polished vertical 9:16 short video for TikTok and YouTube Shorts.",
    "Main character: " + String(character).slice(0, 160),
    "Genre: " + String(genre).slice(0, 80),
    "Story: " + String(idea).slice(0, 1800),
    "Dialogue language: " + String(language || "French").slice(0, 40),
    "Keep the same character design throughout, expressive animation, fluid natural motion, cinematic lighting, clear action, visually coherent scene, no subtitles unless dialogue requires them."
  ].join("\n");

  try {
    const response = await fetch(AGNES_BASE_URL + "/videos", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.AGNES_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: VIDEO_MODEL,
        prompt,
        mode: "text",
        seconds,
        size: "720P",
        aspect_ratio: "9:16"
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({
        error: safeProviderError(data, response.status),
        providerStatus: response.status
      });
    }

    const videoId = data.video_id || data.id || data.data?.video_id || data.data?.id;
    if (!videoId) {
      return res.status(502).json({ error: "Agnes AI n'a pas renvoyé d'identifiant vidéo.", details: data });
    }

    res.json({ status: "processing", videoId, model: VIDEO_MODEL, message: "Vidéo en cours de génération." });
  } catch (error) {
    console.error("Agnes create video error:", error.message);
    res.status(502).json({ error: "Impossible de joindre Agnes AI. Réessaie dans un instant." });
  }
});

app.get("/api/status/:videoId", async (req, res) => {
  if (!process.env.AGNES_API_KEY) {
    return res.status(503).json({ error: "La clé Agnes AI n'est pas configurée sur Render." });
  }

  const videoId = String(req.params.videoId || "");
  if (!/^[a-zA-Z0-9_-]{4,200}$/.test(videoId)) {
    return res.status(400).json({ error: "Identifiant vidéo invalide." });
  }

  try {
    const url = new URL("https://apihub.agnes-ai.com/agnesapi");
    url.searchParams.set("video_id", videoId);
    url.searchParams.set("model_name", VIDEO_MODEL);
    const response = await fetch(url, {
      headers: { "Authorization": "Bearer " + process.env.AGNES_API_KEY }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({
        error: safeProviderError(data, response.status)
      });
    }

    const status = String(data.status || data.data?.status || "processing").toLowerCase();
    const videoUrl = data.url || data.video_url || data.data?.url || data.data?.video_url;
    if (videoUrl && /^https:\/\//i.test(videoUrl)) {
      return res.json({ status: "completed", videoUrl });
    }
    if (["failed", "error", "cancelled"].includes(status)) {
      return res.json({ status: "failed", error: data.error || data.message || "La génération vidéo a échoué." });
    }
    res.json({ status: "processing", message: "La vidéo est toujours en cours de création." });
  } catch (error) {
    console.error("Agnes poll video error:", error.message);
    res.status(502).json({ error: "Impossible de vérifier la vidéo pour le moment." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => console.log("FRUITSTUDIO AI listening on " + PORT));
