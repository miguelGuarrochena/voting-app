'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ------------------------------------------------------------
//  /auth/signup → redirect to /auth/login
//
//  Pickly v1 only supports Google OAuth. Google handles account creation
//  on its side, so there's no need for a separate signup page. We keep this
//  route just in case someone has a bookmark or an old link pointing to it.
// ------------------------------------------------------------

export default function SignupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return null;
}
