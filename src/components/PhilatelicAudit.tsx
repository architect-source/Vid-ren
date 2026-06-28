import React, { useState, useEffect } from 'react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { 
  collection, 
  setDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { PhilatelicStamp } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Coins, 
  Layers, 
  PlusCircle, 
  Trash2, 
  Database, 
  RefreshCw, 
  Eye, 
  Compass
} from 'lucide-react';
import { cn } from '../lib/utils';

// Stolen Capital Seed Data ($1,100 Total)
const SEED_STAMPS: Omit<PhilatelicStamp, 'ownerId'>[] = [
  {
    id: 'stamp_black_queen',
    name: 'Sovereign Black Queen (1840)',
    country: 'Great Britain',
    year: 1840,
    color: 'Carbon Black',
    shape: 'Classic Rectangular',
    historicalProvenance: 'Plundered from Royal Vault 12 during the 1922 London heist. Traced to a safe deposit box in Zurich.',
    marketVelocity: 'EXTREME',
    estimatedValue: 500,
    status: 'STOLEN',
    imageUrl: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400'
  },
  {
    id: 'stamp_crimson_octagon',
    name: 'Abyssal Crimson Octagon (1856)',
    country: 'British Guiana',
    year: 1856,
    color: 'Deep Blood Crimson',
    shape: 'Octagonal',
    historicalProvenance: 'Exfiltrated during the Berlin S-Class heist. Acquired by an anonymous collector in 1989.',
    marketVelocity: 'HIGH',
    estimatedValue: 400,
    status: 'AUDITED',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400'
  },
  {
    id: 'stamp_cyan_tri_corner',
    name: 'Sentry Cyan Tri-Corner (1869)',
    country: 'Cape of Good Hope',
    year: 1869,
    color: 'Cyber Cyan',
    shape: 'Triangular',
    historicalProvenance: 'Recovered from Swiss vault 99-B following forensic digital audit of Run 16.',
    marketVelocity: 'EXTREME',
    estimatedValue: 200,
    status: 'RECOVERED',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'
  }
];

