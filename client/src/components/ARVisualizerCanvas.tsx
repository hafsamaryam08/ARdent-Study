import { useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html, Float, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface ProceduralPrimitive {
  shape: "sphere" | "box" | "cylinder";
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  label: string;
}

interface ARVisualizerCanvasProps {
  proceduralData: ProceduralPrimitive[];
  title: string;
  modelUrl?: string | null;
}

function PrimitiveWithLabel({ data }: { data: ProceduralPrimitive }) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  return (
    <group position={data.position}>
      <mesh 
        scale={data.scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setClicked(!clicked)}
      >
        {data.shape === "sphere" && <sphereGeometry args={[1, 32, 32]} />}
        {data.shape === "box" && <boxGeometry args={[1, 1, 1]} />}
        {data.shape === "cylinder" && <cylinderGeometry args={[1, 1, 1, 32]} />}
        <meshStandardMaterial 
          color={data.color} 
          emissive={data.color} 
          emissiveIntensity={hovered ? 0.5 : 0.1}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      <Html distanceFactor={10}>
        <AnimatePresence>
          {(hovered || clicked) && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 10 }}
              className="pointer-events-none select-none"
            >
              <div className="bg-background/95 backdrop-blur-md border border-primary/20 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 whitespace-nowrap">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-foreground uppercase tracking-tighter">{data.label}</span>
              </div>
              
              {clicked && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-2 w-40 bg-primary text-primary-foreground p-2 rounded-lg text-[9px] font-medium leading-tight shadow-xl"
                >
                  Procedural {data.shape} component of the {data.label} system.
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Html>
    </group>
  );
}

function NeuralNetwork3D() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create a 3x4x2 neural network architecture
  const layers = [3, 5, 3];
  const nodes: THREE.Vector3[][] = layers.map((count, i) => {
    return Array.from({ length: count }, (_, j) => {
      return new THREE.Vector3(i * 2 - 2, j * 0.8 - (count * 0.4), 0);
    });
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Neurons */}
      {nodes.flat().map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
          <Html distanceFactor={10} position={[0, 0.3, 0]}>
            <div className="text-[6px] font-black text-white bg-blue-600 px-1 rounded uppercase tracking-tighter">Neuron</div>
          </Html>
        </mesh>
      ))}

      {/* Connections (Synapses) */}
      {nodes.map((layer, i) => {
        if (i === nodes.length - 1) return null;
        const nextLayer = nodes[i + 1];
        return layer.map((n1, j) => {
          return nextLayer.map((n2, k) => {
            const mid = n1.clone().add(n2).multiplyScalar(0.5);
            const distance = n1.distanceTo(n2);
            return (
              <mesh key={`${i}-${j}-${k}`} position={mid} onUpdate={(self) => { self.lookAt(n2); self.rotateX(Math.PI/2); }}>
                <cylinderGeometry args={[0.01, 0.01, distance, 8]} />
                <meshStandardMaterial color="#8b5cf6" transparent opacity={0.3} />
              </mesh>
            );
          });
        });
      })}
    </group>
  );
}

function CNN3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.3; });

  // Input Grid (3x3)
  const inputGrid = [];
  for(let i=0; i<3; i++) {
    for(let j=0; j<3; j++) {
      inputGrid.push([i*0.4 - 0.4, j*0.4 - 0.4, 0]);
    }
  }

  // Feature Map (2x2)
  const featureMap = [];
  for(let i=0; i<2; i++) {
    for(let j=0; j<2; j++) {
      featureMap.push([i*0.3 - 0.15, j*0.3 - 0.15, 0]);
    }
  }

  // DistanceLine Helper
  const DistanceLine = ({ start, end, color }: { start: [number,number,number], end: [number,number,number], color: string }) => {
    const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
    return (
      // @ts-ignore
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </line>
    );
  };

  return (
    <group ref={groupRef}>
      {/* Input Layer */}
      <group position={[-2, 0, 0]}>
        {inputGrid.map((p, i) => (
          <mesh key={`in-${i}`} position={p as [number,number,number]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial color="#10b981" transparent opacity={0.7} emissive="#10b981" emissiveIntensity={0.2} />
          </mesh>
        ))}
        <Html distanceFactor={10} position={[0, 1.2, 0]}><div className="text-[6px] font-black text-white bg-green-500 px-1 rounded uppercase tracking-tighter border border-green-300 shadow-lg">Input Grid (Pixels)</div></Html>
      </group>

      {/* Feature Map Layer */}
      <group position={[0, 0, 0]}>
        {featureMap.map((p, i) => (
          <mesh key={`fm-${i}`} position={p as [number,number,number]}>
            <boxGeometry args={[0.2, 0.2, 0.1]} />
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.8} emissive="#3b82f6" emissiveIntensity={0.5} />
          </mesh>
        ))}
        <Html distanceFactor={10} position={[0, 1, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase tracking-tighter border border-blue-300 shadow-lg">Feature Map (Conv)</div></Html>
      </group>

      {/* Connection Lines (Simulating Convolution Filter Receptive Field) */}
      <DistanceLine start={[-1.6, 0.4, 0]} end={[-0.15, 0.15, 0]} color="#fbbf24" />
      <DistanceLine start={[-1.6, 0, 0]} end={[-0.15, 0.15, 0]} color="#fbbf24" />
      <DistanceLine start={[-2, 0.4, 0]} end={[-0.15, 0.15, 0]} color="#fbbf24" />
      <DistanceLine start={[-2, 0, 0]} end={[-0.15, 0.15, 0]} color="#fbbf24" />

      {/* Dense / Flatten Layer */}
      <group position={[2, 0, 0]}>
        {[-0.6, -0.2, 0.2, 0.6].map((y, i) => (
          <group key={`d-${i}`}>
            <mesh position={[0, y, 0]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1} />
            </mesh>
            <DistanceLine start={[0.15, 0.15, 0]} end={[0, y, 0]} color="#c084fc" />
            <DistanceLine start={[0.15, -0.15, 0]} end={[0, y, 0]} color="#c084fc" />
          </group>
        ))}
        <Html distanceFactor={10} position={[0, 1, 0]}><div className="text-[6px] font-black text-white bg-purple-500 px-1 rounded uppercase tracking-tighter border border-purple-300 shadow-lg">Flatten / Dense Layer</div></Html>
      </group>
    </group>
  );
}

function LinearRegression3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3; });

  const points = Array.from({ length: 20 }, () => [Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2]);

  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#f43f5e" />
        </mesh>
      ))}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.05, 0.05, 6, 8]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" />
        <Html distanceFactor={10} position={[2, 2, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase tracking-tighter">Line of Best Fit</div></Html>
      </mesh>
    </group>
  );
}

