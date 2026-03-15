'use client'

import { useState, useEffect, useRef } from 'react'
import { encrypt, decrypt, encryptBackup, decryptBackup, generateSecretKey } from '@/lib/crypto'

const SCORE_COLORS = { 1: '#fc8181', 2: '#f6ad55', 3: '#f6e05e', 4: '#68d391', 5: '#4fd1c5' }
const SCORE_LABELS = { 1: 'Çok Yetersiz', 2: 'Yetersiz', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' }

const SUPER_ADMIN = { email: 'fuat@servispro.com.tr', role: 'super_admin' }

const defaultCategories = [
  {
    id: 'cat1', name: 'STRATEJİK VİZYON', icon: '🎯', color: '#6b7fd4',
    questions: [
      { id: 'q1', text: 'Kurum için en kritik 3 mesele nedir?', weight: 3, mentorNote: 'Stratejik farkındalığı değerlendirin', answer_1: 'Hiç farkında değil', answer_2: 'Belirsiz tanımlıyor', answer_3: 'Kısmen farkında', answer_4: 'İyi tanımlıyor', answer_5: 'Mükemmel analiz' },
      { id: 'q2', text: 'En çok zamanınızı alan şey ne?', weight: 3, mentorNote: '', answer_1: 'Farkında değil', answer_2: 'Belirsiz', answer_3: 'Kısmen biliyor', answer_4: 'İyi biliyor', answer_5: 'Çok iyi analiz' },
      { id: 'q3', text: 'Önümüzdeki 12 ayda en riskli karar hangisi?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q4', text: 'Kurum sizden hangi liderliği bekliyor?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
    ]
  },
  {
    id: 'cat2', name: 'KARAR ALMA', icon: '⚖️', color: '#9f7aea',
    questions: [
      { id: 'q5', text: 'Son aldığınız zor karar hangisiydi?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q6', text: 'Hangi kararları erteliyorsunuz?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q7', text: 'Risk alırken sizi durduran ne?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q8', text: 'Karar öncesi kimle konuşmazsınız?', weight: 2, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
    ]
  },
  {
    id: 'cat3', name: 'EKİP LİDERLİĞİ', icon: '👥', color: '#48bb78',
    questions: [
      { id: 'q9', text: 'Ekibiniz sizden neyi çekiniyor?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q10', text: 'En güvendiğiniz yönetici kim?', weight: 2, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q11', text: 'Kimi gereğinden fazla koruyorsunuz?', weight: 2, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q12', text: 'Ekibiniz sizi nasıl hatırlayacak?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
    ]
  },
  {
    id: 'cat4', name: 'DEĞERLER', icon: '⭐', color: '#ed8936',
    questions: [
      { id: 'q13', text: 'Hangi değerden taviz verdiniz?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q14', text: 'Sizi tanımlayan karar hangisi?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q15', text: 'Ayrıldığınızda ne kalmasını istersiniz?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
      { id: 'q16', text: 'Bu rol sizi daha iyi mi yaptı?', weight: 3, mentorNote: '', answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: '' },
    ]
  }
]

export default function Home() {
  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  // App State
  const [tab, setTab] = useState('dashboard')
  const [categories, setCategories] = useState(defaultCategories)
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [selectedCatId, setSelectedCatId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', title: '', company: '' })
  
  // Question Bank
  const [editingCat, setEditingCat] = useState(null)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📁')
  const [newCatColor, setNewCatColor] = useState('#6b7fd4')
  
  // AI & Audio
  const [audioFile, setAudioFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [transcript, setTranscript] = useState('')
  const fileInputRef = useRef(null)
  
  // Encryption
  const [secretKey, setSecretKey] = useState('')
  const [tempKey, setTempKey] = useState('')
  const [isEncrypted, setIsEncrypted] = useState(false)

  // Load data
  useEffect(() => {
    const savedUser = localStorage.getItem('mentorCurrentUser')
    const savedPassword = localStorage.getItem('mentorAdminPassword')
    if (savedUser) { setCurrentUser(JSON.parse(savedUser)); setIsLoggedIn(true) }
    if (!savedPassword) setIsFirstLogin(true)
    
    const savedKey = localStorage.getItem('mentorSecretKey')
    if (savedKey) { setSecretKey(savedKey); setIsEncrypted(true) }
    
    const saved = localStorage.getItem('mentorData')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.categories) setCategories(data.categories)
      if (data.sessions) {
        if (savedKey) {
          const decryptedSessions = data.sessions.map(s => ({
            ...s,
            name: decrypt(s.name, savedKey),
            title: decrypt(s.title, savedKey),
            company: decrypt(s.company, savedKey)
          }))
          setSessions(decryptedSessions)
        } else {
          setSessions(data.sessions)
        }
      }
    }
  }, [])

  // Save data
  useEffect(() => {
    if (sessions.length > 0 || categories !== defaultCategories) {
      const encryptedSessions = secretKey ? sessions.map(s => ({
        ...s,
        name: encrypt(s.name, secretKey),
        title: encrypt(s.title, secretKey),
        company: encrypt(s.company, secretKey)
      })) : sessions
      localStorage.setItem('mentorData', JSON.stringify({ categories, sessions: encryptedSessions }))
    }
  }, [categories, sessions, secretKey])

  // Auth functions
  const handleSetPassword = () => {
    if (!newPassword || newPassword.length < 6) { setLoginError('Şifre en az 6 karakter olmalı!'); return }
    if (newPassword !== confirmPassword) { setLoginError('Şifreler eşleşmiyor!'); return }
    const encryptedPass = encrypt(newPassword, 'mentor_salt_2024')
    localStorage.setItem('mentorAdminPassword', encryptedPass)
    setIsFirstLogin(false)
    setLoginError('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleLogin = () => {
    setLoginError('')
    if (loginEmail !== SUPER_ADMIN.email) { setLoginError('Geçersiz email adresi!'); return }
    const savedPassword = localStorage.getItem('mentorAdminPassword')
    if (!savedPassword) { setLoginError('Önce şifre belirlemeniz gerekiyor!'); setIsFirstLogin(true); return }
    const decryptedPass = decrypt(savedPassword, 'mentor_salt_2024')
    if (loginPassword !== decryptedPass) { setLoginError('Şifre hatalı!'); return }
    const user = { email: SUPER_ADMIN.email, role: SUPER_ADMIN.role, loginTime: new Date().toISOString() }
    localStorage.setItem('mentorCurrentUser', JSON.stringify(user))
    setCurrentUser(user)
    setIsLoggedIn(true)
    setLoginEmail('')
    setLoginPassword('')
  }

  const handleLogout = () => {
    localStorage.removeItem('mentorCurrentUser')
    setCurrentUser(null)
    setIsLoggedIn(false)
  }

  // Encryption functions
  const saveSecretKey = () => {
    if (!tempKey || tempKey.length < 8) { alert('Anahtar en az 8 karakter olmalı!'); return }
    localStorage.setItem('mentorSecretKey', tempKey)
    setSecretKey(tempKey)
    setIsEncrypted(true)
    setTempKey('')
    alert('🔐 Şifreleme anahtarı kaydedildi!')
  }

  const createRandomKey = () => setTempKey(generateSecretKey())

  const exportEncryptedBackup = () => {
    if (!secretKey) { alert('Önce şifreleme anahtarı ayarlayın!'); return }
    const encrypted = encryptBackup({ categories, sessions, exportDate: new Date().toISOString() }, secretKey)
    if (encrypted) {
      const blob = new Blob([encrypted], { type: 'text/plain' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = `mentor-backup-${new Date().toISOString().split('T')[0]}.enc`; a.click()
    }
  }

  const importEncryptedBackup = (e) => {
    const file = e.target.files?.[0]; if (!file || !secretKey) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const decrypted = decryptBackup(ev.target.result, secretKey)
      if (decrypted) {
        if (decrypted.categories) setCategories(decrypted.categories)
        if (decrypted.sessions) setSessions(decrypted.sessions)
        alert('✅ Yedek yüklendi!')
      } else alert('❌ Çözülemedi!')
    }
    reader.readAsText(file)
  }

  // Category functions
  const addCategory = () => {
    if (!newCatName) { alert('Kategori adı girin!'); return }
    const newCat = {
      id: 'cat_' + Date.now(),
      name: newCatName.toUpperCase(),
      icon: newCatIcon,
      color: newCatColor,
      questions: []
    }
    setCategories([...categories, newCat])
    setNewCatName(''); setNewCatIcon('📁'); setNewCatColor('#6b7fd4')
  }

  const updateCategory = (catId, field, value) => {
    setCategories(categories.map(c => c.id === catId ? { ...c, [field]: value } : c))
  }

  const deleteCategory = (catId) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    setCategories(categories.filter(c => c.id !== catId))
  }

  // Question functions
  const addQuestion = (catId) => {
    const newQ = {
      id: 'q_' + Date.now(),
      text: 'Yeni soru...',
      weight: 2,
      mentorNote: '',
      answer_1: '', answer_2: '', answer_3: '', answer_4: '', answer_5: ''
    }
    setCategories(categories.map(c => c.id === catId ? { ...c, questions: [...c.questions, newQ] } : c))
    setEditingQuestion(newQ.id)
  }

  const updateQuestion = (catId, qId, field, value) => {
    setCategories(categories.map(c => c.id === catId ? {
      ...c,
      questions: c.questions.map(q => q.id === qId ? { ...q, [field]: value } : q)
    } : c))
  }

  const deleteQuestion = (catId, qId) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return
    setCategories(categories.map(c => c.id === catId ? {
      ...c, questions: c.questions.filter(q => q.id !== qId)
    } : c))
  }

  // Session functions
  const calcStats = (session) => {
    if (!session) return null
    let earned = 0, max = 0, answered = 0
    const catStats = []
    session.categories.forEach(cat => {
      let catE = 0, catM = 0, catA = 0
      cat.questions.forEach(q => {
        catM += q.weight || 0
        if (q.answer) { catE += (q.answer / 5) * (q.weight || 0); catA++ }
      })
      earned += catE; max += catM; answered += catA
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
      id: Date.now(), ...formData,
      categories: JSON.parse(JSON.stringify(categories)),
      createdAt: new Date().toISOString()
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

  const deleteSession = (id) => {
    if (!confirm('Bu oturumu silmek istediğinize emin misiniz?')) return
    setSessions(sessions.filter(s => s.id !== id))
    if (currentSession?.id === id) setCurrentSession(null)
  }

  // AI Audio Analysis
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 25 * 1024 * 1024) { alert('Dosya 25MB\'dan küçük olmalı!'); return }
      setAudioFile(file)
      setAiResult(null)
      setTranscript('')
    }
  }

  const analyzeAudio = async () => {
    if (!audioFile || !currentSession) { alert('Ses dosyası ve oturum gerekli!'); return }
    
    setIsAnalyzing(true)
    setAiResult(null)
    setTranscript('')
    
    try {
      const allQuestions = currentSession.categories.flatMap(cat => 
        cat.questions.map(q => ({
          id: q.id,
          text: q.text,
          answer_1: q.answer_1 || SCORE_LABELS[1],
          answer_2: q.answer_2 || SCORE_LABELS[2],
          answer_3: q.answer_3 || SCORE_LABELS[3],
          answer_4: q.answer_4 || SCORE_LABELS[4],
          answer_5: q.answer_5 || SCORE_LABELS[5]
        }))
      )
      
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('questions', JSON.stringify(allQuestions))
      
      const response = await fetch('/api/ai-evaluate', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Analiz hatası')
      
      setTranscript(data.transcript)
      setAiResult(data.analysis)
      
      // Otomatik puanlama uygula
      if (data.analysis?.scores) {
        let updatedSession = { ...currentSession }
        data.analysis.scores.forEach(s => {
          updatedSession.categories = updatedSession.categories.map(cat => ({
            ...cat,
            questions: cat.questions.map(q => 
              q.id === s.question_id ? { ...q, answer: s.score, aiReason: s.reason } : q
            )
          }))
        })
        setCurrentSession(updatedSession)
        setSessions(sessions.map(sess => sess.id === updatedSession.id ? updatedSession : sess))
      }
      
    } catch (error) {
      alert('Hata: ' + error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const selectedCat = currentSession?.categories.find(c => c.id === selectedCatId)

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #c9a962, #b8960f)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 16px' }}>👔</div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' }}>Executive Mentor</h1>
            <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>Liderlik Koçluk Platformu</p>
          </div>

          {isFirstLogin ? (
            <div>
              <div style={{ background: '#fef9e7', border: '1px solid #c9a962', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>🔐 İlk Kurulum</div>
                <div style={{ fontSize: '13px', color: '#a16207' }}>Süper Admin şifrenizi belirleyin</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '6px' }}>Yeni Şifre</label>
                <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="En az 6 karakter" style={{ padding: '14px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '6px' }}>Şifre Tekrar</label>
                <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Şifreyi tekrar girin" style={{ padding: '14px' }} />
              </div>
              {loginError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>⚠️ {loginError}</div>}
              <button onClick={handleSetPassword} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #c9a962, #b8960f)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>Şifreyi Kaydet</button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '6px' }}>Email</label>
                <input type="email" className="input" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@example.com" style={{ padding: '14px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '6px' }}>Şifre</label>
                <input type="password" className="input" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" style={{ padding: '14px' }} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              {loginError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>⚠️ {loginError}</div>}
              <button onClick={handleLogin} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>Giriş Yap</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // MAIN APP
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: 'linear-gradient(135deg, #4a5568, #2d3748)', color: 'white', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #c9a962, #b8960f)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👔</div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Executive Mentor</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{currentUser?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isEncrypted && <span title="Şifreleme Aktif">🔐</span>}
            <button onClick={handleLogout} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Çıkış</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        
        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div className="card">
              <h3 style={{ marginBottom: '12px', color: '#c9a962' }}>🆕 Yeni Oturum</h3>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowModal(true)}>+ YENİ OTURUM BAŞLAT</button>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '12px', color: '#c9a962' }}>📁 Oturumlar ({sessions.length})</h3>
              {sessions.length === 0 ? <p style={{ color: '#718096' }}>Henüz oturum yok</p> : sessions.slice().reverse().map(s => {
                const st = calcStats(s)
                return (
                  <div key={s.id} style={{ padding: '12px', background: currentSession?.id === s.id ? '#f0f4ff' : '#f8fafc', borderRadius: '8px', marginBottom: '8px', border: currentSession?.id === s.id ? '2px solid #6b7fd4' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }} onClick={() => { setCurrentSession(s); setSelectedCatId(s.categories[0]?.id); setTab('evaluation') }}>
                      <div style={{ cursor: 'pointer' }}>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>{s.title} - {s.company}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: st?.profile.color }}>{st?.pct.toFixed(0)}%</div>
                        <div style={{ fontSize: '10px', color: '#718096' }}>{st?.profile.type}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setCurrentSession(s); setSelectedCatId(s.categories[0]?.id); setTab('evaluation') }} style={{ flex: 1, padding: '6px', fontSize: '12px', background: '#6b7fd4', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>▶ Aç</button>
                      <button onClick={() => deleteSession(s.id)} style={{ padding: '6px 12px', fontSize: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* EVALUATION */}
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

            {/* AI Audio Upload */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #667eea15, #764ba215)', border: '2px dashed #667eea' }}>
              <h3 style={{ color: '#667eea', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎙️ AI Ses Analizi</h3>
              <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>Görüşme kaydını yükleyin, AI otomatik değerlendirsin</p>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.webm" onChange={handleAudioUpload} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 16px', background: 'white', border: '1px solid #667eea', borderRadius: '8px', color: '#667eea', cursor: 'pointer', fontWeight: '500' }}>
                  📁 Ses Dosyası Seç
                </button>
                {audioFile && (
                  <>
                    <span style={{ padding: '10px', background: '#e0e7ff', borderRadius: '8px', fontSize: '13px' }}>🎵 {audioFile.name}</span>
                    <button onClick={analyzeAudio} disabled={isAnalyzing} style={{ padding: '10px 20px', background: isAnalyzing ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: isAnalyzing ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                      {isAnalyzing ? '⏳ Analiz Ediliyor...' : '🤖 AI ile Değerlendir'}
                    </button>
                  </>
                )}
              </div>

              {transcript && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: '600', color: '#667eea', marginBottom: '8px' }}>📝 Görüşme Metni:</div>
                  <p style={{ fontSize: '13px', color: '#4a5568', maxHeight: '150px', overflow: 'auto' }}>{transcript}</p>
                </div>
              )}

              {aiResult?.summary && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#d1fae5', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '600', color: '#059669', marginBottom: '4px' }}>✅ AI Değerlendirmesi:</div>
                  <p style={{ fontSize: '13px', color: '#065f46' }}>{aiResult.summary}</p>
                </div>
              )}
            </div>

            {/* Categories */}
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

            {/* Questions */}
            {selectedCat && (
              <div className="card">
                <h3 style={{ color: selectedCat.color, marginBottom: '16px' }}>{selectedCat.icon} {selectedCat.name}</h3>
                {selectedCat.questions.map((q, idx) => (
                  <div key={q.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '12px', borderLeft: q.answer ? `4px solid ${SCORE_COLORS[q.answer]}` : '4px solid transparent' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ width: '26px', height: '26px', background: selectedCat.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>{q.text}</p>
                        <span style={{ fontSize: '11px', color: '#c9a962' }}>Kırılım: {q.weight}</span>
                      </div>
                    </div>
                    {q.aiReason && (
                      <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '6px', marginBottom: '10px', fontSize: '12px', color: '#4338ca' }}>
                        🤖 AI: {q.aiReason}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {[1,2,3,4,5].map(score => (
                        <button key={score} onClick={() => setAnswer(selectedCat.id, q.id, score)} style={{ padding: '10px 4px', borderRadius: '8px', border: `2px solid ${SCORE_COLORS[score]}`, background: q.answer === score ? SCORE_COLORS[score] : 'white', color: q.answer === score ? 'white' : SCORE_COLORS[score], cursor: 'pointer', fontWeight: '700' }}>
                          <div style={{ fontSize: '16px' }}>{score}</div>
                          <div style={{ fontSize: '7px' }}>{q[`answer_${score}`] || SCORE_LABELS[score]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUESTION BANK */}
        {tab === 'questions' && (
          <div>
            <div className="card">
              <h3 style={{ color: '#c9a962', marginBottom: '16px' }}>➕ Yeni Kategori Ekle</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input className="input" placeholder="Kategori Adı" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ flex: 1, minWidth: '150px' }} />
                <input className="input" placeholder="🎯" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} style={{ width: '60px', textAlign: 'center' }} />
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} style={{ width: '50px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                <button onClick={addCategory} className="btn btn-primary">+ Ekle</button>
              </div>
            </div>

            {categories.map(cat => (
              <div key={cat.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${cat.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontWeight: '700', color: cat.color }}>{cat.name}</div>
                      <div style={{ fontSize: '11px', color: '#718096' }}>{cat.questions.length} soru | Toplam: {cat.questions.reduce((s,q) => s + (q.weight||0), 0)} puan</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => addQuestion(cat.id)} style={{ padding: '6px 12px', background: cat.color, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>+ Soru</button>
                    <button onClick={() => deleteCategory(cat.id)} style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>

                {cat.questions.map((q, idx) => (
                  <div key={q.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ width: '26px', height: '26px', background: cat.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        {editingQuestion === q.id ? (
                          <div>
                            <textarea className="input" value={q.text} onChange={e => updateQuestion(cat.id, q.id, 'text', e.target.value)} style={{ marginBottom: '8px', minHeight: '60px' }} />
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input className="input" type="number" value={q.weight} onChange={e => updateQuestion(cat.id, q.id, 'weight', parseFloat(e.target.value) || 0)} style={{ width: '80px' }} placeholder="Kırılım" />
                              <input className="input" value={q.mentorNote} onChange={e => updateQuestion(cat.id, q.id, 'mentorNote', e.target.value)} placeholder="Mentor notu..." style={{ flex: 1 }} />
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#718096', marginBottom: '6px' }}>Cevap Açıklamaları (1-5):</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                              {[1,2,3,4,5].map(n => (
                                <input key={n} className="input" value={q[`answer_${n}`] || ''} onChange={e => updateQuestion(cat.id, q.id, `answer_${n}`, e.target.value)} placeholder={SCORE_LABELS[n]} style={{ fontSize: '10px', padding: '6px', textAlign: 'center' }} />
                              ))}
                            </div>
                            <button onClick={() => setEditingQuestion(null)} style={{ marginTop: '10px', padding: '6px 16px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓ Kaydet</button>
                          </div>
                        ) : (
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: '14px' }}>{q.text}</p>
                            <span style={{ fontSize: '11px', color: '#c9a962' }}>Kırılım: {q.weight}</span>
                            {q.mentorNote && <span style={{ fontSize: '11px', color: '#718096', marginLeft: '10px' }}>📌 {q.mentorNote}</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setEditingQuestion(editingQuestion === q.id ? null : q.id)} style={{ padding: '4px 8px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => deleteQuestion(cat.id, q.id)} style={{ padding: '4px 8px', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ANALYSIS */}
        {tab === 'analysis' && (
          <div>
            {!currentSession ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '50px', marginBottom: '16px' }}>📊</div>
                <h3>Analiz için oturum seçin</h3>
              </div>
            ) : stats && (
              <>
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
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                      <span>{cat.icon} {cat.name}</span>
                      <span style={{ fontWeight: '600', color: cat.color }}>{cat.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div>
            <div className="card">
              <h3 style={{ color: '#c9a962', marginBottom: '16px' }}>🔐 Şifreleme</h3>
              {!isEncrypted ? (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input" type="password" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="Şifreleme anahtarı (min 8 kar.)" style={{ flex: 1 }} />
                    <button onClick={createRandomKey} className="btn btn-secondary">🎲</button>
                  </div>
                  {tempKey && <div style={{ marginTop: '8px', padding: '8px', background: '#fef9e7', borderRadius: '6px', fontSize: '11px' }}>Anahtar: {tempKey}</div>}
                  <button onClick={saveSecretKey} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>🔐 Aktifleştir</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: '8px' }}>✅ Şifreleme Aktif</div>
              )}
            </div>
            <div className="card">
              <h3 style={{ color: '#c9a962', marginBottom: '16px' }}>💾 Yedekleme</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportEncryptedBackup} className="btn btn-primary" disabled={!isEncrypted}>📤 Yedek İndir</button>
                <label className="btn btn-secondary" style={{ cursor: isEncrypted ? 'pointer' : 'not-allowed' }}>
                  📥 Yedek Yükle
                  <input type="file" accept=".enc" style={{ display: 'none' }} onChange={importEncryptedBackup} disabled={!isEncrypted} />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', padding: '8px 10px 24px', zIndex: 100 }}>
        {[
          { id: 'dashboard', icon: '📊', label: 'Panel' },
          { id: 'evaluation', icon: '📝', label: 'Değerlendir' },
          { id: 'questions', icon: '❓', label: 'Sorular' },
          { id: 'analysis', icon: '📈', label: 'Analiz' },
          { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 12px', background: tab === t.id ? '#f0f4ff' : 'transparent', border: 'none', borderRadius: '10px', color: tab === t.id ? '#6b7fd4' : '#718096', cursor: 'pointer' }}>
            <span style={{ fontSize: '20px' }}>{t.icon}</span>
            <span style={{ fontSize: '10px' }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* New Session Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '20px' }}>🆕 Yeni Oturum</h2>
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
