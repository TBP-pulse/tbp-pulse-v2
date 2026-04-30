import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import { FileText, Search, Plus, Filter, MoreHorizontal, File, Calendar, Users, FolderRoot, X, UploadCloud, Palette, Presentation, Briefcase, Video, Layers, Music } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import React from 'react';

export default function Docs() {
  const { user } = useAuth();
  const { addAlert } = useAlerts();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      let query = supabase.from('projects').select('id, name, client');
      
      // Owner-ul și Gabi (Videograful) văd toate proiectele
      if (user?.role !== 'owner' && user?.initials !== 'GB' && user?.initials) {
        query = query.contains('assignees', [user.initials]);
      }
      
      const { data: projectsData } = await query;
      
      if (projectsData) {
        setProjectsList(projectsData);
      }

      // Adunăm clienții proiectelor disponibile
      const clients = projectsData?.filter(p => !!p.client).map(p => p.client) || [];
      // Adăugăm un client virtual pentru resurse generale
      clients.push('Agentie');

      if (clients.length > 0) {
        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .in('client', clients)
          .order('created_at', { ascending: false });
        
        let myTaskIds = new Set<number>();
        if (user?.role !== 'owner') {
          const { data: myTasksData } = await supabase
            .from('tasks')
            .select('id')
            .eq('assignee', user?.initials);
          if (myTasksData) {
            myTasksData.forEach(t => myTaskIds.add(t.id));
          }
        }
        
        const filteredDocsData = docsData?.filter(doc => {
          if (user?.role === 'owner') return true;
          
          const match = doc.name.match(/\[TASK-(\d+)\]/);
          if (match) {
            const taskId = Number(match[1]);
            return myTaskIds.has(taskId);
          }
          return true;
        }) || [];
        
        const docsWithProjects = filteredDocsData.map(doc => ({
          ...doc,
          projectName: doc.client === 'Agentie' ? 'Resurse Generale' : (projectsData?.find(p => p.client === doc.client)?.name || doc.client || 'General')
        }));
        
        setDocuments(docsWithProjects);
      } else {
         setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching docs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) {
       return;
    }
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${selectedClient}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from('documents').insert([{
        client: selectedClient,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: data.publicUrl,
        uploader: user?.initials || 'U',
        created_at: new Date().toISOString()
      }]);

      if (dbError) throw dbError;
      
      // Notify about document upload
      if (user?.role !== 'owner') {
         await addAlert({
           title: 'Document Nou',
           description: `${user?.full_name || 'Un colaborator'} a încărcat documentul "${file.name}".`,
           client: selectedClient || 'General',
           assignee: 'Rozalia', // Numele ownerului
           assigneeInitials: 'RM',
           assigneeColor: 'bg-indigo-100 text-indigo-700',
           errorCode: `DOC-NEW-${new Date().getTime().toString().slice(-6)}`,
           severity: 'info'
         });
      } else {
         await addAlert({
           title: 'Document Adăugat',
           description: `Ai încărcat documentul "${file.name}" în spațiul clientului.`,
           client: selectedClient || 'General',
           assignee: 'Echipa',
           assigneeInitials: 'All',
           assigneeColor: 'bg-emerald-100 text-emerald-700',
           errorCode: `DOC-NEW-${new Date().getTime().toString().slice(-6)}`,
           severity: 'info'
         });
      }

      fetchDocuments();
      setIsModalOpen(false);
      setSelectedClient('');
    } catch (error: any) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (!searchQuery) return true;
    
    // Check if searchQuery has multiple keywords separated by |
    if (searchQuery.includes('|')) {
      const keywords = searchQuery.split('|');
      return keywords.some(keyword => 
        doc.name.toLowerCase().includes(keyword.toLowerCase()) ||
        doc.projectName.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    // Standard search
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           doc.projectName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-display tracking-wide text-tbp-dark mb-2">
            {user?.initials === 'GB' ? (
              <>Resurse & <span className="text-tbp-blue">Materiale</span></>
            ) : (
              <>Documente & <span className="text-tbp-blue">Notițe</span></>
            )}
          </h1>
          <p className="text-gray-500 text-lg">
            {user?.initials === 'GB' 
              ? 'Template-uri, presetări și resurse pentru montajul video.'
              : 'Toate fișierele și resursele tale într-un singur loc.'}
          </p>
        </div>
        {user?.role === 'owner' && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-tbp-blue text-white rounded-xl font-bold text-sm hover:bg-tbp-blue-hover transition-colors shadow-glow-blue"
            >
              <Plus className="w-4 h-4" />
              {user?.initials === 'GB' ? 'Resursă Nouă' : 'Document Nou'}
            </button>
          </div>
        )}
      </header>

      {/* Quick Filters Section */}
      <div className="mb-10 section-reveal">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Filtre Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {user?.initials === 'GB' ? (
            <>
              {/* Filtre specifice pentru Videograf (GB) */}
              <div 
                onClick={() => setSearchQuery(searchQuery === 'preset|lut' ? '' : 'preset|lut')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${searchQuery === 'preset|lut' ? 'bg-orange-50/50 border-tbp-orange/30 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
              >
                <div className={`p-3 rounded-xl h-fit ${searchQuery === 'preset|lut' ? 'bg-tbp-orange text-white' : 'bg-orange-50 text-tbp-orange'}`}>
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-tbp-dark">Presetări & Efecte</h4>
                  <p className="text-xs text-gray-500 mt-1">Lut-uri, tranziții și template-uri CapCut</p>
                </div>
              </div>
              
              <div 
                onClick={() => setSearchQuery(searchQuery === 'grafic|asset|logo' ? '' : 'grafic|asset|logo')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${searchQuery === 'grafic|asset|logo' ? 'bg-blue-50/50 border-tbp-blue/30 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
              >
                <div className={`p-3 rounded-xl h-fit ${searchQuery === 'grafic|asset|logo' ? 'bg-tbp-blue text-white' : 'bg-blue-50 text-tbp-blue'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-tbp-dark">Resurse Grafice</h4>
                  <p className="text-xs text-gray-500 mt-1">Fonturi, logo-uri și elemente overlay</p>
                </div>
              </div>

              <div 
                onClick={() => setSearchQuery(searchQuery === 'audio|muzic|sfx' ? '' : 'audio|muzic|sfx')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${searchQuery === 'audio|muzic|sfx' ? 'bg-emerald-50/50 border-emerald-500/30 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
              >
                <div className={`p-3 rounded-xl h-fit ${searchQuery === 'audio|muzic|sfx' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-tbp-dark">Audio & SFX</h4>
                  <p className="text-xs text-gray-500 mt-1">Efecte sonore, trenduri audio</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Filtre standard eliminate pentru colaboratori, se face un inlocuitor functional */}
              {user?.role === 'owner' ? (
              <>
                <div 
                  onClick={() => setSearchQuery(searchQuery === 'brand' ? '' : 'brand')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${searchQuery === 'brand' ? 'bg-orange-50/50 border-tbp-orange/30 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                >
                  <div className={`p-3 rounded-xl h-fit ${searchQuery === 'brand' ? 'bg-tbp-orange text-white' : 'bg-orange-50 text-tbp-orange'}`}>
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-tbp-dark">Brand & Identitate</h4>
                    <p className="text-xs text-gray-500 mt-1">Kit-uri vizuale, manuale și tone of voice</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => setSearchQuery(searchQuery === 'strateg' ? '' : 'strateg')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${searchQuery === 'strateg' ? 'bg-blue-50/50 border-tbp-blue/30 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                >
                  <div className={`p-3 rounded-xl h-fit ${searchQuery === 'strateg' ? 'bg-tbp-blue text-white' : 'bg-blue-50 text-tbp-blue'}`}>
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-tbp-dark">Strategii & Rapoarte</h4>
                    <p className="text-xs text-gray-500 mt-1">Audituri de cont, analize și rezultate</p>
                  </div>
                </div>

                <div 
                  onClick={() => setSearchQuery(searchQuery === 'brief' ? '' : 'brief')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${searchQuery === 'brief' ? 'bg-emerald-50/50 border-emerald-500/30 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                >
                  <div className={`p-3 rounded-xl h-fit ${searchQuery === 'brief' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-tbp-dark">Brief-uri Clienți</h4>
                    <p className="text-xs text-gray-500 mt-1">Contracte, onboarding și notițe apeluri</p>
                  </div>
                </div>
              </>
              ) : (
                <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-100 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <FolderRoot className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-display text-indigo-900">Spațiu de Transfer Fișiere</h4>
                    <p className="text-sm text-indigo-700 mt-1">
                      Ai nevoie de o verificare de la master user? Vrei să lași niște resurse sau o solicitare rapidă? 
                      Pentru a trimite documentele direct la Rozalia, apasă butonul de mai jos.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition"
                  >
                    Trimite un Fișier Acum
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden section-reveal" style={{ animationDelay: '100ms' }}>
        {user?.role === 'owner' && (
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                <Filter className="w-3.5 h-3.5" />
                Filtre
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Caută documente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tbp-blue/20 focus:border-tbp-blue/30 transition-all text-tbp-dark"
              />
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-tbp-blue/30 border-t-tbp-blue rounded-full animate-spin"></div>
            </div>
          ) : user?.role !== 'owner' ? (
            <div className="p-8 text-center bg-gray-50/50">
              <FolderRoot className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
              <h3 className="text-lg font-display text-indigo-900 mb-2">Trimise către Rozalia</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Aici poți trimite fișiere direct către master user. Fișierele trimise anterior din această sesiune îți vor apărea aici.
              </p>
              {filteredDocs.filter(d => d.uploader === user?.initials).length > 0 ? (
                <div className="flex flex-col gap-3 max-w-2xl mx-auto text-left">
                  {filteredDocs.filter(d => d.uploader === user?.initials).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div className="truncate text-sm font-semibold text-tbp-dark">{doc.name}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{doc.size}</span>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 font-bold hover:underline">Vezi</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  Încarcă primul document
                </button>
              )}
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nume</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Locație (Proiect)</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Modificat</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mărime</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                          <File className="w-4 h-4 text-tbp-blue shrink-0" />
                          <span className="font-bold text-sm text-tbp-dark group-hover:text-tbp-blue transition-colors line-clamp-1">{doc.name}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600 bg-gray-100">
                          {doc.projectName}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {doc.size}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-gray-400 hover:text-tbp-dark hover:bg-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12">
              <EmptyState 
                icon={user?.initials === 'GB' ? <Layers className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                title={user?.initials === 'GB' ? "Nu s-au găsit resurse" : "Nu s-au găsit documente"}
                description={searchQuery ? "Nu am găsit niciun rezultat pentru căutarea ta." : (user?.initials === 'GB' ? "Nu există template-uri sau resurse video încărcate." : "Nu există fișiere sau documente anexate proiectelor tale.")}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Upload Document */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-display text-tbp-dark">Document Nou</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Client / Proiect <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tbp-blue/20 focus:border-tbp-blue/30 transition-all appearance-none"
                  required
                >
                  <option value="" disabled>Selectează clientul sau destinația</option>
                  <option value="Agentie" className="font-bold text-tbp-blue">📁 Resurse Generale Agenție (Comun)</option>
                  {projectsList.filter(p => !!p.client).map(p => (
                    <option key={p.id} value={p.client}>{p.name} ({p.client})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Fișier
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-tbp-blue/30 hover:bg-blue-50/30 transition-all">
                  <input
                    type="file"
                    id="doc-upload"
                    className="hidden"
                    onChange={handleUploadDocument}
                    disabled={uploading || !selectedClient}
                  />
                  <label 
                    htmlFor={selectedClient ? "doc-upload" : ""}
                    className={`flex flex-col items-center gap-3 ${selectedClient ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-tbp-blue">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    {uploading ? (
                      <div>
                        <p className="text-sm font-bold text-tbp-dark">Se încărcă...</p>
                        <p className="text-xs text-gray-500 mt-1">Te rugăm să aștepți</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-tbp-dark">Dă click pentru a încărca</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX până la 50MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
                disabled={uploading}
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
