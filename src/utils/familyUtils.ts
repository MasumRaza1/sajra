import { FamilyMember } from '../types/FamilyMember';
import { familyData } from './familyData';

export const findAncestors = (member: FamilyMember): FamilyMember[] => {
  const ancestors: FamilyMember[] = [];
  let currentMember = member;

  while (currentMember.fatherId) {
    const father = familyData.find(m => m.id === currentMember.fatherId);
    if (father) {
      ancestors.push(father);
      currentMember = father;
    } else {
      break;
    }
  }

  return ancestors;
};

export const findDescendants = (member: FamilyMember): FamilyMember[] => {
  const descendants: FamilyMember[] = [];
  
  const findChildren = (parentId: string) => {
    const children = familyData.filter(m => m.fatherId === parentId);
    descendants.push(...children);
    children.forEach(child => findChildren(child.id));
  };

  findChildren(member.id);
  return descendants;
}; 