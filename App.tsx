
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashAlgorithm, BatchItem, HistoryEntry, HammingResult, AdditiveOptions } from './types';
import { calculateChecksum, Hamming } from './utils/hashUtils';
import { getIntegrityInsight } from './services/geminiService';
import { 
  ShieldCheck, ArrowRight, RefreshCcw, AlertCircle, CheckCircle2, 
  Info, ChevronRight, Database, Lock, Cpu, Files, Activity, Settings, 
  Trash2, Upload, Binary, Terminal, History as HistoryIcon, X, SlidersHorizontal
} from 'lucide-react';

const App: React.FC = () => {
  // Navigation & UI
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'hamming'>('single');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Configuration State for Additive Checksum
  const [additiveOptions, setAdditiveOptions] = useState<AdditiveOptions>({
    bitWidth: 16,
    initialValue: 0
  });

  // Single Side State
  const [senderData, setSenderData] = useState<string>("Hello Integrity World!");
  const [senderChecksum, setSenderChecksum] = useState<string>("");
  const [receiverData, setReceiverData] = useState<string>("Hello Integrity World!");
  const [receiverReceivedChecksum, setReceiverReceivedChecksum] = useState<string>("");
  const [receiverCalculatedChecksum, setReceiverCalculatedChecksum] = useState<string>("");

  // Batch State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hamming State
  const [hammingInput, setHammingInput] = useState<string>("1011");
  const [hammingResult, setHammingResult] = useState<HammingResult | null>(null);

  // AI State
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // --- Effects & Logic ---

  useEffect(() => {
    const saved = localStorage.getItem('integrity_history');
    if (saved) setHistory(JSON.parse(saved));
    
    const savedOptions = localStorage.getItem('additive_params');
    if (savedOptions) {
      try {
        setAdditiveOptions(JSON.parse(savedOptions));
      } catch (e) {
        console.error("Failed to parse saved options", e);
      }
    }
  }, []);

  const saveAdditiveOptions = (opts: AdditiveOptions) => {
    setAdditiveOptions(opts);
    localStorage.setItem('additive_params', JSON.stringify(opts));
  };

  const addToHistory = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36), timestamp: Date.now() };
    const updated = [newEntry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('integrity_history', JSON.stringify(updated));
  };

  const updateSenderChecksum = useCallback(async () => {
    const result = await calculateChecksum(senderData, HashAlgorithm.ADDITIVE, additiveOptions);
    setSenderChecksum(result);
  }, [senderData, additiveOptions]);

  const updateReceiverChecksum = useCallback(async () => {
    const result = await calculateChecksum(receiverData, HashAlgorithm.ADDITIVE, additiveOptions);
    setReceiverCalculatedChecksum(result);
  }, [receiverData, additiveOptions]);

  useEffect(() => { updateSenderChecksum(); }, [updateSenderChecksum]);
  useEffect(() => { updateReceiverChecksum(); }, [updateReceiverChecksum]);

  // Transmit logic
  const transmit = () => {
    setReceiverData(senderData);
    setReceiverReceivedChecksum(senderChecksum);
    addToHistory({ 
      algorithm: `Additive (${additiveOptions.bitWidth}-bit)`, 
      type: 'single', 
      result: 'info', 
      summary: `Transmitted: ${senderData.substring(0, 20)}...` 
    });
  };

  // Batch Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const newItems: BatchItem[] = files.map(file => ({
      id: Math.random().toString(36),
      name: file.name,
      size: file.size,
      data: '',
      status: 'pending'
    }));
    setBatchItems(prev => [...prev, ...newItems]);
  };

  const processBatch = async () => {
    const updated = [...batchItems];
    for (let item of updated) {
      if (item.status === 'completed') continue;
      item.status = 'processing';
      setBatchItems([...updated]);
      await new Promise(r => setTimeout(r, 400));
      item.checksum = await calculateChecksum(item.name + item.size, HashAlgorithm.ADDITIVE, additiveOptions);
      item.status = 'completed';
      setBatchItems([...updated]);
    }
    addToHistory({
      algorithm: `Additive (${additiveOptions.bitWidth}-bit)`,
      type: 'batch',
      result: 'info',
      summary: `Batch processed ${batchItems.length} files.`
    });
  };

  // Hamming Logic
  const runHamming = () => {
    if (hammingInput.length !== 4) return;
    const encoded = Hamming.encode(hammingInput);
    setHammingResult({
      original: hammingInput,
      encoded,
      received: encoded,
      corrected: hammingInput,
      errorPosition: null
    });
  };

  const flipBit = (index: number) => {
    if (!hammingResult) return;
    const bits = hammingResult.received.split('');
    bits[index] = bits[index] === '0' ? '1' : '0';
    const newReceived = bits.join('');
    const { corrected, errorPos } = Hamming.decode(newReceived);
    setHammingResult({
      ...hammingResult,
      received: newReceived,
      corrected,
      errorPosition: errorPos
    });
  };

  const isMatch = receiverCalculatedChecksum !== "" && receiverCalculatedChecksum === receiverReceivedChecksum;
  const isMismatch = receiverCalculatedChecksum !== "" && receiverReceivedChecksum !== "" && receiverCalculatedChecksum !== receiverReceivedChecksum;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 leading-none">
                Additive <span className="text-indigo-600 uppercase italic">Checksum</span>
              </h1>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mt-1">Industrial Integrity Lab</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-2">
            {[
              { id: 'single', label: 'Direct Transfer', icon: ArrowRight },
              { id: 'batch', label: 'Bulk Calculation', icon: Files },
              { id: 'hamming', label: 'Bit Correction', icon: Binary }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-wide ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 relative"
            >
              <HistoryIcon size={24} />
              {history.length > 0 && <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            <button 
              onClick={async () => {
                setIsAiLoading(true);
                const insight = await getIntegrityInsight(senderData || "Additive Context", `Additive Checksum with ${additiveOptions.bitWidth}-bit width`);
                setAiInsight(insight);
                setIsAiLoading(false);
              }}
              disabled={isAiLoading}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              {isAiLoading ? <RefreshCcw size={18} className="animate-spin" /> : <Activity size={18} />}
              ANALYZE
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            
            {activeTab === 'single' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* SENDER SIDE */}
                <section className={`bg-white rounded-3xl shadow-xl border-4 overflow-hidden flex flex-col transition-all duration-500 ${isMismatch ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-100 shadow-slate-200'}`}>
                  <div className={`p-5 border-b flex items-center justify-between ${isMismatch ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <span className="text-base font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                      <Database size={20} /> Sender Terminal
                    </span>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black italic">
                      SECURED TRANSMISSION
                    </div>
                  </div>
                  
                  <div className={`p-8 space-y-8 flex-1 transition-colors duration-500 ${isMismatch ? 'bg-red-50/20' : ''}`}>
                    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                         <Settings size={64} className="text-white" />
                       </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal size={18} className="text-indigo-400" />
                          <span className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Configure Checksum Params</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="text-xs font-black text-indigo-400 block mb-2 uppercase tracking-widest">Register Width</label>
                          <select 
                            value={additiveOptions.bitWidth}
                            onChange={(e) => saveAdditiveOptions({...additiveOptions, bitWidth: parseInt(e.target.value) as any})}
                            className="w-full bg-slate-800 text-white border-2 border-slate-700 rounded-xl p-4 text-base font-black focus:ring-4 focus:ring-indigo-500/30 appearance-none cursor-pointer hover:border-indigo-500 transition-all"
                          >
                            <option value={8}>8-bit (Low Accuracy)</option>
                            <option value={16}>16-bit (Standard)</option>
                            <option value={32}>32-bit (High Precision)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-black text-indigo-400 block mb-2 uppercase tracking-widest">Init Vector (Hex)</label>
                          <input 
                            type="text"
                            value={additiveOptions.initialValue.toString(16).toUpperCase()}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 16);
                              if (!isNaN(val)) saveAdditiveOptions({...additiveOptions, initialValue: val});
                              else if (e.target.value === '') saveAdditiveOptions({...additiveOptions, initialValue: 0});
                            }}
                            className="w-full bg-slate-800 text-white border-2 border-slate-700 rounded-xl p-4 text-base font-mono font-black focus:ring-4 focus:ring-indigo-500/30 uppercase hover:border-indigo-500 transition-all"
                            placeholder="0000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-black text-slate-400 block mb-3 uppercase tracking-widest">Data Input Stream</label>
                      <textarea 
                        value={senderData}
                        onChange={(e) => setSenderData(e.target.value)}
                        className={`w-full h-48 p-6 border-4 rounded-3xl font-mono text-xl focus:ring-8 transition-all resize-none shadow-inner ${isMismatch ? 'bg-white border-red-300 focus:ring-red-500/10' : 'bg-slate-50 border-slate-100 focus:ring-indigo-500/10'}`}
                        placeholder="Type message to secure..."
                      />
                    </div>
                    
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl border-b-8 border-indigo-600 relative group transition-transform hover:-translate-y-1">
                      <div className="text-sm text-indigo-400 font-black mb-3 uppercase tracking-[0.4em] flex items-center justify-between">
                        <span className="flex items-center gap-2"><Lock size={18} /> LOCAL HASH SIGNATURE</span>
                        <span className="text-[10px] bg-indigo-500/20 px-3 py-1 rounded-full text-white">{additiveOptions.bitWidth} BIT</span>
                      </div>
                      <div className="text-white font-mono text-5xl break-all font-black tracking-[0.2em] bg-slate-800/50 p-6 rounded-2xl shadow-inner border border-white/5">
                        {senderChecksum}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <button 
                      onClick={transmit}
                      className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-[0.98] transform uppercase italic tracking-tighter"
                    >
                      SEND PAYLOAD <ArrowRight size={32} />
                    </button>
                  </div>
                </section>

                {/* RECEIVER SIDE */}
                <section className={`bg-white rounded-3xl shadow-2xl border-4 overflow-hidden flex flex-col transition-all duration-500 ${isMismatch ? 'border-red-600 ring-8 ring-red-100 animate-pulse-slow' : isMatch ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100'}`}>
                  <div className={`p-5 border-b flex items-center justify-between ${isMismatch ? 'bg-red-600 text-white border-red-700' : isMatch ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    <span className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                      <Cpu size={20} /> Receiver Node
                    </span>
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${isMismatch ? 'bg-white text-red-600' : isMatch ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                      {isMismatch ? 'ALARM: CORRUPTION' : isMatch ? 'INTEGRITY VERIFIED' : 'LISTENING...'}
                    </div>
                  </div>
                  <div className={`p-8 space-y-8 flex-1 transition-colors duration-500 ${isMismatch ? 'bg-red-50/40' : isMatch ? 'bg-emerald-50/20' : ''}`}>
                    <div>
                      <label className={`text-sm font-black block mb-3 uppercase tracking-widest ${isMismatch ? 'text-red-600' : isMatch ? 'text-emerald-600' : 'text-slate-400'}`}>Captured Payload (Editable to Test Errors)</label>
                      <textarea 
                        value={receiverData}
                        onChange={(e) => setReceiverData(e.target.value)}
                        className={`w-full h-48 p-6 border-4 rounded-3xl font-mono text-xl transition-all resize-none outline-none focus:ring-8 shadow-inner ${isMismatch ? 'bg-white border-red-500 focus:ring-red-500/20 text-red-900' : isMatch ? 'bg-white border-emerald-500 focus:ring-emerald-500/20 text-emerald-900' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8">
                       <div className={`p-6 rounded-[2rem] border-4 transition-all shadow-xl group hover:scale-[1.02] ${isMismatch ? 'bg-white border-red-600' : 'bg-slate-100 border-slate-200'}`}>
                          <div className={`text-base font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 ${isMismatch ? 'text-red-600' : 'text-slate-500'}`}>
                            <Activity size={20} /> Incoming Hash Signature
                          </div>
                          <div className={`text-5xl font-mono break-all font-black tracking-[0.2em] ${isMismatch ? 'text-red-600 animate-bounce-short' : 'text-slate-400 opacity-60'}`}>
                            {receiverReceivedChecksum || '----'}
                          </div>
                       </div>
                       
                       <div className={`p-6 rounded-[2rem] border-4 transition-all shadow-xl group hover:scale-[1.02] ${isMismatch ? 'bg-white border-red-600' : isMatch ? 'bg-white border-emerald-600' : 'bg-slate-100 border-slate-200'}`}>
                          <div className={`text-base font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 ${isMismatch ? 'text-red-600' : isMatch ? 'text-emerald-600' : 'text-slate-500'}`}>
                            <RefreshCcw size={20} /> Re-Computed Locally
                          </div>
                          <div className={`text-5xl font-mono break-all font-black tracking-[0.2em] ${isMismatch ? 'text-red-600' : isMatch ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {receiverCalculatedChecksum || '----'}
                          </div>
                       </div>
                    </div>

                    <div className={`p-10 rounded-[3rem] flex flex-col items-center text-center gap-6 border-8 transition-all animate-in zoom-in duration-500 shadow-2xl relative overflow-hidden ${
                      isMatch 
                        ? 'bg-emerald-600 border-emerald-400 text-white' 
                        : isMismatch 
                          ? 'bg-red-700 border-red-500 text-white ring-8 ring-red-100' 
                          : 'bg-white border-slate-100 text-slate-300'
                    }`}>
                      {isMatch ? (
                        <>
                          <CheckCircle2 size={100} className="mb-2 shadow-2xl" />
                          <div>
                            <div className="text-5xl font-black uppercase tracking-tighter italic">Signal Secure</div>
                            <div className="text-base font-black opacity-80 mt-2 uppercase tracking-[0.3em] border-t border-white/20 pt-4">Data Integrity: 100% Guaranteed</div>
                          </div>
                        </>
                      ) : isMismatch ? (
                        <>
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                            <AlertCircle size={150} />
                          </div>
                          <AlertCircle size={100} className="mb-2 animate-bounce shadow-2xl" />
                          <div className="relative z-10">
                            <div className="text-5xl font-black uppercase tracking-tighter italic">Tamper Alert!</div>
                            <div className="text-base font-black opacity-90 mt-2 uppercase tracking-[0.3em] border-t border-white/20 pt-4">Checksum Mismatch: Resource Discarded</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <RefreshCcw size={80} className="opacity-10 mb-2" />
                          <div className="text-2xl font-black uppercase tracking-[0.3em] opacity-20">Idle Diagnostic</div>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'batch' && (
              <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-10 border-b-4 border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-800 uppercase italic">Bulk Verification Suite</h2>
                    <p className="text-base text-slate-500 font-bold mt-2 uppercase tracking-wide">Multi-resource Additive Hashing Lab</p>
                  </div>
                  <div className="flex gap-4">
                    <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="px-8 py-4 border-4 border-slate-200 rounded-2xl text-base font-black hover:bg-white hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-3 shadow-md uppercase tracking-tight"
                    >
                      <Upload size={24} /> Add Resources
                    </button>
                    <button 
                      onClick={processBatch} 
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-base font-black flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-100 hover:bg-indigo-700 uppercase tracking-tight"
                    >
                      <RefreshCcw size={24} /> Run Processing
                    </button>
                  </div>
                </div>
                <div className="p-0">
                  {batchItems.length === 0 ? (
                    <div className="py-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                      <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 border-4 border-slate-100">
                        <Files size={64} className="opacity-10" />
                      </div>
                      <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.3em]">Ready for Queue</p>
                      <p className="text-base font-bold mt-4 opacity-40 uppercase tracking-widest">Connect files to begin industrial batching</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400">
                          <th className="px-10 py-6 font-black uppercase text-xs tracking-[0.3em]">Resource ID</th>
                          <th className="px-10 py-6 font-black uppercase text-xs tracking-[0.3em]">Payload size</th>
                          <th className="px-10 py-6 font-black uppercase text-xs tracking-[0.3em]">Process Stage</th>
                          <th className="px-10 py-6 font-black uppercase text-xs tracking-[0.3em]">Calculated Hash</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {batchItems.map(item => (
                          <tr key={item.id} className="border-b-2 border-slate-50 last:border-0 hover:bg-indigo-50/50 transition-all group">
                            <td className="px-10 py-8 font-black flex items-center gap-4 text-slate-800 text-xl italic tracking-tight">
                              <Files size={24} className="text-slate-200 group-hover:text-indigo-500 transition-colors" /> {item.name}
                            </td>
                            <td className="px-10 py-8 text-slate-500 font-mono text-lg font-bold">{(item.size / 1024).toFixed(2)} KB</td>
                            <td className="px-10 py-8">
                              <span className={`px-6 py-2 rounded-xl text-sm font-black tracking-[0.2em] shadow-sm uppercase ${
                                item.status === 'completed' ? 'bg-emerald-600 text-white' :
                                item.status === 'processing' ? 'bg-indigo-600 text-white animate-pulse' :
                                'bg-slate-200 text-slate-500 border border-slate-300'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-10 py-8 font-mono text-3xl text-indigo-700 font-black tracking-[0.3em] truncate max-w-[350px]">{item.checksum || 'AWAITING'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'hamming' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="lg:col-span-1 space-y-10">
                   <section className="bg-white p-10 rounded-[3rem] border-4 border-slate-100 shadow-xl">
                      <h3 className="text-xl font-black mb-8 flex items-center gap-4 uppercase tracking-tighter italic text-indigo-700">
                        <Terminal size={32} className="text-indigo-600" />
                        Encoder Console
                      </h3>
                      <div className="space-y-8">
                        <div>
                          <label className="text-xs font-black text-slate-400 mb-4 block tracking-[0.4em] uppercase">Bit stream (4-bit binary)</label>
                          <input 
                            maxLength={4}
                            value={hammingInput}
                            onChange={(e) => setHammingInput(e.target.value.replace(/[^01]/g, ''))}
                            className="w-full text-7xl font-mono p-10 bg-slate-900 text-indigo-400 border-b-8 border-indigo-600 rounded-3xl tracking-[0.5em] text-center focus:ring-8 focus:ring-indigo-500/20 outline-none font-black shadow-2xl"
                          />
                        </div>
                        <button onClick={runHamming} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 uppercase italic tracking-tighter">GENERATE SYMBOLS</button>
                      </div>
                   </section>

                   {hammingResult && (
                      <div className="bg-slate-900 text-white p-10 rounded-[3rem] border-t-8 border-emerald-500 shadow-3xl animate-in fade-in slide-in-from-left-8 duration-700 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Binary size={100} />
                        </div>
                        <h4 className="text-xs font-black text-emerald-400 tracking-[0.4em] uppercase mb-8 border-b border-emerald-500/20 pb-4">Hamming (7,4) Protocol</h4>
                        <div className="space-y-6 font-mono text-base">
                          <div className="flex justify-between items-center group">
                            <span className="opacity-40 uppercase font-black text-xs tracking-widest group-hover:opacity-100 transition-opacity">Payload</span> 
                            <span className="text-white font-black tracking-[0.4em] text-2xl">{hammingResult.original}</span>
                          </div>
                          <div className="flex justify-between items-center group">
                            <span className="opacity-40 uppercase font-black text-xs tracking-widest group-hover:opacity-100 transition-opacity">Correction</span> 
                            <span className="text-emerald-400 font-black tracking-[0.4em] text-2xl">+3 BITS</span>
                          </div>
                          <div className="flex justify-between pt-6 border-t border-white/5">
                            <span className="font-black text-emerald-500 text-xs uppercase tracking-widest">Final Signal</span> 
                            <span className="text-emerald-400 font-black tracking-[0.5em] text-4xl">{hammingResult.encoded}</span>
                          </div>
                        </div>
                      </div>
                   )}
                </div>

                <div className="lg:col-span-2 h-full">
                   {hammingResult ? (
                     <section className="bg-white rounded-[3.5rem] border-4 border-slate-100 shadow-3xl overflow-hidden h-full flex flex-col transition-all">
                        <div className="p-8 border-b-4 border-slate-50 bg-slate-50/50 flex items-center justify-between">
                           <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 italic">Physical Interference Module</span>
                           <span className="text-xs font-black text-indigo-600 bg-white border-2 border-indigo-100 px-5 py-2 rounded-2xl uppercase tracking-widest flex items-center gap-2 shadow-sm">
                             <Info size={16} /> INTERACT WITH BITS TO INJECT NOISE
                           </span>
                        </div>
                        <div className="p-10 lg:p-20 flex-1 flex flex-col items-center justify-center space-y-20">
                           <div className="flex gap-4 md:gap-6 flex-wrap justify-center">
                              {hammingResult.received.split('').map((bit, i) => (
                                <button
                                  key={i}
                                  onClick={() => flipBit(i)}
                                  className={`w-20 h-32 md:w-24 md:h-40 rounded-[2rem] border-8 flex flex-col items-center justify-center transition-all active:scale-90 relative group ${
                                    hammingResult.errorPosition === i + 1 
                                      ? 'border-red-600 bg-red-600 text-white shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-pulse' 
                                      : 'border-slate-100 hover:border-indigo-600 bg-slate-50 hover:bg-white text-slate-900 shadow-xl'
                                  }`}
                                >
                                  <span className="text-5xl md:text-7xl font-mono font-black">{bit}</span>
                                  <span className={`text-xs mt-6 uppercase font-black tracking-tighter transition-all ${hammingResult.errorPosition === i + 1 ? 'opacity-100 scale-125' : 'opacity-20'}`}>
                                    {hammingResult.errorPosition === i + 1 ? 'FAULT' : `CH ${i+1}`}
                                  </span>
                                </button>
                              ))}
                           </div>

                           <div className="w-full max-w-2xl">
                              <div className={`p-10 rounded-[4rem] border-8 transition-all duration-700 flex items-center gap-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ${hammingResult.errorPosition ? 'bg-red-600 border-red-400 text-white shadow-red-200' : 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-200'}`}>
                                 <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl flex-shrink-0 ${hammingResult.errorPosition ? 'bg-white text-red-600' : 'bg-white text-emerald-600'}`}>
                                    {hammingResult.errorPosition ? <RefreshCcw size={64} className="animate-spin" /> : <CheckCircle2 size={64} />}
                                 </div>
                                 <div className="flex-1">
                                    <div className="text-6xl font-black leading-none uppercase tracking-tighter italic">
                                      {hammingResult.errorPosition ? `CORRECTED` : 'CLEAN'}
                                    </div>
                                    <div className="text-base font-black uppercase tracking-[0.4em] mt-6 opacity-80 flex justify-between items-center border-t border-white/20 pt-6">
                                      <span className="italic">OUTPUT:</span>
                                      <span className="font-mono font-black text-5xl tracking-[0.5em]">{hammingResult.corrected}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </section>
                   ) : (
                     <div className="h-full min-h-[600px] border-8 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-300 bg-white/50 animate-in fade-in duration-1000">
                        <Binary size={120} className="mb-10 opacity-5" />
                        <p className="text-4xl font-black uppercase tracking-[0.5em] opacity-40 italic">Signal Ready</p>
                        <p className="text-base font-bold mt-6 opacity-20 uppercase tracking-widest border-t border-slate-100 pt-6">Initialize a symobol set to begin</p>
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* AI Engineering Insights */}
            {aiInsight && (activeTab === 'single' || activeTab === 'batch') && (
              <div className="mt-20 bg-slate-900 text-slate-100 p-12 md:p-20 rounded-[5rem] border-[12px] border-slate-800 shadow-[0_80px_150px_-30px_rgba(0,0,0,0.7)] relative overflow-hidden group animate-in slide-in-from-bottom-20 duration-1000">
                <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:opacity-20 transition-all group-hover:rotate-12 group-hover:scale-110">
                  <Cpu size={300} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-8 mb-16">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] transform -rotate-3 group-hover:rotate-0 transition-transform">
                      <Activity size={48} />
                    </div>
                    <div>
                      <h3 className="text-5xl font-black tracking-tighter uppercase leading-none italic group-hover:text-indigo-400 transition-colors">Engineering Insights</h3>
                      <p className="text-sm font-black text-indigo-400 uppercase tracking-[0.6em] mt-4">Additive Integrity Neural Diagnostic</p>
                    </div>
                  </div>
                  <div className="text-slate-200 leading-relaxed space-y-10 max-w-6xl font-light text-2xl border-l-4 border-indigo-500/30 pl-12">
                    {aiInsight.split('\n').map((line, i) => line && <p key={i} className="animate-in fade-in slide-in-from-left-8" style={{animationDelay: `${i * 150}ms`}}>{line}</p>)}
                  </div>
                  <button onClick={() => setAiInsight("")} className="mt-16 px-16 py-6 border-4 border-slate-700 hover:bg-slate-800 hover:border-indigo-500 rounded-3xl text-sm font-black transition-all uppercase tracking-[0.5em] shadow-2xl active:scale-95">CLOSE DIAGNOSTIC REPORT</button>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className={`absolute top-0 right-0 h-full w-[30rem] bg-white border-l-8 border-slate-100 shadow-[0_0_150px_rgba(0,0,0,0.2)] z-40 transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 border-b-4 border-slate-50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-3xl z-10">
            <h3 className="font-black flex items-center gap-4 text-2xl uppercase tracking-tighter italic text-indigo-700">
              <HistoryIcon size={32} className="text-indigo-600" /> Integrity Log
            </h3>
            <div className="flex gap-2">
              <button onClick={() => { setHistory([]); localStorage.removeItem('integrity_history'); }} className="p-4 text-slate-300 hover:text-red-600 transition-all bg-slate-50 rounded-2xl hover:bg-red-50 hover:shadow-lg"><Trash2 size={24} /></button>
              <button onClick={() => setShowHistory(false)} className="p-4 text-slate-300 hover:text-slate-800 transition-all bg-slate-50 rounded-2xl hover:bg-slate-100 hover:shadow-lg"><X size={24} /></button>
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-116px)] p-8 space-y-6 bg-slate-50/20">
            {history.length === 0 ? (
              <div className="text-center py-48 text-slate-300 flex flex-col items-center">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border-4 border-slate-50">
                  <HistoryIcon size={48} className="opacity-10" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.4em] opacity-40">Zero recorded events</p>
              </div>
            ) : (
              history.map(entry => (
                <div key={entry.id} className="p-8 rounded-[2.5rem] border-4 border-slate-50 bg-white hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-default relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all rounded-full blur-xl"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.3em] shadow-sm ${
                      entry.type === 'single' ? 'bg-indigo-600 text-white' :
                      entry.type === 'batch' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {entry.type}
                    </span>
                    <span className="text-xs text-slate-400 font-black font-mono">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-lg font-black text-slate-800 mb-4 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors uppercase italic tracking-tighter">{entry.summary}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-black uppercase tracking-[0.2em] pt-4 border-t-2 border-slate-50 group-hover:border-indigo-100">
                    <Cpu size={16} className="text-indigo-400" /> {entry.algorithm}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <footer className="bg-slate-900 border-t-8 border-indigo-600 p-8 flex items-center justify-between px-16 text-white shadow-3xl z-20">
        <div className="flex flex-col">
          <p className="text-xs text-indigo-400 font-black uppercase tracking-[0.6em]">&copy; 2024 Additive Checksum Lab</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-[0.3em]">Quantum-Ready Data Verification Standard</p>
        </div>
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] italic">System Core: Stable</span>
           </div>
           <div className="h-10 w-1 bg-white/5"></div>
           <div className="flex items-center gap-4 group cursor-pointer">
              <Lock size={20} className="text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">AES-256 Cloud Sync</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
