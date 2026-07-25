import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

const TOP_EDGES = ['top'];

function renderInline(text, keyPrefix) {
  // very small inline formatter: **bold**, [text](url)
  const nodes = [];
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  let idx = 0;
  while ((m = linkRe.exec(text))) {
    if (m.index > last) {
      nodes.push(<Text key={`${keyPrefix}-t-${idx++}`}>{text.slice(last, m.index)}</Text>);
    }
    if (m[1] && m[2]) {
      nodes.push(
        <Text
          key={`${keyPrefix}-a-${idx++}`}
          style={styles.link}
          onPress={() => Linking.openURL(m[2])}
        >
          {m[1]}
        </Text>
      );
    } else if (m[3]) {
      nodes.push(
        <Text key={`${keyPrefix}-b-${idx++}`} style={styles.strong}>
          {m[3]}
        </Text>
      );
    }
    last = linkRe.lastIndex;
  }
  if (last < text.length) {
    nodes.push(<Text key={`${keyPrefix}-t-${idx++}`}>{text.slice(last)}</Text>);
  }
  return nodes;
}

function Section({ heading, body }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{heading}</Text>
      {body.map((block, i) => {
        if (block.type === 'p') {
          return (
            <Text key={`p-${i}`} style={styles.paragraph}>
              {renderInline(block.text, `p-${i}`)}
            </Text>
          );
        }
        if (block.type === 'ul') {
          return (
            <View key={`ul-${i}`} style={styles.list}>
              {block.items.map((it, j) => (
                <View key={`li-${i}-${j}`} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{renderInline(it, `li-${i}-${j}`)}</Text>
                </View>
              ))}
            </View>
          );
        }
        return null;
      })}
    </View>
  );
}

export default function LegalPage({ title, kicker, updated, intro, sections, testID }) {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={TOP_EDGES} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          testID={`${testID}-back`}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.textSoft} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {updated ? <Text style={styles.updated}>Last updated {updated}</Text> : null}
        {intro ? <Text style={styles.intro}>{renderInline(intro, 'intro')}</Text> : null}

        {sections.map((s) => (
          <Section key={s.heading} heading={s.heading} body={s.body} />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Contact Tidyups Cleaning Inc. at{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('mailto:hello@tidyupscleaning.com')}>
              hello@tidyupscleaning.com
            </Text>{' '}
            or call{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('tel:+17807185092')}>
              (780) 718-5092
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: COLORS.textSoft, fontFamily: FONTS.bodyMedium, fontSize: 14 },
  scroll: { paddingHorizontal: 22, paddingBottom: 60, maxWidth: 780, alignSelf: 'center', width: '100%' },
  kicker: {
    color: COLORS.pink,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 32, lineHeight: 38, marginBottom: 8 },
  updated: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13, marginBottom: 22 },
  intro: { color: COLORS.textSoft, fontFamily: FONTS.body, fontSize: 15, lineHeight: 24, marginBottom: 26 },
  section: { marginBottom: 26 },
  heading: { color: COLORS.text, fontFamily: FONTS.heading, fontSize: 18, marginBottom: 10 },
  paragraph: { color: COLORS.textSoft, fontFamily: FONTS.body, fontSize: 14.5, lineHeight: 23, marginBottom: 10 },
  list: { marginBottom: 10 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bullet: { color: COLORS.pink, fontFamily: FONTS.bodySemiBold, fontSize: 15, lineHeight: 23 },
  listText: { color: COLORS.textSoft, fontFamily: FONTS.body, fontSize: 14.5, lineHeight: 23, flex: 1 },
  strong: { color: COLORS.text, fontFamily: FONTS.bodySemiBold },
  link: { color: COLORS.pink, fontFamily: FONTS.bodySemiBold, textDecorationLine: 'underline' },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: { color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13.5, lineHeight: 21 },
});
