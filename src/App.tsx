import { Canvas } from "@react-three/fiber";

export default function App() {

  return (
      <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: "100vw", height: "100vh" }}
      >
        {/* A flat green plane, the size of a CRT screen */}
        <mesh>
          <planeGeometry args={[4, 3]} />
          <meshBasicMaterial color="#33ff66" />

          {/*<meshBasicMaterial color="#001100" />*/}
        </mesh>
      </Canvas>
  );
}

