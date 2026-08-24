import type { Metadata } from 'next'
import { DeskSignOut } from '@/components/admin/desk-sign-out'

/* robots.txt already disallows crawling /admin, but disallow alone cannot
   prevent indexing of a URL discovered through links — noindex can. */
export const metadata: Metadata = {
  title: 'The Posting Desk',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DeskSignOut />
      {children}
    </>
  )
}
