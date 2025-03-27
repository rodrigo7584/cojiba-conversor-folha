import './global.css'

export const metadata = {
  title: 'Conversor',
  description: 'Conversor'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
