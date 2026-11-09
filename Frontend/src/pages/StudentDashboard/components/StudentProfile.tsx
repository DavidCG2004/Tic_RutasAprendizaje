import { Badge, Icon } from '@/components/ui';
import ProfileScreen, {
  type ProfileBadge,
  type ProfileStat,
} from '@/components/profile/ProfileScreen';
import type { User, UserDashboard } from '../../../types';

export interface StudentProfileProps {
  userData: UserDashboard;
  onPhotoUpdate: (newPhotoUrl: string) => void;
  /** Avisa al dashboard para que refresque el perfil tras editarlo. */
  onProfileUpdate?: (user: User) => void;
}

const StudentProfile = ({ userData, onPhotoUpdate, onProfileUpdate }: StudentProfileProps) => {
  const xp = userData.xp ?? 0;
  const streak = userData.streak ?? 0;
  const level = userData.level || 1;

  const badges: ProfileBadge[] = [
    {
      name: 'Primera ruta',
      earned: xp > 0,
      icon: 'epnOwl',
      description: 'El primer paso de tu trayectoria de aprendizaje.',
    },
    {
      name: 'Racha de 7 días',
      earned: streak >= 7,
      icon: 'flame',
      description: 'Constancia de siete días seguidos.',
    },
    {
      name: 'Explorador',
      earned: xp >= 500,
      icon: 'brain',
      description: 'Exploración de contenidos hasta los 500 XP.',
    },
    {
      name: 'Nivel 5',
      earned: level >= 5,
      icon: 'epnLaurel',
      description: 'Distinción por alcanzar el nivel 5.',
    },
  ];

  const stats: ProfileStat[] = [
    { label: 'XP total', value: `${xp} XP` },
    { label: 'Nivel', value: level },
    { label: 'Racha', value: `${streak} días` },
  ];

  return (
    <ProfileScreen
      userData={userData}
      onPhotoUpdate={onPhotoUpdate}
      onProfileUpdate={onProfileUpdate}
      eyebrow="Aprendizaje"
      badges={badges}
      stats={stats}
      showLevelProgress
      showXpField
      headerBadges={
        <>
          <Badge variant="primary">Estudiante EPN</Badge>
          <Badge variant="success">Nivel {level}</Badge>
          {streak > 0 && (
            <Badge variant="accent">
              <Icon name="flame" className="h-3 w-3" />
              {streak} días de racha
            </Badge>
          )}
        </>
      }
    />
  );
};

export default StudentProfile;
