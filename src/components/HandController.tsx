import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface HandControllerProps {
  onHandMove: (y: number, isDetected: boolean) => void;
  onPinch: (isPinching: boolean) => void;
}

export const HandController: React.FC<HandControllerProps> = ({ onHandMove, onPinch }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for callbacks to avoid stale closures in the animation loop
  const onHandMoveRef = useRef(onHandMove);
  const onPinchRef = useRef(onPinch);

  // Update refs when props change
  useEffect(() => {
    onHandMoveRef.current = onHandMove;
    onPinchRef.current = onPinch;
  }, [onHandMove, onPinch]);

  // Internal state to track pinch to avoid spamming events
  const wasPinchingRef = useRef(false);
  
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    const initHandLandmarker = async () => {
      setIsLoading(true);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load AI model");
        setIsLoading(false);
      }
    };

    if (isCameraActive) {
      initHandLandmarker();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraActive]);

  // Detection Loop
  const predictWebcam = () => {
    if (
      handLandmarkerRef.current && 
      webcamRef.current && 
      webcamRef.current.video && 
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const startTimeMs = performance.now();
      const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

      // Draw and Process
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // Draw landmarks
            const drawingUtils = new DrawingUtils(ctx);
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
              color: "#3335E4",
              lineWidth: 2
            });
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FFFFFF",
              lineWidth: 1,
              radius: 3
            });

            // --- Movement Logic ---
            // Use Index Finger Tip (8) or Middle Finger (9) for Y position
            const y = landmarks[9].y; 
            onHandMoveRef.current(y, true);

            // --- Pinch Logic ---
            // Calculate distance between Thumb Tip (4) and Index Finger Tip (8)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            
            // 1. Calculate raw pinch distance
            const pinchDistance = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) + 
              Math.pow(thumbTip.y - indexTip.y, 2)
            );

            // 2. Calculate Hand Scale (Distance between Wrist(0) and Middle Finger MCP(9))
            // This allows us to normalize the pinch threshold based on how close/far the hand is
            const wrist = landmarks[0];
            const middleMCP = landmarks[9];
            const handScale = Math.sqrt(
              Math.pow(wrist.x - middleMCP.x, 2) + 
              Math.pow(wrist.y - middleMCP.y, 2)
            );

            // 3. Normalize pinch distance
            // If hand is far (scale is small), we shouldn't trigger pinch too easily
            // A pinch is usually when thumb/index distance is < 20-30% of the hand size
            const normalizedPinch = pinchDistance / (handScale || 1); 

            // Threshold: 0.25 means fingers are very close relative to hand size
            const PINCH_THRESHOLD = 0.25; 
            const isPinching = normalizedPinch < PINCH_THRESHOLD;

            // Visual feedback for pinch on canvas
            if (isPinching) {
              const cx = (thumbTip.x + indexTip.x) / 2 * canvasRef.current.width;
              const cy = (thumbTip.y + indexTip.y) / 2 * canvasRef.current.height;
              
              ctx.beginPath();
              ctx.arc(cx, cy, 15, 0, 2 * Math.PI);
              ctx.fillStyle = "rgba(51, 53, 228, 0.5)"; // Brand color
              ctx.fill();
              ctx.strokeStyle = "white";
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            // Debounce/State management for pinch event
            if (isPinching !== wasPinchingRef.current) {
              onPinchRef.current(isPinching);
              wasPinchingRef.current = isPinching;
            }

          } else {
            onHandMoveRef.current(0.5, false); // Neutral if no hand
            if (wasPinchingRef.current) {
              onPinchRef.current(false);
              wasPinchingRef.current = false;
            }
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  // Start loop when camera is ready
  useEffect(() => {
    if (isCameraActive && !isLoading && handLandmarkerRef.current) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isCameraActive, isLoading]);

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
    setError(null);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {/* Camera Feed Container */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-white/20 bg-black/40 backdrop-blur-md transition-all duration-500 origin-bottom-right shadow-2xl",
        isCameraActive ? "w-48 h-36 opacity-100" : "w-0 h-0 opacity-0"
      )}>
        {isCameraActive && (
          <>
            <Webcam
              ref={webcamRef}
              className="absolute inset-0 w-full h-full object-cover mirror-x"
              mirrored
              videoConstraints={{
                width: 320,
                height: 240,
                facingMode: "user"
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover mirror-x"
              width={320}
              height={240}
            />
            
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="animate-spin text-white" size={24} />
              </div>
            )}

            {/* Guides */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute top-0 left-0 w-full h-1/3 bg-green-500/20 border-b border-white/10"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/3 bg-red-500/20 border-t border-white/10"></div>
            </div>
          </>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleCamera}
        className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-full font-sans font-medium uppercase tracking-wider text-xs transition-all duration-300 shadow-lg hover:shadow-brand/50",
          isCameraActive 
            ? "bg-white text-brand hover:bg-gray-100" 
            : "bg-brand text-white hover:bg-brand-light border border-white/20"
        )}
      >
        {isCameraActive ? (
          <>
            <CameraOff size={16} />
            <span>Stop Tracking</span>
          </>
        ) : (
          <>
            <Camera size={16} />
            <span>Enable Hand Control</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="text-red-400 text-xs bg-black/50 px-3 py-1 rounded-md backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
};
