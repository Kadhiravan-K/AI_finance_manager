import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';

const modalRoot = document.getElementById('modal-root')!;

interface CameraModalProps {
  onClose: () => void;
  onCapture: (imageData: { base64: string, mimeType: string }) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsLoading(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Camera access was denied. Please enable it in your browser settings.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("No camera found on this device.");
        } else {
          setError("Could not access the camera. Please ensure it's not in use by another application.");
        }
      } else {
        setError("An unknown error occurred while trying to access the camera.");
      }
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        const base64 = dataUrl.split(',')[1];
        if (base64) {
          onCapture({ base64, mimeType });
          onClose();
        }
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Scan Receipt" onClose={onClose} icon="📷" />
        <div className="flex-grow bg-slate-900 relative flex items-center justify-center">
          {isLoading && <LoadingSpinner />}
          {error && <p className="text-center text-rose-400 p-4">{error}</p>}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isLoading || error ? 'hidden' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex-shrink-0 p-4 border-t border-divider flex justify-center">
          <button
            onClick={handleCapture}
            disabled={isLoading || !!error}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center ring-4 ring-slate-500/50 disabled:bg-slate-600 disabled:cursor-not-allowed"
            aria-label="Take picture"
          >
            <div className="w-14 h-14 rounded-full bg-white ring-2 ring-slate-800"></div>
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default CameraModal;