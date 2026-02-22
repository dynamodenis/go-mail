import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type LoaderProps = {
  size?: number;
  nodeCount?: number;
  nodeColor?: string | number;
  orbitRadius?: number;
  className?: string;
};

class OrbitalLoader {
  private container: HTMLElement;
  private size: number;
  private nodeCount: number;
  private nodeColor: number;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private centralSphere!: THREE.Mesh;
  private nodes: THREE.Mesh[] = [];
  private orbitPaths: {
    line: THREE.Line;
    inclination: number;
    rotation: number;
    radius: number;
  }[] = [];
  private animationId: number | null = null;

  constructor(container: HTMLElement, options: LoaderProps = {}) {
    this.container = container;
    this.size = options.size || 400;
    this.nodeCount = options.nodeCount || 4;
    this.nodeColor = this.parseColor(options.nodeColor || 0xe879f9);

    this.init();
    this.createOrbitPaths();
    this.createNodes();
    this.animate();
  }

  private parseColor(color: string | number): number {
    if (typeof color === "string" && color.startsWith("#")) {
      return Number.parseInt(color.slice(1), 16);
    }
    return typeof color === "number" ? color : 0xe879f9;
  }

  private init() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 8;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(this.size, this.size);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    const sphereGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xe879f9,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    this.centralSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    this.scene.add(this.centralSphere);
  }

  private createOrbitPaths() {
    const orbits = [
      { inclination: 0, rotation: 0, radius: 1.7 },
      { inclination: Math.PI / 3, rotation: 0, radius: 1.9 },
      { inclination: Math.PI / 2, rotation: Math.PI / 4, radius: 2.2 },
      { inclination: Math.PI / 4, rotation: Math.PI / 2, radius: 2.0 },
    ];

    for (let i = 0; i < this.nodeCount; i++) {
      const orbit = orbits[i % orbits.length];

      const curve = new THREE.EllipseCurve(
        0,
        0,
        orbit.radius,
        orbit.radius,
        0,
        2 * Math.PI,
        false,
        0,
      );

      const points = curve.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const positions = geometry.attributes.position.array as Float32Array;
      for (let j = 0; j < positions.length; j += 3) {
        const x = positions[j];
        const y = positions[j + 1];
        positions[j] = x;
        positions[j + 1] = 0;
        positions[j + 2] = y;
      }

      const material = new THREE.LineBasicMaterial({
        color: 0xe879f9,
        transparent: true,
        opacity: 0.35,
        vertexColors: true,
      });

      const orbitLine = new THREE.Line(geometry, material);

      const colors = new Float32Array(points.length * 3);
      for (let j = 0; j < points.length * 3; j++) {
        colors[j] = 1.0;
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      orbitLine.rotation.x = orbit.inclination;
      orbitLine.rotation.y = orbit.rotation;

      this.scene.add(orbitLine);
      this.orbitPaths.push({
        line: orbitLine,
        inclination: orbit.inclination,
        rotation: orbit.rotation,
        radius: orbit.radius,
      });
    }
  }

  private createNodes() {
    const geometry = new THREE.SphereGeometry(0.12, 16, 16);

    for (let i = 0; i < this.nodeCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: this.nodeColor,
        transparent: true,
        opacity: 1.0,
      });

      const node = new THREE.Mesh(geometry, material);

      const orbitPath = this.orbitPaths[i];

      node.userData = {
        orbitIndex: i,
        angle: (i / this.nodeCount) * Math.PI * 2,
        speed: 0.5 + (i % 3) * 0.2,
        radius: orbitPath.radius,
        inclination: orbitPath.inclination,
        rotation: orbitPath.rotation,
        pulseOffset: Math.random() * Math.PI * 2,
      };

      this.scene.add(node);
      this.nodes.push(node);
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    const time = Date.now() * 0.025;

    for (const node of this.nodes) {
      const data = node.userData;

      data.angle += data.speed * 0.01;

      const x = data.radius * Math.cos(data.angle);
      const y = 0;
      const z = data.radius * Math.sin(data.angle);

      const y1 =
        y * Math.cos(data.inclination) - z * Math.sin(data.inclination);
      const z1 =
        y * Math.sin(data.inclination) + z * Math.cos(data.inclination);

      const x2 = x * Math.cos(data.rotation) - z1 * Math.sin(data.rotation);
      const z2 = x * Math.sin(data.rotation) + z1 * Math.cos(data.rotation);

      node.position.set(x2, y1, z2);

      const scale = 1 + Math.sin(time * 2 + data.pulseOffset) * 0.12;
      node.scale.set(scale, scale, scale);

      const nodeWorldPos = node.position.clone();
      nodeWorldPos.applyMatrix4(this.scene.matrixWorld);

      const depthFactor = nodeWorldPos.z < 0 ? 0.7 : 1.0;
      (node.material as THREE.MeshBasicMaterial).opacity = depthFactor;
    }

    this.scene.rotation.y = time * 0.15;
    this.scene.rotation.x = Math.sin(time * 0.1) * 0.1;

    this.centralSphere.rotation.y = time * 0.2;
    this.centralSphere.rotation.x = time * 0.15;

    this.updateOrbitVisibility();

    this.renderer.render(this.scene, this.camera);
  };

  private updateOrbitVisibility() {
    for (
      let orbitIndex = 0;
      orbitIndex < this.orbitPaths.length;
      orbitIndex++
    ) {
      const orbitPath = this.orbitPaths[orbitIndex];
      const geometry = orbitPath.line.geometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const colors = geometry.attributes.color.array as Float32Array;

      const node = this.nodes[orbitIndex];
      if (!node) continue;

      const nodePos = node.position;
      const glowRadius = 1.5;
      const maxBrightness = 2.5;
      const minBrightness = 0.08;

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        const dx = x - nodePos.x;
        const dy = y - nodePos.y;
        const dz = z - nodePos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        let brightness: number;
        if (distance < glowRadius) {
          brightness =
            maxBrightness -
            (distance / glowRadius) * (maxBrightness - minBrightness);
        } else {
          brightness = minBrightness;
        }

        const colorIndex = (i / 3) * 3;
        colors[colorIndex] = 0.91 * brightness;
        colors[colorIndex + 1] = 0.47 * brightness;
        colors[colorIndex + 2] = 0.98 * brightness;
      }

      geometry.attributes.color.needsUpdate = true;
    }
  }

  resize(size: number) {
    this.size = size;
    this.renderer.setSize(size, size);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    for (const node of this.nodes) {
      node.geometry.dispose();
      (node.material as THREE.Material).dispose();
    }

    for (const orbitPath of this.orbitPaths) {
      orbitPath.line.geometry.dispose();
      (orbitPath.line.material as THREE.Material).dispose();
    }

    if (this.centralSphere) {
      this.centralSphere.geometry.dispose();
      (this.centralSphere.material as THREE.Material).dispose();
    }

    if (this.renderer.domElement?.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
  }
}

export default function Loader({
  size = 400,
  nodeCount = 4,
  nodeColor = "#e879f9",
  orbitRadius = 2.5,
  className,
}: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<OrbitalLoader | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    loaderRef.current = new OrbitalLoader(containerRef.current, {
      size,
      nodeCount,
      nodeColor,
      orbitRadius,
    });

    return () => {
      loaderRef.current?.dispose();
      loaderRef.current = null;
    };
  }, [size, nodeCount, nodeColor, orbitRadius]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
      )}
    />
  );
}
