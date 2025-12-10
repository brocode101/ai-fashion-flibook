import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { cn } from '../lib/utils';

interface FloatingImageProps {
  url: string;
  title: string;
  price: string;
  index: number;
  position: { x: number; y: number; z: number; rotation: number; scale: number };
  currentZ: MotionValue<number>;
}

export const FloatingImage: React.FC<FloatingImageProps> = ({ 
  url, 
  title, 
  price, 
  index, 
  position, 
  currentZ 
}) => {
  // Calculate the actual Z position relative to the scroll
  // We want the item to move towards the camera as currentZ increases
  const z = useTransform(currentZ, (value) => {
    return position.z + value;
  });

  // Opacity fades in when far, and fades out when it passes the camera (z > 500)
  const opacity = useTransform(z, [-2000, -500, 0, 400], [0, 1, 1, 0]);
  
  // Scale effect based on distance
  const scale = useTransform(z, [-2000, 0], [0.5, 1.2]);
  
  // Blur effect for depth of field
  const blur = useTransform(z, [-2000, -500, 0], [4, 0, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  // Parallax movement for X and Y based on mouse/scroll could be added here
  // For now, we keep them static relative to their Z plane to simulate a tunnel
  
  return (
    <motion.div
      style={{
        z,
        x: position.x,
        y: position.y,
        opacity,
        scale,
        rotate: position.rotation,
        filter,
        position: 'absolute',
        left: '50%',
        top: '50%',
      }}
      className={cn(
        "w-[300px] h-[400px] origin-center -translate-x-1/2 -translate-y-1/2",
        "cursor-pointer will-change-transform"
      )}
    >
      <div className="relative w-full h-full group overflow-hidden bg-black/20 backdrop-blur-sm shadow-2xl">
        <motion.img
          src={url}
          alt={title}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
        />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <h3 className="font-serif text-3xl text-white italic tracking-wide translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            {title}
          </h3>
          <p className="text-white/80 font-sans text-sm mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
            {price}
          </p>
        </div>
        
        {/* Decorative elements from reference */}
        <div className="absolute top-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="animate-spin-slow">
             <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
           </svg>
        </div>
      </div>
    </motion.div>
  );
};
