import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio')
    const questionsData = formData.get('questions')
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Ses dosyası gerekli' }, { status: 400 })
    }

    const questions = JSON.parse(questionsData || '[]')

    // 1. Whisper ile ses → metin
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile)
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'tr')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: whisperFormData
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.json()
      return NextResponse.json({ error: 'Ses çözümleme hatası: ' + (error.error?.message || 'Bilinmeyen') }, { status: 500 })
    }

    const whisperData = await whisperResponse.json()
    const transcript = whisperData.text

    // 2. GPT-4 ile analiz ve puanlama
    const questionsPrompt = questions.map((q, i) => {
      const answers = []
      if (q.answer_1) answers.push(`1: ${q.answer_1}`)
      if (q.answer_2) answers.push(`2: ${q.answer_2}`)
      if (q.answer_3) answers.push(`3: ${q.answer_3}`)
      if (q.answer_4) answers.push(`4: ${q.answer_4}`)
      if (q.answer_5) answers.push(`5: ${q.answer_5}`)
      
      return `
SORU ${i + 1}: ${q.text}
Cevap Seçenekleri:
${answers.join('\n')}
`
    }).join('\n---\n')

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Sen bir yönetici koçluk uzmanısın. Bir koçluk görüşmesinin ses kaydı metne dönüştürüldü. 
            
Görevin:
1. Metni analiz et
2. Her soru için danışanın verdiği cevaba en uygun puan seçeneğini belirle (1-5 arası)
3. Her soru için kısa bir gerekçe yaz

SADECE JSON formatında yanıt ver, başka bir şey yazma:
{
  "scores": [
    {"question_id": "q1", "score": 4, "reason": "Danışan stratejik düşünme becerisi gösterdi..."},
    {"question_id": "q2", "score": 3, "reason": "..."}
  ],
  "summary": "Genel değerlendirme özeti..."
}`
          },
          {
            role: 'user',
            content: `GÖRÜŞME METNİ:
${transcript}

---

DEĞERLENDİRİLECEK SORULAR:
${questionsPrompt}

Lütfen her soru için 1-5 arası puan ver ve gerekçesini açıkla.`
          }
        ],
        temperature: 0.3
      })
    })

    if (!gptResponse.ok) {
      const error = await gptResponse.json()
      return NextResponse.json({ error: 'AI analiz hatası: ' + (error.error?.message || 'Bilinmeyen') }, { status: 500 })
    }

    const gptData = await gptResponse.json()
    const aiContent = gptData.choices[0]?.message?.content || ''

    // JSON parse et
    let result
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { scores: [], summary: '' }
    } catch (e) {
      result = { scores: [], summary: aiContent }
    }

    return NextResponse.json({
      success: true,
      transcript,
      analysis: result
    })

  } catch (error) {
    console.error('AI Evaluate Error:', error)
    return NextResponse.json({ error: 'Sunucu hatası: ' + error.message }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}
