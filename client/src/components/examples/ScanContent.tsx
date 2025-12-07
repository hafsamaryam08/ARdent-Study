import ScanContent from "../../pages/ScanContent";
import { Router } from "wouter";

export default function ScanContentExample() {
  return (
    <Router>
      <div className="p-8">
        <ScanContent />
      </div>
    </Router>
  );
}
