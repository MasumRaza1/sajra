export interface FamilyMember {
  id: string;
  name: string;
  fatherId: string | null;
  isDeceased: boolean;
  fatherName?: string;  // Optional field for manual entries
  isOutsider?: boolean;  // Flag to indicate if this is a manual entry
  additionalInfo?: string;  // Optional additional information
  ancestors?: FamilyMember[];  // Optional array of ancestors for manual entries
  generation?: number;  // Generation number (0 for current member, 1 for father, etc.)
} 