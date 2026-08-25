import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const locales = ['en', 'vi', 'fr'] as const
export type Locale = (typeof locales)[number]
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  fr: 'Français',
}

const copy = {
  en: {
    platform: 'Platform control', signIn: 'Sign in to platform', email: 'Email address', password: 'Password', signInButton: 'Sign in',
    secureAccess: 'Restricted to verified platform administrators.', invalidAdmin: 'This account does not have platform administrator access.',
    overview: 'Overview', teams: 'Teams', users: 'Users', signOut: 'Sign out', totalTeams: 'Teams', totalUsers: 'Users',
    activeUsers: 'Active users', suspendedUsers: 'Suspended users', identities: 'Identities', images: 'Images', platformHealth: 'Platform health', accessGuard: 'Access guard', superadmins: 'Platform administrators',
    searchTeams: 'Search teams', searchUsers: 'Search users', allPlans: 'All plans', allStatuses: 'All statuses', team: 'Team',
    owner: 'Owner', members: 'Members', plan: 'Plan', created: 'Created', name: 'Name', status: 'Status', role: 'Role', actions: 'Actions',
    save: 'Save', active: 'Active', suspended: 'Suspended', protected: 'Protected', previous: 'Previous', next: 'Next', page: 'Page', noResults: 'No matching records.',
    error: 'Unable to load platform data.',
  },
  vi: {
    platform: 'Quản trị nền tảng', signIn: 'Đăng nhập quản trị', email: 'Địa chỉ email', password: 'Mật khẩu', signInButton: 'Đăng nhập',
    secureAccess: 'Chỉ dành cho quản trị viên nền tảng đã xác thực.', invalidAdmin: 'Tài khoản này không có quyền quản trị nền tảng.',
    overview: 'Tổng quan', teams: 'Nhóm', users: 'Người dùng', signOut: 'Đăng xuất', totalTeams: 'Nhóm', totalUsers: 'Người dùng',
    activeUsers: 'Người dùng hoạt động', suspendedUsers: 'Người dùng bị khóa', identities: 'Danh tính', images: 'Hình ảnh', platformHealth: 'Tình trạng nền tảng', accessGuard: 'Kiểm soát truy cập', superadmins: 'Quản trị viên nền tảng',
    searchTeams: 'Tìm nhóm', searchUsers: 'Tìm người dùng', allPlans: 'Tất cả gói', allStatuses: 'Tất cả trạng thái', team: 'Nhóm',
    owner: 'Chủ nhóm', members: 'Thành viên', plan: 'Gói', created: 'Tạo lúc', name: 'Tên', status: 'Trạng thái', role: 'Vai trò', actions: 'Thao tác',
    save: 'Lưu', active: 'Hoạt động', suspended: 'Bị khóa', protected: 'Được bảo vệ', previous: 'Trước', next: 'Sau', page: 'Trang', noResults: 'Không có dữ liệu phù hợp.',
    error: 'Không thể tải dữ liệu nền tảng.',
  },
  fr: {
    platform: 'Contrôle de plateforme', signIn: 'Connexion à la plateforme', email: 'Adresse e-mail', password: 'Mot de passe', signInButton: 'Se connecter',
    secureAccess: 'Réservé aux administrateurs de plateforme vérifiés.', invalidAdmin: 'Ce compte ne peut pas administrer la plateforme.',
    overview: 'Vue d’ensemble', teams: 'Équipes', users: 'Utilisateurs', signOut: 'Se déconnecter', totalTeams: 'Équipes', totalUsers: 'Utilisateurs',
    activeUsers: 'Utilisateurs actifs', suspendedUsers: 'Utilisateurs suspendus', identities: 'Identités', images: 'Images', platformHealth: 'État de la plateforme', accessGuard: 'Contrôle d’accès', superadmins: 'Administrateurs de plateforme',
    searchTeams: 'Rechercher des équipes', searchUsers: 'Rechercher des utilisateurs', allPlans: 'Tous les plans', allStatuses: 'Tous les statuts', team: 'Équipe',
    owner: 'Propriétaire', members: 'Membres', plan: 'Plan', created: 'Créé le', name: 'Nom', status: 'Statut', role: 'Rôle', actions: 'Actions',
    save: 'Enregistrer', active: 'Actif', suspended: 'Suspendu', protected: 'Protégé', previous: 'Précédent', next: 'Suivant', page: 'Page', noResults: 'Aucun résultat.',
    error: 'Impossible de charger les données de plateforme.',
  },
} as const

type CopyKey = keyof (typeof copy)['en']
interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: CopyKey) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function initialLocale(): Locale {
  const saved = window.localStorage.getItem('facematch.admin.locale')
  return locales.includes(saved as Locale) ? (saved as Locale) : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const setLocale = (nextLocale: Locale) => setLocaleState(nextLocale)

  useEffect(() => {
    window.localStorage.setItem('facematch.admin.locale', locale)
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t: (key) => copy[locale][key] }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
