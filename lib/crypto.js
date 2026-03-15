import CryptoJS from 'crypto-js'

// Şifreleme fonksiyonu
export function encrypt(text, secretKey) {
  if (!text || !secretKey) return text
  try {
    return CryptoJS.AES.encrypt(text, secretKey).toString()
  } catch (error) {
    console.error('Şifreleme hatası:', error)
    return text
  }
}

// Çözme fonksiyonu
export function decrypt(encryptedText, secretKey) {
  if (!encryptedText || !secretKey) return encryptedText
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted || encryptedText
  } catch (error) {
    console.error('Çözme hatası:', error)
    return encryptedText
  }
}

// Obje içindeki belirli alanları şifrele
export function encryptFields(obj, fields, secretKey) {
  if (!obj || !secretKey) return obj
  const encrypted = { ...obj }
  fields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field], secretKey)
    }
  })
  return encrypted
}

// Obje içindeki belirli alanları çöz
export function decryptFields(obj, fields, secretKey) {
  if (!obj || !secretKey) return obj
  const decrypted = { ...obj }
  fields.forEach(field => {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field], secretKey)
    }
  })
  return decrypted
}

// Yedekleme için tüm veriyi şifrele
export function encryptBackup(data, secretKey) {
  if (!data || !secretKey) return null
  try {
    const jsonString = JSON.stringify(data)
    return CryptoJS.AES.encrypt(jsonString, secretKey).toString()
  } catch (error) {
    console.error('Yedek şifreleme hatası:', error)
    return null
  }
}

// Şifreli yedeği çöz
export function decryptBackup(encryptedData, secretKey) {
  if (!encryptedData || !secretKey) return null
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey)
    const jsonString = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Yedek çözme hatası:', error)
    return null
  }
}

// Rastgele güçlü anahtar oluştur
export function generateSecretKey() {
  return CryptoJS.lib.WordArray.random(32).toString()
}
