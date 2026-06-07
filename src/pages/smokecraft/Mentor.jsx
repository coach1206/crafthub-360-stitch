import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'

const PRIMARY_MENTORS = [
  {
    id: 'dominican',
    country: 'Dominican Republic',
    name: 'Don Alejandro',
    bio: 'Master of volcanic soil nutrients and the delicate art of Olor wrapper fermentation.',
    tags: ['Complexity', 'Floral Notes'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW0kKp2a_4GazxkwcITfOrEAllIhzdB5Y94YI3GOF4UY_h5x3WXU2pbG40AbZ6ihlpZtaj4UtlO3jZZa3RG7zxsThDh7FmhduBj24ZARTD5K1R7U8MLRDXOnONMqyfI2KIeMMdHkMpT8935igPG_sxJb8OJRHjuKGDLwPzGN19Kt8ZfwQ69SFlzvaxfS-a9dbIpMP6nYSLM-rsa-YkNC1nuvScNfx71c8wnLnyTkUBvOK-hxauZz5t5no9zgFaKX07ODHEsIS-as4',
  },
  {
    id: 'nicaragua',
    country: 'Nicaragua',
    name: 'Javier Estelí',
    bio: "Specialist in sun-grown Criollo '98 and the robust spice profiles of Jalapa Valley.",
    tags: ['Bold', 'Earth / Spice'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzBPCTkkOTqC2zVjLURPTau1pgZIFLC5Co6Y0y-jLHTi3MPuPrcBjDTt0wv45iGgQO1r45o_qnlU6lhp7knFWyi9IbZdaNHSCEUCE9M7cTmVXenKhOnVtMBo4CcP12_nkaUl8Xi3d_E0-CLrlrb8x7OTohO40ZTh80kNnvB_k0ZLieO6i5oQbfWkXaferMudU-whcjP3lV-bd6ZwWDcz3bVcC5SmoiTg9Lh863jYjA4vSWFOdvZXkuJ9qi7DkgSLYyk8W-V9T1V4c',
  },
  {
    id: 'honduras',
    country: 'Honduras',
    name: 'Elena Jamastran',
    bio: 'Legacy grower of authentic Corojo seed and the intense, full-bodied traditions of Danlí.',
    tags: ['Authentic', 'Rich Cedar'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPtp4Y9j-CA6V2A2YUzioHki9r4HgYAXpga25qi9M1COUPn-mESIwesmKG0oI1E6h2va2KG9i2KujziGRyVXJcsACvoLXVtwp-FjXh_vZcGVZaIQs_fyC5Jz9dVH9liVvvuWVAKMoycLpyvukC9824JvSdMKn6zZRZBUs7asdrOGdsLoVEguXkh9FjXAyhwuX3EAC311hlF-IFrr7DDbm8mXSqzWdf456BB2x8YTJH5-TiHWqLKN1JQAV65ylwgaoAIF8IfBY049s',
  },
  {
    id: 'mexico',
    country: 'Mexico',
    name: 'Mateo San Andrés',
    bio: 'Guardian of the Negro San Andrés leaf, the world\'s most sought-after Maduro wrapper.',
    tags: ['Dark Cocoa', 'Maduro Expert'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRshyXQNX_PtXBeEOJebDZFDGsJZ5uA2dzNwMLRsCFEHxT1dxYrfE5P0XDhj6_lw-OlVzTLz8oucgpbQUqYWCyOe__QJfEViUfjY24ntUQaYfqyZnKLPkSBlh6yVIspYyuh9MjP__1IumCEggADaqIzmMfDG3grDYXSqi0Oa6WXnvKK35jmG__D7M7KHVIjwuFaIuMUzNtccxbgr8VUF_FKJN3iLKUzdgs8U0qcuMjvQtLwAgBIoJ4CY_2rdjXUUUrWyfwMQ-CrLg',
  },
]

const SPECIALTY_REGIONS = [
  {
    id: 'brazil',
    country: 'Brazil (Mata Fina)',
    desc: 'Sweet & Earthy Profiles',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA96E-i-V5iTX1UcpiMqbc_VWvmkAzNT6IXZTWyHrnST3_e-F48lk4dZcQt6tnY3-FS8SRN9eitwotUIR2p0CbKKivcTEKxmGgznzCNEX3KLcYGf38oD4XGmclAy2Q4jDvglWAW0T574-61oF2onZkUfmc4FquVGHheV_lYKdEPyv8LeMGLGcNlQmQZiN-rDd2yoYLL1XGs80WOuOsHnwif63374-0j713oPLTw3MQ2Ff7QNQzXtmmTZ3UtN0wJI9yGD0ubbxwDk4g',
  },
  {
    id: 'ecuador',
    country: 'Ecuador (Habano)',
    desc: 'Silky Cloud-Grown Texture',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDinqiRd53IenZj6Dg4uDGjKf7GNFR89-xAI4t2-68wH-BtJVVKUsZMoTibHD5nB2uI61lEqWTKBzcx6fUO83UUDbqCLxufZvXkYwXkxnOvzLpFpOCdbPr3M95R49mvK2G6Wm2V-erAzikJa6EXqtaeZ4RT1Tjq9ANJsNobQ4TZRDYIwxX1xdFGkGHk0QSyvjOIAzrMG8ia4rPhXcUczk9X_nbwCvyVETSYlkbNZdC-KqHYQhoIteDqdb9tGkwvNhs1IeNtBh2Q4Y',
  },
  {
    id: 'colombia',
    country: 'Colombia (Ica Mazupa)',
    desc: 'Exotic & Pungent Nuances',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6_wI8m77sJd7RbYhPEKJZHPeLKjW9-hiycbmJjyP6rJ6L_7-sgj00VR1w8kzQ9FVVhk7hbkk_ZCCDhbOv8kZoVEguXkh9FjXAyhwuX3EAC311hlF-IFrr7DDbm8mXSqzWdf456BB2x8YTJH5-TiHWqLKN1JQAV65ylwgaoAIF8IfBY049s',
  },
]

const MAX_SELECTIONS = 2

export default function Mentor() {
  const navigate = useNavigate()
  const { setMentors, completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState([])

  function toggle(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(m => m !== id)
      if (prev.length >= MAX_SELECTIONS) return prev
      return [...prev, id]
    })
  }

  function handleProceed() {
    setMentors(selected)
    completeStep('mentor')
    addXP(XP_AWARDS.MENTOR_SELECTED)
    navigate('/smokecraft/origins')
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen" style={{ minHeight: 'max(884px, 100dvh)' }}>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 border-b border-outline-variant bg-surface/90 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-200"
            onClick={() => navigate('/smokecraft/enroll')}
          >menu</button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary drop-shadow-[0_2px_2px_rgba(233,193,118,0.5)]">CraftHub 360</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-label-lg text-label-lg text-on-surface-variant tracking-widest uppercase opacity-70">Step 6 of 12</span>
          <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-lg text-label-lg shadow-lg hover:brightness-110 transition-all active:scale-95">
            Grand Lounge
          </button>
        </div>
      </header>

      {/* Desktop left rail nav */}
      <nav className="hidden lg:flex fixed left-0 top-20 h-[calc(100vh-5rem)] w-24 flex-col items-center py-8 gap-8 border-r border-outline-variant bg-surface-container-low">
        {[
          { icon: 'wine_bar',      label: 'Cellar',  active: false },
          { icon: 'smoking_rooms', label: 'Humidor', active: true  },
          { icon: 'chair',         label: 'Lounge',  active: false },
          { icon: 'menu_book',     label: 'Passport',active: false },
        ].map(({ icon, label, active }) => (
          <div key={label} className={`flex flex-col items-center gap-2 ${active ? 'text-primary' : 'text-on-surface-variant opacity-40 hover:opacity-100 transition-opacity'}`}>
            <span className="material-symbols-outlined text-2xl" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
          </div>
        ))}
      </nav>

      <main className="pt-32 pb-40 px-8 max-w-[1440px] mx-auto lg:pl-32">
        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 items-end">
          <div className="md:col-span-7">
            <h2 className="font-display-lg text-display-lg mb-4 leading-tight">
              SmokeCraft <br />
              <span className="gold-foil-text" style={{ WebkitTextFillColor: 'transparent' }}>Mentor Selection</span>
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              The mastery of tobacco is a lineage of fire and soil. Select two mentors from the world's most
              prestigious growing regions to curate your personalized tasting journey and masterclass curriculum.
            </p>
          </div>
          <div className="md:col-span-5 flex justify-end">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              <div className="w-40 h-40 rounded-full border-2 border-primary p-1 bg-surface-container shadow-[0_0_30px_rgba(233,193,118,0.2)]">
                <div className="w-full h-full rounded-full border border-primary/40 flex flex-col items-center justify-center text-center p-4">
                  <span className="material-symbols-outlined text-primary text-4xl mb-1">verified</span>
                  <span className="font-label-sm text-label-sm text-primary uppercase leading-tight">Mentor Participation<br />Stamp</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 opacity-50">Preview Mode</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary mentor grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRIMARY_MENTORS.map((mentor) => {
            const isSelected = selected.includes(mentor.id)
            return (
              <div
                key={mentor.id}
                onClick={() => toggle(mentor.id)}
                className={`group relative bg-surface-container-low rounded-xl overflow-hidden transition-all duration-500 cursor-pointer ${isSelected ? 'shadow-[0_0_40px_rgba(233,193,118,0.25)] border-2 border-primary' : 'border border-primary/30 hover:shadow-[0_0_40px_rgba(233,193,118,0.15)]'}`}
              >
                {/* Selection indicator */}
                <div className="absolute top-4 right-4 z-20">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary text-primary' : 'border-outline text-transparent'}`}>
                    <span className="material-symbols-outlined text-xl" style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>check_circle</span>
                  </div>
                </div>

                {/* Image */}
                <div className="h-80 relative">
                  <img
                    className={`w-full h-full object-cover mentor-image-mask transition-all duration-700 ${isSelected ? 'grayscale-0' : 'grayscale-[0.5] group-hover:grayscale-0'}`}
                    src={mentor.img}
                    alt={mentor.name}
                  />
                  <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface to-transparent">
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-[0.2em] mb-1 block">{mentor.country}</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{mentor.name}</h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 pt-0 space-y-4">
                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{mentor.bio}</p>
                  <div className="flex gap-2 flex-wrap">
                    {mentor.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-surface-container-high rounded text-[10px] uppercase font-bold text-outline">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Specialty Terroir Regions */}
        <div className="mt-16">
          <h4 className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-8 border-b border-outline-variant pb-4">
            Specialty Terroir Regions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPECIALTY_REGIONS.map((region) => {
              const isSelected = selected.includes(region.id)
              return (
                <div
                  key={region.id}
                  onClick={() => toggle(region.id)}
                  className={`flex items-center p-6 rounded-xl border transition-all cursor-pointer group ${isSelected ? 'bg-surface-container-high border-primary' : 'bg-surface-container-high/40 border-primary/30 hover:bg-surface-container-high'}`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform" src={region.img} alt={region.country} />
                  </div>
                  <div className="ml-4 flex-grow">
                    <h5 className="font-headline-md text-[18px] text-on-surface">{region.country}</h5>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{region.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-on-primary border-primary' : 'border-outline text-transparent'}`}>
                    <span className="material-symbols-outlined text-[14px]">done</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center h-24 px-8">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Selections Made</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-headline-md text-primary">{selected.length}</span>
              <span className="text-on-surface-variant">/ 2 Mentors</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/smokecraft/enroll')}
              className="px-8 py-3 rounded-lg font-label-lg text-label-lg text-on-surface border border-outline hover:bg-surface-container transition-all"
            >
              Save Draft
            </button>
            <button
              onClick={handleProceed}
              disabled={selected.length < MAX_SELECTIONS}
              className="px-12 py-3 rounded-lg font-label-lg text-label-lg bg-primary text-on-primary shadow-[0_4px_15px_rgba(233,193,118,0.3)] disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
            >
              Proceed to Tasting Map
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
