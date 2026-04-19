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
    'nav.backToFeed': 'Back to Feed',
    
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
    
    // Spin Wheel
    'spin.title': 'Spin the',
    'spin.titleHighlight': 'Wheel',
    'spin.subtitle': 'Can\'t decide? Let fate choose! Add your options and give the wheel a spin.',
    'spin.spin': 'SPIN',
    'spin.spinning': '...',
    'spin.currentOptions': 'Current Options',
    'spin.quickTemplates': 'Quick Templates',
    'spin.optionPlaceholder': 'Option',
    'spin.addOption': 'Add',
    'spin.add': 'Add',
    'spin.addToWheel': 'Add to Wheel',
    'spin.yesOrNo': 'Yes or No',
    'spin.foodChoice': 'Food Choice',
    'spin.activities': 'Activities',
    'spin.numbers': 'Numbers 1-6',
    'spin.theWheelHasSpoken': 'The wheel has spoken!',
    'spin.spinAgain': 'Spin Again',
    'spin.enterAtLeastTwoOptions': 'Enter at least 2 options to start spinning!',
    'spin.minimumTwoOptions': 'Minimum 2 options required',
    'spin.maximumTwelveOptions': 'Maximum 12 options allowed',
    'spin.pleaseEnterAnOption': 'Please enter an option',
    'spin.optionTextCannotBeEmpty': 'Option text cannot be empty',
    'spin.addAtLeastTwoOptionsToSpin': 'Add at least 2 options to spin',
    'spin.optionsCount': 'options (minimum 2 required to spin)',
    'spin.enterAnOption': 'Enter an option...',
    'spin.addOptionAfterThis': 'Add option after this',
    'spin.removeOption': 'Remove option',
    'spin.configureOptions': 'Configure Options',
    'spin.spinWheel': 'Spin Wheel',
    'spin.continueToWheel': 'Continue to Wheel',
    'spin.editOptions': 'Edit Options',

    // Polls & Rankings
    'poll.yourRankingSubmitted': 'Your ranking has been submitted and cannot be changed',
    'poll.pollsInvitedTo': 'Polls I\'m invited to',
    'poll.myPrivatePolls': 'My Private Polls',
    'poll.myPublicPolls': 'My Public Polls',
    'poll.onlyLinkAccess': 'Only people with this link can see this poll',
    'poll.copyInviteLink': 'Copy invite link',
    'poll.acceptInvite': 'Accept invite & view poll',
    'poll.invalidInvite': 'Invalid or expired invite link',
    'poll.noAccess': 'You don\'t have access to this poll',
    'poll.noRankings': 'No rankings submitted yet',
    'poll.submitRanking': 'Submit Ranking',
    'poll.rankPoll': 'Rank Poll',
    'poll.votePoll': 'Vote Poll',
    'poll.private': 'Private',
    'poll.public': 'Public',
    'poll.emojiOptional': 'Emoji (optional)',
    'poll.share': 'Share',
    'poll.copied': '✓ Copied!',
    'poll.delete': 'Delete',
    'poll.deleteConfirm': 'Are you sure you want to delete this poll? This cannot be undone.',
    'poll.cancel': 'Cancel',
    'poll.viewPoll': 'View poll',
    'poll.noVotesYet': 'No votes yet. Be the first!',
    'poll.active': 'Active',
    'poll.ended': 'Ended',
    'poll.myPolls': 'My Polls',
    'poll.deletePoll': 'Delete poll',
    'poll.voteOnPoll': 'Vote on poll',
    'poll.results': 'Results',
    'poll.dangerZone': 'Danger zone',
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
    'nav.backToFeed': 'Volver al Feed',
    
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
    
    // Spin Wheel
    'spin.title': 'Gira la',
    'spin.titleHighlight': 'Ruleta',
    'spin.subtitle': '¿No puedes decidir? ¡Deja que el destino elija! Agrega tus opciones y dale a la ruleta un giro.',
    'spin.spin': 'GIRAR',
    'spin.spinning': '...',
    'spin.currentOptions': 'Opciones Actuales',
    'spin.quickTemplates': 'Plantillas Rápidas',
    'spin.optionPlaceholder': 'Opción',
    'spin.addOption': 'Agregar',
    'spin.add': 'Agregar',
    'spin.addToWheel': 'Agregar a la Ruleta',
    'spin.yesOrNo': 'Sí o No',
    'spin.foodChoice': 'Comida',
    'spin.activities': 'Actividades',
    'spin.numbers': 'Números 1-6',
    'spin.theWheelHasSpoken': '¡La ruleta ha hablado!',
    'spin.spinAgain': 'Girar de Nuevo',
    'spin.enterAtLeastTwoOptions': '¡Ingresa al menos 2 opciones para comenzar a girar!',
    'spin.minimumTwoOptions': 'Mínimo 2 opciones requeridas',
    'spin.maximumTwelveOptions': 'Máximo 12 opciones permitidas',
    'spin.pleaseEnterAnOption': 'Por favor ingresa una opción',
    'spin.optionTextCannotBeEmpty': 'El texto de la opción no puede estar vacío',
    'spin.addAtLeastTwoOptionsToSpin': 'Agrega al menos 2 opciones para girar',
    'spin.optionsCount': 'opciones (mínimo 2 requeridas para girar)',
    'spin.enterAnOption': 'Ingresa una opción...',
    'spin.addOptionAfterThis': 'Agregar opción después de esta',
    'spin.removeOption': 'Eliminar opción',
    'spin.configureOptions': 'Configurar Opciones',
    'spin.spinWheel': 'Girar Ruleta',
    'spin.continueToWheel': 'Continuar a la Ruleta',
    'spin.editOptions': 'Editar Opciones',

    // Polls & Rankings
    'poll.yourRankingSubmitted': 'Tu ranking ha sido enviado y no puede ser cambiado',
    'poll.pollsInvitedTo': 'Encuestas a las que estoy invitado',
    'poll.myPrivatePolls': 'Mis Encuestas Privadas',
    'poll.myPublicPolls': 'Mis Encuestas Públicas',
    'poll.onlyLinkAccess': 'Solo las personas con este enlace pueden ver esta encuesta',
    'poll.copyInviteLink': 'Copiar enlace de invitación',
    'poll.acceptInvite': 'Aceptar invitación y ver encuesta',
    'poll.invalidInvite': 'Enlace de invitación inválido o expirado',
    'poll.noAccess': 'No tienes acceso a esta encuesta',
    'poll.noRankings': 'No hay rankings enviados aún',
    'poll.submitRanking': 'Enviar Ranking',
    'poll.rankPoll': 'Encuesta de Ranking',
    'poll.votePoll': 'Votar Encuesta',
    'poll.private': 'Privada',
    'poll.public': 'Pública',
    'poll.emojiOptional': 'Emoji (opcional)',
    'poll.share': 'Compartir',
    'poll.copied': '¡✓ Copiado!',
    'poll.delete': 'Eliminar',
    'poll.deleteConfirm': '¿Estás seguro de que quieres eliminar esta encuesta? Esto no se puede deshacer.',
    'poll.cancel': 'Cancelar',
    'poll.viewPoll': 'Ver encuesta',
    'poll.noVotesYet': 'Sin votos aún. ¡Sé el primero!',
    'poll.active': 'Activa',
    'poll.ended': 'Finalizada',
    'poll.myPolls': 'Mis Encuestas',
    'poll.deletePoll': 'Eliminar encuesta',
    'poll.voteOnPoll': 'Votar',
    'poll.results': 'Resultados',
    'poll.dangerZone': 'Zona de peligro',
    'poll.eliminar': 'Eliminar',
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
