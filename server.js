const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "FRUITSTUDIO AI", mode: "prototype" });
});

// This endpoint creates a structured video concept, not a rendered video.
// Connect a video-generation provider before advertising real video output.
app.post("/api/generate", (req, res) => {
  const { character, genre, idea, language, duration } = req.body || {};
  if (!character || !genre || !idea) {
    return res.status(400).json({ error: "Personnage, genre et idée sont obligatoires." });
  }
  const prompt = `Vidéo verticale 9:16 de ${Number(duration) || 20} secondes. Personnage principal : ${character}. Genre : ${genre}. Histoire : ${idea}. Dialogues : ${language || "Français"}. Style cinématographique, animation expressive, mouvements fluides, éclairage soigné, scénario clair et fin mémorable.`;
  res.json({
    mode: "concept",
    message: "Concept prêt. Le rendu vidéo nécessite la connexion d’un fournisseur IA.",
    result: { title: `${character} — ${genre}`, prompt, format: "9:16", duration: Number(duration) || 20 }
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => console.log(`FRUITSTUDIO AI listening on ${PORT}`));
