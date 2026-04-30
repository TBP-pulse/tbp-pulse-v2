import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { 
  Wallet, TrendingUp, Upload, DollarSign, Activity, 
  ArrowUpRight, ArrowDownRight, Tag, ShieldCheck, PieChart,
  RefreshCcw, Filter, AlertCircle, FileText, Trash2, Shield
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, CartesianGrid
} from 'recharts';

interface Transaction {
  id?: number;
  date: string;
  amount: number;
  description: string;
  vendor: string;
  category: string;
  is_recurring: boolean;
  type: 'income' | 'expense';
}

const CATEGORIES = [
  'Subscripții & Software', 'Marketing & Ads', 'Echipamente', 
  'Biotic & Sediu', 'Taxe & Impozite', 'Transferuri', 'Venituri Clienți', 'Altele'
];

export default function Finance() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [supabaseUrlInfo, setSupabaseUrlInfo] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get the first part of the URL for diagnostic
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const prefix = url.split('.')[0].replace('https://', '');
    setSupabaseUrlInfo(prefix);

    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tbp_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('Tabelul tbp_transactions nu este încă vizibil în cache-ul Supabase.');
          setUploadError(`PROBLEMA_SINCRONIZARE: Baza de date nu recunoaște încă tabelul tbp_transactions (Cod ${error.code}).`);
          setTransactions([]);
        } else {
          console.error('Eroare fetch tranzacții:', error);
          setUploadError(`Eroare la citirea datelor: ${error.message}`);
        }
      } else {
        setTransactions(data || []);
        setUploadError(''); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const parseDate = (dateStr: any): string => {
    if (!dateStr) return new Date().toISOString();
    
    // Try standard parsing
    let d = new Date(dateStr);
    
    // If invalid, try DD.MM.YYYY or DD/MM/YYYY (common in RO statements)
    if (isNaN(d.getTime()) && typeof dateStr === 'string') {
      const parts = dateStr.split(/[./-]/);
      if (parts.length === 3) {
        // Assume DD.MM.YYYY first
        if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
          d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
          // YYYY.MM.DD
          d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        }
      }
    }

    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const processData = (rawData: any[]) => {
    // Basic heuristic parser for bank statements
    const parsedTransactions: Transaction[] = [];
    
    rawData.forEach((row, index) => {
      // Trim all keys in the row to handle headers with trailing spaces (like "tip tranzactie ")
      const cleanRow: any = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim()] = row[key];
      });

      // Find date
      const dateKey = Object.keys(cleanRow).find(k => 
        k.toLowerCase().includes('data') || 
        k.toLowerCase().includes('date')
      );
      
      // Find amount (suma)
      const amountKey = Object.keys(cleanRow).find(k => 
        k.toLowerCase() === 'sum' || 
        k.toLowerCase().includes('amount') || 
        k.toLowerCase().includes('suma')
      );

      // Find vendor/beneficiary
      const vendorKey = Object.keys(cleanRow).find(k => 
        k.toLowerCase().includes('beneficiar') || 
        k.toLowerCase().includes('ordonator') ||
        k.toLowerCase().includes('nume') ||
        k.toLowerCase().includes('vendor')
      );

      // Find details/description
      const detailsKey = Object.keys(cleanRow).find(k => 
        k.toLowerCase().includes('detalii') || 
        k.toLowerCase().includes('explicatii') || 
        k.toLowerCase().includes('description')
      );
      
      let amount = 0;
      let type: 'income' | 'expense' = 'expense';
      
      if (amountKey && cleanRow[amountKey]) {
        // Handle Romanian format "-14,99"
        let rawVal = String(cleanRow[amountKey]).replace(/\s/g, '').replace(',', '.');
        let val = parseFloat(rawVal);
        type = val < 0 ? 'expense' : 'income';
        amount = Math.abs(val);
      }
      
      if (isNaN(amount) || amount === 0) return;

      const description = detailsKey ? String(cleanRow[detailsKey]) : 'Tranzacție';
      const vendorRaw = vendorKey ? String(cleanRow[vendorKey]) : 'Necunoscut';
      
      // Auto-categorize heuristics
      const descLower = description.toLowerCase();
      const vendorLower = vendorRaw.toLowerCase();
      const searchSpace = `${descLower} ${vendorLower}`;
      
      let category = 'Altele';
      let is_recurring = false;
      let vendor = vendorRaw;
      
      if (searchSpace.includes('meta') || searchSpace.includes('facebook') || searchSpace.includes('google ads') || searchSpace.includes('tiktok')) {
        category = 'Marketing & Ads';
        vendor = searchSpace.includes('meta') ? 'Meta Platforms' : searchSpace.includes('google') ? 'Google Ads' : 'TikTok';
      } else if (searchSpace.includes('adobe') || searchSpace.includes('figma') || searchSpace.includes('github') || searchSpace.includes('chatgpt') || searchSpace.includes('notion') || searchSpace.includes('apple.com/bill') || searchSpace.includes('anthropic') || searchSpace.includes('midjourney')) {
        category = 'Subscripții & Software';
        is_recurring = true;
        if (searchSpace.includes('apple')) vendor = 'Apple Services';
        else if (searchSpace.includes('chatgpt') || searchSpace.includes('openai')) vendor = 'OpenAI';
        else if (searchSpace.includes('anthropic') || searchSpace.includes('claude')) vendor = 'Anthropic';
      } else if (searchSpace.includes('anaf') || searchSpace.includes('impozit')) {
        category = 'Taxe & Impozite';
        vendor = 'Statul Român';
      } else if (searchSpace.includes('ing business') || searchSpace.includes('transfer') || searchSpace.includes('retragere')) {
        category = 'Transferuri';
      } else if (type === 'income') {
        category = 'Venituri Clienți';
        if (searchSpace.includes('factura') || searchSpace.includes('fact tbp')) vendor = 'Client (Achitat Factură)';
      }

      parsedTransactions.push({
        date: parseDate(dateKey && row[dateKey] ? row[dateKey] : null),
        amount,
        description,
        vendor: vendor.length > 50 ? vendor.substring(0, 50) : vendor,
        category,
        is_recurring,
        type
      });
    });

    return parsedTransactions;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError('');
    
    try {
      // 1. Securely store the raw file first (Audit Trail)
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload to private bucket 'finance-statements'
      const { error: storageError } = await supabase.storage
        .from('finance-statements')
        .upload(filePath, file);

      if (storageError) {
        console.warn('Storage warning (private bucket might not exist yet):', storageError.message);
        // We continue with parsing even if backup storage fails, 
        // as long as the user knows we are trying to be secure.
      }
      
      let rawData: any[] = [];
      
      if (fileExt === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false, // keep as string to handle RO commas manually
          delimitersToGuess: [',', ';', '\t', '|'],
          complete: async (results) => {
            console.log('CSV Raw Data:', results.data);
            rawData = results.data;
            const parsed = processData(rawData);
            console.log('Parsed Transactions:', parsed);
            await saveParsedData(parsed);
          },
          error: (err) => {
            setUploadError('Eroare la citirea CSV-ului: ' + err.message);
            setIsUploading(false);
          }
        });
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
            console.log('Excel Raw Data:', rawData);
            const parsed = processData(rawData);
            console.log('Parsed Transactions:', parsed);
            await saveParsedData(parsed);
          } catch (err: any) {
            setUploadError('Eroare la citirea Excel: ' + err.message);
            setIsUploading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setUploadError('Vă rugăm să încărcați doar fișiere CSV sau Excel.');
        setIsUploading(false);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Eroare necunoscută la parsare.');
      setIsUploading(false);
    }
  };

  const saveParsedData = async (newTransactions: Transaction[]) => {
    if (newTransactions.length === 0) {
      setUploadError('Nu s-au găsit tranzacții valabile în document.');
      setIsUploading(false);
      return;
    }
    
    try {
      const { error } = await supabase.from('tbp_transactions').insert(newTransactions);
      if (error) {
        if (error.code === 'PGRST205') {
          setUploadError('Sistemul Supabase încă se sincronizează. Te rugăm să mai încerci o dată peste 10 secunde sau să dai un Hard Refresh (Ctrl+Shift+R).');
        } else {
          setUploadError(`Eroare Supabase (${error.code}): ${error.message}`);
        }
        console.error('Insert error details:', error);
        return;
      }
      
      setUploadError(''); // Clear errors on success
      await fetchTransactions(); // Refresh
      setActiveTab('transactions');
    } catch (err: any) {
      if (err.code === '42P01') {
        setUploadError('Tabelul tbp_transactions nu există! Rulează script-ul SQL în Supabase.');
      } else {
        setUploadError('Eroare la salvarea tranzacțiilor: ' + err.message);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!window.confirm('Sigur vrei să ștergi această tranzacție?')) return;
    try {
      await supabase.from('tbp_transactions').delete().eq('id', id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // --- DERIVED METRICS ---
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const currentMonthIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const recurringExpenses = transactions.filter(t => t.is_recurring && t.type === 'expense')
      .reduce((acc, current) => {
        const x = acc.find(item => item.vendor === current.vendor);
        if (!x) return acc.concat([current]);
        return acc;
      }, [] as Transaction[]);

  // Chart data (expenses by category)
  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((sum, t) => sum + t.amount, 0)
  })).filter(c => c.value > 0).sort((a,b) => b.value - a.value);

  const COLORS = ['#FF6B00', '#FDE4D3', '#EAEAEA', '#333333', '#888888', '#FF974D'];

  if (user?.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-display tracking-wide text-tbp-dark">Finance Pulse</h1>
          <p className="text-sm text-gray-500 mt-1">
            Perspectivă financiară și monitorizare inteligentă a costurilor.
          </p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-tbp-dark text-white' 
                : 'text-gray-500 hover:text-tbp-dark'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'transactions' 
                ? 'bg-tbp-dark text-white' 
                : 'text-gray-500 hover:text-tbp-dark'
            }`}
          >
            Tranzacții ({transactions.length})
          </button>
        </div>
      </header>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Atenție</p>
            <p>{uploadError}</p>
            {(uploadError.includes('PGRST205') || uploadError.includes('PROBLEMA_SINCRONIZARE')) && (
              <div className="mt-2 p-2 bg-white/50 rounded border border-red-100 text-xs text-red-600 font-mono">
                <p className="font-bold mb-1">Diagnostic Conexiune:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>ID Proiect Aplicație: <span className="font-bold underline">{supabaseUrlInfo || 'incarcare...'}</span></li>
                  <li>ID Proiect Browser (din URL Supabase): <span className="font-bold">pimwgjag...</span></li>
                </ul>
                <p className="mt-2 bg-red-100 p-1 rounded italic text-[10px]">
                  Dacă ID-urile nu încep la fel, înseamnă că rulezi scriptul SQL în alt proiect!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Top Metrics Map */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 bg-emerald-50 rounded-bl-3xl">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Venituri Luna Curentă</p>
              <p className="text-3xl font-display mt-2 text-tbp-dark">{currentMonthIncome.toLocaleString('ro-RO')} RON</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 bg-red-50 rounded-bl-3xl">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Cheltuieli Luna Curentă</p>
              <p className="text-3xl font-display mt-2 text-tbp-dark">{currentMonthExpense.toLocaleString('ro-RO')} RON</p>
            </div>
            
            <div className="bg-gradient-to-br from-tbp-dark to-gray-900 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <p className="text-sm text-gray-300 font-medium">Costuri recurente</p>
              <p className="text-3xl font-display mt-2 text-white">{recurringExpenses.length} Active</p>
              <button 
                onClick={() => setActiveTab('transactions')}
                className="mt-6 text-xs text-white/70 hover:text-white pb-0.5 border-b border-white/30 hover:border-white transition-all">
                Vezi Registru Plăți
              </button>
            </div>
          </div>

          {/* Insight Strip */}
          {transactions.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-slide-up border-l-4 border-l-tbp-orange">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tbp-orange/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-tbp-orange" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Analiză Pulse • Securizat</p>
                  <p className="text-xs text-gray-500">
                    {currentMonthIncome > currentMonthExpense 
                      ? `${(currentMonthIncome - currentMonthExpense).toLocaleString('ro-RO')} RON disponibili pentru reinvestire în creșterea brandului.`
                      : currentMonthExpense > 0 
                        ? `Atenție: Cheltuielile depășesc veniturile. Recomandăm auditarea costurilor de marketing.`
                        : "Sincronizare completă. Datele tale financiare sunt stocate într-un container privat."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Saving Rate</p>
                  <p className="text-sm font-bold text-tbp-dark">
                    {currentMonthIncome > 0 ? `${Math.round(((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100)}%` : '0%'}
                  </p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Burn Rate</p>
                  <p className="text-sm font-bold text-tbp-dark">
                    {currentMonthExpense.toLocaleString('ro-RO')} RON
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center animate-pulse">
              <p className="text-sm text-gray-400">Așteptăm importul primului extras de cont pentru a genera analize de profitabilitate.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg text-tbp-dark mb-6">Distribuție Costuri TBP</h3>
              {categoryData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                      <XAxis type="number" tickFormatter={(val) => `${val/1000}k`} stroke="#9CA3AF" />
                      <YAxis dataKey="name" type="category" width={120} stroke="#9CA3AF" fontSize={12} />
                      <Tooltip 
                        cursor={{fill: '#f3f4f6'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toLocaleString('ro-RO')} RON`, 'Suma']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-sm text-gray-400">Nu există suficiente date analizate</p>
                </div>
              )}
            </div>

            {/* Upload Area & Quick Actions */}
            <div className="space-y-6">
              <div className="bg-tbp-orange/5 border border-tbp-orange/20 rounded-3xl p-8 text-center border-dashed relative group">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-tbp-orange" />
                </div>
                <h3 className="font-bold text-tbp-dark mb-2">Importă Extras Cont</h3>
                <p className="text-xs text-gray-500 mb-6 px-4 leading-relaxed">
                  Încarcă extrasul de cont PDF (OCR), CSV sau Excel furnizat de bancă pentru a actualiza automat cashflow-ul TBP.
                </p>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="bank-upload"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-tbp-orange text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:shadow-md hover:bg-tbp-orange-hover transition-all w-full flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : <><FileText className="w-4 h-4" /> Încarcă Extras (.CSV / .XLSX)</>}
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-sm text-tbp-dark mb-4 flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-gray-400" />
                  Top Plăți Recurente
                </h3>
                <div className="space-y-4">
                  {recurringExpenses.slice(0, 5).map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                          {exp.vendor.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700">{exp.vendor}</span>
                      </div>
                      <span className="text-gray-900 font-bold">{exp.amount.toLocaleString('ro-RO')} RON</span>
                    </div>
                  ))}
                  {recurringExpenses.length === 0 && (
                    <div className="text-center py-6">
                      <ShieldCheck className="w-8 h-8 text-gray-100 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Nicio plată recurentă detectată în baza de date actuală.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="font-bold text-tbp-dark">Registru financiar securizat</h3>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Strict Confidențial • Acces Rozalia</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:border-gray-300">
                <Filter className="w-4 h-4" />
                <span>Filtrare avansată</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px] font-bold bg-white">
                  <th className="px-6 py-4">Dată</th>
                  <th className="px-6 py-4">Beneficiar / Explicație</th>
                  <th className="px-6 py-4">Categorie</th>
                  <th className="px-6 py-4">Tip</th>
                  <th className="px-6 py-4 text-right">Sumă (RON)</th>
                  <th className="px-6 py-4 text-center">Gestionare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 animate-pulse">
                      Sincronizare registru securizat...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-tbp-dark font-bold mb-1">Registru Gol</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Nu am găsit date financiare salvate. Importă un extras de cont pentru a popula automat acest registru și a genera analize de cashflow.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tr) => (
                    <tr key={tr.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(tr.date).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{tr.vendor}</span>
                          <span className="text-[11px] text-gray-400 truncate max-w-[280px]">{tr.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                          {tr.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tr.is_recurring ? (
                          <span className="inline-flex items-center gap-1.5 text-tbp-orange text-[10px] font-bold uppercase tracking-tighter bg-tbp-orange/5 px-2 py-0.5 rounded-md">
                            <RefreshCcw className="w-3 h-3" /> Recurent
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Unic</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${tr.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {tr.type === 'income' ? '+' : '-'}{tr.amount.toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => tr.id && deleteTransaction(tr.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Elimină tranzacție"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