function GenerativeAI3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.4; });

  return (
    <group ref={groupRef}>
      <mesh position={[-1.5, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#8b5cf6" wireframe />
        <Html distanceFactor={10} position={[0, 0.8, 0]}><div className="text-[6px] font-black text-white bg-purple-500 px-1 rounded uppercase tracking-tighter">Latent Space</div></Html>
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#10b981" />
        <Html distanceFactor={10} position={[0, 0.8, 0]}><div className="text-[6px] font-black text-white bg-green-500 px-1 rounded uppercase tracking-tighter">Generated Output</div></Html>
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.5} />
        <Html distanceFactor={10} position={[0, 0.5, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase tracking-tighter">Decoder</div></Html>
      </mesh>
    </group>
  );
}

function AppleVisionPro3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.5; });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
        <Html distanceFactor={10} position={[0, 0.8, 0]}><div className="text-[6px] font-black text-white bg-slate-800 px-1 rounded uppercase tracking-tighter">Glass Front (EyeSight)</div></Html>
      </mesh>
      <mesh position={[0, 0, -0.6]}>
        <boxGeometry args={[2.1, 1.1, 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        <Html distanceFactor={10} position={[0, -0.8, 0]}><div className="text-[6px] font-black text-slate-800 bg-white px-1 rounded uppercase tracking-tighter">Light Seal</div></Html>
      </mesh>
    </group>
  );
}

function DNA3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.5; });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={i} position={[0, i * 0.4 - 2, 0]} rotation={[0, i * 0.5, 0]}>
          <mesh position={[-0.5, 0, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
          <mesh position={[0.5, 0, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#ef4444" /></mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 1, 8]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        </group>
      ))}
      <Html distanceFactor={10} position={[0, 2.5, 0]}><div className="text-[6px] font-black text-white bg-indigo-500 px-1 rounded uppercase tracking-tighter">Double Helix</div></Html>
    </group>
  );
}

