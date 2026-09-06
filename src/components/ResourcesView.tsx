import React, { useState } from 'react';
import { UserProfile } from '../types';
import { BookMarked, Calculator, FlaskConical, Globe, Languages, ChevronRight, X } from 'lucide-react';

interface ResourcesViewProps {
  profile: UserProfile;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ profile }) => {
  const [activeModal, setActiveModal] = useState<'math' | 'science' | 'sst' | 'languages' | null>(null);

  const resourceCards = [
    {
      id: 'math' as const,
      tag: 'Mathematics',
      title: 'NCERT Formula & Identity Cheatsheet',
      desc: 'Formulas for Real Numbers, Quadratic Equations, APs, Trigonometry, Coordinate Geometry & Volumes.',
      icon: Calculator,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    },
    {
      id: 'science' as const,
      tag: 'Physics & Chemistry',
      title: 'Equations, Numericals & Reactivity Series',
      desc: 'Ohm’s Law, lens/mirror formulas, reactivity series, balanced chemical equations & organic compounds.',
      icon: FlaskConical,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    },
    {
      id: 'sst' as const,
      tag: 'Social Science',
      title: 'Key Dates, Timeline & Geography Maps',
      desc: 'Nationalism in India & Europe milestones, major dams, iron ore mines, and constitution points.',
      icon: Globe,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'languages' as const,
      tag: 'English & Hindi',
      title: 'Grammar, Analytical Paragraphs & Patra Lekhan',
      desc: 'Formal letter formats, analytical paragraph templates, Hindi Vachya, Alankar & Nibandh formats.',
      icon: Languages,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="card-title m-0 mb-1">
          <span>📖</span>
          <span>Revision Kits & Notes</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-[#f0f6fc] sm:text-3xl">
          CBSE Study Resources & Cheatsheets
        </h2>
        <p className="text-xs text-[#8b949e] sm:text-sm">
          Quick-reference revision sheets for {profile.classLevel} board exam preparation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {resourceCards.map(res => {
          const Icon = res.icon;
          return (
            <div
              key={res.id}
              onClick={() => setActiveModal(res.id)}
              className="bento-card group cursor-pointer p-5 transition-all hover:border-[#58a6ff]/40"
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${res.color}`}>
                  {res.tag}
                </span>
                <Icon className="h-5 w-5 text-[#8b949e] transition-colors group-hover:text-[#58a6ff]" />
              </div>

              <h3 className="mt-3 text-base font-bold text-[#f0f6fc] group-hover:text-[#58a6ff]">
                {res.title}
              </h3>
              <p className="mt-1 text-xs text-[#8b949e] line-clamp-2">
                {res.desc}
              </p>

              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#58a6ff]">
                <span>View Full Notes</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal View */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bento-card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="card-title m-0">
                <span>📑</span>
                <span>
                  {activeModal === 'math' && 'Mathematics NCERT Formula Cheatsheet'}
                  {activeModal === 'science' && 'Physics & Chemistry Key Formulations'}
                  {activeModal === 'sst' && 'Social Science Milestones & Map Cheatsheet'}
                  {activeModal === 'languages' && 'English & Hindi Writing Formats'}
                </span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-[#8b949e] hover:bg-white/[0.05] hover:text-[#f0f6fc]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#8b949e] leading-relaxed">
              {activeModal === 'math' && (
                <>
                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#58a6ff]">1. Real Numbers & Polynomials:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>Fundamental Theorem of Arithmetic: Every composite number can be uniquely expressed as product of primes.</li>
                      <li>HCF(a, b) × LCM(a, b) = a × b</li>
                      <li>Quadratic zeroes: α + β = -b/a, αβ = c/a</li>
                      <li>Discriminant D = b² - 4ac (D &gt; 0: two distinct real roots; D = 0: equal real roots; D &lt; 0: no real roots).</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#58a6ff]">2. Arithmetic Progressions (AP):</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>n-th term: aₙ = a + (n - 1)d</li>
                      <li>Sum of n terms: Sₙ = (n/2)[2a + (n - 1)d] = (n/2)[a + l]</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#58a6ff]">3. Trigonometry & Coordinate Geometry:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>Distance formula: √[(x₂ - x₁)² + (y₂ - y₁)²]</li>
                      <li>Section formula: ((m₁x₂ + m₂x₁)/(m₁ + m₂), (m₁y₂ + m₂y₁)/(m₁ + m₂))</li>
                      <li>Identities: sin²θ + cos²θ = 1 | 1 + tan²θ = sec²θ | 1 + cot²θ = cosec²θ</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#58a6ff]">4. Surface Areas & Volumes:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>Cylinder: Volume = πr²h, CSA = 2πrh, TSA = 2πr(r + h)</li>
                      <li>Cone: Volume = (1/3)πr²h, CSA = πrl (where l = √(r² + h²))</li>
                      <li>Sphere: Volume = (4/3)πr³, TSA = 4πr²</li>
                      <li>Hemisphere: Volume = (2/3)πr³, CSA = 2πr², TSA = 3πr²</li>
                    </ul>
                  </div>
                </>
              )}

              {activeModal === 'science' && (
                <>
                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#bc8cff]">Physics - Optics & Electricity:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>Mirror formula: 1/f = 1/v + 1/u | Magnification: m = -v/u = h'/h</li>
                      <li>Lens formula: 1/f = 1/v - 1/u | Magnification: m = v/u</li>
                      <li>Power of Lens: P = 1/f (in meters), unit: Dioptre (D)</li>
                      <li>Ohm’s Law: V = IR | Series: Rₛ = R₁ + R₂ | Parallel: 1/Rₚ = 1/R₁ + 1/R₂</li>
                      <li>Joule's Heating: H = I²Rt | Electric Power: P = VI = I²R = V²/R</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#bc8cff]">Chemistry - Reactivity & Reactions:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>Reactivity Series: K &gt; Na &gt; Ca &gt; Mg &gt; Al &gt; Zn &gt; Fe &gt; Pb &gt; [H] &gt; Cu &gt; Hg &gt; Ag &gt; Au</li>
                      <li>Plaster of Paris: CaSO₄·½H₂O + 1½H₂O → CaSO₄·2H₂O (Gypsum)</li>
                      <li>Bleaching Powder: Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O</li>
                      <li>Baking Soda: NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃</li>
                      <li>Saponification: Ester + NaOH → Soap + Alcohol</li>
                    </ul>
                  </div>
                </>
              )}

              {activeModal === 'sst' && (
                <>
                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#d29922]">History - Key Chronology:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>1789: French Revolution breaks out.</li>
                      <li>1915: Mahatma Gandhi returns to India from South Africa.</li>
                      <li>1919: Rowlatt Act & Jallianwala Bagh Massacre (13 April).</li>
                      <li>1920–1922: Non-Cooperation Movement (called off after Chauri Chaura).</li>
                      <li>1930: Dandi March & Civil Disobedience Movement.</li>
                      <li>1931: Gandhi-Irwin Pact.</li>
                      <li>1942: Quit India Movement launched.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#d29922]">Geography Map Essentials:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>Major Dams: Salal (J&K), Bhakra Nangal (Punjab), Tehri (Uttarakhand), Rana Pratap Sagar (Rajasthan), Sardar Sarovar (Gujarat), Hirakud (Odisha), Nagarjuna Sagar (Telangana/AP).</li>
                      <li>Iron Ore Mines: Mayurbhanj, Durg, Bailadila, Bellary, Kudremukh.</li>
                      <li>Major Ports: Kandla, Mumbai, Marmagao, New Mangalore, Kochi, Tuticorin, Chennai, Visakhapatnam, Paradip, Haldia.</li>
                    </ul>
                  </div>
                </>
              )}

              {activeModal === 'languages' && (
                <>
                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#f85149]">English Formal Letter Layout (5 Marks):</strong>
                    <ol className="mt-2 list-inside list-decimal space-y-1 text-[#8b949e]">
                      <li>Sender’s address (Top left, 2–3 lines)</li>
                      <li>Date (e.g., 15 March 2026)</li>
                      <li>Receiver’s designation and official address</li>
                      <li>Subject (Underlined, concise, 5–6 words)</li>
                      <li>Salutation (Respected Sir / Madam)</li>
                      <li>Body (Introductory para, detailed concern/inquiry, concluding request)</li>
                      <li>Subscription (Yours faithfully / sincerely) & Signature</li>
                    </ol>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0b0f19] p-4">
                    <strong className="text-[#f85149]">Hindi Patra & Vyakaran Checkpoints:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[#8b949e]">
                      <li>Aupcharik Patra: Preshak ka pata, Dinaank, Prapak ka pad va pata, Vishay, Sambodhan, Vishay-vastu, Samapan.</li>
                      <li>Vachya: Kartrivachya, Karmavachya, Bhavavachya ke niyam aur parivartan.</li>
                      <li>Pad Parichay: Sangya, Sarvanam, Visheshan, Kriya, Karak ka nirdharan.</li>
                      <li>Alankar: Shlesh, Utpreksha, Atishyokti, Maanikaran.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-bold text-[#8b949e] hover:bg-white/[0.05] hover:text-[#f0f6fc]"
            >
              Close Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
