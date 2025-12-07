import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeDModelProps {
  modelType: string;
  title: string;
  rotation: number;
  zoom: number;
}

// Create a realistic 3D heart
function createHeartGeometry(): THREE.BufferGeometry {
  const vertices = [];
  const indices = [];

  // Heart shape using mathematical formula
  for (let lat = 0; lat <= Math.PI; lat += Math.PI / 16) {
    for (let lon = 0; lon < 2 * Math.PI; lon += Math.PI / 16) {
      // Heart parametric equation
      const x = 16 * Math.sin(lon) ** 3;
      const y = 13 * Math.cos(lat) - 5 * Math.cos(2 * lat) - 2 * Math.cos(3 * lat) - Math.cos(4 * lat);
      const z = 5 * Math.sin(lat);

      vertices.push(x * 0.05, y * 0.04, z * 0.05);
    }
  }

  // Create indices for faces
  const latSegs = 17;
  const lonSegs = 32;
  for (let lat = 0; lat < latSegs - 1; lat++) {
    for (let lon = 0; lon < lonSegs - 1; lon++) {
      const a = lat * lonSegs + lon;
      const b = a + lonSegs;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();

  return geometry;
}

// Create a more visible DNA double helix
function createDNAGeometry(): THREE.BufferGeometry {
  const group = new THREE.Group();
  const points1 = [];
  const points2 = [];

  // Create tighter, more visible helix
  for (let i = 0; i < 80; i++) {
    const t = (i / 80) * Math.PI * 6;
    const height = (i / 80) * 2.5 - 1.25;
    const radius = 0.3;

    points1.push(new THREE.Vector3(
      Math.cos(t) * radius,
      height,
      Math.sin(t) * radius
    ));

    points2.push(new THREE.Vector3(
      Math.cos(t + Math.PI) * radius,
      height,
      Math.sin(t + Math.PI) * radius
    ));
  }

  const curve1 = new THREE.CatmullRomCurve3(points1);
  const curve2 = new THREE.CatmullRomCurve3(points2);

  // Thicker tubes for better visibility
  const tubeGeometry1 = new THREE.TubeGeometry(curve1, 20, 0.12, 8, false);
  const tubeGeometry2 = new THREE.TubeGeometry(curve2, 20, 0.12, 8, false);

  // Create connector rungs between the helices
  const connectorGeometry = new THREE.BufferGeometry();
  const connectorVertices = [];

  for (let i = 0; i < 20; i++) {
    const t = (i / 20) * Math.PI * 6;
    const height = (i / 20) * 2.5 - 1.25;
    const radius = 0.3;

    // Connector from one strand to other
    connectorVertices.push(Math.cos(t) * radius, height, Math.sin(t) * radius);
    connectorVertices.push(Math.cos(t + Math.PI) * radius, height, Math.sin(t + Math.PI) * radius);
  }

  const connectorGeometry2 = new THREE.BufferGeometry();
  connectorGeometry2.setAttribute("position", new THREE.BufferAttribute(new Float32Array(connectorVertices), 3));

  // Merge all geometries
  const mergedGeometry = new THREE.BufferGeometry();
  const pos1 = tubeGeometry1.getAttribute("position") as THREE.BufferAttribute;
  const pos2 = tubeGeometry2.getAttribute("position") as THREE.BufferAttribute;

  const combined = new Float32Array(pos1.array.length + pos2.array.length);
  combined.set(pos1.array as Float32Array, 0);
  combined.set(pos2.array as Float32Array, pos1.array.length);

  mergedGeometry.setAttribute("position", new THREE.BufferAttribute(combined, 3));
  mergedGeometry.computeVertexNormals();

  return mergedGeometry;
}

// Create improved computer/monitor
function createComputerGeometry(): THREE.BufferGeometry {
  const group = new THREE.Group();
  
  // Screen - use box geometry for clean look
  const screenGeom = new THREE.BoxGeometry(1.0, 0.7, 0.05);
  
  // Stand - cylinder pole
  const poleGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16);
  poleGeom.translate(0, -0.45, 0);
  
  // Base - wide cylinder
  const baseGeom = new THREE.CylinderGeometry(0.3, 0.35, 0.08, 32);
  baseGeom.translate(0, -0.8, 0);
  
  // Merge all
  const vertices = [];
  const indices = [];
  
  // Screen vertices
  const screenGeo = screenGeom;
  const pos1 = screenGeo.getAttribute('position') as THREE.BufferAttribute;
  const idx1 = screenGeo.getIndex() as THREE.BufferAttribute;
  
  let vertexOffset = 0;
  const screenVertices = Array.from(pos1.array as Float32Array);
  vertices.push(...screenVertices);
  
  if (idx1) {
    const screenIndices = Array.from(idx1.array as Uint32Array);
    indices.push(...screenIndices);
    vertexOffset = screenVertices.length / 3;
  }
  
  // Pole
  const poleGeo = poleGeom;
  const pos2 = poleGeo.getAttribute('position') as THREE.BufferAttribute;
  const idx2 = poleGeo.getIndex() as THREE.BufferAttribute;
  const poleVertices = Array.from(pos2.array as Float32Array);
  vertices.push(...poleVertices);
  if (idx2) {
    const poleIndices = Array.from(idx2.array as Uint32Array);
    indices.push(...poleIndices.map(i => i + vertexOffset));
    vertexOffset += poleVertices.length / 3;
  }
  
  // Base
  const baseGeo = baseGeom;
  const pos3 = baseGeo.getAttribute('position') as THREE.BufferAttribute;
  const idx3 = baseGeo.getIndex() as THREE.BufferAttribute;
  const baseVertices = Array.from(pos3.array as Float32Array);
  vertices.push(...baseVertices);
  if (idx3) {
    const baseIndices = Array.from(idx3.array as Uint32Array);
    indices.push(...baseIndices.map(i => i + vertexOffset));
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  if (indices.length > 0) {
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Create realistic lens/camera optical element
function createLensGeometry(): THREE.BufferGeometry {
  const vertices = [];
  const indices = [];
  
  // Barrel body - cylinder
  const barrelRadius = 0.5;
  const barrelHeight = 1.0;
  const segments = 32;
  
  // Create front lens dome
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * barrelRadius;
    const z = Math.sin(angle) * barrelRadius;
    vertices.push(x, 0.5, z);
  }
  
  // Front lens center
  vertices.push(0, 0.6, 0);
  const frontCenterIdx = vertices.length / 3 - 1;
  
  // Barrel side
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * barrelRadius;
    const z = Math.sin(angle) * barrelRadius;
    vertices.push(x, -0.3, z);
  }
  
  // Back lens dome
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * barrelRadius * 0.8;
    const z = Math.sin(angle) * barrelRadius * 0.8;
    vertices.push(x, -0.6, z);
  }
  
  // Back lens center
  vertices.push(0, -0.7, 0);
  const backCenterIdx = vertices.length / 3 - 1;
  
  // Create faces for front lens dome
  for (let i = 0; i < segments; i++) {
    indices.push(i, (i + 1) % segments, frontCenterIdx);
  }
  
  // Create faces for barrel
  const barrelStart = segments + 1;
  for (let i = 0; i < segments; i++) {
    const a = i;
    const b = (i + 1) % segments;
    const c = barrelStart + i;
    const d = barrelStart + ((i + 1) % segments);
    indices.push(a, c, b);
    indices.push(b, c, d);
  }
  
  // Create faces for back lens dome
  const backStart = barrelStart + segments + 1;
  for (let i = 0; i < segments; i++) {
    indices.push(barrelStart + i, backStart + i, barrelStart + ((i + 1) % segments));
    indices.push(barrelStart + ((i + 1) % segments), backStart + i, backStart + ((i + 1) % segments));
  }
  
  // Back lens center connections
  for (let i = 0; i < segments; i++) {
    indices.push(backStart + i, backCenterIdx, backStart + ((i + 1) % segments));
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();
  return geometry;
}

export function ThreeDModel({ modelType, title, rotation, zoom }: ThreeDModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Better lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    let geometry: THREE.BufferGeometry;
    let materialColor = 0x4f46e5;
    let wireframe = false;

    const typeStr = (modelType || "").toLowerCase();
    const titleStr = (title || "").toLowerCase();

    console.log("Creating 3D model:", typeStr, titleStr);

    // Exact models based on content
    if (typeStr.includes("organic") || titleStr.includes("heart")) {
      geometry = createHeartGeometry();
      materialColor = 0xef4444; // Bright red
    } else if (typeStr.includes("dna") || titleStr.includes("dna") || titleStr.includes("helix")) {
      geometry = createDNAGeometry();
      materialColor = 0x0066ff; // Bright blue
    } else if (
      titleStr.includes("computer") ||
      titleStr.includes("hardware") ||
      titleStr.includes("monitor") ||
      titleStr.includes("cpu") ||
      titleStr.includes("processor")
    ) {
      geometry = createComputerGeometry();
      materialColor = 0x2c3e50; // Dark blue-gray
    } else if (titleStr.includes("lens") || titleStr.includes("camera") || titleStr.includes("optic")) {
      geometry = createLensGeometry();
      materialColor = 0x00ccff; // Cyan lens
    } else if (typeStr.includes("molecular")) {
      geometry = new THREE.IcosahedronGeometry(1, 5);
      materialColor = 0xef4444;
    } else if (typeStr.includes("motion")) {
      geometry = new THREE.TorusGeometry(0.8, 0.25, 20, 150);
      materialColor = 0xeab308;
    } else {
      geometry = new THREE.SphereGeometry(1, 64, 64);
      materialColor = 0x8b5cf6;
    }

    const material = new THREE.MeshPhongMaterial({
      color: materialColor,
      emissive: 0x111111,
      shininess: 120,
      wireframe: wireframe,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    meshRef.current = mesh;
    scene.add(mesh);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (meshRef.current) {
        meshRef.current.rotation.x = (rotation * Math.PI) / 180;
        meshRef.current.rotation.y += 0.003;
        const scale = zoom / 100;
        meshRef.current.scale.set(scale, scale, scale);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelType, title, rotation, zoom]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: "400px" }} />;
}
