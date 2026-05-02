import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectPage from "./pages/ProjectPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [project, setProject] = useState(null);

  const handleLogin = (email) => {
    setUser(email);
    setPage("dashboard");
  };

  const handleProjectLoaded = (projectData) => {
    setProject(projectData);
    setPage("project");
  };

  const handleBack = () => {
    setPage("dashboard");
    setProject(null);
  };

  if (page === "login") return <LoginPage onLogin={handleLogin} />;
  if (page === "dashboard")
    return <DashboardPage user={user} onProjectLoaded={handleProjectLoaded} />;
  return <ProjectPage project={project} onBack={handleBack} />;
}
