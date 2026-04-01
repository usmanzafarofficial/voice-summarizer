import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { List, X } from 'phosphor-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { UserCircle } from 'phosphor-react';

const navItems: { name: string; id?: string; to?: string }[] = [
  { name: 'Home', id: 'hero' },
  { name: 'About', id: 'about' },
  { name: 'Plans', id: 'plans' },
  { name: 'Tools', id: 'tools' },
  { name: 'Contact', id: 'contact' },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signName, setSignName] = useState('');
  const [signEmail, setSignEmail] = useState('');
  const [signPassword, setSignPassword] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  const { user, token, signup: authSignup, login: authLogin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDashboard = location.pathname === '/dashboard';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('login') === '1') {
      setLoginOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (isDashboard) return;
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      delay: 3.5,
    });
    gsap.from(logoRef.current, {
      x: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 3.7,
    });
    gsap.from(menuRef.current?.children || [], {
      y: -20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
      delay: 3.8,
    });
  }, [isDashboard]);

  useEffect(() => {
    if (isOpen) {
      gsap.to(mobileMenuRef.current, {
        x: 0,
        duration: 0.5,
        ease: "power3.out"
      });

      gsap.from(mobileMenuRef.current?.querySelectorAll('.menu-item') || [], {
        x: 50,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2
      });
    } else {
      gsap.to(mobileMenuRef.current, {
        x: '100%',
        duration: 0.5,
        ease: "power3.out"
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (dropdownOpen && dropdownContentRef.current) {
      const items = dropdownContentRef.current.querySelectorAll('[role="menuitem"]');
      gsap.fromTo(
        items,
        {
          x: -20,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [dropdownOpen]);

  const scrollToSection = (sectionId: string) => {
    if (isDashboard) {
      if (sectionId === 'plans') {
        navigate('/plans');
      } else {
        navigate(`/#${sectionId}`);
      }
      setIsOpen(false);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  const navLink = (item: (typeof navItems)[0]) => {
    if (item.to) {
      return (
        <Link
          key={item.to}
          to={item.to}
          className="text-foreground/80 hover:text-primary-glow transition-colors duration-300 font-light"
        >
          {item.name}
        </Link>
      );
    }
    if (isDashboard) {
      const to =
        item.id === 'hero'
          ? '/'
          : item.id === 'plans'
            ? '/plans'
            : `/#${item.id}`;
      return (
        <Link
          key={item.id}
          to={to}
          className="text-foreground/80 hover:text-primary-glow transition-colors duration-300 font-light"
        >
          {item.name}
        </Link>
      );
    }
    return (
      <button
        key={item.id}
        onClick={() => item.id && scrollToSection(item.id)}
        className="text-foreground/80 hover:text-primary-glow transition-colors duration-300 font-light"
      >
        {item.name}
      </button>
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await authLogin(loginEmail.trim(), loginPassword);
      const pendingPlanId = sessionStorage.getItem('pendingPlanId');
      sessionStorage.removeItem('pendingPlanId');
      setLoginOpen(false);
      setLoginEmail('');
      setLoginPassword('');

      if (pendingPlanId) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const newToken = localStorage.getItem('voice_token');
        if (newToken) {
          try {
            const { createCheckout } = await import('../lib/api');
            const { url } = await createCheckout(pendingPlanId, newToken);
            if (url) {
              window.location.href = url;
              return;
            }
          } catch (checkoutErr) {
            console.error('Checkout error:', checkoutErr);
            alert('Failed to start checkout. Please try selecting the plan again.');
          }
        }
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim()) {
      setError('Name is required');
      return;
    }
    if (signPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await authSignup(signName.trim(), signEmail.trim(), signPassword);
      const pendingPlanId = sessionStorage.getItem('pendingPlanId');
      sessionStorage.removeItem('pendingPlanId');
      setLoginOpen(false);
      setSignName('');
      setSignEmail('');
      setSignPassword('');

      if (pendingPlanId) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const newToken = localStorage.getItem('voice_token');
        if (newToken) {
          try {
            const { createCheckout } = await import('../lib/api');
            const { url } = await createCheckout(pendingPlanId, newToken);
            if (url) {
              window.location.href = url;
              return;
            }
          } catch (checkoutErr) {
            console.error('Checkout error:', checkoutErr);
            alert('Failed to start checkout. Please try selecting the plan again.');
          }
        }
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openLoginModal = (tab: 'login' | 'signup' = 'login') => {
    setLoginTab(tab);
    setLoginOpen(true);
  };

  return (
    <>
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" ref={logoRef} className="block">
              <h2 className="text-2xl font-bold text-primary-glow cursor-pointer">
                Voice Summarizer
              </h2>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <div ref={menuRef} className="flex items-center space-x-8">
                {navItems.map(navLink)}
              </div>
              {user ? (
                <DropdownMenu onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-muted gap-2 shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-glow-primary group"
                    >
                      <UserCircle size={20} weight="fill" className="text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      <span className="max-w-[140px] truncate">
                        {user.name || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-border bg-card/95 backdrop-blur-lg shadow-2xl mt-3 rounded-xl overflow-hidden border-2 border-primary/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                    sideOffset={12}
                    ref={dropdownContentRef}
                  >
                    <div className="p-2 space-y-1">
                      <DropdownMenuItem asChild>
                        <Link
                          to="/dashboard"
                          className="cursor-pointer text-foreground focus:bg-gradient-to-r focus:from-primary/20 focus:to-accent/20 focus:text-primary rounded-lg px-3 py-2.5 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:text-primary hover:translate-x-1 flex items-center gap-2 group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="flex-1">Dashboard</span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/profile"
                          className="cursor-pointer text-foreground focus:bg-gradient-to-r focus:from-primary/20 focus:to-accent/20 focus:text-primary rounded-lg px-3 py-2.5 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:text-primary hover:translate-x-1 flex items-center gap-2 group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="flex-1">Profile</span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/manage-subscription"
                          className="cursor-pointer text-foreground focus:bg-gradient-to-r focus:from-primary/20 focus:to-accent/20 focus:text-primary rounded-lg px-3 py-2.5 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:text-primary hover:translate-x-1 flex items-center gap-2 group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="flex-1">Manage Subscription</span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                        </Link>
                      </DropdownMenuItem>
                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-1.5" />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/recordings"
                          className="cursor-pointer text-foreground focus:bg-gradient-to-r focus:from-primary/20 focus:to-accent/20 focus:text-primary rounded-lg px-3 py-2.5 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:text-primary hover:translate-x-1 flex items-center gap-2 group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="flex-1">Recordings</span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/summarizations"
                          className="cursor-pointer text-foreground focus:bg-gradient-to-r focus:from-primary/20 focus:to-accent/20 focus:text-primary rounded-lg px-3 py-2.5 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:text-primary hover:translate-x-1 flex items-center gap-2 group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="flex-1">Summarizations</span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/pdfs"
                          className="cursor-pointer text-foreground focus:bg-gradient-to-r focus:from-primary/20 focus:to-accent/20 focus:text-primary rounded-lg px-3 py-2.5 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:text-primary hover:translate-x-1 flex items-center gap-2 group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <span className="flex-1">PDFs</span>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                        </Link>
                      </DropdownMenuItem>
                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-1.5" />
                      <DropdownMenuItem
                        onClick={() => {
                          logout();
                          if (isDashboard) navigate('/');
                        }}
                        className="cursor-pointer text-foreground focus:bg-destructive/20 focus:text-destructive rounded-lg px-3 py-2.5 transition-all duration-300 hover:bg-destructive/20 hover:text-destructive hover:translate-x-1 flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="flex-1">Logout</span>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => openLoginModal('login')}
                  className="px-6 py-2 bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow-primary transition-all duration-300 hover:scale-105 font-medium shrink-0"
                >
                  Login
                </Button>
              )}
            </div>

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-foreground p-2">
              <List size={24} />
            </button>
          </div>
        </div>
      </nav>

      <div ref={mobileMenuRef} className="fixed top-0 right-0 w-full h-full bg-background/95 backdrop-blur-lg z-50 transform translate-x-full md:hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-light text-primary-glow">Voice Summarizer</h2>
          <button onClick={() => setIsOpen(false)} className="text-foreground p-2">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col space-y-6 p-6 mt-8">
          {isDashboard && (
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
            >
              Home
            </Link>
          )}
          {navItems.filter((item) => !(isDashboard && item.id === 'hero')).map((item) =>
            item.to ? (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
              >
                {item.name}
              </Link>
            ) : isDashboard ? (
              <Link
                key={item.id}
                to={item.id === 'plans' ? '/plans' : `/#${item.id}`}
                onClick={() => setIsOpen(false)}
                className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
              >
                {item.name}
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => item.id && scrollToSection(item.id)}
                className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
              >
                {item.name}
              </button>
            )
          )}
          {user ? (
            <div className="pt-6 border-t border-white/10 space-y-4">
              <p className="text-base font-medium text-foreground/90 truncate">
                {user.name || user.email}
              </p>

              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
                >
                  Profile
                </Link>
                <Link
                  to="/manage-subscription"
                  onClick={() => setIsOpen(false)}
                  className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
                >
                  Manage Subscription
                </Link>
                <Link
                  to="/recordings"
                  onClick={() => setIsOpen(false)}
                  className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
                >
                  Recordings
                </Link>
                <Link
                  to="/summarizations"
                  onClick={() => setIsOpen(false)}
                  className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
                >
                  Summarizations
                </Link>
                <Link
                  to="/pdfs"
                  onClick={() => setIsOpen(false)}
                  className="menu-item block w-full rounded-xl px-4 py-3 text-left text-lg font-medium text-foreground/90 bg-card/20 border border-border/40 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/15 hover:text-primary-glow transition-all duration-300"
                >
                  PDFs
                </Link>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              <Button
                variant="outline"
                className="w-full border-border mt-2"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                  if (isDashboard) navigate('/');
                }}
              >
                Logout
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { openLoginModal('login'); setIsOpen(false); }}
              className={cn("menu-item px-6 py-3 rounded-lg text-center mt-4 w-full", "bg-gradient-primary text-primary-foreground hover:shadow-glow-primary")}
            >
              Login
            </button>
          )}
        </div>
      </div>

      <Dialog open={loginOpen} onOpenChange={(open) => {
        setLoginOpen(open);
        if (!open) {
          setLoginTab('login');
          setError(null);
        }
      }}>
        <DialogContent className="border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Login or Sign up</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </DialogHeader>
          {error && (
            <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          <Tabs value={loginTab} onValueChange={(v) => {
            setLoginTab(v as 'login' | 'signup');
            setError(null);
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm text-primary hover:underline"
                  onClick={() => alert('Use the email associated with your account to reset your password. Contact support if you need help.')}
                >
                  Forgot password?
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-accent">
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setLoginTab('signup')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUpSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={signEmail}
                    onChange={(e) => setSignEmail(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={signPassword}
                    onChange={(e) => setSignPassword(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-accent">
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setLoginTab('login')}
                    className="text-primary font-medium hover:underline"
                  >
                    Login
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navigation;
