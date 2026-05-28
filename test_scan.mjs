import fs from "fs";

async function testScan() {
  await fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "testuser_ai", password: "password123", fullName: "Test User" })
  });

  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "testuser_ai", password: "password123" })
  });
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Login:", loginRes.status);

  const formData = new FormData();
  formData.append("extractedText", "The mitochondria is the powerhouse of the cell. It generates most of the chemical energy needed to power the cell's biochemical reactions.");
  formData.append("concepts", JSON.stringify([]));

  // We need to simulate a file upload. 
  // For FormData in Node.js, we can append a Blob.
  const blob = new Blob(["test"], { type: "text/plain" });
  formData.append("file", blob, "test.txt");

  const scanRes = await fetch("http://localhost:5000/api/scan/upload", {
    method: "POST",
    headers: { "Cookie": cookie || "" },
    body: formData
  });

  console.log("Scan status:", scanRes.status);
  const data = await scanRes.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

testScan();
