import Concepts from "../../pages/Concepts";
import { Router } from "wouter";

export default function ConceptsExample() {
  return (
    <Router>
      <div className="p-8 max-w-7xl mx-auto">
        <Concepts />
      </div>
    </Router>
  );
}