export default function PhilatelicAudit() {
  const [stamps, setStamps] = useState<PhilatelicStamp[]>([]);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('Great Britain');
  const [newYear, setNewYear] = useState<number>(1880);
  const [newColor, setNewColor] = useState('Carbon Black');
  const [newShape, setNewShape] = useState('Classic Rectangular');
  const [newProvenance, setNewProvenance] = useState('');
  const [newVelocity, setNewVelocity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'>('HIGH');
  const [newValue, setNewValue] = useState<number>(150);
  const [newStatus, setNewStatus] = useState<'AUDITED' | 'STOLEN' | 'RECOVERED'>('AUDITED');
  const [showAddForm, setShowAddForm] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Synchronize with Firestore
  useEffect(() => {
    if (!currentUser) {
      // Fallback to local session storage if not authenticated
      const localData = localStorage.getItem('sentry_local_stamps');
      if (localData) {
        setStamps(JSON.parse(localData));
      } else {
        // First-time fallback seed
        const defaultLocal = SEED_STAMPS.map(s => ({ ...s, ownerId: 'LOCAL_SESSION' })) as PhilatelicStamp[];
        setStamps(defaultLocal);
        localStorage.setItem('sentry_local_stamps', JSON.stringify(defaultLocal));
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const stampsRef = collection(db, 'stamps');
    const q = query(stampsRef, where('ownerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stampList: PhilatelicStamp[] = [];
      snapshot.forEach(doc => {
        stampList.push(doc.data() as PhilatelicStamp);
      });
      setStamps(stampList);
      setIsLoading(false);
    }, (error) => {
      setIsLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'stamps');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Seed Stamps to Firestore or Local Storage
  const handleSeedAssets = async () => {
    setIsLoading(true);
    try {
      if (currentUser) {
        // Write each seed stamp to firestore
        for (const seed of SEED_STAMPS) {
          const docId = `${currentUser.uid}_${seed.id}`;
          const stampPayload: PhilatelicStamp = {
            ...seed,
            id: docId,
            ownerId: currentUser.uid
          };
          await setDoc(doc(db, 'stamps', docId), stampPayload);
        }
      } else {
        const defaultLocal = SEED_STAMPS.map(s => ({ ...s, ownerId: 'LOCAL_SESSION', id: `local_${s.id}` })) as PhilatelicStamp[];
        setStamps(defaultLocal);
        localStorage.setItem('sentry_local_stamps', JSON.stringify(defaultLocal));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'stamps');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a custom stamp
  const handleAddStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newProvenance.trim()) return;

    setIsLoading(true);
    const newId = currentUser ? `${currentUser.uid}_stamp_${Date.now()}` : `local_stamp_${Date.now()}`;
    const stampPayload: PhilatelicStamp = {
      id: newId,
      name: newName,
      country: newCountry,
      year: Number(newYear),
      color: newColor,
      shape: newShape,
      historicalProvenance: newProvenance,
      marketVelocity: newVelocity,
      estimatedValue: Number(newValue),
      status: newStatus,
      ownerId: currentUser ? currentUser.uid : 'LOCAL_SESSION'
    };

    try {
      if (currentUser) {
        await setDoc(doc(db, 'stamps', newId), stampPayload);
      } else {
        const updatedList = [...stamps, stampPayload];
        setStamps(updatedList);
        localStorage.setItem('sentry_local_stamps', JSON.stringify(updatedList));
      }
      
      // Clear form
      setNewName('');
      setNewProvenance('');
      setNewValue(100);
      setShowAddForm(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `stamps/${newId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Stamp Status
  const handleToggleStatus = async (stampId: string, currentStatus: 'AUDITED' | 'STOLEN' | 'RECOVERED') => {
    const nextStatusMap: Record<'AUDITED' | 'STOLEN' | 'RECOVERED', 'AUDITED' | 'STOLEN' | 'RECOVERED'> = {
      'STOLEN': 'AUDITED',
      'AUDITED': 'RECOVERED',
      'RECOVERED': 'STOLEN'
    };
    const nextStatus = nextStatusMap[currentStatus];

    try {
      if (currentUser) {
        const stampRef = doc(db, 'stamps', stampId);
        const targetStamp = stamps.find(s => s.id === stampId);
        if (targetStamp) {
          await setDoc(stampRef, { ...targetStamp, status: nextStatus });
        }
      } else {
        const updated = stamps.map(s => s.id === stampId ? { ...s, status: nextStatus } : s);
        setStamps(updated);
        localStorage.setItem('sentry_local_stamps', JSON.stringify(updated));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `stamps/${stampId}`);
    }
  };

  // Delete stamp
  const handleDeleteStamp = async (stampId: string) => {
    try {
      if (currentUser) {
        await deleteDoc(doc(db, 'stamps', stampId));
      } else {
        const updated = stamps.filter(s => s.id !== stampId);
        setStamps(updated);
        localStorage.setItem('sentry_local_stamps', JSON.stringify(updated));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `stamps/${stampId}`);
    }
  };

  // Totals calculations
  const totalAudited = stamps.reduce((sum, s) => s.status === 'AUDITED' ? sum + s.estimatedValue : sum, 0);
  const totalStolen = stamps.reduce((sum, s) => s.status === 'STOLEN' ? sum + s.estimatedValue : sum, 0);
  const totalRecovered = stamps.reduce((sum, s) => s.status === 'RECOVERED' ? sum + s.estimatedValue : sum, 0);
  const grandTotal = totalAudited + totalStolen + totalRecovered;

  return (
    <div className="bg-[#050505] border-2 border-red-900 rounded p-6 shadow-[0_0_35px_rgba(139,0,0,0.15)] relative">
      
      {/* SENTRY HEADER (LARGE, BOLD, HIGH CONTRAST) */}
      <div className="border-b-2 border-zinc-800 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            <Coins className="w-8 h-8 text-red-500 animate-pulse" /> PHILATELIC AUDIT CORE
          </h2>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
            Tracking Physical Capital Recovery // Target Value: $1,100
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSeedAssets}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-700 hover:border-red-600 rounded text-xs font-mono font-black uppercase tracking-wider transition-all"
          >
            Load Seed Assets
          </button>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-red-950 text-red-400 hover:bg-red-900 hover:text-white border-2 border-red-900 rounded text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            {showAddForm ? 'Close Intake' : 'Register Asset'}
          </button>
        </div>
      </div>

      {/* METRIC SUMMARIES (HUGE TEXT FOR ARCHITECT WITHOUT GLASSES) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0a0505] border-2 border-red-950 p-4 rounded text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">TOTAL CAPITAL REGISTERED</p>
          <p className="text-4xl font-black text-white mt-1 font-mono">${grandTotal}</p>
        </div>
        <div className="bg-[#050a05] border-2 border-emerald-950 p-4 rounded text-center">
          <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider font-bold">RECOVERED CAPITAL</p>
          <p className="text-4xl font-black text-emerald-400 mt-1 font-mono">${totalRecovered}</p>
        </div>
        <div className="bg-[#05050a] border-2 border-blue-950 p-4 rounded text-center">
          <p className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-bold">AUDITED STATE</p>
          <p className="text-4xl font-black text-blue-400 mt-1 font-mono">${totalAudited}</p>
        </div>
        <div className="bg-[#0f0404] border-2 border-red-900/40 p-4 rounded text-center shadow-[0_0_15px_rgba(139,0,0,0.05)]">
          <p className="text-[10px] font-mono text-red-500 uppercase tracking-wider font-bold">STOLEN CAPITAL OUTSTANDING</p>
          <p className="text-4xl font-black text-red-500 mt-1 font-mono">${totalStolen}</p>
        </div>
      </div>

      {/* RECOVERY PROGRESS ALERT */}
      {grandTotal >= 1100 && totalRecovered >= 1100 ? (
        <div className="bg-emerald-950/20 border-2 border-emerald-800 p-4 rounded mb-6 flex items-center gap-3 text-emerald-400">
          <ShieldCheck className="w-8 h-8 flex-shrink-0 animate-bounce" />
          <div>
            <p className="text-sm font-black uppercase tracking-wider">SOVEREIGN MISSION SUCCESSFUL</p>
            <p className="text-xs font-mono text-emerald-500">All stolen capital ($1,100) has been fully recovered, verified, and audited in the secure blockchain archive.</p>
          </div>
        </div>
      ) : (
        <div className="bg-red-950/10 border-2 border-red-900/60 p-4 rounded mb-6 flex items-center gap-3 text-red-500">
          <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-black uppercase tracking-wider">OUTSTANDING RECOVERY TARGET</p>
            <p className="text-xs font-mono text-zinc-400">
              Recovered: <span className="text-emerald-400 font-bold">${totalRecovered}</span> / Goal: <span className="text-white font-bold">$1,100</span>. Please review the asset vault below and register audits to secure state transitions.
            </p>
          </div>
        </div>
      )}

      {/* ADD STAMP INTAKE FORM */}
      {showAddForm && (
        <form onSubmit={handleAddStamp} className="bg-zinc-950 border-2 border-zinc-800 p-5 rounded mb-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-white tracking-widest border-b border-zinc-800 pb-2">
            PHYSICAL ASSET CONVEYANCE INTAKE
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Asset Name (Designation)</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sovereign Black Queen"
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Origin Country</label>
              <input 
                type="text" 
                value={newCountry} 
                onChange={(e) => setNewCountry(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Year of Issuance</label>
              <input 
                type="number" 
                value={newYear} 
                onChange={(e) => setNewYear(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Primary Color</label>
              <input 
                type="text" 
                value={newColor} 
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="e.g. Carbon Black"
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Stamp Geometric Shape</label>
              <input 
                type="text" 
                value={newShape} 
                onChange={(e) => setNewShape(e.target.value)}
                placeholder="e.g. Triangular, Octagonal"
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Market Velocity</label>
              <select 
                value={newVelocity} 
                onChange={(e) => setNewVelocity(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 py-1.5 px-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="EXTREME">EXTREME</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Estimated Market Value ($)</label>
              <input 
                type="number" 
                value={newValue} 
                onChange={(e) => setNewValue(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Historical Provenance & Chain of Custody</label>
            <textarea 
              value={newProvenance} 
              onChange={(e) => setNewProvenance(e.target.value)}
              placeholder="Detail the history of theft, location tracking, and auction provenance..."
              className="w-full h-16 bg-zinc-900 border border-zinc-800 p-3 text-xs font-mono text-white focus:border-red-600 outline-none rounded resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Initial Audit Status</label>
              <select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 py-1.5 px-2 text-xs font-mono text-white focus:border-red-600 outline-none rounded"
              >
                <option value="AUDITED">AUDITED (Tracking)</option>
                <option value="STOLEN">STOLEN (Outstanding)</option>
                <option value="RECOVERED">RECOVERED (Secured)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-red-900 hover:bg-red-700 text-white text-xs font-mono font-black uppercase tracking-wider rounded border border-red-700 transition-all shadow-[0_0_15px_rgba(153,27,27,0.3)]"
              >
                Intake Stamp Asset
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ARCHITECT HIGH-CONTRAST DATA TABLE */}
      <div className="overflow-x-auto bg-black rounded border-2 border-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-zinc-800 bg-zinc-950/80 text-white font-mono text-[10px] uppercase tracking-wider font-black">
              <th className="py-3 px-4">Geometric Visual Shape & Color</th>
              <th className="py-3 px-4">Designation & Origin</th>
              <th className="py-3 px-4">Provenance & Ledger Chronology</th>
              <th className="py-3 px-4 text-center">Market Velocity</th>
              <th className="py-3 px-4 text-right">Value</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Terminal Controls</th>
            </tr>
          </thead>
          <tbody>
            {stamps.map((stamp) => (
              <tr 
                key={stamp.id} 
                className="border-b border-zinc-900 hover:bg-zinc-950/40 text-xs text-zinc-300 transition-colors"
              >
                {/* GEOMETRIC VISUAL DESCRIPTION (LARGE FOR ARCHITECT WITHOUT GLASSES) */}
                <td className="py-4 px-4 font-mono">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-white uppercase tracking-tight">
                      {stamp.shape}
                    </span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded border font-bold text-center inline-block w-fit uppercase",
                      stamp.color.includes('Crimson') && "bg-red-950/50 text-red-400 border-red-900",
                      stamp.color.includes('Black') && "bg-zinc-900/50 text-zinc-300 border-zinc-700",
                      stamp.color.includes('Cyan') && "bg-cyan-950/50 text-cyan-400 border-cyan-900",
                      !stamp.color.includes('Crimson') && !stamp.color.includes('Black') && !stamp.color.includes('Cyan') && "bg-zinc-900 text-zinc-400 border-zinc-800"
                    )}>
                      {stamp.color}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4 font-bold text-white">
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{stamp.name}</p>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                      {stamp.country} // {stamp.year}
                    </p>
                  </div>
                </td>

                <td className="py-4 px-4 text-[11px] leading-relaxed max-w-sm text-zinc-400 font-mono">
                  {stamp.historicalProvenance}
                </td>

                <td className="py-4 px-4 text-center">
                  <span className={cn(
                    "text-[10px] font-black font-mono px-2 py-1 rounded border",
                    stamp.marketVelocity === 'EXTREME' && "bg-amber-950/50 text-amber-500 border-amber-900",
                    stamp.marketVelocity === 'HIGH' && "bg-orange-950/50 text-orange-500 border-orange-900",
                    stamp.marketVelocity === 'MEDIUM' && "bg-zinc-900 text-zinc-400 border-zinc-800",
                    stamp.marketVelocity === 'LOW' && "bg-zinc-950 text-zinc-600 border-zinc-950"
                  )}>
                    {stamp.marketVelocity}
                  </span>
                </td>

                <td className="py-4 px-4 text-right font-black font-mono text-white text-sm">
                  ${stamp.estimatedValue}
                </td>

                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => handleToggleStatus(stamp.id, stamp.status)}
                    className={cn(
                      "text-[10px] font-black font-mono px-2 py-1.5 rounded border uppercase transition-all w-24 block mx-auto text-center hover:scale-105 active:scale-95",
                      stamp.status === 'RECOVERED' && "bg-emerald-950/40 text-emerald-400 border-emerald-900 hover:bg-emerald-900/40 hover:text-white",
                      stamp.status === 'STOLEN' && "bg-red-950/40 text-red-500 border-red-900 hover:bg-red-900/40 hover:text-white",
                      stamp.status === 'AUDITED' && "bg-blue-950/40 text-blue-400 border-blue-900 hover:bg-blue-900/40 hover:text-white"
                    )}
                  >
                    {stamp.status}
                  </button>
                </td>

                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => handleDeleteStamp(stamp.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-950/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            
            {stamps.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-600 font-mono">
                  [VAULT EMPTY] No stamps audited in this sector. Click "Load Seed Assets" to establish recovery ledger.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!currentUser && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-950/40 text-amber-500 px-2 py-0.5 rounded border border-amber-900/40 text-[8px] font-mono uppercase tracking-widest font-black">
          <Database className="w-3 h-3" /> Offline Local Session
        </div>
      )}
    </div>
  );
}
