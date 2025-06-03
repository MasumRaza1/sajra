export interface FamilyMember {
  id: string;
  name: string;
  fatherId: string | null;
  isDeceased: boolean;
  deathDate?: string; // Optional death date in YYYY-MM-DD format
} 