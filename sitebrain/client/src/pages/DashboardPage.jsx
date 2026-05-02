import { useState } from "react";
import Upload from "../components/Upload";
import styles from "../styles";

const EXAMPLE_JSON = JSON.stringify(
  [
    { id: "1", name: "Foundation", progress: 0.8, critical: true, dependencies: [] },
    { id: "2", name: "Structure", progress: 0.3, critical: true, dependencies: ["1"] },
    { id: "3", name: "MEP Installation", progress: 0.2, critical: false, dependencies: ["2"] },
  ],
  null,
  2
);

export default function DashboardPage({ user, onProjectLoaded }) {
  const [projectName, setProjectName] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [mode, setMode] = useState("json"); // "json" | "excel"
  const [projectId, setProjectId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    const name = projectName.trim() || "Demo Project";
    const res = await fetch("/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    return data.id;
  };

  const handleAnalyzeJson = async () => {
    setError("");
    setLoading(true);

    let tasks;
    try {
      tasks = JSON.parse(jsonInput);
    } catch {
      setError("Invalid JSON format. Please check your input.");
      setLoading(false);
      return;
    }

    try {
      const id = await createProject();
      const res = await fetch(`/analyze/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      onProjectLoaded(data);
    } catch {
      setError("Server error. Make sure the backend is running.");
    }

    setLoading(false);
  };

  const handleProjectCreatedForUpload = async () => {
    const id = await createProject();
    setProjectId(id);
    return id;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>SiteBrain</h1>
        <span style={styles.userBadge}>{user}</span>
      </div>

      <h2 style={styles.sectionTitle}>New Project</h2>

      <input
        placeholder="Project name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        style={styles.input}
      />

      {/* Mode toggle */}
      <div style={styles.toggleRow}>
        <button
          onClick={() => setMode("json")}
          style={mode === "json" ? styles.toggleActive : styles.toggleInactive}
        >
          Paste JSON
        </button>
        <button
          onClick={() => setMode("excel")}
          style={mode === "excel" ? styles.toggleActive : styles.toggleInactive}
        >
          Upload Excel
        </button>
      </div>

      {mode === "json" && (
        <>
          <textarea
            placeholder={`Paste schedule JSON here...\n\nExample:\n${EXAMPLE_JSON}`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            style={{ ...styles.input, height: 200, fontFamily: "monospace", fontSize: 12 }}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button onClick={handleAnalyzeJson} style={styles.button} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Project"}
          </button>
        </>
      )}

      {mode === "excel" && (
        <Upload
          getProjectId={handleProjectCreatedForUpload}
          onProjectLoaded={onProjectLoaded}
        />
      )}
    </div>
  );
}
