export const supportedLocales = ['en', 'vi', 'fr'] as const;
export type Locale = (typeof supportedLocales)[number];
export type TranslationValues = Record<string, string | number>;

const en = {
  'response.ok': 'OK',
  'response.registrationSuccessful': 'Registration successful',
  'response.loginSuccessful': 'Login successful',
  'response.passwordResetRequested': 'If that email is registered, a reset link has been sent.',
  'response.passwordResetSuccessful': 'Password reset successfully',
  'response.teamUpdated': 'Team updated',
  'response.memberAdded': 'Member added',
  'response.memberUpdated': 'Member updated',
  'response.memberRemoved': 'Member removed',
  'response.planUpdated': 'Plan updated',
  'response.identityCreated': 'Identity created',
  'response.identityUpdated': 'Identity updated',
  'response.identityDeleted': 'Identity deleted',
  'response.uploadStarted': 'Upload started',
  'response.reviewSubmitted': 'Review submitted',
  'response.imageDeleted': 'Image deleted',
  'response.workspaceCreated': 'Workspace created',
  'response.workspaceUpdated': 'Workspace updated',
  'response.workspaceDeleted': 'Workspace deleted',
  'response.userStatusUpdated': 'User status updated',
  'error.validation': 'Validation error',
  'error.invalidField': 'Invalid value for {{field}}',
  'error.invalidValue': 'Invalid {{field}}: {{value}}',
  'error.internal': 'Internal server error',
  'error.notFound': 'Requested resource was not found',
  'error.unauthorized': 'Authentication failed',
  'error.forbidden': 'Access denied',
  'error.conflict': 'Request conflicts with existing data',
  'error.planLimit': 'Plan limit reached',
  'error.emailRegistered': 'Email already registered',
  'error.invalidCredentials': 'Invalid email or password',
  'error.invalidToken': 'Invalid or expired token',
  'error.missingAuthorization': 'Missing authorization token',
  'error.accountSuspended': 'Account is suspended',
  'error.notAuthenticated': 'Not authenticated',
  'error.superadminRequired': 'Superadmin access required',
  'error.teamSuspended': 'Team is suspended',
  'error.invalidResetToken': 'Invalid or expired reset token',
  'error.noImageProvided': 'No image file provided',
  'error.noValidImages': 'No valid image files uploaded',
  'error.memberExists': 'User is already a member of this team',
  'error.memberInAnotherTeam': 'User is already a member of another team',
  'error.cannotChangeOwner': 'Cannot change the role of the team owner',
  'error.cannotChangeOwnRole': 'Cannot change your own role',
  'error.cannotRemoveOwner': 'Cannot remove the team owner',
  'error.cannotRemoveSelf': 'Cannot remove yourself from the team',
  'error.cannotChangeOwnStatus': 'Cannot change your own account status',
  'error.cannotChangeSuperadmin': 'Cannot change a superadmin account status',
} as const;

export type TranslationKey = keyof typeof en;
type Catalog = Record<TranslationKey, string>;

