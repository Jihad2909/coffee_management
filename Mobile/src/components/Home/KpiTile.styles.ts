import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
kpiTile: {
width: '47.5%',
backgroundColor: colors.surface,
borderRadius: 16,
paddingVertical: 16,
paddingHorizontal: 14,
borderWidth: 1,
borderColor: colors.border,

...Platform.select({
  ios: {
    shadowColor: '#3E2723',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  android: {
    elevation: 2,
  },
}),

},

kpiValue: {
fontSize: 26,
fontWeight: '700',
letterSpacing: -0.5,
},

kpiLabel: {
marginTop: 4,
fontSize: 13,
color: colors.muted,
fontWeight: '500',
},
});