'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
interface DAGNode3D {
    id: number;
    position: THREE.Vector3;
    parents: number[];
    depth: number;
    lane: number;
    color: THREE.Color;
    hash: string;
    birthTime: number;
}

// ─── Colors ────────────────────────────────────────────
const PALETTE = [
    new THREE.Color('#00ffff'), new THREE.Color('#00e5ff'),
    new THREE.Color('#00bcd4'), new THREE.Color('#26c6da'),
    new THREE.Color('#00e676'), new THREE.Color('#69f0ae'),
    new THREE.Color('#76ff03'), new THREE.Color('#4dd0e1'),
];

function genHash(): string {
    const c = '0123456789abcdef';
    let h = '';
    for (let i = 0; i < 8; i++) h += c[Math.floor(Math.random() * 16)];
    return h;
}

// ─── All-in-one 3D scene rendered via refs (no per-node React components) ────
function DAGScene({ isPaused, onNodeSelect }: {
    isPaused: boolean;
    onNodeSelect: (node: { hash: string; depth: number; parents: number; lane: number; color: string } | null) => void;
}) {
    const { camera, raycaster, pointer } = useThree();
    const nodesRef = useRef<DAGNode3D[]>([]);
    const idRef = useRef(0);
    const lastAddRef = useRef(0);
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    // Instanced mesh for nodes
    const instancedRef = useRef<THREE.InstancedMesh>(null);
    const MAX_INSTANCES = 80;
    const LANES = 6;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Edge lines
    const edgeLinesRef = useRef<THREE.LineSegments>(null);
    const edgePositions = useRef(new Float32Array(MAX_INSTANCES * 3 * 2 * 6)); // up to 3 parents per node, 2 points per line
    const edgeColors = useRef(new Float32Array(MAX_INSTANCES * 3 * 2 * 6));

    // Particles — initialize inline so positions are valid on first render
    const particlesRef = useRef<THREE.Points>(null);
    const PARTICLE_COUNT = 200;
    const particleData = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const speeds: number[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            speeds.push(0.005 + Math.random() * 0.01);
        }
        return { positions, speeds };
    }, []);

    // Set bounding spheres manually to prevent NaN computations on empty buffers
    const geometryInitRef = useRef(false);
    useEffect(() => {
        if (geometryInitRef.current) return;
        geometryInitRef.current = true;

        // Set manual bounding sphere on edges
        if (edgeLinesRef.current) {
            edgeLinesRef.current.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);
            edgeLinesRef.current.frustumCulled = false;
        }
        // Set manual bounding sphere on particles
        if (particlesRef.current) {
            particlesRef.current.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);
            particlesRef.current.frustumCulled = false;
        }
    });

    // Add blocks
    const addRow = useCallback(() => {
        const nodes = nodesRef.current;
        const depth = nodes.length > 0 ? Math.max(...nodes.map(n => n.depth)) + 1 : 0;
        const count = 1 + Math.floor(Math.random() * 3);
        const used = new Set<number>();

        for (let i = 0; i < count; i++) {
            let lane: number;
            do { lane = Math.floor(Math.random() * LANES); } while (used.has(lane));
            used.add(lane);

            const cands = nodes.filter(n => n.depth >= depth - 3 && n.depth < depth);
            const parents: number[] = [];
            if (cands.length > 0) {
                const sorted = cands.map(p => ({ id: p.id, d: Math.abs(p.lane - lane) })).sort((a, b) => a.d - b.d);
                const np = Math.min(3, Math.min(sorted.length, 1 + Math.floor(Math.random() * 3)));
                for (let j = 0; j < np; j++) if (!parents.includes(sorted[j].id)) parents.push(sorted[j].id);
            }

            const x = (lane - LANES / 2) * 1.6 + (Math.random() - 0.5) * 0.3;
            const z = (Math.random() - 0.5) * 2.5;

            nodes.push({
                id: idRef.current++,
                position: new THREE.Vector3(x, 0, z),
                parents,
                depth,
                lane,
                color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
                hash: genHash(),
                birthTime: performance.now(),
            });
        }

        // Re-center Y
        if (nodes.length > 0) {
            const avgD = nodes.reduce((s, n) => s + n.depth, 0) / nodes.length;
            nodes.forEach(n => {
                n.position.y = (n.depth - avgD) * 1.2;
            });
        }

        // Trim
        if (nodes.length > MAX_INSTANCES) {
            nodesRef.current = nodes.slice(nodes.length - MAX_INSTANCES);
        }
    }, []);

    // Initialize
    useEffect(() => {
        for (let i = 0; i < 20; i++) addRow();
    }, [addRow]);

    // Main animation loop - ALL rendering happens here, no React re-renders
    useFrame((state, delta) => {
        const now = performance.now();
        const nodes = nodesRef.current;
        const mesh = instancedRef.current;

        // Add blocks on timer (no setState!)
        if (!isPausedRef.current && now - lastAddRef.current > 900) {
            addRow();
            lastAddRef.current = now;
        }

        // ──── Update instanced nodes ────
        if (mesh) {
            mesh.count = nodes.length;

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const age = now - n.birthTime;
                const isNew = age < 2500;

                // Gentle floating
                const floatY = Math.sin(now * 0.001 + n.id * 0.7) * 0.06;

                // Scale pulse for new nodes
                const scale = isNew ? 0.22 + Math.sin(now * 0.004 + n.id) * 0.06 : 0.18;

                dummy.position.set(n.position.x, n.position.y + floatY, n.position.z);
                dummy.scale.setScalar(scale);
                dummy.rotation.y = now * 0.0005 + n.id;
                dummy.rotation.x = now * 0.0003;
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);

                // Color with emissive boost for new nodes
                const brightness = isNew ? 2.5 : 0.8;
                const col = n.color.clone().multiplyScalar(brightness);
                mesh.setColorAt(i, col);
            }

            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }

        // ──── Update edge lines ────
        if (edgeLinesRef.current) {
            const positions = edgePositions.current;
            const colors = edgeColors.current;
            let edgeIdx = 0;

            nodes.forEach(n => {
                n.parents.forEach(pid => {
                    const parent = nodes.find(p => p.id === pid);
                    if (!parent || edgeIdx >= positions.length / 6) return;

                    const age = now - n.birthTime;
                    const isNew = age < 2500;
                    const alpha = isNew ? 0.7 : 0.15;

                    // Guard against NaN positions
                    const px = isFinite(parent.position.x) ? parent.position.x : 0;
                    const py = isFinite(parent.position.y) ? parent.position.y : 0;
                    const pz = isFinite(parent.position.z) ? parent.position.z : 0;
                    const nx = isFinite(n.position.x) ? n.position.x : 0;
                    const ny = isFinite(n.position.y) ? n.position.y : 0;
                    const nz = isFinite(n.position.z) ? n.position.z : 0;

                    // Start point
                    positions[edgeIdx * 6] = px;
                    positions[edgeIdx * 6 + 1] = py;
                    positions[edgeIdx * 6 + 2] = pz;
                    // End point
                    positions[edgeIdx * 6 + 3] = nx;
                    positions[edgeIdx * 6 + 4] = ny;
                    positions[edgeIdx * 6 + 5] = nz;

                    // Colors
                    colors[edgeIdx * 6] = n.color.r * alpha;
                    colors[edgeIdx * 6 + 1] = n.color.g * alpha;
                    colors[edgeIdx * 6 + 2] = n.color.b * alpha;
                    colors[edgeIdx * 6 + 3] = parent.color.r * alpha;
                    colors[edgeIdx * 6 + 4] = parent.color.g * alpha;
                    colors[edgeIdx * 6 + 5] = parent.color.b * alpha;

                    edgeIdx++;
                });
            });

            // Zero out remaining
            for (let i = edgeIdx * 6; i < positions.length; i++) {
                positions[i] = 0;
                colors[i] = 0;
            }

            const geo = edgeLinesRef.current.geometry;
            geo.attributes.position.needsUpdate = true;
            geo.attributes.color.needsUpdate = true;
            geo.setDrawRange(0, edgeIdx * 2);
        }

        // ──── Update background particles ────
        if (particlesRef.current) {
            const pp = particleData.positions;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                pp[i * 3 + 1] += particleData.speeds[i] * delta * 60;
                if (pp[i * 3 + 1] > 20) pp[i * 3 + 1] = -20;
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
            particlesRef.current.rotation.y += delta * 0.005;
        }
    });

    // Click detection
    const handleClick = useCallback(() => {
        const mesh = instancedRef.current;
        if (!mesh) return;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(mesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
            const node = nodesRef.current[intersects[0].instanceId];
            if (node) {
                onNodeSelect({
                    hash: node.hash,
                    depth: node.depth,
                    parents: node.parents.length,
                    lane: node.lane,
                    color: `#${node.color.getHexString()}`,
                });
                return;
            }
        }
        onNodeSelect(null);
    }, [camera, raycaster, pointer, onNodeSelect]);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.1} />
            <pointLight position={[8, 8, 8]} intensity={0.6} color="#00ffff" distance={30} />
            <pointLight position={[-8, 4, -8]} intensity={0.4} color="#8b5cf6" distance={25} />
            <pointLight position={[0, -6, 4]} intensity={0.2} color="#00e676" distance={20} />

            {/* Background & fog */}
            <color attach="background" args={['#020208']} />
            <fog attach="fog" args={['#020208', 12, 30]} />

            {/* Background particles — single Points object */}
            <points ref={particlesRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[particleData.positions, 3]} />
                </bufferGeometry>
                <pointsMaterial color="#00ffff" size={0.04} transparent opacity={0.3} sizeAttenuation depthWrite={false} />
            </points>

            {/* Edge lines — single LineSegments object */}
            <lineSegments ref={edgeLinesRef} onClick={handleClick} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[edgePositions.current, 3]} />
                    <bufferAttribute attach="attributes-color" args={[edgeColors.current, 3]} />
                </bufferGeometry>
                <lineBasicMaterial vertexColors transparent opacity={0.8} depthWrite={false} />
            </lineSegments>

            {/* Instanced nodes — single draw call for ALL nodes */}
            <instancedMesh
                ref={instancedRef}
                args={[undefined, undefined, MAX_INSTANCES]}
                onClick={handleClick}
            >
                <icosahedronGeometry args={[1, 2]} />
                <meshStandardMaterial
                    emissive="white"
                    emissiveIntensity={1}
                    metalness={0.95}
                    roughness={0.05}
                    toneMapped={false}
                />
            </instancedMesh>

            {/* Bloom glow */}
            <EffectComposer multisampling={0}>
                <Bloom
                    intensity={2.0}
                    luminanceThreshold={0.05}
                    luminanceSmoothing={0.4}
                    mipmapBlur
                />
            </EffectComposer>

            {/* Camera */}
            <OrbitControls
                enableDamping
                dampingFactor={0.08}
                minDistance={4}
                maxDistance={18}
                autoRotate
                autoRotateSpeed={0.5}
                enablePan={false}
                maxPolarAngle={Math.PI * 0.75}
            />
        </>
    );
}

