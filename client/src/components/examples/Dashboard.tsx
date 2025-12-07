import Dashboard from "../../pages/Dashboard";
import { Router } from "wouter";

export default function DashboardExample() {
  return (
    <Router>
      <div className="p-8 max-w-7xl mx-auto">
        <Dashboard />
      </div>
    </Router>
  );
}
