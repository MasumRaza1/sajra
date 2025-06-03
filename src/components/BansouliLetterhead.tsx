import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: '20 30',
    fontFamily: 'Helvetica',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#1a5f7a',
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingTop: 15,
  },
  metaLeft: {
    flexDirection: 'column',
    fontSize: 7,
    color: '#666666',
  },
  metaRight: {
    flexDirection: 'column',
    fontSize: 7,
    color: '#666666',
    textAlign: 'right',
  },
  qrSection: {
    position: 'absolute',
    top: 15,
    right: 30,
    alignItems: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  qrText: {
    fontSize: 7,
    color: '#666666',
    textAlign: 'right',
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  qrCode: {
    width: 45,
    height: 45,
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 45,
    height: 45,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    color: '#1a5f7a',
  },
  subtitle: {
    fontSize: 9,
    color: '#666666',
  },
 
  content: {
    marginTop: 10,
  },
  documentTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1a5f7a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoSection: {
    marginBottom: 20,
    padding: '8 12',
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: '#666666',
    width: '30%',
  },
  infoValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    width: '70%',
  },
  familyTree: {
    alignItems: 'center',
    marginTop: 15,
    padding: '15 0',
  },
  memberText: {
    fontSize: 11,
    color: '#333333',
    textAlign: 'center',
    marginVertical: 4,
  },
  currentMemberText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a5f7a',
    textAlign: 'center',
    marginVertical: 4,
  },
  arrow: {
    fontSize: 10,
    marginVertical: 2,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
  },
  footerTop: {
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 8,
    marginBottom: 8,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footerLeft: {
    width: '60%',
  },
  footerRight: {
    width: '35%',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 7,
    color: '#666666',
    lineHeight: 1.5,
  },
  footerTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginBottom: 2,
  },
  signaturePlaceholder: {
    width: 100,
    height: 30,
    marginBottom: 4,
    opacity: 0.6,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  watermarkLogo: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: (841.89 - 300) / 2,  // = 270.945
    left: (595.28 - 300) / 2, // = 147.64
    opacity: 0.02,
  },
  
  watermarkText: {
    position: 'absolute',
    color: '#f0f0f0',
    fontSize: 120,
    opacity: 0.15,
    transform: 'rotate(-45deg)',
    textAlign: 'center',
    top: '40%',
    left: '25%',
    right: '25%',
  },
  watermarkTop: {
    top: '20%',
    left: '10%',
  },
  watermarkBottom: {
    bottom: '20%',
    right: '10%',
  },
});

interface BansouliLetterheadProps {
  member: {
    name: string;
    fatherName?: string;  // Optional for manual entry
    ancestors?: { name: string }[];  // Optional for manual entry
    isOutsider?: boolean;  // Flag to indicate if this is a manual/outsider entry
  };
}

const BansouliLetterhead: React.FC<BansouliLetterheadProps> = ({ member }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const refNumber = `NPB/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  // Simplified QR data with basic information in text format
  const qrData = `Certificate: ${refNumber}
Name: ${member.name}
Father: ${member.isOutsider ? member.fatherName : member.ancestors?.[0]?.name || 'Not Available'}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=1&data=${encodeURIComponent(qrData)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermarks */}
        <View style={styles.watermarkContainer}>
          <Image 
            src="src/assets/jharkhand-logo.png"
            style={styles.watermarkLogo}
          />
        </View>

     
        <View style={styles.qrSection}>
          <Text style={styles.qrText}>Reference: {refNumber}</Text>
          <Text style={styles.qrText}>Valid Until: Permanent</Text>
         
        </View>

        {/* Meta Information */}
        <View style={styles.metaHeader}>
          <View style={styles.metaLeft}>
            <Text>Document Type: Vanshaavali Family Lineage Certificate</Text>
            <Text>Issue Date: {formattedDate}</Text>
          </View>
        </View>

        {/* Top Accent Bar */}
        <View style={styles.topBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              src="src/assets/jharkhand-logo.png"
              style={styles.logo}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Nagar Panchayat Bishrampur</Text>
              <Text style={styles.subtitle}>Palamu, Jharkhand • 822124</Text>
            </View>
          </View>
          <Image 
            style={styles.qrCode}
            src={qrCodeUrl}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.documentTitle}>
            Vanshaavali Or Lineage Certificate
          </Text>

          {/* Information Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Certificate Number:</Text>
              <Text style={styles.infoValue}>{refNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issue Date:</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{member.name}</Text>
            </View>
            {member.isOutsider && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Father's Name:</Text>
                <Text style={styles.infoValue}>{member.fatherName}</Text>
              </View>
            )}
            {member.isOutsider && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Entry Type:</Text>
                <Text style={styles.infoValue}>Manual Entry / Outsider</Text>
              </View>
            )}
          </View>

          {/* Modified Family Tree */}
          <View style={styles.familyTree}>
            {member.isOutsider ? (
              // For outsiders/manual entries, show only father and current person
              <>
                {member.fatherName && (
                  <>
                    <Text style={styles.memberText}>{member.fatherName}</Text>
                    <Text style={styles.arrow}>|</Text>
                  </>
                )}
                <Text style={styles.currentMemberText}>{member.name}</Text>
              </>
            ) : (
              // For family members, show full ancestry
              <>
                {member.ancestors?.slice().reverse().map((ancestor, index) => (
                  <React.Fragment key={index}>
                    <Text style={styles.memberText}>{ancestor.name}</Text>
                    <Text style={styles.arrow}>|</Text>
                  </React.Fragment>
                ))}
                <Text style={styles.currentMemberText}>{member.name}</Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop} />
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerTitle}>Important Notice</Text>
              <Text style={styles.footerText}>
              This document is for reference in making vanshaavali. It contains verified lineage data but is not issued by any government body. Valid only if signed by an authorized official.
              </Text>
            </View>
            <View style={styles.footerRight}>
              <View style={styles.signaturePlaceholder} />
              <Text style={styles.footerTitle}>Authorized Signatory</Text>
              <Text style={styles.footerText}>Ward Parshad</Text>
              <Text style={styles.footerText}>Nagar Panchayat Bishrampur</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default BansouliLetterhead;