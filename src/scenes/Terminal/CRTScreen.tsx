import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

import vertexShader from "./shaders/crt.vert.glsl?raw";
import fragmentShader from "./shaders/crt.frag.glsl?raw";

type CRTUniforms = {
    uTime: { value: number };
    uFont: { value: THREE.Texture };
};

type CRTScreenProps = {
    // The size of the plane. Caller decides this based on the model's screen face.
    size: [number, number];
};

export function CRTScreen({ size }: CRTScreenProps) {
    const fontTexture = useLoader(THREE.TextureLoader, "/fonts/cp437.png");

    useMemo(() => {
        fontTexture.minFilter = THREE.NearestFilter;
        fontTexture.magFilter = THREE.NearestFilter;
        fontTexture.generateMipmaps = false;
        fontTexture.colorSpace = THREE.SRGBColorSpace;
    }, [fontTexture]);

    const uniformsRef = useRef<CRTUniforms>({
        uTime: { value: 0 },
        uFont: { value: fontTexture },
    });

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: uniformsRef.current,
        });
    }, []);

    useFrame((state) => {
        uniformsRef.current.uTime.value = state.clock.elapsedTime;
    });

    return (
        <mesh>
            <planeGeometry args={size} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}