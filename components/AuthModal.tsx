import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase/init';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  deleteUser,
  updatePassword,
} from 'firebase/auth';
import { loadFromCloud, mergeCloudSaveIntoLocal, syncCloudSaveImmediate } from '../game/systems/CloudSave';
import { ACHIEVEMENTS, Achievement, AchievementSystem, normalizeAchievements } from '../game/systems/Achievements';
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
  const [selectedAvatar, setSelectedAvatar] = useState('🥷');
  const [stats, setStats] = useState({ 
    matches: 0, 
    wins: 0, 
    losses: 0, 
    achievements: [] as string[], 
    elo: 1000, 
    coins: 0, 
    avatar: '' 
  });

  const [combatStats, setCombatStats] = useState({
    totalWins: 0,
    winStreak: 0,
    maxWinStreak: 0,
    tournamentsWon: 0,
    arcadeClears: 0,
  });

  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const refreshLocalStateView = useCallback(() => {
    if (typeof window !== "undefined" && window.UTLW && window.UTLW.state) {
      const s = window.UTLW.state;
      if (s.unlockedTitles) {
        s.unlockedTitles = normalizeAchievements(s.unlockedTitles);
      }
      AchievementSystem.checkAchievements();
      if (s.stats) {
        setCombatStats({
          totalWins: s.stats.totalWins || 0,
          winStreak: s.stats.winStreak || 0,
          maxWinStreak: s.stats.maxWinStreak || 0,
          tournamentsWon: s.stats.tournamentsWon || 0,
          arcadeClears: s.stats.arcadeClears || 0,
        });
      }
      if (s.storyState) {
        setCampaignStats(s.storyState);
      }
      const updatedTitles = s.unlockedTitles || [];
      setStats(prev => ({
        ...prev,
        coins: s.coins !== undefined ? s.coins : prev.coins,
        achievements: Array.from(new Set([...prev.achievements, ...updatedTitles]))
      }));
    }
  }, []);

  useEffect(() => {
    const handleSceneChange = (e: any) => {
      if (e.detail === 'MenuScene') {
        setIsVisible(true);
        refreshLocalStateView();
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scene-changed', handleSceneChange);

    const handleCloudSaveSynced = (e: any) => {
      if (e.detail?.success) {
        setSyncStatusText('Progresso salvo na nuvem com sucesso!');
        refreshLocalStateView();
      } else {
        setSyncStatusText('Falha ao sincronizar na nuvem.');
      }
      setTimeout(() => setSyncStatusText(null), 4000);
    };
    window.addEventListener('cloud-save-synced', handleCloudSaveSynced);

    const handleCloudSaveLoaded = (e: any) => {
      refreshLocalStateView();
    };
    window.addEventListener('cloud-save-loaded', handleCloudSaveLoaded);

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
        
        let earnedCoins = win ? 50 : 10;
        updateData.coins = increment(earnedCoins);
        
        if (gameMode === "ranked_pvp") {
           const currentElo = stats.elo ?? 1000;
           let eloChange = win ? 25 : -25;
           if (!win && currentElo + eloChange < 0) {
             eloChange = -currentElo;
           }
           updateData.elo = increment(eloChange);
        }
        if (win) {
           updateData.wins = increment(1);
        } else {
           updateData.losses = increment(1);
        }

        AchievementSystem.checkAchievements();
        const currentUnlocked = window.UTLW?.state?.unlockedTitles || [];
        if (currentUnlocked.length > 0) {
          updateData.achievements = currentUnlocked;
        }

        await setDoc(userRef, updateData, { merge: true });

        const updatedSnap = await getDoc(userRef);
        if (updatedSnap.exists()) {
          const updatedData = updatedSnap.data();
          await setDoc(doc(db, 'leaderboard_public', u.uid), {
            username: updatedData.username || 'Jogador',
            avatar: updatedData.avatar || '🥷',
            wins: updatedData.wins || 0,
            elo: updatedData.elo || 1000,
            matches: updatedData.matches || 0,
          }, { merge: true });
        }

        setStats(prev => ({
           matches: prev.matches + 1,
           wins: prev.wins + (win ? 1 : 0),
           losses: prev.losses + (win ? 0 : 1),
           achievements: currentUnlocked.length > 0 ? currentUnlocked : prev.achievements,
           elo: gameMode === "ranked_pvp" ? Math.max(0, (prev.elo || 1000) + (win ? 25 : -25)) : prev.elo,
           coins: (prev.coins || 0) + earnedCoins
        }));
        
        if (window.UTLW && window.UTLW.state) {
            window.UTLW.state.coins = (window.UTLW.state.coins || 0) + earnedCoins;
            window.UTLW.save();
            syncCloudSaveImmediate();
        }
      } catch (err) {
        console.error("Erro ao salvar estatísticas:", err);
        handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`);
      }
    };
    window.addEventListener('battle-ended', handleBattleEnded);
    
    const handleSyncCoins = async (e: any) => {
        if (!auth.currentUser) return;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        setStats(prev => ({ ...prev, coins: e.detail.coins }));
        await setDoc(userRef, { coins: e.detail.coins }, { merge: true });
    };
    window.addEventListener('sync-coins', handleSyncCoins);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        try {
          await u.getIdToken(true);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             const wins = data?.wins || 0;
             const losses = data?.losses || 0;
             let matches = data?.matches || 0;
             const dbUname = data?.username || u.email?.split('@')[0] || 'Jogador';
             const dbAvatar = data?.avatar || '🥷';

             if (matches !== wins + losses) {
                 matches = wins + losses;
                 await setDoc(userRef, { matches }, { merge: true });
             }
             
             await setDoc(doc(db, 'leaderboard_public', u.uid), {
                 username: dbUname,
                 avatar: dbAvatar,
                 wins: wins,
                 elo: data?.elo || 1000,
                 matches: matches,
             }, { merge: true });

             const rawCloudAchs = data?.achievements || [];
             const normalizedCloudAchs = normalizeAchievements(rawCloudAchs);
             if (window.UTLW && window.UTLW.state) {
               if (!window.UTLW.state.unlockedTitles) window.UTLW.state.unlockedTitles = [];
               normalizedCloudAchs.forEach(a => {
                 if (!window.UTLW.state.unlockedTitles.includes(a)) {
                   window.UTLW.state.unlockedTitles.push(a);
                 }
               });
               AchievementSystem.checkAchievements();
             }
             const allAchs = window.UTLW?.state?.unlockedTitles || normalizedCloudAchs;

             setDbUsername(dbUname);
             setStats({
               matches: matches,
               wins: wins,
               losses: losses,
               achievements: allAchs,
               elo: data?.elo || 1000,
               coins: data?.coins || 0,
               avatar: dbAvatar
             });

             if (window.UTLW && window.UTLW.state) {
                 window.UTLW.state.coins = data?.coins || 0;
                 window.UTLW.state.elo = data?.elo || 1000;
             }

             // Load complete cloud save from Firestore
             loadFromCloud(u.uid).then((cloudSave) => {
               if (cloudSave) {
                 mergeCloudSaveIntoLocal(cloudSave);
                 refreshLocalStateView();
               }
             });
             
             await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          } else {
             setDbUsername(u.email?.split('@')[0] || '');
             setStats({ matches: 0, wins: 0, losses: 0, achievements: [], elo: 1000, coins: 0, avatar: '🥷' });
          }
        } catch (err: any) {
          console.error("Auth init error:", err);
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setDbUsername('');
        setStats({ matches: 0, wins: 0, losses: 0, achievements: [], elo: 1000, coins: 0, avatar: '' });
      }
    });

    return () => {
      unsub();
      window.removeEventListener('scene-changed', handleSceneChange);
      window.removeEventListener('battle-ended', handleBattleEnded);
      window.removeEventListener('sync-coins', handleSyncCoins);
      window.removeEventListener('cloud-save-synced', handleCloudSaveSynced);
      window.removeEventListener('cloud-save-loaded', handleCloudSaveLoaded);
    };
  }, [refreshLocalStateView]);

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncingCloud(true);
    setSyncStatusText('Sincronizando com a nuvem...');
    try {
      const ok = await syncCloudSaveImmediate();
      if (ok) {
        setSyncStatusText('✓ Sincronizado com sucesso!');
        refreshLocalStateView();
      } else {
        setSyncStatusText('Aviso: Nenhum dado novo para sincronizar');
      }
    } catch (e) {
      setSyncStatusText('Erro ao sincronizar com a nuvem');
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setSyncStatusText(null), 3500);
    }
  };

  const getEmailFromUsername = (uname: string) => {
    return `${uname.toLowerCase().replace(/[^a-z0-9]/g, '')}@lastwarrior.app`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
            avatar: selectedAvatar,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            wins: 0,
            matches: 0,
            losses: 0,
            elo: 1000,
            coins: 1000,
          });
          await setDoc(doc(db, 'leaderboard_public', cred.user.uid), {
            username: username,
            avatar: selectedAvatar,
            wins: 0,
            elo: 1000,
            matches: 0,
          });

          // Upload current local progress as initial cloud save
          if (window.UTLW && window.UTLW.state) {
            syncCloudSaveImmediate();
          }
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
        msg = 'Login por Email/Senha está desativado!';
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
        await deleteDoc(doc(db, 'users', user.uid));
        await deleteDoc(doc(db, 'leaderboard_public', user.uid));
        await deleteDoc(doc(db, 'users', user.uid, 'save', 'progress'));
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.DELETE, `users/${user.uid}`);
      }
      await deleteUser(user);
      setShowModal(false);
    } catch (err: any) {
      alert("Erro ao excluir conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setPasswordChangeSuccess(false);
    setLoading(true);

    try {
      await updatePassword(user, newPassword);
      setPasswordChangeSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordChange(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="absolute z-40"
        style={{ top: 'max(1rem, env(safe-area-inset-top))', left: 'max(1rem, env(safe-area-inset-left))' }}
        onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        onClick={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
        onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      >
        <button
          onClick={() => {
            refreshLocalStateView();
            setShowModal(true);
          }}
          className="group relative flex items-center justify-center w-10 h-10 bg-gray-900 rounded-sm border border-yellow-500/50 hover:border-yellow-500 hover:bg-black transition-all duration-300 shadow-lg"
          title={user ? "Minha Conta / Perfil na Nuvem" : "Acessar Conta"}
          aria-label={user ? "Minha Conta" : "Acessar Conta"}
        >
          {user ? (
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-black animate-pulse"></span>
            </div>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400 group-hover:text-white">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
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
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setShowModal(false)}
          />

          <div className="relative bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-500/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.25)] flex flex-col max-h-[92vh] text-white">
            {/* Header / Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-20 bg-gray-800/80 hover:bg-gray-700 p-2 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {user ? (
              <div className="flex flex-col h-full gap-4">
                <div className="text-center shrink-0">
                  <h2 id="modal-title" className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-widest drop-shadow-md">
                    FIGHTER ID & SALVAMENTO EM NUVEM
                  </h2>
                  <p className="text-[11px] text-gray-400 tracking-wider uppercase mt-0.5">
                    Seu progresso, campanha e estatísticas sincronizados via Firestore
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
                  {/* LEFT COLUMN: Player profile & Cloud Sync */}
                  <div className="flex flex-col flex-1 min-w-0 md:w-1/2 relative z-10 gap-3">
                    <div className="bg-black/60 rounded-xl p-4 border border-yellow-500/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700/80">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg bg-gradient-to-tr from-yellow-800 to-yellow-500 border-2 border-yellow-300 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                          <span className="text-3xl sm:text-4xl drop-shadow-md">{stats.avatar || '🥷'}</span>
                        </div>
                        <div className="text-left min-w-0 z-10 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Nuvem Conectada</span>
                          </div>
                          <p className="font-black text-xl sm:text-2xl text-white tracking-wider truncate drop-shadow-md" title={dbUsername}>{dbUsername}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* Combat Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                         <div className="bg-gray-900/80 rounded-lg p-2 border border-gray-700 shadow-inner">
                           <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Vitórias</div>
                           <div className="font-black text-lg text-green-400">{combatStats.totalWins || stats.wins}</div>
                         </div>
                         <div className="bg-gray-900/80 rounded-lg p-2 border border-gray-700 shadow-inner">
                           <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Derrotas</div>
                           <div className="font-black text-lg text-red-400">{stats.losses}</div>
                         </div>
                         <div className="bg-gray-900/80 rounded-lg p-2 border border-gray-700 shadow-inner">
                           <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Max Streak</div>
                           <div className="font-black text-lg text-amber-400">{combatStats.maxWinStreak}🔥</div>
                         </div>
                         <div className="bg-gray-900/80 rounded-lg p-2 border border-gray-700 shadow-inner">
                           <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Torneios</div>
                           <div className="font-black text-lg text-yellow-400">{combatStats.tournamentsWon}🏅</div>
                         </div>
                         <div className="bg-gray-900/80 rounded-lg p-2 border border-gray-700 shadow-inner">
                           <div className="text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Arcades</div>
                           <div className="font-black text-lg text-purple-400">{combatStats.arcadeClears}🕹️</div>
                         </div>
                         <div className="bg-gray-900/80 rounded-lg p-2 border border-gray-700 shadow-inner">
                           <div className="text-yellow-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Moedas</div>
                           <div className="font-black text-lg text-yellow-400">🪙 {stats.coins || 0}</div>
                         </div>
                      </div>

                      {/* Manual Cloud Sync Action */}
                      <div className="mt-3 pt-3 border-t border-gray-800 flex flex-col gap-2">
                        <button
                          onClick={handleManualSync}
                          disabled={isSyncingCloud}
                          className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                        >
                          {isSyncingCloud ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sincronizando com Firestore...
                            </>
                          ) : (
                            <>
                              <span>☁️ Sincronizar Progresso Agora</span>
                            </>
                          )}
                        </button>
                        {syncStatusText && (
                          <div className="text-center text-[11px] font-bold text-yellow-400 bg-yellow-950/40 border border-yellow-800/40 p-1.5 rounded animate-fade-in">
                            {syncStatusText}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                      {showPasswordChange ? (
                        <form onSubmit={handleChangePassword} className="flex flex-col gap-2 bg-black/40 p-3 rounded-lg border border-gray-700">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Alterar Senha</h3>
                            <button type="button" onClick={() => { setShowPasswordChange(false); setError(''); setPasswordChangeSuccess(false); }} className="text-gray-400 hover:text-white p-1">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                            </button>
                          </div>
                          
                          {passwordChangeSuccess && (
                            <div className="text-green-400 text-xs font-bold text-center bg-green-950/50 border border-green-900/50 p-1.5 rounded">
                              Senha alterada com sucesso!
                            </div>
                          )}
                          
                          {error && (
                            <div className="text-red-400 text-xs font-bold text-center bg-red-950/50 border border-red-900/50 p-1.5 rounded">
                              {error}
                            </div>
                          )}

                          <input
                            type="password"
                            className="w-full bg-black/60 border border-gray-600 rounded-lg p-2 text-white text-xs font-bold placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                            placeholder="Nova Senha (Mínimo 6)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                          />

                          <button type="submit" disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                            {loading ? 'Aguarde...' : 'Confirmar'}
                          </button>
                        </form>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => { setShowPasswordChange(true); setError(''); }}
                            className="bg-gray-800 hover:bg-gray-700 text-yellow-400 border border-gray-700 font-bold py-2 rounded-lg uppercase tracking-wider text-xs transition-colors"
                          >
                            Alterar Senha
                          </button>
                          <button
                            onClick={handleLogout}
                            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 font-bold py-2 rounded-lg uppercase tracking-wider text-xs transition-colors"
                          >
                            Desconectar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Campaign Status & Trophy Room */}
                  <div className="flex flex-col flex-1 min-w-0 md:w-1/2 gap-3">
                     {/* Campaign State Card */}
                     <div className="bg-black/60 rounded-xl p-4 border border-purple-500/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2">
                           <span className="text-lg">📜</span>
                           <h3 className="text-purple-400 text-xs sm:text-sm font-black uppercase tracking-widest">
                             Status da Campanha (História)
                           </h3>
                         </div>
                         <span className="bg-purple-900/80 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/40">
                           {campaignStats ? `Fase ${campaignStats.stage || 1}` : 'Não Iniciada'}
                         </span>
                       </div>

                       {campaignStats ? (
                         <div className="flex flex-col gap-2.5">
                           <div className="flex items-center justify-between bg-purple-950/40 p-2.5 rounded-lg border border-purple-900/40">
                             <div>
                               <div className="text-[10px] text-gray-400 uppercase font-bold">Guerreiro da História</div>
                               <div className="text-sm font-black text-yellow-300 tracking-wide">
                                 {campaignStats.customCharacter?.name || 'Guerreiro Z'}
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-[10px] text-gray-400 uppercase font-bold">Nível / EXP</div>
                               <div className="text-sm font-black text-white">
                                 Lvl {campaignStats.level || 0} <span className="text-xs text-purple-400">({campaignStats.exp || 0} EXP)</span>
                               </div>
                             </div>
                           </div>

                           {/* Distributed Attributes */}
                           {campaignStats.stats && (
                             <div className="grid grid-cols-5 gap-1 text-center bg-black/40 p-2 rounded-lg border border-gray-800">
                               <div>
                                 <div className="text-[8px] text-red-400 uppercase font-bold">ATQ</div>
                                 <div className="text-xs font-black text-white">{campaignStats.stats.attack}</div>
                               </div>
                               <div>
                                 <div className="text-[8px] text-blue-400 uppercase font-bold">DEF</div>
                                 <div className="text-xs font-black text-white">{campaignStats.stats.defense}</div>
                               </div>
                               <div>
                                 <div className="text-[8px] text-purple-400 uppercase font-bold">KI</div>
                                 <div className="text-xs font-black text-white">{campaignStats.stats.ki}</div>
                               </div>
                               <div>
                                 <div className="text-[8px] text-yellow-400 uppercase font-bold">VEL</div>
                                 <div className="text-xs font-black text-white">{campaignStats.stats.speed}</div>
                               </div>
                               <div>
                                 <div className="text-[8px] text-green-400 uppercase font-bold">VIT</div>
                                 <div className="text-xs font-black text-white">{campaignStats.stats.health}</div>
                               </div>
                             </div>
                           )}

                           {campaignStats.statPoints > 0 && (
                             <div className="text-[10px] font-bold text-yellow-400 text-center bg-yellow-950/30 p-1 rounded border border-yellow-800/30 animate-pulse">
                               ✨ {campaignStats.statPoints} pontos de atributo disponíveis para distribuir!
                             </div>
                           )}
                         </div>
                       ) : (
                         <div className="text-center py-4 bg-purple-950/20 rounded-lg border border-purple-900/30">
                           <p className="text-xs text-gray-300 font-medium">Nenhuma campanha em andamento.</p>
                           <p className="text-[10px] text-gray-500 mt-1">Acesse o Modo História no menu para criar seu guerreiro!</p>
                         </div>
                       )}
                     </div>

                     {/* Conquistas Card (Emparelhado com ProfileScene) */}
                     <div className="bg-black/70 rounded-xl p-3 sm:p-4 border border-yellow-500/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex-1 flex flex-col min-h-[220px] max-h-[260px]">
                       {(() => {
                         const isAchUnlocked = (ach: Achievement) => {
                           const inStats = stats.achievements?.includes(ach.name);
                           const inState = window.UTLW?.state?.unlockedTitles?.includes(ach.name);
                           const checkState = window.UTLW?.state ? ach.check(window.UTLW.state) : false;
                           return Boolean(inStats || inState || checkState);
                         };

                         const unlockedCount = ACHIEVEMENTS.filter(isAchUnlocked).length;
                         const totalCount = ACHIEVEMENTS.length;

                         return (
                           <>
                             <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
                               <div className="flex items-center gap-2">
                                 <span className="text-base">🏆</span>
                                 <h3 className="text-yellow-400 text-xs sm:text-sm font-black uppercase tracking-wider">Conquistas</h3>
                               </div>
                               <span className="bg-slate-900/90 border border-yellow-500/70 text-yellow-300 font-bold text-[9px] sm:text-[10px] px-2 py-0.5 rounded shadow-sm">
                                 {unlockedCount} / {totalCount} LIBERADAS
                               </span>
                             </div>

                             <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1.5">
                               {ACHIEVEMENTS.map((ach) => {
                                 const unlocked = isAchUnlocked(ach);
                                 const isEquipped = window.UTLW?.state?.equippedTitle === ach.name;

                                 return (
                                   <div
                                     key={ach.id}
                                     onClick={() => {
                                       if (unlocked && window.UTLW?.state) {
                                         window.UTLW.state.equippedTitle = ach.name;
                                         window.UTLW.save();
                                         refreshLocalStateView();
                                       }
                                     }}
                                     className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all ${unlocked ? "bg-slate-900/90 border-amber-500/80 hover:border-sky-400 hover:bg-slate-800/90 cursor-pointer shadow-sm" : "bg-[#070b14]/90 border-slate-800/80 opacity-60 cursor-default"}`}
                                     title={unlocked ? 'Clique para equipar este título' : ach.desc}
                                   >
                                     <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`text-xs sm:text-sm font-black shrink-0 ${unlocked ? "text-emerald-400" : "text-slate-500"}`}>
                                         {unlocked ? '✓' : '🔒'}
                                       </span>
                                       <div className="flex flex-col min-w-0">
                                         <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-bold truncate ${unlocked ? "text-yellow-200" : "text-slate-400"}`}>
                                             {ach.name}
                                           </span>
                                           {isEquipped && (
                                             <span className="text-[8px] bg-sky-950 border border-sky-500 text-sky-300 px-1 rounded uppercase font-bold">
                                               Equipado
                                             </span>
                                           )}
                                         </div>
                                          <span className={`text-[9.5px] sm:text-[10px] truncate ${unlocked ? "text-slate-300" : "text-slate-500"}`}>
                                           {ach.desc}
                                         </span>
                                       </div>
                                     </div>

                                     <div className="shrink-0">
                                       {unlocked ? (
                                         <span className="bg-slate-800/90 border border-yellow-400/80 text-yellow-300 text-[8.5px] sm:text-[9px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
                                           Concluída
                                         </span>
                                       ) : (
                                         <span className="bg-slate-900/60 border border-slate-800 text-slate-500 text-[8.5px] sm:text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                           Bloqueada
                                         </span>
                                       )}
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </>
                         );
                       })()}
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col relative z-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                <div className="text-center mb-6 relative z-10">
                  <h2 id="modal-title" className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-widest drop-shadow-md">
                    PORTAL DO GUERREIRO
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide uppercase">
                    Salve sua campanha, vitórias e guerreiro no Firestore
                  </p>
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
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Codinome (Min. 3)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-black/40 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all placeholder-gray-600 font-bold text-sm"
                        placeholder="Nome de guerreiro"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Escolha seu Avatar</label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {['🥷', '🦸‍♂️', '🧛', '🤖', '👽', '💀', '🤡', '👹'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setSelectedAvatar(emoji)}
                            className={`h-11 text-2xl flex items-center justify-center rounded-lg border transition-all ${selectedAvatar === emoji ? 'bg-yellow-500/20 border-yellow-500 scale-110 shadow-[0_0_10px_rgba(234,179,8,0.3)] z-10' : 'bg-black/40 border-gray-700 hover:border-gray-500 hover:bg-black/60'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Código Secreto (Min. 6)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full bg-black/40 border border-gray-700 rounded-lg py-2.5 pl-10 pr-12 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none transition-all placeholder-gray-600 font-bold text-sm"
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="flex items-start gap-2 bg-red-950/50 border-l-2 border-red-500 p-2.5 rounded text-red-400 text-xs font-medium">
                      <p>{error}</p>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-black font-black py-3 rounded-lg text-sm uppercase tracking-widest shadow-[0_4px_15px_rgba(234,179,8,0.3)] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Aguarde...' : (isLogin ? 'Adentrar Arena' : 'Confirmar Alistamento')}
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
