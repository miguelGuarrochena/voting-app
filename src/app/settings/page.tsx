'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CogIcon,
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Settings state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [pollReminders, setPollReminders] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pickly_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setDisplayName(parsed.displayName || user?.name || '');
        setBio(parsed.bio || '');
        setEmailNotifications(parsed.emailNotifications ?? true);
        setPushNotifications(parsed.pushNotifications ?? false);
        setPollReminders(parsed.pollReminders ?? true);
        setPrivateProfile(parsed.privateProfile ?? false);
        setShowActivity(parsed.showActivity ?? true);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    } else {
      setDisplayName(user?.name || '');
    }
  }, [user]);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      displayName,
      bio,
      language,
      theme,
      notifications: {
        email: emailNotifications,
        push: pushNotifications,
        pollReminders,
      },
      privacy: {
        showProfile: privateProfile,
        showVotes: showActivity,
      },
    };
    localStorage.setItem('pickly_settings', JSON.stringify(settings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const settingsSections = [
    {
      id: 'profile',
      name: t('settings.profile'),
      icon: UserCircleIcon,
      description: t('settings.profileDesc')
    },
    {
      id: 'notifications',
      name: t('settings.notifications'),
      icon: BellIcon,
      description: t('settings.notificationsDesc')
    },
    {
      id: 'privacy',
      name: t('settings.privacy'),
      icon: ShieldCheckIcon,
      description: t('settings.privacyDesc')
    },
    {
      id: 'appearance',
      name: t('settings.appearance'),
      icon: CogIcon,
      description: t('settings.appearanceDesc')
    },
    {
      id: 'language',
      name: t('settings.language'),
      icon: GlobeAltIcon,
      description: t('settings.languageDesc')
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-[var(--text)]" />
              </button>
              <h1 className="text-xl font-semibold text-[var(--text)]">
                {t('settings.title')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-sm opacity-75">{section.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="font-medium">{t('settings.logout')}</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--text)] mb-4">
                    {t('settings.profile')}
                  </h2>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-pink-500 flex items-center justify-center text-white text-2xl font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[var(--text)]">{user?.name || 'User'}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{user?.email || 'user@example.com'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-2">
                        {t('settings.displayName')}
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                        placeholder={t('settings.displayNamePlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-2">
                        {t('settings.bio')}
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                        placeholder={t('settings.bioPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--text)] mb-4">
                    {t('settings.notifications')}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-[var(--text)]">{t('settings.emailNotifications')}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.emailNotificationsDesc')}</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-[var(--primary)]' : 'bg-[var(--surface-2)]'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-[var(--text)]">{t('settings.pushNotifications')}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.pushNotificationsDesc')}</p>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? 'bg-[var(--primary)]' : 'bg-[var(--surface-2)]'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-[var(--text)]">{t('settings.pollReminders')}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.pollRemindersDesc')}</p>
                      </div>
                      <button
                        onClick={() => setPollReminders(!pollReminders)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pollReminders ? 'bg-[var(--primary)]' : 'bg-[var(--surface-2)]'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pollReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--text)] mb-4">
                    {t('settings.privacy')}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-[var(--text)]">{t('settings.privateProfile')}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.privateProfileDesc')}</p>
                      </div>
                      <button
                        onClick={() => setPrivateProfile(!privateProfile)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privateProfile ? 'bg-[var(--primary)]' : 'bg-[var(--surface-2)]'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privateProfile ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-medium text-[var(--text)]">{t('settings.showActivity')}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.showActivityDesc')}</p>
                      </div>
                      <button
                        onClick={() => setShowActivity(!showActivity)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showActivity ? 'bg-[var(--primary)]' : 'bg-[var(--surface-2)]'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showActivity ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--text)] mb-4">
                    {t('settings.appearance')}
                  </h2>
                  
                  <div>
                    <h3 className="font-medium text-[var(--text)] mb-4">{t('settings.theme')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === 'light'
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <SunIcon className="w-8 h-8 mx-auto mb-2 text-[var(--primary)]" />
                        <div className="text-sm font-medium text-[var(--text)]">{t('theme.light')}</div>
                      </button>
                      
                      <button
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === 'dark'
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <MoonIcon className="w-8 h-8 mx-auto mb-2 text-[var(--primary)]" />
                        <div className="text-sm font-medium text-[var(--text)]">{t('theme.dark')}</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'language' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--text)] mb-4">
                    {t('settings.language')}
                  </h2>
                  
                  <div>
                    <h3 className="font-medium text-[var(--text)] mb-4">{t('settings.displayLanguage')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => language !== 'en' && toggleLanguage()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          language === 'en'
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <div className="text-2xl mb-2">🇺🇸</div>
                        <div className="text-sm font-medium text-[var(--text)]">English</div>
                      </button>
                      
                      <button
                        onClick={() => language !== 'es' && toggleLanguage()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          language === 'es'
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <div className="text-2xl mb-2">🇪🇸</div>
                        <div className="text-sm font-medium text-[var(--text)]">Español</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-6 border-t border-[var(--border)]">
                <button
                  onClick={saveSettings}
                  className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors"
                >
                  {settingsSaved ? 'Changes saved ✓' : t('settings.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
    </div>
  );
};

export default SettingsPage;
