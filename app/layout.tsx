import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import TopLoaderWrapper from '@/components/top-loader-wrapper' // Import here

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Answer Key & Rank Predictor | RankMatters',
  description:
    'Check your answer keys and ranks for SSC, Banking, RRB, State Exams. Accurate normalization and category ranks.',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  alternates: {
    canonical: 'https://rankmatters.in/',
  },

  openGraph: {
    title: 'RankMatters | SSC Rank Predictor & Answer Keys',
    description:
      'Free SSC, Banking, RRB Rank Predictor and Answer Key Analysis.',
    url: 'https://rankmatters.in',
    siteName: 'RankMatters',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'RankMatters | SSC Rank Predictor',
    description:
      'Free SSC, Banking, RRB Rank Predictor and Answer Key Analysis.',
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {/* Add the wrapper here at the top of the body */}
          <TopLoaderWrapper />
          
          {children}
          
          <Toaster position="bottom-right" reverseOrder={false} />
        </body>
      </html>
    </ClerkProvider>
  )
}