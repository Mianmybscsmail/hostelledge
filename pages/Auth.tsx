import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Button, Input, Card } from '../components/ui/Card';
import { Wallet, ShieldCheck, Loader2 } from 'lucide-react';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        alert('Check your email for the confirmation link!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-red-900/30 mb-6 rotate-3">
            <Wallet className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Hostel Kharcha</h1>
          <p className="text-zinc-400">Manage expenses, meals & debts seamlessly.</p>
        </div>

        <Card className="backdrop-blur-xl bg-zinc-900/80 border-zinc-800">
          <form onSubmit={handleAuth} className="space-y-4">
            <Input 
              label="Email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-red-500 hover:text-red-400 font-medium"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </Card>
        
        <div className="mt-8 flex justify-center gap-2 text-zinc-600 text-xs">
          <ShieldCheck size={14} />
          <span>Secure Supabase Authentication</span>
        </div>
      </div>
    </div>
  );
};
