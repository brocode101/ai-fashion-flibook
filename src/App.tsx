import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useAnimationFrame } from 'framer-motion';
import { Move, MousePointer2, Hand, ScanFace } from 'lucide-react';
import { fashionImages } from './data/images';
import { FloatingImage } from './components/FloatingImage';
import { generateRandomPosition, cn } from './lib/utils';
import { HandController } from './components/HandController';
import { ProductModal } from './components/ProductModal';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate fixed positions for images once
  // Moved to top to ensure availability for callbacks
  const [positions] = useState(() => 
    fashionImages.map((_, i) => generateRandomPosition(i))
  );
  
  // The 'camera' position along the Z axis
  const zPosition = useMotionValue(0);
  
  // Smooth spring physics for the movement
  const smoothZ = useSpring(zPosition, {
    damping: 30,
    stiffness: 200,
    mass: 1
  });

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const lastY = useRef(0);

  // Hand Tracking State
  const [handVelocity, setHandVelocity] = useState(0);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<typeof fashionImages[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Hand Control Logic ---
  const handleHandMove = (y: number, detected: boolean) => {
    setIsHandDetected(detected);
    
    // Stop movement if modal is open or hand not detected
    if (!detected || isModalOpen) {
      setHandVelocity(0);
      return;
    }

    // Map Y (0 to 1) to Velocity
    const deadzoneThreshold = 0.15; // 15% deadzone around center
    const center = 0.5;
    const diff = center - y; // Positive if hand is up (y < 0.5), Negative if down

    if (Math.abs(diff) < deadzoneThreshold) {
      setHandVelocity(0);
    } else {
      // Scale velocity non-linearly for better control
      const direction = Math.sign(diff);
      const magnitude = Math.abs(diff) - deadzoneThreshold;
      const speedMultiplier = 25; // Max speed per frame
      setHandVelocity(direction * magnitude * speedMultiplier);
    }
  };

  const handlePinch = (pinching: boolean) => {
    setIsPinching(pinching);

    if (pinching) {
      if (isModalOpen) {
        // CLOSE LOGIC: If modal is open, pinch closes it
        setIsModalOpen(false);
        // We keep selectedProduct for a moment so the exit animation has content
      } else {
        // OPEN LOGIC: If modal is closed, pinch tries to open closest item
        
        // Find the closest image to the camera (z ~ 0 relative to camera)
        const currentCameraZ = zPosition.get();
        
        let closestImg = null;
        let minDistance = Infinity;

        // We look for images that are roughly in front of the camera
        // Image absolute Z = img.z
        // Image relative Z = img.z + currentCameraZ
        // We want relative Z to be close to -200 (sweet spot)
        
        const SWEET_SPOT_Z = -200;

        fashionImages.forEach((img, i) => {
          const imgZ = positions[i].z;
          const relativeZ = imgZ + currentCameraZ;
          const distance = Math.abs(relativeZ - SWEET_SPOT_Z);

          if (distance < minDistance) {
            minDistance = distance;
            closestImg = img;
          }
        });

        // Only open if we are reasonably close to something (within 1000 units)
        if (closestImg && minDistance < 1000) {
          setSelectedProduct(closestImg);
          setIsModalOpen(true);
          setHandVelocity(0); // Stop movement immediately
        }
      }
    }
  };

  // Continuous movement loop for hand tracking
  useAnimationFrame(() => {
    if (Math.abs(handVelocity) > 0.1 && !isModalOpen) {
      const current = zPosition.get();
      zPosition.set(current + handVelocity);
    }
  });

  // --- Mouse/Touch Logic ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isModalOpen) return;
    setIsDragging(true);
    lastY.current = e.clientY;
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isModalOpen) return;
    
    const deltaY = e.clientY - lastY.current;
    lastY.current = e.clientY;

    const current = zPosition.get();
    const sensitivity = 2.5;
    zPosition.set(current + deltaY * sensitivity);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  // Wheel support
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isModalOpen) return;
      e.preventDefault();
      const current = zPosition.get();
      zPosition.set(current + e.deltaY * 1.5);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zPosition, isModalOpen]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-brand overflow-hidden touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* UI Overlay - Fixed and High Z-Index to show over modal */}
      <div className="fixed top-0 left-0 w-full p-8 flex justify-between items-start z-[60] pointer-events-none mix-blend-difference text-white">
        <div>
          <h1 className="font-serif text-5xl italic tracking-tighter">
            Dualite <br/> Atelier
          </h1>
          <p className="font-sans text-xs tracking-widest mt-2 uppercase opacity-70">
            Fall / Winter 2025
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="font-serif text-xl italic">
            {isHandDetected 
              ? (isPinching 
                  ? (isModalOpen ? "Release to Close" : "Pinch Detected!") 
                  : "Hand Control Active") 
              : "Drag to explore"}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1 opacity-60">
            {isHandDetected ? <Hand size={16} /> : <Move size={16} />}
            <span className="text-xs font-sans uppercase tracking-widest">
              {isHandDetected 
                ? (isModalOpen ? "Pinch to Close" : "Pinch to Inspect") 
                : "Pan & Zoom"}
            </span>
          </div>
        </div>
      </div>

      {/* Hand Controller Integration */}
      <HandController onHandMove={handleHandMove} onPinch={handlePinch} />

      {/* Hand Feedback Indicator (Center Screen) */}
      {isHandDetected && !isModalOpen && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          {/* Deadzone Guide */}
          <div className="w-1 h-32 bg-white/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          
          {/* Dynamic Velocity Indicator */}
          <motion.div 
            className={cn(
              "w-12 h-12 border-2 rounded-full flex items-center justify-center transition-colors duration-200",
              isPinching ? "border-green-400 bg-green-400/20" : "border-white"
            )}
            animate={{ 
              y: -handVelocity * 10, // Visual feedback of speed
              scale: isPinching ? 1.5 : (Math.abs(handVelocity) > 0.5 ? 1.2 : 1),
              opacity: Math.abs(handVelocity) > 0.1 || isPinching ? 1 : 0.3
            }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isPinching ? "bg-green-400" : "bg-white"
            )} />
          </motion.div>
          
          <div className="absolute top-2/3 text-white/50 text-xs font-sans uppercase tracking-widest">
            {isPinching ? "Opening..." : (handVelocity > 1 ? "Accelerating" : handVelocity < -1 ? "Reversing" : "Hovering")}
          </div>
        </div>
      )}

      {/* 3D Scene Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center perspective-container"
        style={{
          perspective: '1000px',
          perspectiveOrigin: 'center center',
        }}
      >
        <motion.div 
          className="relative w-full h-full transform-style-3d"
        >
          {fashionImages.map((img, i) => (
            <FloatingImage
              key={img.id}
              {...img}
              index={i}
              position={positions[i]}
              currentZ={smoothZ}
            />
          ))}
        </motion.div>
      </div>

      {/* Product Modal */}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct} 
      />

      {/* Hint Indicator (Only show if hand not active) */}
      {!isHandDetected && !isModalOpen && (
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2 pointer-events-none"
          animate={{ 
            y: [0, 10, 0],
            opacity: [0.3, 0.8, 0.3] 
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <MousePointer2 size={24} />
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll or Drag</span>
        </motion.div>
      )}

      {/* Decorative Star/Shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-20 text-white mix-blend-overlay">
         <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
         </svg>
      </div>
    </div>
  );
}

export default App;
