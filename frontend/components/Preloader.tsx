'use client'

                 import React, { useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, PerspectiveCamera, MeshDistortMaterial } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

function Scene() {
  const globeRef = React.useRef<THREE.Mesh>(null)
  const ringRef = React.useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.2
      globeRef.current.rotation.x = t * 0.1
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1)
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        {/* Wireframe Globe */}
        <mesh ref={globeRef}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial 
            color="#10b981" 
            wireframe 
            transparent 
            opacity={0.4} 
          />
        </mesh>

        {/* Pulsing Radar Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.02, 16, 100]} />
          <meshBasicMaterial 
            color="#10b981" 
            transparent 
            opacity={0.6} 
          />
        </mesh>

        {/* Inner Core */}
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <MeshDistortMaterial
            color="#10b981"
            speed={3}
            distort={0.4}
            radius={1}
          />
        </mesh>
      </Float>
    </>
  )
}

export function Preloader() {
  const [isVisible, setIsVisible] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="preloader-overlay"
          initial={{ opacity: 1 }}
          exit={{ 
            y: '-100%',
            opacity: 0,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A1C1E] overflow-hidden"
        >
          {isMounted && (
            <>
              <div className="relative w-full h-64 md:h-96">
                <Canvas>
                  <Scene />
                </Canvas>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-8 text-center"
              >
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-2">
                  CrisisLens
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-emerald-500/80 font-medium tracking-widest uppercase text-xs md:text-sm">
                    Initializing Strategic Intelligence
                  </p>
                </div>
              </motion.div>

              {/* Loading Progress Bar Decoration */}
              <div className="absolute bottom-12 w-48 h-[2px] bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="w-full h-full bg-emerald-500/50"
                />
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
