import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'phosphor-react';
import { Button } from './ui/button';
import { getPlans, createCheckout, type Plan } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const Projects = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await getPlans();
        setPlans(data);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handlePlanClick = async (plan: Plan) => {
    if (!user || !token) {
      sessionStorage.setItem('pendingPlanId', plan._id);
      navigate('/?login=1');
      return;
    }

    setProcessingPlanId(plan._id);
    try {
      const { url } = await createCheckout(plan._id, token);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const formatPrice = (price: number, period: string) => {
    if (period === 'one-time') {
      return `$${price}`;
    }
    if (period === 'monthly') {
      return `$${price}/month`;
    }
    return `$${price}/year`;
  };

  const getCtaText = (period: string) => {
    if (period === 'one-time') return 'Get Started';
    if (period === 'monthly') return 'Subscribe Monthly';
    return 'Subscribe Yearly';
  };

  useEffect(() => {
    if (plans.length === 0) return;
    
    let fallbackTimeout: NodeJS.Timeout;
    
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current?.children || [], {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 80%',
        },
      });

      // Fallback: ensure cards are visible after a short delay if ScrollTrigger doesn't fire
      fallbackTimeout = setTimeout(() => {
        if (containerRef.current) {
          Array.from(containerRef.current.children).forEach((child) => {
            const element = child as HTMLElement;
            const computedOpacity = window.getComputedStyle(element).opacity;
            if (computedOpacity === '0' || parseFloat(computedOpacity) < 0.1) {
              gsap.to(element, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: 'power2.out',
              });
            }
          });
        }
      }, 1500);

      gsap.from(containerRef.current?.children || [], {
        y: 100,
        scale: 0.9,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      const cards = containerRef.current?.children;
      if (cards) {
        Array.from(cards).forEach((card) => {
          const element = card as HTMLElement;
          element.addEventListener('mouseenter', () => {
            gsap.to(element, {
              y: -10,
              scale: 1.02,
              duration: 0.3,
              ease: 'power2.out',
            });
          });
          element.addEventListener('mouseleave', () => {
            gsap.to(element, {
              y: 0,
              scale: 1,
              duration: 0.3,
              ease: 'power2.out',
            });
          });
        });
      }
    }, sectionRef);

    return () => {
      ctx.revert();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return (
    <section id="plans" ref={sectionRef} className="py-20 px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div ref={titleRef} className="text-center mb-16">
          <div className="inline-block">
            <h2 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Our <span className="text-primary-glow">Plans</span>
            </h2>
            <div className="w-full h-1 bg-gradient-primary rounded-full mx-auto mb-6" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. One-time, monthly, or yearly — all with access to voice summarization and AI-powered tools.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" ref={containerRef}>
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="glass rounded-xl overflow-hidden hover:shadow-glow-primary transition-all duration-500 flex flex-col ring-2 ring-primary/50 shadow-glow-primary"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-bold text-primary-glow">
                      {formatPrice(plan.price, plan.period)}
                    </span>
                  </div>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground text-sm">
                        <Check size={18} className="text-primary-glow shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePlanClick(plan)}
                    disabled={processingPlanId === plan._id}
                    className="mt-6 w-full bg-gradient-primary text-primary-foreground hover:shadow-glow-primary"
                  >
                    {processingPlanId === plan._id ? 'Processing...' : getCtaText(plan.period)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute top-1/4 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2" />
    </section>
  );
};

export default Projects;
