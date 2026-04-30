import { Mail, Phone } from 'lucide-react';

export default function Team() {
  const team = [
    { 
      id: 1, 
      name: 'Rozalia Marinescu', 
      role: 'Owner Agenție', 
      initials: 'RM', 
      color: 'bg-tbp-orange/20 text-tbp-orange',
      responsibilities: ['iNES (14 postari B2B, 6 B2C, 6 LI)', 'iNES (Marketing Meta Ads)', 'Tucano (14 postari)', 'ASJR (14 feed, 40 story)', 'AtlantisDigitalLab (14 feed, 40 story)', 'BOON (20 feed, 20 story)'],
      email: 'design@thebigpixel.ro',
      tel: '0728 396 396'
    },
    { 
      id: 2, 
      name: 'Andreea Sîrbu', 
      role: 'Specialist Social Media', 
      initials: 'AS', 
      color: 'bg-pink-100 text-pink-600',
      responsibilities: ['Cabana Soveja (14 feed, 40 story)', 'Infinity Forest (14 feed, 40 story)', 'West Exclusive (14 feed, 40 story)', 'CNPG (14 feed, 40 story)', 'Tucano (40 story)', 'iNES (40 story)'],
      email: 'deea_as2006@yahoo.com',
      tel: '+40 734 622 623'
    },
    { 
      id: 3, 
      name: 'Aurora Roventa', 
      role: 'Marketing Specialist', 
      initials: 'AR', 
      color: 'bg-purple-100 text-purple-600',
      responsibilities: ['Clinica32 (Google Ads, Meta Ads)', 'iNES (Google Ads, Meta Ads)'],
      email: '',
      tel: '+40 767 632 250'
    },
    { 
      id: 4, 
      name: 'Gabi Buliga', 
      role: 'Video Editor', 
      initials: 'GB', 
      color: 'bg-blue-100 text-blue-600',
      responsibilities: ['Responsabilități în funcție de proiecte'],
      email: '',
      tel: ''
    },
    { 
      id: 5, 
      name: 'Radu Podaru', 
      role: 'Business Consultant', 
      initials: 'RP', 
      color: 'bg-emerald-100 text-emerald-600',
      responsibilities: ['Consultanță Business']
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display tracking-wide text-tbp-dark">Echipa & Colaboratori</h1>
        <p className="text-sm text-gray-500 mt-1">Oamenii care fac lucrurile să se întâmple și responsabilitățile lor.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((member, idx) => (
          <div key={member.id} className="bg-white p-6 rounded-2xl shadow-card border border-gray-100 section-reveal flex flex-col h-full" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display text-xl ${member.color}`}>
                {member.initials}
              </div>
              <div>
                <h3 className="font-bold text-tbp-dark">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            </div>
            
            <div className="flex-1 mb-6">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Responsabilități & Clienți</h4>
              <div className="flex flex-wrap gap-2">
                {member.responsibilities.map((resp, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-medium rounded-md">
                    {resp}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              {member.email ? (
                <a href={`mailto:${member.email}`} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              ) : (
                <div className="flex-1 py-2 bg-gray-50 text-gray-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                  <Mail className="w-3.5 h-3.5" /> N/A
                </div>
              )}
              
              {member.tel ? (
                <a href={`tel:${member.tel}`} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Contact
                </a>
              ) : (
                <div className="flex-1 py-2 bg-gray-50 text-gray-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                  <Phone className="w-3.5 h-3.5" /> N/A
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

