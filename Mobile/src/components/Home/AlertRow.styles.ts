import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
alertRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingHorizontal: 16,
paddingVertical: 14,
},

alertLeft: {
flex: 1,
paddingRight: 12,
},

alertName: {
fontSize: 15,
fontWeight: '600',
color: colors.text,
},

alertMeta: {
marginTop: 3,
fontSize: 12,
color: colors.muted,
},

alertRight: {
alignItems: 'flex-end',
gap: 6,
},

alertStock: {
fontSize: 16,
fontWeight: '700',
color: colors.text,
},

alertUnit: {
fontSize: 12,
fontWeight: '500',
color: colors.muted,
},

badge: {
paddingHorizontal: 8,
paddingVertical: 3,
borderRadius: 999,
},

badgeText: {
fontSize: 11,
fontWeight: '700',
},
});