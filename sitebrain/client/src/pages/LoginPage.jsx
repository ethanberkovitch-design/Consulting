import { useState } from "react";
import styles from "../styles";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) onLogin(email.trim());
  };

  return (
    <div style={styles.pageCenter}>
      <div style={styles.card}>
        <h1 style={styles.title}>SiteBrain</h1>
        <p style={styles.subtitle}>Outcome Engine for Construction Projects</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
