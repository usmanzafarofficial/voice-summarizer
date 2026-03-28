import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Handshake } from 'phosphor-react';
import { Button } from './ui/button';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const splineRef = useRef<HTMLDivElement>(null);
  const orbRef1 = useRef<HTMLDivElement>(null);
  const orbRef2 = useRef<HTMLDivElement>(null);
  const orbRef3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 4 });

    tl.from(titleRef.current, {
      y: 50,
      opacity: 0,
      filter: "blur(10px)",
      duration: 1,
      ease: "power3.out"
    })
      .from(subtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.5")
      .from(ctaRef.current, {
        y: 30,
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.3")
      .from(splineRef.current, {
        x: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
      }, "-=1");

    gsap.to(orbRef1.current, {
      y: -20,
      x: 10,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    gsap.to(orbRef2.current, {
      y: -30,
      x: -15,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      delay: 1
    });

    gsap.to(orbRef3.current, {
      y: -25,
      x: 20,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      delay: 2
    });

    return () => {
      tl.kill();
    };
  }, []);

  const scrollToPlans = () => {
    const element = document.getElementById('plans');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div ref={splineRef} className="absolute inset-0 w-full h-full opacity-70">
        <iframe src="https://my.spline.design/genkubgreetingrobot-MW4W3iAFsJj5olFfT1MhN0TH/" frameBorder="0" width="100%" height="100%" className="w-full h-full" title="Spline animated background" />
        {/* Overlay to hide "Built with Spline" badge - keeps animation visible */}
        <div className="absolute bottom-4 right-4 w-36 h-10 bg-background/95 backdrop-blur-sm rounded-lg z-10 pointer-events-none" aria-hidden="true" />
      </div>

      <div ref={orbRef1} className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-pulse" />
      <div ref={orbRef2} className="absolute top-1/3 right-1/3 w-24 h-24 bg-secondary/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div ref={orbRef3} className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-accent/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 ref={titleRef} className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground mb-6 leading-tight">
          <span className="text-primary-glow">AI-Powered Audio Intelligence</span>
        </h1>

        <p ref={subtitleRef} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Convert lengthy audio into concise summaries with AI-powered voice processing and multi-language support.
        </p>

        <div ref={ctaRef} className="flex items-center justify-center">
          <Button onClick={scrollToPlans} className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-primary text-primary-foreground rounded-lg font-medium hover:shadow-glow-primary transition-all duration-300 hover:scale-105" size="lg">
            <Handshake size={20} />
            Explore Our Plans
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;