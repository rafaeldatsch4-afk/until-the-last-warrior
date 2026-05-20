import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/init';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, deleteDoc, increment, arrayUnion } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  const [stats, setStats] = useState({ matches: 0, wins: 0, losses: 0, achievements: [] as string[] });
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  useEffect(() => {
    const handleSceneChange = (e: any) => {
      if (e.detail === 'MenuScene') {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scene-changed', handleSceneChange);

    const handleBattleEnded = async (e: any) => {
      if (!auth.currentUser) return;
      const { win, gameMode } = e.detail;
      const u = auth.currentUser;
      const userRef = doc(db, 'users', u.uid);

      try {
        await u.getIdToken(true);
        const updateData: any = {
           matches: increment(1)
        };
        if (win) {
           updateData.wins = increment(1);
        } else {
           updateData.losses = increment(1);
        }

        const docSnap = await getDoc(userRef);
        let newAchievements: string[] = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentWins = (data.wins || 0) + (win ? 1 : 0);
          const currentMatches = (data.matches || 0) + 1;
          const currentAchievements = data.achievements || [];
          
          if (currentWins >= 1 && !currentAchievements.includes("Primeira Vitória!")) {
             newAchievements.push("Primeira Vitória!");
          }
          if (currentWins >= 10 && !currentAchievements.includes("Campeão (10 Vitórias)")) {
             newAchievements.push("Campeão (10 Vitórias)");
          }
          if (currentMatches >= 50 && !currentAchievements.includes("Veterano (50 Partidas)")) {
             newAchievements.push("Veterano (50 Partidas)");
          }
          if (win && gameMode === "arcade" && !currentAchievements.includes("Mestre do Arcade")) {
             newAchievements.push("Mestre do Arcade");
          }
        }

        if (newAchievements.length > 0) {
           updateData.achievements = arrayUnion(...newAchievements);
        }

        await setDoc(userRef, updateData, { merge: true });

        setStats(prev => ({
           matches: prev.matches + 1,
           wins: prev.wins + (win ? 1 : 0),
           losses: prev.losses + (win ? 0 : 1),
           achievements: [...prev.achievements, ...newAchievements]
        }));
      } catch (err) {
        console.error("Erro ao salvar estatísticas:", err);
        handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`);
      }
    };
    window.addEventListener('battle-ended', handleBattleEnded);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        try {
          await u.getIdToken(true);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             setDbUsername(data?.username || u.email?.split('@')[0]);
             setStats({
               matches: data?.matches || 0,
               wins: data?.wins || 0,
               losses: data?.losses || 0,
               achievements: data?.achievements || []
             });
             await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          } else {
             setDbUsername(u.email?.split('@')[0] || '');
             setStats({ matches: 0, wins: 0, losses: 0, achievements: [] });
          }
        } catch (err: any) {
          // Retry automatically after a short delay to account for token propagation latency
          setTimeout(async () => {
             try {
                await u.getIdToken(true);
                const retrySnap = await getDoc(userRef);
                if (retrySnap.exists()) {
                   const data = retrySnap.data();
                   setDbUsername(data?.username || u.email?.split('@')[0]);
                   setStats({
                     matches: data?.matches || 0,
                     wins: data?.wins || 0,
                     losses: data?.losses || 0,
                     achievements: data?.achievements || []
                   });
                   await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
                } else {
                   setDbUsername(u.email?.split('@')[0] || '');
                   setStats({ matches: 0, wins: 0, losses: 0, achievements: [] });
                }
             } catch (retryErr: any) {
                console.error("Erro ao atualizar lastLogin:", retryErr);
                handleFirestoreError(retryErr, OperationType.GET, `users/${u.uid}`);
             }
          }, 3000);
          setDbUsername(u.email?.split('@')[0] || '');
        }
      } else {
        setDbUsername('');
        setStats({ matches: 0, wins: 0, losses: 0, achievements: [] });
      }
    });
    return () => {
      unsub();
      window.removeEventListener('scene-changed', handleSceneChange);
      window.removeEventListener('battle-ended', handleBattleEnded);
    };
  }, []);

  const getEmailFromUsername = (uname: string) => {
    return `${uname.toLowerCase().replace(/[^a-z0-9]/g, '')}@lastwarrior.app`;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    setError('');
    setPasswordChangeSuccess(false);
    
    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordChangeSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('A senha atual está incorreta.');
      } else {
        setError('Erro ao alterar senha. Verifique a senha atual e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
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
        try {
          await cred.user.getIdToken(true);
          await setDoc(doc(db, 'users', cred.user.uid), {
            username: username,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${cred.user.uid}`);
        }
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
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = '⚠️ Login por Email/Senha está desativado! Por favor, ative nas configurações do Firebase Authentication.';
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
      try {
        // Deletar doc do firestore
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.DELETE, `users/${user.uid}`);
      }
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
      <div 
        className="absolute top-6 left-6 z-50"
        onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      >
        <button
          onClick={() => setShowModal(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-b from-gray-800 to-black rounded-full border-2 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:shadow-[0_0_25px_rgba(234,179,8,0.8)] hover:scale-105 transition-all duration-300"
          title={user ? "Minha Conta / Perfil" : "Acessar Conta"}
          aria-label={user ? "Minha Conta" : "Acessar Conta"}
        >
          {user ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-yellow-400 group-hover:text-yellow-300">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-gray-300 group-hover:text-white">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Content */}
          <div className={`relative w-full ${user ? 'max-w-3xl' : 'max-w-md'} max-h-[95vh] flex flex-col bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-500/80 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.3)] text-white overflow-hidden animate-in fade-in zoom-in duration-300`}>
            {/* Header decoration */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-80 shrink-0"></div>
            
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 z-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {user ? (
              <div className="flex flex-col h-full">
                <div className="text-center mb-4 shrink-0">
                  <h2 id="modal-title" className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-wider drop-shadow-sm">CARTÃO DE JOGADOR</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
                  {/* LEFT COLUMN: Player info & Accounts */}
                  <div className="flex flex-col flex-1 min-w-0 sm:w-1/2">
                    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-5 mb-4 border border-gray-700/50 shadow-inner shrink-0">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4 pb-4 border-b border-gray-700/50">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-300 border-2 border-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Combatente</p>
                          <p className="font-black text-xl sm:text-2xl text-white tracking-wide truncate" title={dbUsername}>{dbUsername}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
                         <div className="bg-black/40 rounded-lg p-2 border border-gray-700/50">
                           <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Lutas</div>
                           <div className="font-black text-lg sm:text-xl text-blue-400">{stats.matches}</div>
                         </div>
                         <div className="bg-black/40 rounded-lg p-2 border border-green-900/30">
                           <div className="text-green-500 opacity-80 text-[10px] uppercase font-bold tracking-wider mb-1">Vitórias</div>
                           <div className="font-black text-lg sm:text-xl text-green-400">{stats.wins}</div>
                         </div>
                         <div className="bg-black/40 rounded-lg p-2 border border-red-900/30">
                           <div className="text-red-500 opacity-80 text-[10px] uppercase font-bold tracking-wider mb-1">Derrotas</div>
                           <div className="font-black text-lg sm:text-xl text-red-400">{stats.losses}</div>
                         </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 flex flex-col gap-2 shrink-0">
                      {showPasswordChange ? (
                        <form onSubmit={handleChangePassword} className="flex flex-col gap-3 mt-2 bg-black/40 p-3 sm:p-4 rounded-lg border border-gray-700 shadow-inner">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Alterar Senha</h3>
                            <button type="button" onClick={() => { setShowPasswordChange(false); setError(''); setPasswordChangeSuccess(false); }} className="text-gray-400 hover:text-white p-1">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                            </button>
                          </div>
                          
                          {passwordChangeSuccess && (
                            <div className="text-green-400 text-xs font-bold text-center bg-green-950/50 border border-green-900/50 p-2 rounded">
                              Senha alterada com sucesso!
                            </div>
                          )}
                          
                          {error && (
                            <div className="text-red-400 text-xs font-bold text-center bg-red-950/50 border border-red-900/50 p-2 rounded">
                              {error}
                            </div>
                          )}

                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              className="w-full bg-black/60 border border-gray-600 rounded-lg p-2.5 pr-10 text-white text-xs font-bold placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
                              placeholder="Senha Atual"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                            />
                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                              {showCurrentPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              )}
                            </button>
                          </div>
                          
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              className="w-full bg-black/60 border border-gray-600 rounded-lg p-2.5 pr-10 text-white text-xs font-bold placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
                              placeholder="Nova Senha (Mínimo 6)"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              minLength={6}
                            />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                              {showNewPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              )}
                            </button>
                          </div>

                          <button type="submit" disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg mt-2 text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                            {loading ? 'Aguarde...' : 'Confirmar'}
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={() => { setShowPasswordChange(true); setError(''); }}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-yellow-500 border border-gray-600 font-bold py-3 rounded-lg uppercase tracking-wider transition-all text-xs sm:text-sm"
                          >
                            Alterar Senha
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 font-bold py-3 rounded-lg uppercase tracking-wider transition-all text-xs sm:text-sm"
                          >
                            Desconectar
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className="w-full bg-transparent hover:bg-red-950 text-red-500 hover:text-red-400 border border-transparent hover:border-red-900/50 font-bold py-2 rounded-lg text-[10px] sm:text-xs uppercase tracking-wider transition-all disabled:opacity-50 mt-1 sm:mt-2"
                          >
                            {loading ? 'Processando...' : 'Excluir Conta Permanentemente'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Trophy Room */}
                  <div className="flex flex-col flex-1 min-w-0 sm:w-1/2 bg-black/30 rounded-xl p-3 sm:p-4 border border-gray-800">
                     <div className="flex items-center gap-2 mb-3 shrink-0">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-yellow-500">
                         <circle cx="12" cy="8" r="7"></circle>
                         <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                       </svg>
                       <h3 className="text-gray-300 text-xs sm:text-sm font-bold uppercase tracking-widest">Sala de Troféus</h3>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                        {stats.achievements.length > 0 ? (
                           <div className="flex flex-col gap-2">
                             {stats.achievements.map((ach, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-gradient-to-r from-yellow-900/40 to-transparent border-l-2 border-yellow-500 px-3 py-2 rounded-r">
                                   <span className="text-xl">🏆</span>
                                   <span className="text-yellow-100 text-[10px] sm:text-xs font-bold uppercase tracking-wide">{ach}</span>
                                </div>
                             ))}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                             <span className="text-3xl sm:text-4xl mb-2">🏅</span>
                             <span className="text-gray-400 text-[10px] sm:text-xs font-medium px-4">Continue lutando para desbloquear conquistas.</span>
                           </div>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="text-center mb-6">
                  <h2 id="modal-title" className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-wider drop-shadow-sm">
                    PORTAL DO GUERREIRO
                  </h2>
                  <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide uppercase">Identifique-se para salvar o seu progresso</p>
                </div>
                
                {/* Tabs */}
                <div className="flex p-1 bg-gray-800/80 rounded-lg mb-6 border border-gray-700/50">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${isLogin ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setError(''); }}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${!isLogin ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    Alistar-se
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Codinome (Min. 3)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-black/40 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all placeholder-gray-600 font-bold"
                        placeholder="Nome de guerreiro"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                        required
                        minLength={3}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Código Secreto (Min. 6)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full bg-black/40 border border-gray-700 rounded-lg py-3 pl-10 pr-12 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all placeholder-gray-600 font-bold"
                        placeholder="*************"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 transition-colors"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
                  
                  {error && (
                    <div className="flex items-start gap-2 bg-red-950/50 border-l-2 border-red-500 p-3 rounded text-red-400 text-sm font-medium">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <p>{error}</p>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-black font-black py-3.5 rounded-lg text-lg uppercase tracking-widest shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:shadow-[0_6px_25px_rgba(234,179,8,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Aguarde...
                      </span>
                    ) : (isLogin ? 'Adentrar Arena' : 'Confirmar Alistamento')}
                  </button>
                </form>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};