const vi: Catalog = {
  'response.ok': 'OK', 'response.registrationSuccessful': 'Đăng ký thành công', 'response.loginSuccessful': 'Đăng nhập thành công', 'response.passwordResetRequested': 'Nếu email đã được đăng ký, liên kết đặt lại mật khẩu đã được gửi.', 'response.passwordResetSuccessful': 'Đặt lại mật khẩu thành công', 'response.teamUpdated': 'Đã cập nhật đội nhóm', 'response.memberAdded': 'Đã thêm thành viên', 'response.memberUpdated': 'Đã cập nhật thành viên', 'response.memberRemoved': 'Đã xóa thành viên', 'response.planUpdated': 'Đã cập nhật gói', 'response.identityCreated': 'Đã tạo danh tính', 'response.identityUpdated': 'Đã cập nhật danh tính', 'response.identityDeleted': 'Đã xóa danh tính', 'response.uploadStarted': 'Đã bắt đầu tải lên', 'response.reviewSubmitted': 'Đã gửi đánh giá', 'response.imageDeleted': 'Đã xóa ảnh', 'response.workspaceCreated': 'Đã tạo không gian', 'response.workspaceUpdated': 'Đã cập nhật không gian', 'response.workspaceDeleted': 'Đã xóa không gian', 'response.userStatusUpdated': 'Đã cập nhật trạng thái người dùng',
  'error.validation': 'Lỗi xác thực dữ liệu', 'error.invalidField': 'Giá trị không hợp lệ cho {{field}}', 'error.invalidValue': '{{field}} không hợp lệ: {{value}}', 'error.internal': 'Lỗi máy chủ nội bộ', 'error.notFound': 'Không tìm thấy tài nguyên yêu cầu', 'error.unauthorized': 'Xác thực thất bại', 'error.forbidden': 'Truy cập bị từ chối', 'error.conflict': 'Yêu cầu xung đột với dữ liệu hiện có', 'error.planLimit': 'Đã đạt giới hạn gói', 'error.emailRegistered': 'Email đã được đăng ký', 'error.invalidCredentials': 'Email hoặc mật khẩu không đúng', 'error.invalidToken': 'Token không hợp lệ hoặc đã hết hạn', 'error.missingAuthorization': 'Thiếu token xác thực', 'error.accountSuspended': 'Tài khoản đã bị tạm ngưng', 'error.notAuthenticated': 'Chưa xác thực', 'error.superadminRequired': 'Yêu cầu quyền quản trị nền tảng', 'error.teamSuspended': 'Đội nhóm đã bị tạm ngưng', 'error.invalidResetToken': 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 'error.noImageProvided': 'Chưa cung cấp tệp ảnh', 'error.noValidImages': 'Không có tệp ảnh hợp lệ được tải lên', 'error.memberExists': 'Người dùng đã là thành viên của đội nhóm này', 'error.memberInAnotherTeam': 'Người dùng đã là thành viên của đội nhóm khác', 'error.cannotChangeOwner': 'Không thể thay đổi vai trò của chủ sở hữu đội nhóm', 'error.cannotChangeOwnRole': 'Không thể thay đổi vai trò của chính bạn', 'error.cannotRemoveOwner': 'Không thể xóa chủ sở hữu đội nhóm', 'error.cannotRemoveSelf': 'Không thể tự xóa chính bạn khỏi đội nhóm', 'error.cannotChangeOwnStatus': 'Không thể thay đổi trạng thái tài khoản của chính bạn', 'error.cannotChangeSuperadmin': 'Không thể thay đổi trạng thái tài khoản quản trị nền tảng',
};

const fr: Catalog = {
  'response.ok': 'OK', 'response.registrationSuccessful': 'Inscription réussie', 'response.loginSuccessful': 'Connexion réussie', 'response.passwordResetRequested': 'Si cette adresse e-mail est enregistrée, un lien de réinitialisation a été envoyé.', 'response.passwordResetSuccessful': 'Mot de passe réinitialisé avec succès', 'response.teamUpdated': 'Équipe mise à jour', 'response.memberAdded': 'Membre ajouté', 'response.memberUpdated': 'Membre mis à jour', 'response.memberRemoved': 'Membre supprimé', 'response.planUpdated': 'Forfait mis à jour', 'response.identityCreated': 'Identité créée', 'response.identityUpdated': 'Identité mise à jour', 'response.identityDeleted': 'Identité supprimée', 'response.uploadStarted': 'Import démarré', 'response.reviewSubmitted': 'Vérification envoyée', 'response.imageDeleted': 'Image supprimée', 'response.workspaceCreated': 'Espace créé', 'response.workspaceUpdated': 'Espace mis à jour', 'response.workspaceDeleted': 'Espace supprimé', 'response.userStatusUpdated': 'Statut de l’utilisateur mis à jour',
  'error.validation': 'Erreur de validation', 'error.invalidField': 'Valeur invalide pour {{field}}', 'error.invalidValue': '{{field}} invalide : {{value}}', 'error.internal': 'Erreur interne du serveur', 'error.notFound': 'Ressource demandée introuvable', 'error.unauthorized': 'Échec de l’authentification', 'error.forbidden': 'Accès refusé', 'error.conflict': 'La demande entre en conflit avec des données existantes', 'error.planLimit': 'Limite du forfait atteinte', 'error.emailRegistered': 'Cette adresse e-mail est déjà enregistrée', 'error.invalidCredentials': 'Adresse e-mail ou mot de passe invalide', 'error.invalidToken': 'Jeton invalide ou expiré', 'error.missingAuthorization': 'Jeton d’autorisation manquant', 'error.accountSuspended': 'Le compte est suspendu', 'error.notAuthenticated': 'Non authentifié', 'error.superadminRequired': 'Accès administrateur de plateforme requis', 'error.teamSuspended': 'L’équipe est suspendue', 'error.invalidResetToken': 'Jeton de réinitialisation invalide ou expiré', 'error.noImageProvided': 'Aucun fichier image fourni', 'error.noValidImages': 'Aucun fichier image valide importé', 'error.memberExists': 'Cet utilisateur est déjà membre de cette équipe', 'error.memberInAnotherTeam': 'Cet utilisateur est déjà membre d’une autre équipe', 'error.cannotChangeOwner': 'Impossible de modifier le rôle du propriétaire de l’équipe', 'error.cannotChangeOwnRole': 'Impossible de modifier votre propre rôle', 'error.cannotRemoveOwner': 'Impossible de supprimer le propriétaire de l’équipe', 'error.cannotRemoveSelf': 'Impossible de vous supprimer de l’équipe', 'error.cannotChangeOwnStatus': 'Impossible de modifier le statut de votre propre compte', 'error.cannotChangeSuperadmin': 'Impossible de modifier le statut d’un compte superadministrateur',
};

