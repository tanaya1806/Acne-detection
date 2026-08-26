import type { LesionClass, Zone, Detection } from '../types/acne';

// Forehead = factor 2
// Right Cheek = factor 2
// Left Cheek = factor 2
// Nose = factor 1
// Chin = factor 1
export const ZONE_FACTORS: Record<Zone, number> = {
  forehead: 2,
  right_cheek: 2,
  left_cheek: 2,
  nose: 1,
  chin: 1,
};

// Comedone = 1
// Papule = 2
// Pustule = 3
// Nodule = 4
// Cyst = 4
export const getLesionGrade = (lesionClass: LesionClass): number => {
  switch (lesionClass) {
    case 'closed_comedone':
    case 'open_comedone':
    case 'comedone':
      return 1;
    case 'papule':
      return 2;
    case 'pustule':
      return 3;
    case 'nodule':
    case 'cyst':
      return 4;
    default:
      return 0;
  }
};

export interface ZoneResult {
  zone: Zone;
  maxGrade: number;
  score: number;
}

export const calculateGagsScore = (detections: Detection[]) => {
  const zoneMaxGrades: Record<Zone, number> = {
    forehead: 0,
    left_cheek: 0,
    right_cheek: 0,
    nose: 0,
    chin: 0,
  };

  // Find max grade per zone
  detections.forEach((d) => {
    // If gags_grade is not provided by backend, calculate it:
    const grade = d.gags_grade ?? getLesionGrade(d.class);
    if (grade > zoneMaxGrades[d.zone]) {
      zoneMaxGrades[d.zone] = grade;
    }
  });

  // Calculate scores
  let totalScore = 0;
  const zoneResults: ZoneResult[] = Object.keys(zoneMaxGrades).map((z) => {
    const zone = z as Zone;
    const maxGrade = zoneMaxGrades[zone];
    const score = maxGrade * ZONE_FACTORS[zone];
    totalScore += score;
    return {
      zone,
      maxGrade,
      score,
    };
  });

  return {
    totalScore,
    zoneResults,
  };
};

export const formatZoneName = (zone: Zone): string => {
  return zone
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatLesionName = (lesion: LesionClass): string => {
  return lesion
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
