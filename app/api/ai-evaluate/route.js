import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio')
    const questionsData = formData.get('questions')
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Ses dosyasi gerekli' }, { status: 400 })
    }

    const questions = JSON.parse(questionsData || '[]')

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    const whisperFormData = new FormData()
    whisperFormData.append('file', new Blob([audioBuffer]), audioFile.name)
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'tr')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
      body: whisperFormData
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.json()
      return NextResponse.json({ error: 'Ses cozumleme hatasi: ' + (error.error?.message || 'Bilinmeyen') }, { status: 500 })
    }

    const whisperData = await whisperResponse.json()
    const transcript = whisperData.text

    const questionsText = questions.map((q, i) => 'Soru ' + (i+1) + ' (ID: ' + q.id + '): ' + q.text).join('\n')

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sen bir yonetici kocluk uzmanisin. Gorusme metnini analiz et ve her soru icin 1-5 arasi puan ver. SADECE JSON formatinda yanit ver: {"scores": [{"question_id": "q1", "score": 4, "reason": "..."}], "summary": "..."}'
          },
          {
            role: 'user',
            content: 'GORUSME METNI:\n' + transcript + '\n\nSORULAR:\n' + questionsText
          }
        ],
        temperature: 0.3
      })
    })

    if (!gptResponse.ok) {
      const error = await gptResponse.json()
      return NextResponse.json({ error: 'AI analiz hatasi: ' + (error.error?.message || 'Bilinmeyen') }, { status: 500 })
    }

    const gptData = await gptResponse.json()
    const aiContent = gptData.choices[0]?.message?.content || ''

    let result
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { scores: [], summary: '' }
    } catch (e) {
      result = { scores: [], summary: aiContent }
    }

    return NextResponse.json({ success: true, transcript: transcript, analysis: result })

  } catch (error) {
    console.error('AI Evaluate Error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi: ' + error.message }, { status: 500 })
  }
}
