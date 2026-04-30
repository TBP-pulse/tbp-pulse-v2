import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Puzzle, Lightbulb, Mail, MousePointer2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (email.trim() && password.trim()) {
      try {
        await login(email.trim(), password);
      } catch (err: any) {
        setError(err.message || 'A apărut o eroare la autentificare.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      setError('Te rugăm să introduci emailul și parola.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in border border-gray-100">
        
        {/* Left Side - Interactive 3D Vibe */}
        <div className="md:w-5/12 bg-gradient-to-br from-gray-50 to-gray-100 p-12 flex flex-col justify-between relative overflow-hidden border-r border-gray-100/50">
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-10 text-tbp-orange/20"
            >
              <Puzzle className="w-24 h-24 drop-shadow-xl" strokeWidth={1} />
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 30, 0], x: [0, 10, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-32 -right-4 text-purple-400/20"
            >
              <Lightbulb className="w-32 h-32 drop-shadow-xl" strokeWidth={1} />
            </motion.div>

            <motion.div 
              animate={{ y: [0, -15, 0], rotate: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400/10"
            >
              <Mail className="w-48 h-48 drop-shadow-2xl" strokeWidth={0.5} />
            </motion.div>
          </div>

          <div className="relative z-10">
            {/* TBP Logo Container */}
            <div className="mb-16">
              <BrandLogo className="h-12" variant="dark" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-display text-tbp-dark leading-tight mb-6">
                Construim<br/>
                <span className="text-tbp-orange relative">
                  creativitate
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-8 -top-4"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </span><br/>
                împreună.
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm font-medium">
                Conectează echipa, gestionează proiectele și livrează rezultate extraordinare.
              </p>
            </motion.div>
          </div>

          <div className="relative z-10 mt-12 md:mt-0 flex items-center gap-4">
            <div className="flex -space-x-3">
              {['AS', 'AR', 'GB', 'RP', 'RM'].map((initials, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm cursor-default"
                >
                  {initials}
                </motion.div>
              ))}
            </div>
            <div className="w-10 h-10 rounded-full bg-tbp-orange flex items-center justify-center text-white shadow-lg cursor-default">
              <MousePointer2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-7/12 p-12 md:p-20 flex flex-col justify-center bg-white relative">
          <div className="max-w-md w-full mx-auto relative z-10">
            <h2 className="text-3xl font-display font-bold text-tbp-dark mb-2">Bine ai venit! 👋</h2>
            <p className="text-gray-500 text-sm mb-10">Introdu adresa de email TBP și parola pentru a accesa platforma.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Adresă de Email
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nume@tbp.ro"
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-tbp-orange/10 focus:border-tbp-orange outline-none transition-all text-base text-tbp-dark"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Parolă
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introdu parola"
                    required
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-tbp-orange/10 focus:border-tbp-orange outline-none transition-all text-base text-tbp-dark"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-tbp-dark hover:bg-tbp-orange text-white rounded-2xl font-bold text-base transition-all group disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-tbp-dark/10"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Intră în cont
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Accesul este restricționat doar pentru membrii și colaboratorii The Big Pixel.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
