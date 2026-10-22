import { Platform, StyleSheet } from 'react-native';

import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
safe: {
flex: 1,
backgroundColor: colors.background,
},

scroll: {
paddingHorizontal: 20,
paddingBottom: 32,
},

kpiGrid: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: 12,
marginBottom: 28,
},

sectionHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: 8,
marginBottom: 12,
},

sectionTitle: {
fontSize: 17,
fontWeight: '700',
color: colors.text,
marginBottom: 12,
},

countChip: {
backgroundColor: colors.warningBg,
paddingHorizontal: 8,
paddingVertical: 2,
borderRadius: 999,
marginBottom: 12,
},

countChipText: {
fontSize: 12,
fontWeight: '700',
color: colors.warning,
},

quickRow: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 28,
},

card: {
backgroundColor: colors.surface,
borderRadius: 16,
borderWidth: 1,
borderColor: colors.border,
overflow: 'hidden',

...Platform.select({
  ios: {
    shadowColor: '#3E2723',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  android: {
    elevation: 1,
  },
}),

},

divider: {
height: StyleSheet.hairlineWidth,
backgroundColor: colors.border,
marginLeft: 16,
},

empty: {
alignItems: 'center',
paddingVertical: 28,
paddingHorizontal: 20,
},

emptyEmoji: {
fontSize: 28,
marginBottom: 8,
},

emptyTitle: {
fontSize: 16,
fontWeight: '700',
color: colors.text,
},

emptyText: {
marginTop: 4,
fontSize: 13,
color: colors.muted,
textAlign: 'center',
},

seeAll: {
marginTop: 16,
alignItems: 'center',
paddingVertical: 12,
},

seeAllText: {
fontSize: 14,
fontWeight: '600',
color: colors.accent,
},
});