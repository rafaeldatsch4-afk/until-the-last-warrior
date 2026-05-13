import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/init';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';

export const AuthButton: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dbUsername, setDbUsername] = useState('');

  useEffect(() => {
    const handleSceneChange = (e: any) => {
      if (e.detail === 'MenuScene') {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scene-changed', handleSceneChange);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
             setDbUsername(docSnap.data()?.username || u.email?.split('@')[0]);
             await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          } else {
             setDbUsername(u.email?.split('@')[0] || '');
          }
        } catch (err) {
          console.error("Erro ao atualizar lastLogin:", err);
          setDbUsername(u.email?.split('@')[0] || '');
        }
      } else {
        setDbUsername('');
      }
    });
    return () => {
      unsub();
      window.removeEventListener('scene-changed', handleSceneChange);
    };
  }, []);

  const getEmailFromUsername = (uname: string) => {
    return `${uname.toLowerCase().replace(/[^a-z0-9]/g, '')}@lastwarrior.app`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username.length < 3) {
      setError('O nome deve ter no mínimo 3 caracteres.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    const email = getEmailFromUsername(username);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          username: username,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      }
      setShowModal(false);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Usuário ou senha incorretos.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este nome já está sendo usado.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setShowModal(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirm = window.confirm("Tem certeza que deseja excluir sua conta para sempre? Essa ação não pode ser desfeita.");
    if (!confirm) return;

    setLoading(true);
    try {
      // Deletar doc do firestore
      await deleteDoc(doc(db, 'users', user.uid));
      // Deletar auth
      await deleteUser(user);
      setShowModal(false);
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        alert("Por favor, saia da conta e faça login novamente para excluir a conta de forma segura.");
      } else {
        alert("Erro ao excluir conta: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setShowModal(true)}
          className="bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur transition-all flex items-center justify-center border-2 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
          title={user ? "Minha Conta" : "Login / Criar Conta"}
        >
          {user ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl p-6 w-full max-w-sm relative text-white shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-4 text-gray-400 hover:text-white text-2xl font-bold"
            >
              &times;
            </button>
            
            {user ? (
              <div className="text-center">
                <h2 className="text-2xl font-black mb-2 text-yellow-400">CONTA</h2>
                <div className="bg-black/50 p-4 rounded mb-6">
                  <p className="text-gray-300 mb-1">Logado como:</p>
                  <p className="font-bold text-xl drop-shadow-md">{dbUsername}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded uppercase transition-colors mb-2"
                >
                  Sair da Conta
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded uppercase transition-colors disabled:opacity-50"
                >
                  {loading ? 'Excluindo...' : 'Excluir Conta'}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-black mb-6 text-center text-yellow-400">
                  {isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
                </h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">NOME DE USUÁRIO</label>
                    <input
                      type="text"
                      className="w-full bg-black/60 border border-gray-600 rounded p-3 text-white focus:border-yellow-500 focus:outline-none placeholder-gray-600 font-bold"
                      placeholder="Seu nome"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">SENHA (Mín. 6)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full bg-black/60 border border-gray-600 rounded p-3 pr-12 text-white focus:border-yellow-500 focus:outline-none placeholder-gray-600 font-bold"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {error && <p className="text-red-400 text-sm font-bold bg-red-900/30 p-2 rounded">{error}</p>}
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded uppercase transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Registrar')}
                  </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-700 pt-4">
                  <p className="text-sm text-gray-400">
                    {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
                  </p>
                  <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-yellow-400 hover:text-yellow-300 font-bold mt-1 uppercase text-sm"
                  >
                    {isLogin ? 'CRIAR UMA CONTA AQUI' : 'ENTRAR COM SUA CONTA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
