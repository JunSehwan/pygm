import { GoogleTagManager } from '@next/third-parties/google'
import { GoogleAnalytics } from '@next/third-parties/google'

export const GOOGLE_TAG = process.env.NEXT_PUBLIC_GOOGLE_TAG;
export const GOOGLE_ANAL = process.env.NEXT_PUBLIC_GOOGLE_ANAL;
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <GoogleTagManager gtmId={GOOGLE_TAG} />
      <GoogleAnalytics gaId={GOOGLE_ANAL} />
      <body>{children}</body>
    </html>
  )
}