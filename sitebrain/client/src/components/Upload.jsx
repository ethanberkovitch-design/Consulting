import { useState } from "react";
import styles from "../styles";

export default function Upload({ getProjectId, onProjectLoaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const projectId = await getProjectId();

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`/upload/${projectId}`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onProjectLoaded(data);
    } catch {
      setError("Upload failed. Make sure the backend is running and the file is a valid Excel sheet.");
    }

    setLoading(false);
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
        Excel columns required: <code>name</code>, <code>progress</code>,{" "}
        <code>critical</code>, <code>dependencies</code>
      </p>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ ...styles.input, padding: 6 }}
      />

      {error && <p style={styles.error}>{error}</p>}

      <button onClick={handleUpload} style={styles.button} disabled={loading}>
        {loading ? "Uploading..." : "Upload & Analyze"}
      </button>
    </div>
  );
}
