const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const DB = {
  projects: {},
};

/* =========================
   CREATE PROJECT
========================= */
app.post("/project", (req, res) => {
  const id = Date.now().toString();

  DB.projects[id] = {
    id,
    name: req.body.name,
    tasks: [],
    risks: [],
    recommendations: [],
    outcomes: [],
  };

  res.json(DB.projects[id]);
});

/* =========================
   ANALYZE JSON TASKS
========================= */
app.post("/analyze/:projectId", (req, res) => {
  const project = DB.projects[req.params.projectId];

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const tasks = req.body.tasks;

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: "tasks must be an array" });
  }

  project.tasks = tasks;
  project.risks = analyzeRisks(tasks);
  project.recommendations = generateRecommendations(project.risks);

  res.json(project);
});

/* =========================
   EXCEL UPLOAD
========================= */
app.post("/upload/:projectId", upload.single("file"), (req, res) => {
  const project = DB.projects[req.params.projectId];

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const workbook = XLSX.read(req.file.buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const tasks = rows.map((r, i) => ({
    id: String(i + 1),
    name: r.name,
    progress: Number(r.progress || 0),
    critical: r.critical === "true" || r.critical === true,
    dependencies: r.dependencies ? r.dependencies.split(",") : [],
  }));

  project.tasks = tasks;
  project.risks = analyzeRisks(tasks);
  project.recommendations = generateRecommendations(project.risks);

  res.json(project);
});

/* =========================
   RISK ENGINE
========================= */
function analyzeRisks(tasks) {
  const risks = [];
  const map = {};

  tasks.forEach((t) => (map[t.id] = t));

  tasks.forEach((task) => {
    let score = 0;

    if (task.progress < 0.5 && task.critical) score += 0.6;

    (task.dependencies || []).forEach((dep) => {
      if (map[dep] && map[dep].progress < 1) score += 0.3;
    });

    if (score > 0.5) {
      risks.push({
        task_id: task.id,
        name: task.name,
        score: +score.toFixed(2),
        severity: score > 0.7 ? "HIGH" : "MEDIUM",
      });
    }
  });

  return risks;
}

/* =========================
   RECOMMENDATIONS
========================= */
function generateRecommendations(risks) {
  return risks.map((r) => ({
    task_id: r.task_id,
    action:
      r.severity === "HIGH"
        ? "Re-sequence + allocate extra crew immediately"
        : "Monitor closely",
    impact: "Reduce delay probability",
  }));
}

/* =========================
   GET PROJECT
========================= */
app.get("/project/:id", (req, res) => {
  const project = DB.projects[req.params.id];
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

/* =========================
   LIST PROJECTS
========================= */
app.get("/projects", (req, res) => {
  res.json(Object.values(DB.projects));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SiteBrain server running on port ${PORT}`));