// ─── Main Component ────────────────────────────────────
export function DAGVisualizer() {
    const [isPaused, setIsPaused] = useState(false);
    const [selectedNode, setSelectedNode] = useState<{
        hash: string; depth: number; parents: number; lane: number; color: string;
    } | null>(null);

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-[var(--primary)]">⬡</span> 3D BlockDAG Visualizer
                        <span className="live-dot" />
                    </h3>
                    <p className="text-sm text-white/50">Drag to orbit · Scroll to zoom · Click to inspect</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${isPaused ? 'bg-[var(--success)] text-black' : 'bg-white/10 hover:bg-white/15'}`}
                    >
                        {isPaused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
                    </button>
                </div>
            </div>

            {/* 3D Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-white/5" style={{ height: '500px' }}>
                <Canvas
                    camera={{ position: [6, 3, 6], fov: 55 }}
                    gl={{ antialias: true, powerPreference: 'high-performance' }}
                    dpr={[1, 1.5]}
                    frameloop="always"
                >
                    <DAGScene isPaused={isPaused} onNodeSelect={setSelectedNode} />
                </Canvas>

                {/* Overlay hints */}
                <div className="absolute top-3 left-3 space-y-1.5 pointer-events-none">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]" style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(0,255,255,0.1)' }}>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-white/70">Bright nodes = <strong className="text-cyan-300">new blocks</strong></span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]" style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(0,255,255,0.1)' }}>
                        <span className="text-cyan-400 text-xs">↗</span>
                        <span className="text-white/70">Lines = <strong className="text-cyan-300">parent links</strong></span>
                    </div>
                </div>

                {/* Selected block info */}
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-3 right-3 p-4 rounded-xl"
                        style={{ background: 'rgba(5,5,16,0.92)', border: '1px solid rgba(139,92,246,0.3)', backdropFilter: 'blur(16px)', minWidth: '170px' }}
                    >
                        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Block</div>
                        <div className="font-mono text-cyan-400 text-sm mb-3">0x{selectedNode.hash}</div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-white/40">Depth</span><span className="font-mono text-white">{selectedNode.depth}</span></div>
                            <div className="flex justify-between"><span className="text-white/40">Parents</span><span className="font-mono text-white">{selectedNode.parents}</span></div>
                            <div className="flex justify-between"><span className="text-white/40">Lane</span><span className="font-mono text-white">{selectedNode.lane}</span></div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Color</span>
                                <span className="flex items-center gap-1 font-mono text-white">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color, boxShadow: `0 0 6px ${selectedNode.color}` }} />
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Explainer */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.08)' }}>
                    <h4 className="text-sm font-bold text-cyan-400 mb-2">💡 What am I looking at?</h4>
                    <p className="text-xs text-white/55 leading-relaxed">
                        This is Kaspa&apos;s <strong className="text-white">BlockDAG</strong> — a Directed Acyclic Graph.
                        Unlike Bitcoin&apos;s chain, Kaspa mines <strong className="text-white">multiple blocks at the same time</strong>.
                        Each node connects to several parents, forming a web that processes transactions in parallel.
                    </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.08)' }}>
                    <h4 className="text-sm font-bold text-violet-400 mb-3">⚡ Why is this faster?</h4>
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-white/40 w-14">Bitcoin</span>
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (<div key={i} className="flex items-center"><div className="w-4 h-4 rounded bg-orange-500/25 border border-orange-500/40 text-[7px] text-orange-400 flex items-center justify-center">B</div>{i < 5 && <div className="w-2 h-px bg-orange-500/25" />}</div>))}
                            </div>
                            <span className="text-[9px] text-white/25">1 blk / 10 min</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-cyan-400 w-14 font-semibold">Kaspa</span>
                            <div className="flex items-center gap-0.5">
                                <div className="w-4 h-4 rounded-full bg-cyan-500/25 border border-cyan-400/40" />
                                <div className="flex flex-col gap-px"><div className="w-2 h-px bg-cyan-400/30" /><div className="w-2 h-px bg-cyan-400/30" /></div>
                                <div className="flex flex-col gap-0.5"><div className="w-4 h-4 rounded-full bg-cyan-500/25 border border-cyan-400/40" /><div className="w-4 h-4 rounded-full bg-cyan-500/25 border border-cyan-400/40" /></div>
                                <div className="flex flex-col gap-px"><div className="w-2 h-px bg-cyan-400/30" /><div className="w-2 h-px bg-cyan-400/30" /><div className="w-2 h-px bg-cyan-400/30" /></div>
                                <div className="flex flex-col gap-0.5"><div className="w-4 h-4 rounded-full bg-cyan-500/25 border border-cyan-400/40" /><div className="w-4 h-4 rounded-full bg-cyan-500/25 border border-cyan-400/40" /><div className="w-4 h-4 rounded-full bg-cyan-500/25 border border-cyan-400/40" /></div>
                            </div>
                            <span className="text-[9px] text-cyan-400/50 font-bold">10+ blk/sec!</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
