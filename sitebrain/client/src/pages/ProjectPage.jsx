import styles from "../styles";

const severityColor = {
  HIGH: "#c0392b",
  MEDIUM: "#e67e22",
};

export default function ProjectPage({ project, onBack }) {
  if (!project) return null;

  const { name, tasks = [], risks = [], recommendations = [] } = project;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Project: {name || "Demo Project"}</h1>
        <button onClick={onBack} style={styles.buttonOutline}>
          ← Back
        </button>
      </div>

      {/* TASKS SUMMARY */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Tasks ({tasks.length})</h2>
        {tasks.length === 0 && <p style={styles.muted}>No tasks loaded.</p>}
        <div style={styles.tableWrapper}>
          {tasks.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Progress</th>
                  <th style={styles.th}>Critical</th>
                  <th style={styles.th}>Dependencies</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td style={styles.td}>{t.name}</td>
                    <td style={styles.td}>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${Math.round(t.progress * 100)}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: "#555" }}>
                        {Math.round(t.progress * 100)}%
                      </span>
                    </td>
                    <td style={styles.td}>{t.critical ? "Yes" : "No"}</td>
                    <td style={styles.td}>
                      {t.dependencies?.length ? t.dependencies.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* RISKS */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Risks</h2>
        {risks.length === 0 && (
          <p style={styles.muted}>No risks detected.</p>
        )}
        {risks.map((r, i) => (
          <div key={i} style={{ ...styles.alertCard, borderLeftColor: severityColor[r.severity] }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>{r.name}</b>
              <span
                style={{
                  ...styles.badge,
                  background: severityColor[r.severity],
                }}
              >
                {r.severity}
              </span>
            </div>
            <div style={{ marginTop: 4, color: "#555", fontSize: 14 }}>
              Risk Score: {r.score}
            </div>
          </div>
        ))}
      </section>

      {/* RECOMMENDATIONS */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Recommendations</h2>
        {recommendations.length === 0 && (
          <p style={styles.muted}>No recommendations.</p>
        )}
        {recommendations.map((r, i) => (
          <div key={i} style={styles.recCard}>
            <span style={{ marginRight: 8 }}>👉</span>
            <div>
              <div style={{ fontWeight: 600 }}>{r.action}</div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
                Impact: {r.impact}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
