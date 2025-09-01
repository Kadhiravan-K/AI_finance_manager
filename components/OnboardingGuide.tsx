import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';

const modalRoot = document.getElementById('modal-root')!;

interface OnboardingGuideProps {
  onFinish: () => void;
}

const STEPS = [
  {
    target: '.themed-header',
    title: 'The Header',
    content: 'Access the main menu, search, notifications, and other quick actions from here.',
    position: 'bottom',
    padding: 4,
  },
  {
    target: 'header button[aria-label="Open navigation menu"]',
    title: 'All Your Tools',
    content: 'Tap here to find every tool and screen available, like Trip Management, Investments, and more!',
    position: 'bottom',
    padding: 8,
    isCircle: true,
  },
  {
    target: '.interactive-fab-container',
    title: 'The "Magic" Button',
    content: 'Start here to quickly add transactions and see the AI work its magic!',
    position: 'top',
    padding: 8,
    isCircle: true,
  },
  {
    target: '.footer-nav',
    title: 'Quick Navigation',
    content: 'Instantly switch between your main screens. You can customize these shortcuts in the settings.',
    position: 'top',
    padding: 4,
  },
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onFinish }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);
  const guideRef = useRef<HTMLDivElement>(null);
  const [guideRect, setGuideRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (guideRef.current && !guideRect) {
      setGuideRect(guideRef.current.getBoundingClientRect());
    }
  }, [guideRect, currentStep]);


  useEffect(() => {
    const updateRect = () => {
      const element = document.querySelector(currentStep.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        if (guideRef.current && !guideRect) {
          setGuideRect(guideRef.current.getBoundingClientRect());
        }
      } else {
        // If element not found, skip to next step or finish
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(s => s + 1);
        } else {
            onFinish();
        }
      }
    };

    // Use a timeout to ensure the element is rendered, especially for the FAB
    const timerId = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep, stepIndex, onFinish, guideRect]);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setGuideRect(null); // Reset guide rect to recalculate for next step
      setStepIndex(stepIndex + 1);
    } else {
      onFinish();
    }
  };

  const guideStyle: React.CSSProperties = {
      position: 'absolute',
      width: 'calc(100% - 32px)',
      maxWidth: '320px',
      zIndex: 101,
      transition: 'top 0.3s ease, bottom 0.3s ease, left 0.3s ease, opacity 0.3s ease',
      transform: 'none',
  };

  if (targetRect && guideRect) {
    if (currentStep.position === 'bottom') {
      guideStyle.top = `${targetRect.bottom + 12}px`;
    } else {
      guideStyle.bottom = `${window.innerHeight - targetRect.top + 12}px`;
    }
    
    let left = targetRect.left + (targetRect.width / 2) - (guideRect.width / 2);
    // Clamp left position to be within viewport with a 16px padding
    left = Math.max(16, left);
    left = Math.min(left, window.innerWidth - guideRect.width - 16);
    
    guideStyle.left = `${left}px`;
  } else {
      guideStyle.opacity = 0; // Hide if target is not found
  }

  const clipPathStyle = useMemo(() => {
    if (!targetRect) return { clipPath: 'none' };
    const { top, left, width, height } = targetRect;
    const padding = currentStep.padding || 4;
    const isCircle = currentStep.isCircle || false;
    
    const x = left - padding;
    const y = top - padding;
    const w = width + padding * 2;
    const h = height + padding * 2;

    const vh = window.innerHeight;
    const vw = window.innerWidth;

    if (isCircle) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = w / 2;
        const ry = h / 2;
        return { clipPath: `path(evenodd, 'M 0 0 H ${vw} V ${vh} H 0 Z M ${cx - rx}, ${cy} a ${rx},${ry} 0 1,0 ${w},0 a ${rx},${ry} 0 1,0 -${w},0')` };
    }

    return { clipPath: `polygon(0% 0%, 0% 100%, ${x}px 100%, ${x}px ${y}px, ${x + w}px ${y}px, ${x + w}px ${y + h}px, ${x}px ${y + h}px, ${x}px 100%, 100% 100%, 100% 0%)` };
  }, [targetRect, currentStep]);

  const guideContent = (
    <div 
      className="fixed inset-0 bg-slate-900/80 z-[100] transition-all duration-300" 
      style={targetRect ? clipPathStyle : { opacity: 0 }}
    >
      <div
        ref={guideRef}
        className="glass-card rounded-lg shadow-lg text-primary animate-fadeInUp"
        style={guideStyle}
      >
        <div className="p-4">
            <h3 className="font-bold text-lg mb-2">{currentStep.title}</h3>
            <p className="text-sm text-secondary mb-4">{currentStep.content}</p>
            <div className="flex justify-between items-center">
            <button onClick={onFinish} className="text-sm text-tertiary hover:text-primary">Skip</button>
            <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">{stepIndex + 1} / {STEPS.length}</span>
                <button onClick={handleNext} className="button-primary px-4 py-1.5 text-sm">
                {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(guideContent, modalRoot);
};

export default OnboardingGuide;