function HumanEye3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2; });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        <Html distanceFactor={10} position={[0, 1.6, 0]}><div className="text-[6px] font-black text-slate-800 bg-white px-1 rounded uppercase">Sclera</div></Html>
      </mesh>
      <mesh position={[0, 0, 1.4]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
        <meshStandardMaterial color="#0ea5e9" />
        <Html distanceFactor={10} position={[0, -0.8, 0]}><div className="text-[6px] font-black text-white bg-sky-500 px-1 rounded uppercase">Iris</div></Html>
      </mesh>
      <mesh position={[0, 0, 1.46]}>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
        <meshStandardMaterial color="#0f172a" />
        <Html distanceFactor={10} position={[0, 0, 0.2]}><div className="text-[6px] font-black text-white bg-slate-900 px-1 rounded uppercase">Pupil</div></Html>
      </mesh>
      <mesh position={[0, 0, 1.2]}>
        <sphereGeometry args={[0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={1} transparent roughness={0} />
        <Html distanceFactor={10} position={[0.8, 0.8, 0]}><div className="text-[6px] font-black text-slate-800 bg-white px-1 rounded uppercase border border-slate-200">Cornea</div></Html>
      </mesh>
    </group>
  );
}

function Photosynthesis3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3; });

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.05, 3]} />
        <meshStandardMaterial color="#22c55e" />
        <Html distanceFactor={10} position={[0, 0.5, 0]}><div className="text-[6px] font-black text-white bg-green-500 px-1 rounded uppercase">Chloroplast / Leaf</div></Html>
      </mesh>
      <mesh position={[-2, 2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={2} />
        <Html distanceFactor={10} position={[0, 0.6, 0]}><div className="text-[6px] font-black text-slate-900 bg-yellow-400 px-1 rounded uppercase">Light Energy</div></Html>
      </mesh>
      <Html distanceFactor={10} position={[-1.5, 0, 1]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase">H₂O + CO₂ In</div></Html>
      <Html distanceFactor={10} position={[1.5, 0, -1]}><div className="text-[6px] font-black text-white bg-sky-400 px-1 rounded uppercase">O₂ + Glucose Out</div></Html>
    </group>
  );
}

function Transformer3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3; });

  return (
    <group ref={groupRef}>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[1, 2.5, 1]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.8} />
        <Html distanceFactor={10} position={[0, 1.5, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase">Encoder Stack</div></Html>
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[1, 2.5, 1]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.8} />
        <Html distanceFactor={10} position={[0, 1.5, 0]}><div className="text-[6px] font-black text-white bg-purple-500 px-1 rounded uppercase">Decoder Stack</div></Html>
      </mesh>
      {Array.from({length: 3}).map((_, i) => (
        <mesh key={i} position={[0, i * 0.8 - 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" />
          {i === 1 && <Html distanceFactor={10} position={[0, 0.2, 0]}><div className="text-[6px] font-black text-slate-900 bg-amber-400 px-1 rounded uppercase">Self-Attention</div></Html>}
        </mesh>
      ))}
    </group>
  );
}

function DecisionTree3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3; });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.5, 0]}><boxGeometry args={[0.8, 0.4, 0.4]} /><meshStandardMaterial color="#3b82f6" /><Html distanceFactor={10} position={[0, 0.4, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase">Root Node</div></Html></mesh>
      <mesh position={[-1, 0, 0]}><boxGeometry args={[0.6, 0.3, 0.3]} /><meshStandardMaterial color="#8b5cf6" /><Html distanceFactor={10} position={[0, 0.3, 0]}><div className="text-[6px] font-black text-white bg-purple-500 px-1 rounded uppercase">Decision A</div></Html></mesh>
      <mesh position={[1, 0, 0]}><boxGeometry args={[0.6, 0.3, 0.3]} /><meshStandardMaterial color="#8b5cf6" /><Html distanceFactor={10} position={[0, 0.3, 0]}><div className="text-[6px] font-black text-white bg-purple-500 px-1 rounded uppercase">Decision B</div></Html></mesh>
      <mesh position={[-1.5, -1.5, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#10b981" /><Html distanceFactor={10} position={[0, -0.4, 0]}><div className="text-[6px] font-black text-white bg-green-500 px-1 rounded uppercase">Leaf (Class 1)</div></Html></mesh>
      <mesh position={[-0.5, -1.5, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#ef4444" /><Html distanceFactor={10} position={[0, -0.4, 0]}><div className="text-[6px] font-black text-white bg-red-500 px-1 rounded uppercase">Leaf (Class 2)</div></Html></mesh>
      <mesh position={[1.5, -1.5, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#10b981" /></mesh>
      <mesh position={[-0.5, 0.75, 0]} rotation={[0, 0, Math.PI / 4]}><cylinderGeometry args={[0.02, 0.02, 1.5, 8]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh position={[0.5, 0.75, 0]} rotation={[0, 0, -Math.PI / 4]}><cylinderGeometry args={[0.02, 0.02, 1.5, 8]} /><meshStandardMaterial color="#94a3b8" /></mesh>
    </group>
  );
}

function Clustering3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.15; });

  const cent1: [number, number, number] = [-1.5, 1, -1.5];
  const cent2: [number, number, number] = [1.5, -1, 1.5];
  const cent3: [number, number, number] = [2, 1.5, -1];

  const genPoints = (c: [number, number, number], num: number) => {
    return Array.from({ length: num }, () => [
      c[0] + (Math.random() * 1.5 - 0.75),
      c[1] + (Math.random() * 1.5 - 0.75),
      c[2] + (Math.random() * 1.5 - 0.75)
    ] as [number, number, number]);
  };

  const c1Points = genPoints(cent1, 20);
  const c2Points = genPoints(cent2, 20);
  const c3Points = genPoints(cent3, 20);

  const DistanceLine = ({ start, end, color }: { start: [number,number,number], end: [number,number,number], color: string }) => {
    const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
    return (
      // @ts-ignore
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </line>
    );
  };

  return (
    <group ref={groupRef}>
      {/* Cluster 1 */}
      <mesh position={cent1}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" wireframe emissive="#3b82f6" emissiveIntensity={0.5} />
        <Html distanceFactor={10} position={[0, 0.5, 0]}><div className="text-[6px] font-black text-white bg-blue-600 px-1 rounded uppercase tracking-tighter">Centroid (K=1)</div></Html>
      </mesh>
      {c1Points.map((p, i) => (
        <group key={`c1-${i}`}>
          <mesh position={p}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#60a5fa" /></mesh>
          <DistanceLine start={cent1} end={p} color="#60a5fa" />
        </group>
      ))}

      {/* Cluster 2 */}
      <mesh position={cent2}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#10b981" wireframe emissive="#10b981" emissiveIntensity={0.5} />
        <Html distanceFactor={10} position={[0, 0.5, 0]}><div className="text-[6px] font-black text-white bg-green-600 px-1 rounded uppercase tracking-tighter">Centroid (K=2)</div></Html>
      </mesh>
      {c2Points.map((p, i) => (
        <group key={`c2-${i}`}>
          <mesh position={p}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#34d399" /></mesh>
          <DistanceLine start={cent2} end={p} color="#34d399" />
        </group>
      ))}

      {/* Cluster 3 */}
      <mesh position={cent3}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ef4444" wireframe emissive="#ef4444" emissiveIntensity={0.5} />
        <Html distanceFactor={10} position={[0, 0.5, 0]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase tracking-tighter">Centroid (K=3)</div></Html>
      </mesh>
      {c3Points.map((p, i) => (
        <group key={`c3-${i}`}>
          <mesh position={p}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#f87171" /></mesh>
          <DistanceLine start={cent3} end={p} color="#f87171" />
        </group>
      ))}
    </group>
  );
}

function SVM3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3; });

  const classA = Array.from({length: 12}, () => [Math.random() * 2 - 2, Math.random() * 2 + 0.5, Math.random() * 2 - 1]);
  const classB = Array.from({length: 12}, () => [Math.random() * 2 + 1, Math.random() * 2 - 1.5, Math.random() * 2 - 1]);

  return (
    <group ref={groupRef}>
      {classA.map((p, i) => <mesh key={`a-${i}`} position={p as [number,number,number]}><boxGeometry args={[0.15, 0.15, 0.15]} /><meshStandardMaterial color="#ef4444" /></mesh>)}
      {classB.map((p, i) => <mesh key={`b-${i}`} position={p as [number,number,number]}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#3b82f6" /></mesh>)}
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 6]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#eab308" transparent opacity={0.4} side={THREE.DoubleSide} />
        <Html distanceFactor={10} position={[0, 0, 0]}><div className="text-[6px] font-black text-slate-900 bg-yellow-400 px-1 rounded uppercase">Optimal Hyperplane</div></Html>
      </mesh>
    </group>
  );
}
function Atom3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.5; });

  return (
    <group ref={groupRef}>
      {/* Nucleus */}
      <mesh><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} /><Html distanceFactor={10} position={[0, 0.5, 0]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase">Nucleus (Protons/Neutrons)</div></Html></mesh>
      {/* Electron Orbits */}
      <mesh rotation={[Math.PI / 3, 0, 0]}><torusGeometry args={[1.2, 0.02, 16, 100]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh rotation={[-Math.PI / 3, Math.PI / 4, 0]}><torusGeometry args={[1.2, 0.02, 16, 100]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh rotation={[0, Math.PI / 2, Math.PI / 4]}><torusGeometry args={[1.2, 0.02, 16, 100]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      {/* Electrons */}
      <mesh position={[1.2, 0, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#3b82f6" /><Html distanceFactor={10} position={[0, -0.3, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase">Electron</div></Html></mesh>
      <mesh position={[-0.8, 0.8, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
    </group>
  );
}

function AnimalCell3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.5; });

  return (
    <group ref={groupRef}>
      {/* Cell Membrane */}
      <mesh>
        <sphereGeometry args={[1.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.8} opacity={0.5} transparent roughness={0.2} side={THREE.DoubleSide} />
        <Html distanceFactor={10} position={[1.8, 0, 0]}><div className="text-[6px] font-black text-white bg-sky-500 px-1 rounded uppercase">Cell Membrane</div></Html>
      </mesh>
      {/* Nucleus */}
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#a855f7" />
        <Html distanceFactor={10} position={[0, 0.7, 0]}><div className="text-[6px] font-black text-white bg-purple-500 px-1 rounded uppercase">Nucleus</div></Html>
      </mesh>
      {/* Mitochondria */}
      <mesh position={[0.8, -1, 0.5]} rotation={[0, 0, Math.PI / 4]}>
        <capsuleGeometry args={[0.15, 0.4, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
        <Html distanceFactor={10} position={[0, 0.4, 0]}><div className="text-[6px] font-black text-white bg-red-500 px-1 rounded uppercase">Mitochondria (Powerhouse)</div></Html>
      </mesh>
      <mesh position={[-0.8, -0.8, -0.5]} rotation={[0, Math.PI / 2, -Math.PI / 4]}>
        <capsuleGeometry args={[0.15, 0.4, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

function Brain3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3; });

  return (
    <group ref={groupRef}>
      {/* Left Hemisphere (Frontal/Parietal) */}
      <mesh position={[-0.4, 0.5, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#fca5a5" roughness={0.7} />
        <Html distanceFactor={10} position={[-1, 0.5, 0]}><div className="text-[6px] font-black text-slate-900 bg-pink-200 px-1 rounded uppercase border border-pink-400">Frontal Lobe</div></Html>
      </mesh>
      {/* Right Hemisphere */}
      <mesh position={[0.4, 0.5, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#fca5a5" roughness={0.7} />
      </mesh>
      {/* Cerebellum */}
      <mesh position={[0, -0.5, -0.8]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#f87171" roughness={0.9} />
        <Html distanceFactor={10} position={[0, -0.8, 0]}><div className="text-[6px] font-black text-white bg-red-500 px-1 rounded uppercase">Cerebellum</div></Html>
      </mesh>
      {/* Brain Stem */}
      <mesh position={[0, -1.2, -0.2]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 32]} />
        <meshStandardMaterial color="#fcd34d" />
        <Html distanceFactor={10} position={[0.3, 0, 0]}><div className="text-[6px] font-black text-slate-900 bg-amber-200 px-1 rounded uppercase border border-amber-400">Brain Stem</div></Html>
      </mesh>
    </group>
  );
}
function FeatureDetection3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2; });

  const grid = [];
  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      const isEdge = (i === j); // Diagonal edge
      grid.push({ p: [i*0.4 - 0.6, j*0.4 - 0.6, 0], isEdge });
    }
  }

  return (
    <group ref={groupRef}>
      {grid.map((cell, i) => (
        <mesh key={i} position={cell.p as [number,number,number]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color={cell.isEdge ? "#ef4444" : "#94a3b8"} emissive={cell.isEdge ? "#ef4444" : "#000000"} emissiveIntensity={cell.isEdge ? 1 : 0} />
          {cell.isEdge && i === 5 && <Html distanceFactor={10} position={[0, 0, 0.2]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase tracking-tighter shadow-xl">Diagonal Edge Detected</div></Html>}
        </mesh>
      ))}
    </group>
  );
}

function GridTopology3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { 
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <gridHelper args={[4, 10, "#3b82f6", "#1e40af"]} position={[0, -0.5, 0]} />
      <gridHelper args={[4, 10, "#10b981", "#047857"]} position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} />
      
      <mesh position={[0.5, -0.5, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        <Html distanceFactor={10} position={[0, 0.3, 0]}><div className="text-[6px] font-black text-slate-900 bg-amber-400 px-1 rounded uppercase">Spatial Node (x,y)</div></Html>
      </mesh>
    </group>
  );
}

function ComputerVision3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3; });

  return (
    <group ref={groupRef}>
      {/* Camera Lens */}
      <mesh position={[-2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.1, 0.5, 16]} />
        <meshStandardMaterial color="#334155" />
        <Html distanceFactor={10} position={[0, 0.5, 0]}><div className="text-[6px] font-black text-white bg-slate-700 px-1 rounded uppercase">Camera Sensor</div></Html>
      </mesh>

      {/* Field of View (Frustum) */}
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[1.5, 3, 4]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.15} wireframe />
        <Html distanceFactor={10} position={[0, 1.5, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase">Field of View</div></Html>
      </mesh>

      {/* Detected Object */}
      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#ef4444" />
        <Html distanceFactor={10} position={[0, 0.6, 0]}><div className="text-[6px] font-black text-white bg-red-500 px-1 rounded uppercase border border-red-300">Bounding Box: Object</div></Html>
      </mesh>
    </group>
  );
}

function SingleCluster3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.4; });

  const points = Array.from({ length: 150 }, () => [
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.5
  ]);

  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.1} wireframe />
        <Html distanceFactor={10} position={[0, 1.5, 0]}><div className="text-[6px] font-black text-white bg-purple-600 px-1 rounded uppercase shadow-xl border border-purple-400 tracking-tighter">Dense Data Cluster</div></Html>
      </mesh>
    </group>
  );
}

function CentroidsOnly3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2; });

  const cents = [
    { p: [-1.5, 1, 0], c: "#3b82f6", n: "μ1" },
    { p: [1.5, 0, 1], c: "#10b981", n: "μ2" },
    { p: [0, -1.5, -1], c: "#ef4444", n: "μ3" }
  ];

  return (
    <group ref={groupRef}>
      {cents.map((c, i) => (
        <mesh key={i} position={c.p as [number,number,number]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial color={c.c} wireframe emissive={c.c} emissiveIntensity={1} />
          <Html distanceFactor={10} position={[0, 0.6, 0]}><div className="text-[6px] font-black text-white bg-slate-900 px-1 rounded uppercase border shadow-xl tracking-tighter" style={{ borderColor: c.c }}>Centroid {c.n}</div></Html>
        </mesh>
      ))}
    </group>
  );
}

function EuclideanDistance3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5; });

  const p1: [number,number,number] = [-1.5, -1, 0];
  const p2: [number,number,number] = [1.5, 1, 0];

  const DistanceLine = () => {
    const points = useMemo(() => [new THREE.Vector3(...p1), new THREE.Vector3(...p2)], []);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
    return (
      // @ts-ignore
      <line geometry={lineGeometry}>
        <lineBasicMaterial color="#fbbf24" linewidth={5} />
      </line>
    );
  };

  return (
    <group ref={groupRef}>
      <mesh position={p1}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" />
        <Html distanceFactor={10} position={[-0.3, 0.4, 0]}><div className="text-[6px] font-black text-white bg-blue-600 px-1 rounded uppercase shadow-xl tracking-tighter">Point A (x₁, y₁)</div></Html>
      </mesh>
      <mesh position={p2}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
        <Html distanceFactor={10} position={[0.3, 0.4, 0]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase shadow-xl tracking-tighter">Point B (x₂, y₂)</div></Html>
      </mesh>
      <DistanceLine />
      <Html distanceFactor={10} position={[0, 0.2, 0]}><div className="text-[6px] font-black text-slate-900 bg-amber-400 px-1 rounded uppercase shadow-xl border border-amber-500 tracking-tighter">Distance = √Δx² + Δy²</div></Html>
    </group>
  );
}

