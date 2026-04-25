'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ------------------------------------------------------------
//  /auth/signup → redirect a /auth/login
//
//  Pickly v1 solo soporta Google OAuth. Google maneja la creación de
//  cuenta por su lado, así que no hace falta una página de signup
//  separada. Mantenemos esta ruta solo por si alguien tiene un bookmark
//  o un link viejo que la apunte.
// ------------------------------------------------------------

export default function SignupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return null;
}
