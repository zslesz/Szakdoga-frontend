import { useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'

// Kiegészítettük a típusokat a ferde fal (contour) adataival
interface Container {
  width: number;
  height: number;
  depth: number;
  base_width: number | null;
  contour_height: number;
}

interface PlacedItem {
  item: { id: string };
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

interface SceneProps {
  container: Container;
  placedItems: PlacedItem[];
}

export default function Scene({ container, placedItems }: SceneProps) {
  // A kamera célpontjához kiszámoljuk a középpontot
  const cx = container.width / 2;
  const cy = container.height / 2;
  const cz = container.depth / 2;

// 1. Megrajzoljuk a konténer 2D-s profilját (az XY síkon)
  const containerShape = useMemo(() => {
    const shape = new THREE.Shape();

    if (container.base_width && container.base_width < container.width) {
      // Megnézzük, hogy kétoldalas-e
      const isDoubleContoured = container.id.includes("ALF") || container.name.includes("Double");

      if (isDoubleContoured) {
        // --- KÉTOLDALAS LEVÁGÁS (ALF) ---
        const margin = (container.width - container.base_width) / 2;

        shape.moveTo(margin, 0); // Bal alsó (beljebb kezdődik)
        shape.lineTo(container.width - margin, 0); // Jobb alsó
        shape.lineTo(container.width, container.contour_height); // Jobb oldali ferde fal
        shape.lineTo(container.width, container.height); // Jobb felső sarok
        shape.lineTo(0, container.height); // Bal felső sarok
        shape.lineTo(0, container.contour_height); // Bal oldali egyenes fal lefelé
        shape.lineTo(margin, 0); // Bal oldali ferde fal (vissza a kezdőponthoz)

      } else {
        // --- EGYOLDALAS LEVÁGÁS (AKE) ---
        shape.moveTo(0, 0);
        shape.lineTo(container.base_width, 0);
        shape.lineTo(container.width, container.contour_height);
        shape.lineTo(container.width, container.height);
        shape.lineTo(0, container.height);
        shape.lineTo(0, 0);
      }
    } else {
      // --- SIMA TÉGLATEST (PMC) ---
      shape.moveTo(0, 0);
      shape.lineTo(container.width, 0);
      shape.lineTo(container.width, container.height);
      shape.lineTo(0, container.height);
      shape.lineTo(0, 0);
    }

    return shape;
  }, [container]);

  // 2. Beállítjuk, hogy milyen mélyre húzza ki a 2D-s formát a térben
  const extrudeSettings = useMemo(() => ({
    depth: container.depth,
    bevelEnabled: false, // Ne gömbölyítse le az éleket
  }), [container.depth]);

  return (
    <Canvas camera={{ position: [container.width * 1.5, container.height * 1.5, container.depth * 1.5], fov: 50 }}>

      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={1.5} />

      <OrbitControls makeDefault />

      {/* A group továbbra is középre igazítja az egész modellt a kamerának */}
      <group position={[-cx, -cy, -cz]}>

        {/* A Konténer - BoxGeometry helyett ExtrudeGeometry-vel */}
        {/* Az ExtrudeGeometry alapból a 0,0,0-ból indul, így nem kell neki külön X,Y,Z pozíció (eltolás) */}
        <mesh position={[0, 0, 0]}>
          <extrudeGeometry args={[containerShape, extrudeSettings]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.15} depthWrite={false} />
          <Edges color="#0055ff" />
        </mesh>

        {/* A Bepakolt Dobozok - Ez a rész változatlan */}
        {placedItems.map((pi, index) => {
          const posX = pi.x + pi.w / 2;
          const posY = pi.y + pi.h / 2;
          const posZ = pi.z + pi.d / 2;

          const boxColor = `hsl(${(index * 137.5) % 360}, 75%, 50%)`;

          return (
            <mesh key={index} position={[posX, posY, posZ]}>
              <boxGeometry args={[pi.w, pi.h, pi.d]} />
              <meshStandardMaterial color={boxColor} />
              <Edges color="black" />
            </mesh>
          )
        })}

      </group>
    </Canvas>
  )
}