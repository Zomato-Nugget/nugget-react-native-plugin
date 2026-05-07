import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.purpleDark,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.whiteTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.whiteBorderSubtle,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.whiteFaint,
    marginTop: 2,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  badge: {
    marginTop: 12,
    backgroundColor: colors.whiteBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.whiteBorderStrong,
  },
  badgeText: {
    color: colors.whiteMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.whiteBorder,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.whiteBorder,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    color: colors.whiteGhost,
    fontSize: 13,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  halfButtonIcon: {
    color: colors.white,
    fontSize: 18,
    marginBottom: 4,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
  },
  buttonPrimary: {
    backgroundColor: colors.purpleMid,
  },
  buttonAccent: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.whiteTint,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.whiteBorderStrong,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  buttonTextGhost: {
    color: colors.whiteFaint,
    fontWeight: '600',
  },
  buttonSublabel: {
    color: colors.whiteGhost,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center' as const,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.whiteBorder,
  },
  resultDot: {
    color: colors.green,
    fontSize: 10,
  },
  resultText: {
    color: colors.whiteMuted,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
