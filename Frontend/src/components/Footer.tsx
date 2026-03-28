import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart } from 'phosphor-react';
import { ArrowLeft, ArrowUp, ArrowUpToLine } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(footerRef.current?.children || [], {
        y: 60,
        opacity: 0,
        filter: "blur(10px)",
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 90%"
        }
      });

      const particles = particlesRef.current?.children;
      if (particles) {
        Array.from(particles).forEach((particle, index) => {
          gsap.to(particle, {
            y: -30,
            x: Math.random() * 40 - 20,
            duration: 3 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            delay: index * 0.5
          });
        });
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer ref={footerRef} className="relative py-16 px-6 border-t border-border/30 overflow-hidden">
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full blur-sm" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-secondary rounded-full blur-sm" />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-accent rounded-full blur-sm" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-primary rounded-full blur-sm" />
        <div className="absolute bottom-1/3 right-1/2 w-1 h-1 bg-secondary rounded-full blur-sm" />
        <div className="absolute top-3/4 left-1/2 w-2 h-2 bg-accent rounded-full blur-sm" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              A web-based Voice-to-Voice Summarization system that converts long audio recordings into concise summaries using AI, NLP, and advanced speech processing technologies.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-medium text-foreground mb-4">Quick Links</h4>
            <nav className="space-y-3">
              <button onClick={() => scrollToSection('hero')} className="block text-muted-foreground hover:text-primary-glow transition-colors duration-300">
                Home
              </button>
              <button onClick={() => scrollToSection('about')} className="block text-muted-foreground hover:text-primary-glow transition-colors duration-300">
                About
              </button>
              <button onClick={() => scrollToSection('plans')} className="block text-muted-foreground hover:text-primary-glow transition-colors duration-300">
                Plans
              </button>
              <button onClick={() => scrollToSection('contact')} className="block text-muted-foreground hover:text-primary-glow transition-colors duration-300">
                Contact
              </button>
            </nav>
          </div>

          <div>
            <h4 className="text-lg font-medium text-foreground mb-4">Get In Touch</h4>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                <span className="text-primary-glow">Email:</span><br />
                umerawan@gmail.com
              </p>
              <p className="text-muted-foreground">
                <span className="text-primary-glow">Phone:</span><br />
                +92 3155979297
              </p>
              <p className="text-muted-foreground">
                <span className="text-primary-glow">Location:</span><br />
                43600, Attock Pakistan
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-center md:text-left">
            © 2025 Voice-to-Voice Summarization Platform. All rights reserved.
          </p>

          {/* <div className="flex items-center gap-2 text-muted-foreground">
            Made with
            <Heart size={16} className="text-accent-glow animate-pulse" />
            using React & GSAP
          </div> */}

          <button onClick={scrollToTop} className="px-4 py-2 gap-2 flex items-center bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow-primary transition-all duration-300 hover:scale-105 text-sm">
            Back to Top <ArrowUp size={18}/>
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-32 bg-gradient-primary opacity-10 blur-3xl" />
    </footer>
  );
};

export default Footer;