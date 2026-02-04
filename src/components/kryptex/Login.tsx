import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getOAuthRedirectUrl, getProviderOptions } from "@/lib/oauthRedirect";
import { toast } from "sonner";

const apiBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

async function syncApiSession(accessToken: string) {
  const res = await fetch(`${apiBase}/api/auth/supabase/sync`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "API session sync failed");
  }
}

interface LoginProps {
  isVisible: boolean;
  onClose: () => void;
}

const Login = ({ isVisible, onClose }: LoginProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    confirmPassword: ""
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: formData.identifier,
          password: formData.password,
          options: {
            emailRedirectTo: getOAuthRedirectUrl(),
          },
        });
        if (error) {
          toast.error(error.message);
        } else {
          setEmailSent(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.identifier,
          password: formData.password,
        });
        if (error) {
          toast.error(error.message);
        } else if (data.session) {
          await syncApiSession(data.session.access_token);
          toast.success("Welcome back!");
          onClose();
          navigate("/dashboard");
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "azure" | "twitter" | "linkedin_oidc") => {
    setOauthLoading(provider);
    try {
      const providerOpts = getProviderOptions(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === "linkedin_oidc" ? ("linkedin_oidc" as any) : provider,
        options: {
          redirectTo: getOAuthRedirectUrl(),
          ...providerOpts,
        },
      });
      if (error) {
        if (error.message?.includes("Unsupported provider") || error.message?.includes("Provider not enabled")) {
          toast.error(
            `${provider.replace("_oidc", "").charAt(0).toUpperCase() + provider.replace("_oidc", "").slice(1)} is not enabled. Enable it in Supabase Dashboard.`
          );
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl cursor-pointer"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.2)] p-6 sm:p-12 w-full max-w-md relative z-10"
          >
            {emailSent ? (
              <div className="text-center py-8">
                 <CheckCircle2 className="w-16 h-16 text-[#FF3B13] mx-auto mb-6" />
                 <h2 className="text-2xl font-bold text-black uppercase mb-2">Check Your Email</h2>
                 <p className="text-sm text-black/50 mb-8">We have sent a verification link to your inbox. Please verify to activate your Kryptex vault.</p>
                 <button onClick={onClose} className="w-full bg-black text-white py-4 rounded-xl font-bold text-xs tracking-widest uppercase">GOT IT</button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="text-center mb-6 sm:mb-8 flex flex-col items-center">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black uppercase">Kryptex</h2>
                  <p className="text-[10px] sm:text-xs text-black/40 mt-1 sm:mt-2 font-bold uppercase tracking-widest">Zero-Knowledge Entry</p>
                </div>

                <div className="space-y-4">
                  {/* SOCIAL AUTH GRID */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <button
                      id="oauth-google"
                      type="button"
                      disabled={!!oauthLoading}
                      onClick={() => signInWithProvider("google")}
                      className="relative flex items-center justify-center p-3.5 bg-white border border-black/5 rounded-xl hover:border-[#FF3B13] transition-all group shadow-sm disabled:opacity-50"
                    >
                      {oauthLoading === "google" ? (
                        <div className="w-5 h-5 border-2 border-[#FF3B13] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-5 h-5 transition-all" alt="Google" />
                      )}
                    </button>
                    <button
                      id="oauth-azure"
                      type="button"
                      disabled={!!oauthLoading}
                      onClick={() => signInWithProvider("azure")}
                      className="relative flex items-center justify-center p-3.5 bg-white border border-black/5 rounded-xl hover:border-[#FF3B13] transition-all group shadow-sm disabled:opacity-50"
                    >
                      {oauthLoading === "azure" ? (
                        <div className="w-5 h-5 border-2 border-[#FF3B13] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-5 h-5 transition-all" alt="Microsoft" />
                      )}
                    </button>
                    <button
                      id="oauth-twitter"
                      type="button"
                      disabled={!!oauthLoading}
                      onClick={() => signInWithProvider("twitter")}
                      className="relative flex items-center justify-center p-3.5 bg-white border border-black/5 rounded-xl hover:border-[#FF3B13] transition-all group shadow-sm disabled:opacity-50"
                    >
                      {oauthLoading === "twitter" ? (
                        <div className="w-5 h-5 border-2 border-[#FF3B13] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black transition-all" aria-hidden>
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )}
                    </button>
                    <button
                      id="oauth-linkedin"
                      type="button"
                      disabled={!!oauthLoading}
                      onClick={() => signInWithProvider("linkedin_oidc")}
                      className="relative flex items-center justify-center p-3.5 bg-white border border-black/5 rounded-xl hover:border-[#FF3B13] transition-all group shadow-sm disabled:opacity-50"
                    >
                      {oauthLoading === "linkedin_oidc" ? (
                        <div className="w-5 h-5 border-2 border-[#FF3B13] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0077b5]" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5"></div></div>
                    <div className="relative flex justify-center text-[8px] font-bold uppercase tracking-widest"><span className="bg-white px-2 text-black/30">OR CONTINUE WITH</span></div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Email or Phone Number</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input 
                          required
                          type="text" 
                          placeholder="EMAIL OR PHONE"
                          value={formData.identifier}
                          onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                          className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3.5 pl-11 pr-4 text-[10px] sm:text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Access Key</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                          <Key className="w-4 h-4" />
                        </div>
                        <input 
                          required
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3.5 pl-11 pr-11 text-[10px] sm:text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isSignUp && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] ml-4">Confirm Access Key</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#FF3B13] transition-colors">
                            <Key className="w-4 h-4" />
                          </div>
                          <input 
                            required
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl py-3.5 pl-11 pr-11 text-[10px] sm:text-xs font-bold tracking-widest focus:outline-none focus:border-[#FF3B13] transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <button 
                    disabled={loading}
                    className="w-full bg-[#FF3B13] text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs tracking-[0.2em] shadow-[0_15px_30px_rgba(255,59,19,0.3)] hover:bg-black transition-all flex items-center justify-center gap-3 sm:gap-4 group disabled:opacity-50"
                  >
                    {loading ? "PROCESSING..." : isSignUp ? "CREATE VAULT" : "LOGIN"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-4">
                    <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[#FF3B13] hover:underline">
                      {isSignUp ? "Already have a vault?" : "Need a vault?"}
                    </button>
                    <button type="button" onClick={onClose} className="text-black/40 hover:text-black">Cancel</button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Login;
