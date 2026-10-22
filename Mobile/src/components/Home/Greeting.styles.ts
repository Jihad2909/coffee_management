import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
greetingBlock: {
marginTop: 8,
marginBottom: 20,
},

greeting: {
fontSize: 15,
color: colors.muted,
fontWeight: '500',
},

shopName: {
marginTop: 4,
fontSize: 28,
fontWeight: '700',
color: colors.primary,
letterSpacing: -0.5,
},

subtitle: {
marginTop: 6,
fontSize: 14,
color: colors.muted,
lineHeight: 20,
},
});
