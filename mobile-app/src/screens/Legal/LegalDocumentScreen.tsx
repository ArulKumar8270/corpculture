import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getLegalDocument, LegalBlock } from '../../data/legalDocuments';

const Block = ({ block }: { block: LegalBlock }) => {
  if (block.type === 'p') {
    return <Text style={styles.paragraph}>{block.text}</Text>;
  }
  if (block.type === 'h3') {
    return <Text style={styles.subtitle}>{block.text}</Text>;
  }
  if (block.type === 'ul') {
    return (
      <View style={styles.list}>
        {block.items.map((item) => (
          <View key={item} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.contactBox}>
      {block.rows.map((row, index) => (
        <Text key={`${row.label || 'row'}-${index}`} style={styles.contactText}>
          {row.label ? <Text style={styles.contactLabel}>{row.label}: </Text> : null}
          {row.value}
        </Text>
      ))}
    </View>
  );
};

const LegalDocumentScreen = () => {
  const route = useRoute<any>();
  const document = getLegalDocument(route.params?.documentType);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{document.title}</Text>
      {document.lastUpdated ? <Text style={styles.meta}>{document.lastUpdated}</Text> : null}
      {document.subtitle ? <Text style={styles.intro}>{document.subtitle}</Text> : null}
      {document.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.blocks.map((block, index) => (
            <Block key={`${section.title}-${index}`} block={block} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c115d',
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  intro: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0c115d',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#c5e8f0',
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c115d',
    marginTop: 10,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 8,
  },
  list: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    color: '#019ee3',
    marginRight: 8,
    fontSize: 14,
    lineHeight: 22,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  contactBox: {
    backgroundColor: '#f1f3f6',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  contactLabel: {
    fontWeight: '700',
    color: '#0c115d',
  },
});

export default LegalDocumentScreen;
