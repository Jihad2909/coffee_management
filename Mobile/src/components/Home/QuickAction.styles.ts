import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
quickAction: {
alignItems: 'center',
width: '23%',
},

quickActionIcon: {
width: 56,
height: 56,
borderRadius: 16,
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.border,
alignItems: 'center',
justifyContent: 'center',
marginBottom: 8,
},

quickActionEmoji: {
fontSize: 22,
},

quickActionLabel: {
fontSize: 11,
fontWeight: '600',
color: colors.muted,
textAlign: 'center',
},
});