const catalogs: Record<Locale, Catalog> = { en, vi, fr };

const legacyMessageKeys: Record<string, TranslationKey> = {
  'Email already registered': 'error.emailRegistered',
  'Invalid email or password': 'error.invalidCredentials',
  'Invalid or expired token': 'error.invalidToken',
  'Missing authorization token': 'error.missingAuthorization',
  'Account is suspended': 'error.accountSuspended',
  'Not authenticated': 'error.notAuthenticated',
  'Superadmin access required': 'error.superadminRequired',
  'Team is suspended': 'error.teamSuspended',
  'Invalid or expired reset token': 'error.invalidResetToken',
  'No image file provided': 'error.noImageProvided',
  'No valid image files uploaded': 'error.noValidImages',
  'User is already a member of this team': 'error.memberExists',
  'User is already a member of another team': 'error.memberInAnotherTeam',
  'Cannot change the role of the team owner': 'error.cannotChangeOwner',
  'Cannot change your own role': 'error.cannotChangeOwnRole',
  'Cannot remove the team owner': 'error.cannotRemoveOwner',
  'Cannot remove yourself from the team': 'error.cannotRemoveSelf',
  'Cannot change your own account status': 'error.cannotChangeOwnStatus',
  'Cannot change a superadmin account status': 'error.cannotChangeSuperadmin',
};

const codeMessageKeys: Record<string, TranslationKey> = {
  NOT_FOUND: 'error.notFound',
  VALIDATION_ERROR: 'error.validation',
  UNAUTHORIZED: 'error.unauthorized',
  FORBIDDEN: 'error.forbidden',
  CONFLICT: 'error.conflict',
  PLAN_LIMIT_EXCEEDED: 'error.planLimit',
};

export function resolveLocale(value?: string | string[]): Locale {
  const candidate = Array.isArray(value) ? value[0] : value;
  const tags = (candidate ?? '').toLowerCase().split(',').map((item) => item.trim().split(';')[0].split('-')[0]);
  return tags.find((tag): tag is Locale => (supportedLocales as readonly string[]).includes(tag)) ?? 'en';
}

export function translate(locale: Locale, key: TranslationKey, values?: TranslationValues): string {
  const text = catalogs[locale][key];
  return values ? text.replace(/{{(\w+)}}/g, (_, name: string) => String(values[name] ?? '')) : text;
}

export function translateLegacyError(locale: Locale, message: string, code?: string): string {
  const key = legacyMessageKeys[message] ?? (code ? codeMessageKeys[code] : undefined);
  return key ? translate(locale, key) : message;
}
