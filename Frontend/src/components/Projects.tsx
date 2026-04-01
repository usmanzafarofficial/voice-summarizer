import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, CreditCard, Wallet } from 'phosphor-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { getPlans, createCheckout, submitManualPayment, type Plan } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const Projects = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const hardcodedPlans = [
      {
        _id: 'plan_free',
        name: 'Free Tier',
        price: 0,
        period: 'free',
        features: [
          '20 AI Voices/month',
          '20 PDF Downloads/month',
          '20 Summarization Edits',
          'Basic Support',
        ],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'plan_pro_monthly',
        name: 'Pro',
        price: 19,
        period: 'monthly',
        features: [
          'Unlimited AI Voices',
          'Unlimited PDF Downloads',
          'Unlimited Summarizations',
          'Priority Email Support',
          'Advanced Formatting'
        ],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'plan_lifetime',
        name: 'Lifetime Access',
        price: 149,
        period: 'one-time',
        features: [
          'Everything in Pro',
          'Pay once, use forever',
          'Early access to new features',
          '24/7 Dedicated Support',
          'Commercial Usage Rights'
        ],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setPlans(hardcodedPlans as unknown as Plan[]);
    setLoading(false);
  }, []);

  const handlePlanClick = async (plan: Plan) => {
    if (!token) {
      navigate('/?login=1');
      return;
    }

    if (plan.period === 'free') {
      navigate('/dashboard');
      return;
    }

    // For paid plans, show manual payment modal
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !token) return;

    if (!transactionId.trim()) {
      alert("Please enter a Transaction ID");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitManualPayment(selectedPlan._id, transactionId, paymentMethod, token);
      alert("Payment submitted successfully. You will be upgraded after the payment verification.");
      setPaymentModalOpen(false);
      setTransactionId('');
      setSelectedPlan(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number, period: string) => {
    if (period === 'free') {
      return 'Free';
    }
    if (period === 'one-time') {
      return `$${price}`;
    }
    if (period === 'monthly') {
      return `$${price}/mo`;
    }
    return `$${price}/yr`;
  };

  const getCtaText = (period: string) => {
    if (period === 'free') return 'Get Started Free';
    return 'Coming Soon';
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
                className={`glass relative rounded-xl overflow-hidden transition-all duration-500 flex flex-col ring-2 ${plan.period === 'monthly'
                    ? 'ring-primary shadow-glow-primary transform md:-translate-y-2 hover:-translate-y-4'
                    : 'ring-primary/40 shadow-glow-primary/30 hover:shadow-glow-primary'
                  }`}
              >
                {plan.period === 'monthly' && (
                  <div className="absolute top-0 right-0 bg-gradient-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10 shadow-md">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col mt-2">
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
                    disabled={(isSubmitting && selectedPlan?._id === plan._id) || plan.period !== 'free'}
                    className={`mt-6 w-full ${plan.period !== 'free' 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-gradient-primary text-primary-foreground hover:shadow-glow-primary'
                    }`}
                  >
                    {isSubmitting && selectedPlan?._id === plan._id ? 'Processing...' : getCtaText(plan.period)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="glass border-border/50 max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-primary-glow">Complete Payment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please transfer the amount to one of our accounts and provide the Transaction ID below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualPaymentSubmit} className="space-y-6 pt-4">
            <div className="space-y-4">
              <Label className="text-base">Select Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as 'easypaisa' | 'jazzcash')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="easypaisa" id="easypaisa" className="peer sr-only" />
                  <Label
                    htmlFor="easypaisa"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card/20 p-4 hover:bg-card/40 peer-data-[state=checked]:border-primary transition-all cursor-pointer"
                  >
                    <Wallet size={24} className="mb-2 text-primary" />
                    <span className="text-sm font-medium">Easypaisa</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="jazzcash" id="jazzcash" className="peer sr-only" />
                  <Label
                    htmlFor="jazzcash"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card/20 p-4 hover:bg-card/40 peer-data-[state=checked]:border-primary transition-all cursor-pointer"
                  >
                    <CreditCard size={24} className="mb-2 text-primary" />
                    <span className="text-sm font-medium">JazzCash</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Account Name:</span>
                <span className="font-semibold text-foreground">
                  {paymentMethod === 'easypaisa' ? 'Voice Summarizer' : 'Usman Zafar'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Account Number:</span>
                <span className="font-mono font-bold text-primary-glow tracking-wider">
                  {paymentMethod === 'easypaisa' ? '0300-1234567' : '0300-7654321'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-primary/10">
                <span className="text-muted-foreground">Payable Amount:</span>
                <span className="text-lg font-bold text-primary-glow">
                  {selectedPlan ? formatPrice(selectedPlan.price, selectedPlan.period) : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter 11-digit Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                className="bg-background/50 border-border focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-primary text-primary-foreground py-6 text-lg hover:shadow-glow-primary transition-all duration-300"
            >
              {isSubmitting ? 'Verifying...' : 'Submit Payment Details'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5 pt-2">
              <Check size={14} className="text-primary" /> 
              You will be upgraded after manual verification.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      <div className="absolute top-1/4 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2" />
    </section>
  );
};

export default Projects;