function RawData3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.1; });

  const points = Array.from({ length: 300 }, () => [
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4
  ]);

  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
      <Html distanceFactor={10} position={[0, 2.5, 0]}><div className="text-[6px] font-black text-white bg-slate-800 px-1 rounded uppercase border border-slate-500 tracking-tighter shadow-xl">Unstructured Raw Data</div></Html>
    </group>
  );
}

function AIModel3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2; });

  return (
    <group ref={groupRef}>
      {/* Input Data */}
      <mesh position={[-2, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" />
        <Html distanceFactor={10} position={[0, -0.6, 0]}><div className="text-[6px] font-black text-white bg-slate-600 px-1 rounded uppercase tracking-tighter shadow-xl">Raw Input</div></Html>
      </mesh>
      
      {/* The Model */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#8b5cf6" wireframe emissive="#8b5cf6" emissiveIntensity={0.5} />
        <Html distanceFactor={10} position={[0, 1.2, 0]}><div className="text-[8px] font-black text-white bg-purple-600 px-1 rounded uppercase shadow-xl tracking-tighter">Trained ML Model</div></Html>
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6d28d9" transparent opacity={0.5} />
      </mesh>

      {/* Output Prediction */}
      <mesh position={[2, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#10b981" />
        <Html distanceFactor={10} position={[0, -0.6, 0]}><div className="text-[6px] font-black text-white bg-green-600 px-1 rounded uppercase tracking-tighter shadow-xl">Prediction</div></Html>
      </mesh>

      {/* Data Flow Arrows */}
      <mesh position={[-1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.4, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.4, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

function DataLabels3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2; });

  return (
    <group ref={groupRef}>
      {/* Unlabeled vs Labeled Data */}
      <mesh position={[-1.5, 0, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" />
        <Html distanceFactor={10} position={[0, -0.8, 0]}><div className="text-[6px] font-black text-slate-800 bg-slate-200 px-1 rounded uppercase shadow-xl tracking-tighter border border-slate-400">Unlabeled Data</div></Html>
      </mesh>

      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" />
        <Html distanceFactor={10} position={[0, 0.6, 0]}><div className="text-[6px] font-black text-white bg-blue-600 px-1 rounded uppercase shadow-xl tracking-tighter border border-blue-400">Label: Class A</div></Html>
      </mesh>

      <mesh position={[1.5, -0.5, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#ef4444" />
        <Html distanceFactor={10} position={[0, 0.6, 0]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase shadow-xl tracking-tighter border border-red-400">Label: Class B</div></Html>
      </mesh>
    </group>
  );
}

function HumanAnatomy3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2; });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#fca5a5" transparent opacity={0.8} />
        <Html distanceFactor={10} position={[0.4, 0, 0]}><div className="text-[6px] font-black text-white bg-red-500 px-1 rounded uppercase tracking-tighter shadow-xl border border-red-300">Cranium</div></Html>
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.4, 0.3, 1.2, 16]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
        <Html distanceFactor={10} position={[-0.5, 0, 0]}><div className="text-[6px] font-black text-white bg-blue-500 px-1 rounded uppercase tracking-tighter shadow-xl border border-blue-300">Thorax</div></Html>
      </mesh>
      {/* Arms */}
      <mesh position={[-0.6, 0.4, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.6, 0.4, 0]} rotation={[0, 0, Math.PI / 8]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 1.2, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.2, -0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 1.2, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

function StudyBook3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.3; });

  const particles = Array.from({ length: 30 }, () => [
    (Math.random() - 0.5) * 1.5,
    Math.random() * 2,
    (Math.random() - 0.5) * 1.5
  ]);

  return (
    <group ref={groupRef}>
      {/* Left Page */}
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <boxGeometry args={[1, 0.05, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Right Page */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 8]}>
        <boxGeometry args={[1, 0.05, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Cover Spine */}
      <group position={[0, -0.1, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.5, 16]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <Html distanceFactor={10} position={[0, -0.3, 0]}><div className="text-[6px] font-black text-white bg-blue-600 px-1 rounded uppercase tracking-tighter shadow-xl border border-blue-400">Academic Material</div></Html>
      </group>
      
      {/* Knowledge Particles */}
      {particles.map((p, i) => (
        <mesh key={i} position={p as [number,number,number]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

function StructuralLattice3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { 
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  const nodes = [];
  for(let x=-1; x<=1; x+=1) {
    for(let y=-1; y<=1; y+=1) {
      for(let z=-1; z<=1; z+=1) {
        nodes.push([x,y,z]);
      }
    }
  }

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} position={[0, 1.5, 0]}><div className="text-[6px] font-black text-white bg-slate-800 px-1 rounded uppercase tracking-tighter shadow-xl border border-slate-400">Structural Lattice</div></Html>
      {/* Nodes */}
      {nodes.map((n, i) => (
        <mesh key={`n-${i}`} position={n as [number,number,number]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#f87171" />
        </mesh>
      ))}
      {/* Wireframe box overlay */}
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#94a3b8" wireframe />
      </mesh>
    </group>
  );
}

function Backpropagation3D() {
  const groupRef = useRef<THREE.Group>(null);
  
  const layers = [2, 3, 2];
  const nodes = layers.map((count, i) => {
    return Array.from({ length: count }, (_, j) => {
      return new THREE.Vector3(i * 2 - 2, j * 1 - (count * 0.5) + 0.5, 0);
    });
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} position={[0, 2, 0]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase shadow-xl tracking-tighter border border-red-400">Error Gradient Flow (Backward)</div></Html>
      
      {/* Neurons */}
      {nodes.flat().map((pos, i) => (
        <mesh key={`n-${i}`} position={pos}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={pos.x > 0 ? "#ef4444" : "#3b82f6"} emissive={pos.x > 0 ? "#ef4444" : "#3b82f6"} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Backward Synapses */}
      {nodes.map((layer, i) => {
        if (i === 0) return null;
        const prevLayer = nodes[i - 1];
        return layer.map((n1, j) => {
          return prevLayer.map((n2, k) => {
            const mid = n1.clone().add(n2).multiplyScalar(0.5);
            const distance = n1.distanceTo(n2);
            return (
              <group key={`s-${i}-${j}-${k}`} position={mid} onUpdate={(self) => { self.lookAt(n2); self.rotateX(Math.PI/2); }}>
                <mesh>
                  <cylinderGeometry args={[0.02, 0.02, distance, 8]} />
                  <meshStandardMaterial color="#f87171" transparent opacity={0.6} />
                </mesh>
                <mesh position={[0, -distance * 0.2, 0]}>
                  <coneGeometry args={[0.08, 0.15, 8]} />
                  <meshStandardMaterial color="#ef4444" />
                </mesh>
              </group>
            );
          });
        });
      })}
    </group>
  );
}

function LossLandscape3D() {
  const groupRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    if (ballRef.current) {
      const t = (state.clock.elapsedTime % 3) / 3;
      const x = 2 - t * 4; 
      const y = x * x * 0.3 - 1;
      ballRef.current.position.set(x, y + 0.2, 0);
    }
  });

  const points = [];
  for(let x=-2.5; x<=2.5; x+=0.1) {
    points.push(new THREE.Vector3(x, x*x*0.3 - 1, 0));
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} position={[0, 1.5, 0]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase shadow-xl tracking-tighter border border-red-400">Minimizing Error (Gradient Descent)</div></Html>
      
      {/* @ts-ignore */}
      <line geometry={lineGeo}>
        <lineBasicMaterial color="#3b82f6" linewidth={3} />
      </line>

      <mesh ref={ballRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
        <Html distanceFactor={10} position={[0, 0.4, 0]}><div className="text-[5px] font-black text-white bg-slate-800 px-1 rounded uppercase border border-red-500">Loss</div></Html>
      </mesh>
    </group>
  );
}

function MachineLearningGear3D() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  const teeth = 8;
  const teethArray = Array.from({ length: teeth });

  return (
    <group>
      <Html distanceFactor={10} position={[0, 2, 0]}><div className="text-[6px] font-black text-white bg-indigo-600 px-1 rounded uppercase tracking-tighter shadow-xl border border-indigo-400">Machine Learning Core</div></Html>
      <group ref={groupRef}>
        <mesh>
          <torusGeometry args={[1, 0.3, 16, 32]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        
        <mesh>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.8} emissive="#3b82f6" emissiveIntensity={1} />
        </mesh>

        {teethArray.map((_, i) => {
          const angle = (i / teeth) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0]} rotation={[0, 0, angle]}>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Kidney3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.3; });

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} position={[0, 1.5, 0]}><div className="text-[6px] font-black text-white bg-red-800 px-1 rounded uppercase shadow-xl tracking-tighter border border-red-400">Renal Anatomy (Kidneys)</div></Html>
      {/* Left Kidney (Bean Shape) */}
      <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
      {/* Right Kidney (Bean Shape) */}
      <mesh position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
      {/* Renal Vessels */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

function RoughSurface3D() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.2; });

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} position={[0, 1.2, 0]}><div className="text-[6px] font-black text-white bg-slate-700 px-1 rounded uppercase shadow-xl tracking-tighter border border-slate-500">Surface Texture: Rough</div></Html>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#94a3b8" wireframe />
      </mesh>
      {/* Jagged spikes to represent 'roughly' */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[(Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2]}>
          <coneGeometry args={[0.05, 0.3, 4]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
    </group>
  );
}

function BloodFlow3D() {
  const groupRef = useRef<THREE.Group>(null);
  const cellsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (cellsRef.current) {
      cellsRef.current.children.forEach((cell, i) => {
        cell.position.y += 0.02;
        if (cell.position.y > 1.5) cell.position.y = -1.5;
      });
    }
  });

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} position={[0, 2, 0]}><div className="text-[6px] font-black text-white bg-red-600 px-1 rounded uppercase shadow-xl tracking-tighter border border-red-400">Circulatory System: Blood</div></Html>
      {/* Vessel Wall */}
      <mesh>
        <cylinderGeometry args={[0.6, 0.6, 3, 32, 1, true]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Red Blood Cells */}
      <group ref={cellsRef}>
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={i} position={[(Math.random()-0.5)*0.8, (Math.random()-0.5)*3, (Math.random()-0.5)*0.8]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#b91c1c" emissive="#7f1d1d" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SolarSystem3D() {
  const groupRef = useRef<THREE.Group>(null);
  const planetsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (planetsRef.current) {
      planetsRef.current.children.forEach((planetGroup, i) => {
        const speed = 0.5 / (i + 1);
        const radius = 1.8 + i * 0.9;
        const angle = state.clock.elapsedTime * speed;
        // The first child is the orbit ring, the second is the planet group
        const planetMeshGroup = planetGroup.children[1];
        if (planetMeshGroup) {
          planetMeshGroup.position.x = Math.cos(angle) * radius;
          planetMeshGroup.position.z = Math.sin(angle) * radius;
          planetMeshGroup.rotation.y += 0.01;
        }
      });
    }
  });

  const planets = [
    { color: "#ff9f43", size: 0.15, name: "Mercury" },
    { color: "#feca57", size: 0.25, name: "Venus" },
    { color: "#54a0ff", size: 0.28, name: "Earth" },
    { color: "#ee5253", size: 0.2, name: "Mars" },
    { color: "#ff9f43", size: 0.5, name: "Jupiter" },
  ];

  return (
    <group ref={groupRef}>
      <Html distanceFactor={10} position={[0, 3, 0]}><div className="text-[6px] font-black text-white bg-orange-600 px-1 rounded uppercase shadow-xl tracking-tighter border border-orange-400">Celestial Mechanics: Solar System</div></Html>
      
      {/* The Sun */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#f1c40f" emissive="#f39c12" emissiveIntensity={2} />
        <pointLight intensity={2} color="#f1c40f" />
      </mesh>

      {/* Orbits & Planets */}
      <group ref={planetsRef}>
        {planets.map((p, i) => (
          <group key={i}>
            {/* Orbit Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.8 + i * 0.9 - 0.02, 1.8 + i * 0.9 + 0.02, 64]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            {/* The Planet Group */}
            <group>
              <mesh>
                <sphereGeometry args={[p.size, 16, 16]} />
                <meshStandardMaterial color={p.color} />
                <Html distanceFactor={8} position={[0, p.size + 0.3, 0]}>
                  <div className="text-[4px] font-bold text-white bg-black/60 px-1 rounded whitespace-nowrap border border-white/20">{p.name}</div>
                </Html>
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

function Scene({ data, title, modelUrl }: { data: ProceduralPrimitive[], title: string, modelUrl?: string | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const titleLower = title.toLowerCase();
  
  // Load GLB if available
  const { scene: glbScene } = modelUrl ? useGLTF(modelUrl) : { scene: null };
  
  // Detection logic for custom components
  const isCNN = titleLower.includes("cnn") || titleLower.includes("convolutional") || titleLower.includes("convolution");
  const isFeatureDetection = titleLower.includes("feature detection");
  const isGridTopology = titleLower.includes("grid-like") || titleLower.includes("grid topology");
  const isComputerVision = titleLower.includes("computer vision");
  const isLinearRegression = titleLower.includes("linear regression") || titleLower.includes("scatter plot") || titleLower.includes("data visualization");
  const isVisionPro = titleLower.includes("vision pro") || titleLower.includes("apple vision");
  const isGenerative = titleLower.includes("generative") || titleLower.includes("gan") || titleLower.includes("diffusion");
  const isDNA = titleLower.includes("dna") || titleLower.includes("genetics");
  const isNeuralNetwork = titleLower.includes("neural") || titleLower.includes("network") || titleLower.includes("deep learning");
  
  // New Additions
  const isEye = titleLower.includes("eye") || titleLower.includes("ocular") || titleLower.includes("retina");
  const isPhotosynthesis = titleLower.includes("photosynthesis") || titleLower.includes("chloroplast");
  const isTransformer = titleLower.includes("transformer") || titleLower.includes("attention");
  const isDecisionTree = titleLower.includes("decision tree") || titleLower.includes("random forest");
  const isSVM = titleLower.includes("svm") || titleLower.includes("support vector");
  
  // Specific Clustering Models
  const isKMeans = titleLower.includes("k-means") || titleLower.includes("k means") || titleLower.includes("kmeans");
  const isCentroids = titleLower.includes("centroid") || titleLower.includes("cluster center");
  const isDistance = titleLower.includes("distance") || titleLower.includes("euclidean");
  const isRawData = titleLower === "data" || titleLower.includes("raw data");
  const isCluster = (titleLower === "cluster" || titleLower.includes("cluster ")) && !isCentroids && !titleLower.includes("label");
  const isModel = titleLower === "model" || titleLower.includes("ml model") || titleLower.includes("ai model");
  const isLabels = titleLower === "labels" || titleLower === "label" || titleLower.includes("labeled");

  
  // Brand New Additions
  const isAtom = titleLower.includes("atom") || titleLower.includes("bohr") || titleLower.includes("electron") || titleLower.includes("scientific") || titleLower.includes("science");
  const isCell = titleLower.includes("cell") || titleLower.includes("mitochondria") || titleLower.includes("nucleus");
  const isBrain = titleLower.includes("brain") || titleLower.includes("cerebrum") || titleLower.includes("lobe");
  const isAnatomy = titleLower.includes("anatomy") || titleLower.includes("human") || titleLower.includes("organ");
  const isStudy = titleLower.includes("study") || titleLower.includes("education");
  const isStructural = titleLower.includes("structural") || titleLower.includes("structure");
  const isKidneys = titleLower.includes("kidney") || titleLower.includes("beanshaped") || titleLower.includes("bean-shaped");
  const isBlood = titleLower.includes("blood") || titleLower.includes("vessel") || titleLower.includes("circulatory");
  const isRoughly = titleLower.includes("roughly") || titleLower.includes("rough");
  const isBackpropagation = titleLower.includes("backpropagation") || titleLower.includes("backward");
  const isErrors = titleLower.includes("error") || titleLower.includes("loss");
  const isMachineLearning = titleLower.includes("machine") || titleLower.includes("learning");
  const isSolarSystem = titleLower.includes("solar") || titleLower.includes("planet") || titleLower.includes("orbit") || titleLower.includes("galaxy") || titleLower.includes("space") || titleLower.includes("gravit");
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {isCNN ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><CNN3D /></Float>
      ) : isFeatureDetection ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><FeatureDetection3D /></Float>
      ) : isGridTopology ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><GridTopology3D /></Float>
      ) : isComputerVision ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><ComputerVision3D /></Float>
      ) : isLinearRegression ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><LinearRegression3D /></Float>
      ) : isVisionPro ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><AppleVisionPro3D /></Float>
      ) : isGenerative ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><GenerativeAI3D /></Float>
      ) : isDNA ? (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}><DNA3D /></Float>
      ) : isEye ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><HumanEye3D /></Float>
      ) : isPhotosynthesis ? (
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}><Photosynthesis3D /></Float>
      ) : isTransformer ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><Transformer3D /></Float>
      ) : isDecisionTree ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><DecisionTree3D /></Float>
      ) : isSVM ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><SVM3D /></Float>
      ) : isAnatomy ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><HumanAnatomy3D /></Float>
      ) : isStudy ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><StudyBook3D /></Float>
      ) : isStructural ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><StructuralLattice3D /></Float>
      ) : isKMeans ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><Clustering3D /></Float>
      ) : isCentroids ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><CentroidsOnly3D /></Float>
      ) : isDistance ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><EuclideanDistance3D /></Float>
      ) : isRawData ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><RawData3D /></Float>
      ) : isCluster ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><SingleCluster3D /></Float>
      ) : isModel ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><AIModel3D /></Float>
      ) : isLabels ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><DataLabels3D /></Float>
      ) : isBackpropagation ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><Backpropagation3D /></Float>
      ) : isErrors ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><LossLandscape3D /></Float>
      ) : isMachineLearning ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><MachineLearningGear3D /></Float>
      ) : isSolarSystem ? (
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}><SolarSystem3D /></Float>
      ) : isKidneys ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><Kidney3D /></Float>
      ) : isBlood ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><BloodFlow3D /></Float>
      ) : isRoughly ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><RoughSurface3D /></Float>
      ) : isNeuralNetwork ? (
        <Float speed={3} rotationIntensity={1} floatIntensity={1}><NeuralNetwork3D /></Float>
      ) : isAtom ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><Atom3D /></Float>
      ) : isCell ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><AnimalCell3D /></Float>
      ) : isBrain ? (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}><Brain3D /></Float>
      ) : modelUrl && glbScene ? (
        <primitive object={glbScene} scale={2} />
      ) : (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {data.map((item, i) => (
            <PrimitiveWithLabel key={i} data={item} />
          ))}
        </Float>
      )}

      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.4} 
        scale={10} 
        blur={2.5} 
        far={4.5} 
      />
    </group>
  );
}

