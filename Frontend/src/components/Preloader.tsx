import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader = ({ onComplete }: PreloaderProps) => {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.from(logoRef.current, {
      scale: 0.5,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })

      .to(progressBarRef.current, {
        width: "100%",
        duration: 1.5,
        ease: "power2.out"
      }, "-=0.3")

      .to({ value: 0 }, {
        value: 100,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: function () {
          if (percentRef.current) {
            percentRef.current.textContent = Math.round(this.targets()[0].value) + '%';
          }
        }
      }, "-=2.5")

      .to(logoRef.current, {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out"
      })
      .to(preloaderRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 1,
        ease: "power3.inOut",
        onComplete: () => {
          onComplete();
        }
      }, "+=0.2");

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={preloaderRef} className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center">
        <div ref={logoRef} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-light text-foreground text-glow mb-4">
             Voice Summarizer
          </h1>
          <p className="text-xl text-muted-foreground">Loading Just wait a moment...</p>
        </div>

        <div className="w-80 max-w-md mx-auto">
          <div className="h-1 bg-muted rounded-full overflow-hidden mb-4">
            <div ref={progressBarRef} className="h-full bg-gradient-primary w-0 rounded-full shadow-glow-primary" />
          </div>

          <div ref={percentRef} className="text-lg font-medium text-primary-glow">
            0%
          </div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};

export default Preloader;