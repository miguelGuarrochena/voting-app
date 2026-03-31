'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys will be defined here for now, but we'll move them to separate files
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.trending': 'Trending',
    'nav.spin': 'Spin Wheel',
    'nav.create': 'Create',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.login': 'Login',
    'nav.signup': 'Sign up',
    'nav.createPoll': 'Create Poll',
    'nav.getStarted': 'Get Started',
    'nav.logout': 'Log Out',
    
    // Home page
    'home.hero.title': 'What does',
    'home.hero.titleHighlight': 'everyone',
    'home.hero.titleEnd': 'think?',
    'home.hero.subtitle': 'Vote on anything. Share it instantly. See results in real time.',
    'home.createPoll': 'Create a poll →',
    'home.browsePolls': 'Browse polls',
    'home.liveNow': 'Live now',
    'home.noActivePolls': 'No active polls at the moment.',
    'home.searchPlaceholder': 'Search polls...',
    'home.trending': 'Trending',
    'home.recent': 'Recent',
    'home.expiringSoon': 'Expiring Soon',
    'home.searchResults': 'Search Results',
    'home.whatsHappening': 'What\'s happening',
    'home.loading': 'Loading...',
    'home.failedToLoad': 'Failed to load polls',
    'home.tryAgain': 'Try Again',
    'home.refreshPage': 'Refresh Page',
    
    // Footer
    'footer.copyright': '© 2024 Polls. Create and share opinions.',
    
    // Theme/Language
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'lang.en': 'English',
    'lang.es': 'Español',
    
    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.profileDesc': 'Manage your profile information',
    'settings.notifications': 'Notifications',
    'settings.notificationsDesc': 'Control your notification preferences',
    'settings.privacy': 'Privacy',
    'settings.privacyDesc': 'Manage your privacy settings',
    'settings.appearance': 'Appearance',
    'settings.appearanceDesc': 'Customize the app appearance',
    'settings.language': 'Language',
    'settings.languageDesc': 'Choose your preferred language',
    'settings.logout': 'Log Out',
    'settings.displayName': 'Display Name',
    'settings.displayNamePlaceholder': 'Enter your display name',
    'settings.bio': 'Bio',
    'settings.bioPlaceholder': 'Tell us about yourself',
    'settings.emailNotifications': 'Email Notifications',
    'settings.emailNotificationsDesc': 'Receive notifications via email',
    'settings.pushNotifications': 'Push Notifications',
    'settings.pushNotificationsDesc': 'Receive push notifications on your device',
    'settings.pollReminders': 'Poll Reminders',
    'settings.pollRemindersDesc': 'Get reminded about polls you participated in',
    'settings.privateProfile': 'Private Profile',
    'settings.privateProfileDesc': 'Only followers can see your activity',
    'settings.showActivity': 'Show Activity Status',
    'settings.showActivityDesc': 'Let others see when you\'re active',
    'settings.theme': 'Theme',
    'settings.displayLanguage': 'Display Language',
    'settings.saveChanges': 'Save Changes',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.explore': 'Explorar',
    'nav.trending': 'Tendencias',
    'nav.spin': 'Girar Ruleta',
    'nav.create': 'Crear',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configuración',
    'nav.login': 'Iniciar Sesión',
    'nav.signup': 'Registrarse',
    'nav.createPoll': 'Crear Encuesta',
    'nav.getStarted': 'Comenzar',
    'nav.logout': 'Cerrar Sesión',
    
    // Home page
    'home.hero.title': '¿Qué opinas',
    'home.hero.titleHighlight': 'tú',
    'home.hero.titleEnd': '?',
    'home.hero.subtitle': 'Vota sobre cualquier cosa. Comparte instantáneamente. Ve los resultados en tiempo real.',
    'home.createPoll': 'Crear encuesta →',
    'home.browsePolls': 'Explorar encuestas',
    'home.liveNow': 'En vivo',
    'home.noActivePolls': 'No hay encuestas activas en este momento.',
    'home.searchPlaceholder': 'Buscar encuestas...',
    'home.trending': 'Tendencias',
    'home.recent': 'Recientes',
    'home.expiringSoon': 'Terminan Pronto',
    'home.searchResults': 'Resultados de Búsqueda',
    'home.whatsHappening': 'Qué está pasando',
    'home.loading': 'Cargando...',
    'home.failedToLoad': 'Error al cargar encuestas',
    'home.tryAgain': 'Intentar de Nuevo',
    'home.refreshPage': 'Actualizar Página',
    
    // Footer
    'footer.copyright': '© 2024 Polls. Crea y comparte opiniones.',
    
    // Theme/Language
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'lang.en': 'English',
    'lang.es': 'Español',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.profile': 'Perfil',
    'settings.profileDesc': 'Gestionar tu información de perfil',
    'settings.notifications': 'Notificaciones',
    'settings.notificationsDesc': 'Controlar tus preferencias de notificación',
    'settings.privacy': 'Privacidad',
    'settings.privacyDesc': 'Gestionar tu configuración de privacidad',
    'settings.appearance': 'Apariencia',
    'settings.appearanceDesc': 'Personalizar la apariencia de la aplicación',
    'settings.language': 'Idioma',
    'settings.languageDesc': 'Elegir tu idioma preferido',
    'settings.logout': 'Cerrar Sesión',
    'settings.displayName': 'Nombre para Mostrar',
    'settings.displayNamePlaceholder': 'Ingresa tu nombre para mostrar',
    'settings.bio': 'Biografía',
    'settings.bioPlaceholder': 'Cuéntanos sobre ti',
    'settings.emailNotifications': 'Notificaciones por Email',
    'settings.emailNotificationsDesc': 'Recibir notificaciones por email',
    'settings.pushNotifications': 'Notificaciones Push',
    'settings.pushNotificationsDesc': 'Recibir notificaciones push en tu dispositivo',
    'settings.pollReminders': 'Recordatorios de Encuestas',
    'settings.pollRemindersDesc': 'Recibir recordatorios sobre encuestas en las que participaste',
    'settings.privateProfile': 'Perfil Privado',
    'settings.privateProfileDesc': 'Solo seguidores pueden ver tu actividad',
    'settings.showActivity': 'Mostrar Estado de Actividad',
    'settings.showActivityDesc': 'Permitir que otros vean cuándo estás activo',
    'settings.theme': 'Tema',
    'settings.displayLanguage': 'Idioma de Visualización',
    'settings.saveChanges': 'Guardar Cambios',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Check for saved language preference or default to English
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguageState(savedLanguage);
    } else {
      // Check browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) {
        setLanguageState('es');
      } else {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    document.documentElement.setAttribute('lang', newLanguage);
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'es' : 'en';
    setLanguage(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
