import './globals.css'

export const metadata = {
  title: 'Executive Mentor & Coaching Platform',
  description: 'Profesyonel liderlik koçluğu ve yönetici değerlendirme sistemi',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