export function ARVisualizerCanvas({ proceduralData, title, modelUrl }: ARVisualizerCanvasProps) {
  // SMART PRESETS: Guarantee high-fidelity for common anatomical terms
  const titleLower = title.toLowerCase();
  let safeData = proceduralData;

  if (!safeData || safeData.length <= 1) {
    if (titleLower.includes("lung")) {
      safeData = [
        { shape: "sphere", position: [-1.2, 0, 0], scale: [1, 1.8, 0.8], color: "#ff6b6b", label: "Left Lung" },
        { shape: "sphere", position: [1.2, 0, 0], scale: [1, 1.8, 0.8], color: "#ff6b6b", label: "Right Lung" },
        { shape: "cylinder", position: [0, 1.5, 0], scale: [0.2, 1, 0.2], color: "#feca57", label: "Trachea" },
        { shape: "cylinder", position: [-0.4, 0.8, 0], scale: [0.15, 0.6, 0.15], color: "#ff9f43", label: "Bronchus (L)" },
        { shape: "cylinder", position: [0.4, 0.8, 0], scale: [0.15, 0.6, 0.15], color: "#ff9f43", label: "Bronchus (R)" },
      ] as ProceduralPrimitive[];
    } else if (titleLower.includes("heart")) {
      safeData = [
        { shape: "sphere", position: [0, 0, 0], scale: [1.2, 1.4, 1], color: "#ee5253", label: "Cardiac Muscle" },
        { shape: "cylinder", position: [0.3, 1, 0], scale: [0.3, 1, 0.3], color: "#ff6b6b", label: "Aorta" },
        { shape: "cylinder", position: [-0.3, 0.8, 0], scale: [0.25, 0.8, 0.25], color: "#48dbfb", label: "Vena Cava" },
      ] as ProceduralPrimitive[];
    } else {
      // Default geometric cluster for unknown concepts
      safeData = [
        { shape: "sphere", position: [0, 0, 0], scale: [1, 1, 1], color: "#54a0ff", label: title },
        { shape: "box", position: [0, -1.2, 0], scale: [1.5, 0.1, 1.5], color: "#2e86de", label: "Concept Base" }
      ] as ProceduralPrimitive[];
    }
  }

  return (
    <div className="w-full h-full bg-[#f8fafc] rounded-2xl overflow-hidden relative group border border-slate-200">
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3 pointer-events-none">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter leading-none">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Real-Time Procedural Engine</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 text-[9px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
        INTERACT WITH PRIMITIVES • SCROLL TO ZOOM
      </div>

      <ErrorBoundary fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Procedural Engine Error</p>
          <p className="text-[9px] mt-1">Invalid geometric data received from NVIDIA Nemotron.</p>
        </div>
      }>
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 border-4 border-primary border-t-transparent animate-spin rounded-full" />
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Compiling Geometry...</p>
              </div>
            </Html>
          }>
            <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={45} />
            <OrbitControls 
              enablePan={false} 
              minDistance={3} 
              maxDistance={12} 
              autoRotate 
              autoRotateSpeed={0.8}
              maxPolarAngle={Math.PI / 1.8}
            />
            
            <ambientLight intensity={0.7} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
            <pointLight position={[-10, -5, -10]} intensity={0.5} />
            
            <Scene data={safeData} title={title} modelUrl={modelUrl} />
            
            <Environment preset="studio" />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
