import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FamilyMember } from '../types/FamilyMember';

const styles = StyleSheet.create({
  page: {
    padding: '30 40',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    width: '100%',
    position: 'relative',
  },
  yearBadge: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderRadius: 6,
    width: 35,
    border: '1 solid #dddddd',
    alignItems: 'center',
    position: 'absolute',
    left: 20,
  },
  yearNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#444444',
    textAlign: 'center',
  },
  yearLabel: {
    fontSize: 5,
    fontFamily: 'Helvetica',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  currentYear: {
    fontSize: 6,
    fontFamily: 'Helvetica',
    color: '#888888',
    textAlign: 'center',
    marginTop: 1,
  },
  startedText: {
    position: 'absolute',
    left: 0,
    top: 35,
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: '#888888',
    width: 75,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    letterSpacing: 1.5,
    color: '#111111',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'Helvetica',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  eidUpdateText: {
    position: 'absolute',
    right: 0,
    top: 5,
    fontSize: 7,
    color: '#888888',
    fontFamily: 'Helvetica',
    textAlign: 'right',
  },
  yearText: {
    fontSize: 12,
    color: '#444444',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 25,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '0.5 solid #f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    color: '#111111',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 7,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Helvetica',
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 30,
  },
  column: {
    flex: 1,
    gap: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottom: '0.2 solid #f5f5f5',
  },
  serialNumber: {
    fontSize: 7,
    color: '#888888',
    fontFamily: 'Helvetica',
    width: 16,
    textAlign: 'right',
  },
  nameText: {
    flex: 1,
    fontSize: 8.5,
    color: '#333333',
    fontFamily: 'Helvetica',
    letterSpacing: 0.2,
  },
  genBadge: {
    fontSize: 6.5,
    color: '#666666',
    fontFamily: 'Helvetica',
    letterSpacing: 0.2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  pageNumber: {
    position: 'absolute',
    top: 30,
    right: 40,
    fontSize: 7,
    color: '#bbbbbb',
    fontFamily: 'Helvetica',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 6,
    color: '#bbbbbb',
    fontFamily: 'Helvetica',
  }
});

interface IsaaleSawabPDFProps {
  deceasedMembers: FamilyMember[];
}

const IsaaleSawabPDF: React.FC<IsaaleSawabPDFProps> = ({ deceasedMembers }) => {
  const sortedMembers = [...deceasedMembers].sort((a, b) => {
    const genA = a.generation ?? 0;
    const genB = b.generation ?? 0;
    if (genA !== genB) return genA - genB;
    return a.name.localeCompare(b.name);
  });

  const membersPerPage = 80; // Increased for 2-column layout
  const memberGroups = sortedMembers.reduce((acc, member, index) => {
    const pageIndex = Math.floor(index / membersPerPage);
    if (!acc[pageIndex]) acc[pageIndex] = [];
    acc[pageIndex].push({ ...member, serialNumber: index + 1 });
    return acc;
  }, [] as Array<Array<FamilyMember & { serialNumber: number }>>);

  const formatGeneration = (gen: number | undefined) => {
    if (gen === undefined || gen === null) return '';
    const getOrdinalSuffix = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    return `${getOrdinalSuffix(gen)} Gen`;
  };

  const formatName = (name: string) => {
    let cleanName = name
      .replace(/\bJanab\b/g, '')
      .replace(/\bMarhoom\b/g, '')
      .trim();
    return `Janab ${cleanName} Marhoom`;
  };

  const uniqueGenerations = new Set(sortedMembers.map(m => m.generation)).size;

  const splitIntoColumns = (members: Array<FamilyMember & { serialNumber: number }>) => {
    const midpoint = Math.ceil(members.length / 2);
    return [members.slice(0, midpoint), members.slice(midpoint)];
  };

  const getYearInfo = () => {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - startYear + 1;
    const ordinal = yearDiff === 1 ? 'st' : yearDiff === 2 ? 'nd' : yearDiff === 3 ? 'rd' : 'th';
    return {
      number: yearDiff,
      text: `${yearDiff}${ordinal}`,
      currentYear: currentYear
    };
  };

  return (
    <Document>
      {memberGroups.map((group, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {pageIndex === 0 && (
            <View style={styles.header}>
              <View style={styles.headerContainer}>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearNumber}>{getYearInfo().text}</Text>
                  <Text style={styles.yearLabel}>Year</Text>
                  <Text style={styles.currentYear}>{getYearInfo().currentYear}</Text>
                </View>
                <Text style={styles.startedText}>Started from 2024</Text>
                <View style={{ width: '100%' }}>
                  <Text style={styles.title}>ISAAL·E·SAWAB</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                List of Deceased Family Members
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{sortedMembers.length}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{uniqueGenerations}</Text>
                  <Text style={styles.statLabel}>Generations</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.columnsContainer}>
            {splitIntoColumns(group).map((columnMembers, columnIndex) => (
              <View key={columnIndex} style={styles.column}>
                {columnMembers.map((member) => (
                  <View key={member.id} style={styles.listItem}>
                    <Text style={styles.serialNumber}>{member.serialNumber}</Text>
                    <Text style={styles.nameText}>{formatName(member.name)}</Text>
                    <Text style={styles.genBadge}>
                      {formatGeneration(member.generation)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Text style={styles.pageNumber}>
            {pageIndex + 1}/{memberGroups.length}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Last Updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default IsaaleSawabPDF; 