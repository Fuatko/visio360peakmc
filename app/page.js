'use client'

import { useState, useEffect } from 'react'

const SCORE_COLORS = { 1: '#fc8181', 2: '#f6ad55', 3: '#f6e05e', 4: '#68d391', 5: '#4fd1c5' }
const SCORE_LABELS = { 1: 'Çok Yetersiz', 2: 'Yetersiz', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' }

const defaultCategories = [
  {
    id: 'cat1', name: 'STRATEJİK VİZYON', icon: '🎯', color: '#6b7fd4',
    questions: [
      { id: 'q1', text: 'Kurum için en kritik 3 mesele nedir?', weight: 3, mentorNote: 'Stratejik farkındalığı değerlendirin', answers: {} },
      { id: 'q2', text: 'En çok zamanınızı alan şey ne?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q3', text: 'Önümüzdeki 12 ayda en riskli karar hangisi?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q4', text: 'Kurum sizden hangi liderliği bekliyor?', weight: 3, mentorNote: '', answers: {} },
    ]
  },
  {
    id: 'cat2', name: 'KARAR ALMA', icon: '⚖️', color: '#9f7aea',
    questions: [
      { id: 'q5', text: 'Son aldığınız zor karar hangisiydi?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q6', text: 'Hangi kararları erteliyorsunuz?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q7', text: 'Risk alırken sizi durduran ne?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q8', text: 'Karar öncesi kimle konuşmazsınız?', weight: 2, mentorNote: '', answers: {} },
    ]
  },
  {
    id: 'cat3', name: 'EKİP LİDERLİĞİ', icon: '👥', color: '#48bb78',
    questions: [
      { id: 'q9', text: 'Ekibiniz sizden neyi çekiniyor?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q10', text: 'En güvendiğiniz yönetici kim?', weight: 2, mentorNote: '', answers: {} },
      { id: 'q11', text: 'Kimi gereğinden fazla koruyorsunuz?', weight: 2, mentorNote: '', answers: {} },
      { id: 'q12', text: 'Ekibiniz sizi nasıl hatırlayacak?', weight: 3, mentorNote: '', answers: {} },
    ]
  },
  {
    id: 'cat4', name: 'DEĞERLER', icon: '⭐', color: '#ed8936',
    questions: [
      { id: 'q13', text: 'Hangi değerden taviz verdiniz?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q14', text: 'Sizi tanımlayan karar hangisi?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q15', text: 'Ayrıldığınızda ne kalmasını istersiniz?', weight: 3, mentorNote: '', answers: {} },
      { id: 'q16', text: 'Bu rol sizi daha iyi mi yaptı?', weight: 3, mentorNote: '', answers: {} },
    ]
  }
]

export default function Home() {
  const [tab, setTab] = useState('dashboard')
  const [categories, setCategories] = useState(defaultCategories)
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [selectedCatId, setSelectedCatId] = useState(null)
  const [answers, setAnswers] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', title: '', company: '' })

  useEffect(() => {
    const saved = localStorage.getItem('mentorData')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.categories) setCategories(data.categories)
      if (data.sessions) setSessions(data.sessions)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mentorData', JSON.stringify({ categories, sessions }))
  }, [categories, sessions])

  const calcStats = (session) => {
    if (!session) return null
    let earned = 0, max = 0, answered = 0
    const catStats = []
    session.categories.forEach(cat => {
      let catE = 0, catM = 0, catA = 0
      cat.questions.forEach(q => {
        catM += q.weight || 0
        if (q.answer) {
          catE += (q.answer / 5) * (q.weight || 0)
          catA++
        }
      })
      earned += catE
      max += catM
      answered += catA
      catStats.push({ ...cat, earned: catE, max: catM, answered: catA, pct: catM > 0 ? (catE/catM)*100 : 0 })
    })
    const pct = max > 0 ? (earned / max) * 100 : 0
    let profile = { type: 'GELİŞİM ODAKLI', color: '#fc8181' }
    if (pct >= 90) profile = { type: 'VİZYONER LİDER', color: '#4fd1c5' }
    else if (pct >= 75) profile = { type: 'GÜÇLÜ YÖNETİCİ', color: '#68d391' }
    else if (pct >= 60) profile = { type: 'GELİŞEN LİDER', color: '#f6e05e' }
    else if (pct >= 40) profile = { type: 'POTANSİYEL', color: '#f6ad55' }
    return { earned, max, pct, answered, total: session.categories.reduce((s,c) => s + c.questions.length, 0), catStats, profile }
  }

  const stats = currentSession ? calcStats(currentSession) : null
  const totalWeight = categories.reduce((sum, cat) => sum + cat.questions.reduce((s, q) => s + (q.weight || 0), 0), 0)

  const startSession = () => {
    if (!formData.name || !formData.title || !formData.company) { alert('Tüm alanları doldurun!'); return }
    const newSession = {
      id: Date.now(),
      ...formData,
      categories: JSON.parse(JSON.stringify(categories)),
      createdAt: new Date().toISOString(),
      notes: {}
    }
    setSessions([...sessions, newSession])
    setCurrentSession(newSession)
    setSelectedCatId(newSession.categories[0]?.id)
    setShowModal(false)
    setFormData({ name: '', title: '', company: '' })
    setTab('evaluation')
  }

  const setAnswer = (catId, qId, score) => {
    if (!currentSession) return
    const updated = {
      ...currentSession,
      categories: currentSession.categories.map(cat =>
        cat.id === catId ? { ...cat, questions: cat.questions.map(q => q.id === qId ? { ...q, answer: score } : q) } : cat
      )
    }
    setCurrentSession(updated)
    setSessions(sessions.map(s => s.id === updated.id ? updated : s))
  }

  const selectedCat = currentSession?.categories.find(c => c.id === selectedCatId)

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: 'linear-gradient(135deg, #4a5568, #2d3748)', color: 'white', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #c9a962, #b8960f)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👔</div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Executive Mentor</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Liderlik Koçluk Platformu</div>
            </div>
          </div>
          <span style={{ padding: '4px 12px', background: totalWeight === 48 ? 'rgba(104,211,145,0.3)' : 'rgba(252,129,129,0.3)', borderRadius: '12px', fontSize: '12px' }}>{totalWeight}/48</span>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        {tab === 'dashboard' && (
          <div>
            <div className="card">
              <h3 style={{ marginBottom: '12px', color: '#c9a962' }}>🆕 Yeni Oturum</h3>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowModal(true)}>+ YENİ OTURUM BAŞLAT</button>
              {currentSession && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#fef9e7', borderLeft: '3px solid #c9a962', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ fontSize: '11px', color: '#c9a962', fontWeight: '600' }}>📌 Aktif Oturum</div>
                  <div style={{ fontWeight: '600' }}>{currentSession.name}</div>
                </div>
              )}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '12px', color: '#c9a962' }}>📁 Oturumlar ({sessions.length})</h3>
              {sessions.length === 0 ? <p style={{ color: '#718096' }}>Henüz oturum yok</p> : sessions.slice().reverse().map(s => {
                const st = calcStats(s)
                return (
                  <div key={s.id} onClick={() => { setCurrentSession(s); setSelectedCatId(s.categories[0]?.id); setTab('evaluation') }} style={{ padding: '12px', background: currentSession?.id === s.id ? '#f0f4ff' : '#f8fafc', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', border: currentSession?.id === s.id ? '2px solid #6b7fd4' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>{s.title}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: st?.profile.color }}>{st?.pct.toFixed(0)}%</div>
                        <div style={{ fontSize: '10px', color: '#718096' }}>{st?.profile.type}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'evaluation' && currentSession && (
          <div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>{currentSession.name}</h2>
                  <p style={{ fontSize: '12px', color: '#718096', margin: '4px 0 0' }}>{currentSession.title} | {currentSession.company}</p>
                </div>
                {stats && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '28px', fontWeight: '700', color: '#6b7fd4' }}>{stats.earned.toFixed(1)}</div><div style={{ fontSize: '11px', color: '#718096' }}>/ {stats.max.toFixed(0)}</div></div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {currentSession.categories.map(cat => {
                const catStat = stats?.catStats.find(c => c.id === cat.id)
                return (
                  <div key={cat.id} onClick={() => setSelectedCatId(cat.id)} style={{ padding: '12px 8px', background: selectedCatId === cat.id ? cat.color + '20' : 'white', border: `2px solid ${selectedCatId === cat.id ? cat.color : '#e2e8f0'}`, borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px' }}>{cat.icon}</div>
                    <div style={{ fontSize: '9px', fontWeight: '600' }}>{cat.name.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', color: '#718096' }}>{catStat?.answered || 0}/{cat.questions.length}</div>
                  </div>
                )
              })}
            </div>
            {selectedCat && (
              <div className="card">
                <h3 style={{ color: selectedCat.color, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '24px' }}>{selectedCat.icon}</span>{selectedCat.name}</h3>
                {selectedCat.questions.map((q, idx) => (
                  <div key={q.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '12px', borderLeft: q.answer ? `4px solid ${SCORE_COLORS[q.answer]}` : '4px solid transparent' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ width: '26px', height: '26px', background: selectedCat.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>{q.text}</p>
                        <span style={{ fontSize: '11px', color: '#c9a962' }}>Kırılım: {q.weight}</span>
                      </div>
                    </div>
                    {q.mentorNote && <div style={{ background: '#fef9e7', borderLeft: '3px solid #c9a962', padding: '10px', borderRadius: '0 8px 8px 0', marginBottom: '10px', fontSize: '12px', color: '#718096' }}><strong style={{ color: '#c9a962' }}>📌 Mentor:</strong> {q.mentorNote}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {[1,2,3,4,5].map(score => (
                        <button key={score} onClick={() => setAnswer(selectedCat.id, q.id, score)} style={{ padding: '10px 4px', borderRadius: '8px', border: `2px solid ${SCORE_COLORS[score]}`, background: q.answer === score ? SCORE_COLORS[score] : 'white', color: q.answer === score ? 'white' : SCORE_COLORS[score], cursor: 'pointer', fontWeight: '700' }}>
                          <div style={{ fontSize: '16px' }}>{score}</div>
                          <div style={{ fontSize: '8px' }}>{SCORE_LABELS[score]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'analysis' && stats && (
          <div>
            <div className="card" style={{ textAlign: 'center', background: stats.profile.color + '15' }}>
              <div style={{ fontSize: '50px' }}>👔</div>
              <h2 style={{ color: stats.profile.color, margin: '10px 0' }}>{stats.profile.type}</h2>
              <p style={{ color: '#718096' }}>{currentSession?.name}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px' }}>
                <div><div style={{ fontSize: '28px', fontWeight: '700', color: '#6b7fd4' }}>{stats.earned.toFixed(1)}</div><div style={{ fontSize: '11px', color: '#718096' }}>Kazanılan</div></div>
                <div><div style={{ fontSize: '28px', fontWeight: '700', color: '#6b7fd4' }}>{stats.max.toFixed(0)}</div><div style={{ fontSize: '11px', color: '#718096' }}>Maksimum</div></div>
                <div><div style={{ fontSize: '28px', fontWeight: '700', color: stats.profile.color }}>{stats.pct.toFixed(0)}%</div><div style={{ fontSize: '11px', color: '#718096' }}>Başarı</div></div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ color: '#c9a962', marginBottom: '12px' }}>📋 Kategoriler</h3>
              {stats.catStats.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                  <span>{cat.icon} {cat.name}</span>
                  <span style={{ fontWeight: '600', color: cat.color }}>{cat.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', padding: '8px 10px 24px', zIndex: 100 }}>
        {[
          { id: 'dashboard', icon: '📊', label: 'Panel' },
          { id: 'evaluation', icon: '📝', label: 'Değerlendir' },
          { id: 'analysis', icon: '📈', label: 'Analiz' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 16px', background: tab === t.id ? '#f0f4ff' : 'transparent', border: 'none', borderRadius: '10px', color: tab === t.id ? '#6b7fd4' : '#718096', cursor: 'pointer' }}>
            <span style={{ fontSize: '20px' }}>{t.icon}</span>
            <span style={{ fontSize: '10px' }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🆕 Yeni Oturum</h2>
            <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '12px', color: '#718096' }}>Ad Soyad *</label><input className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn: Ahmet Yılmaz" /></div>
            <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '12px', color: '#718096' }}>Unvan *</label><input className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Örn: Genel Müdür" /></div>
            <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '12px', color: '#718096' }}>Kurum *</label><input className="input" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Örn: ABC Holding" /></div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={startSession}>Başlat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
