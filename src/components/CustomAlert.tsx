import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  FadeIn,
  FadeOut,
  ScaleInCenter,
  ScaleOutCenter
} from 'react-native-reanimated';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react-native';
import { useTheme } from '../services/theme';
import { AlertType } from '../services/AlertContext';

const { width } = Dimensions.get('window');

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface CustomAlertProps {
  options: AlertOptions;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomAlertComponent: React.FC<CustomAlertProps> = ({ 
  options, 
  visible, 
  onConfirm, 
  onCancel 
}) => {
  const { colors, dark } = useTheme();
  const type = options.type || 'info';

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={32} color="#10B981" />;
      case 'error': return <XCircle size={32} color="#EF4444" />;
      case 'confirm': return <AlertTriangle size={32} color="#F59E0B" />;
      default: return <Info size={32} color="#1E63D3" />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success': return '#D1FAE5';
      case 'error': return '#FEE2E2';
      case 'confirm': return '#FEF3C7';
      default: return '#DBEAFE';
    }
  };

  const getHeaderIconBg = () => {
    switch (type) {
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'confirm': return 'rgba(245, 158, 11, 0.1)';
      default: return 'rgba(30, 99, 211, 0.1)';
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
        />
        <Animated.View 
          entering={ScaleInCenter.springify().damping(15)}
          exiting={ScaleOutCenter.duration(150)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.iconContainer, { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : getHeaderIconBg() }]}>
            {getIcon()}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{options.title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{options.message}</Text>

          <View style={styles.buttonContainer}>
            {type === 'confirm' && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { backgroundColor: dark ? '#1E293B' : '#F1F5F9' }]} 
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                  {options.cancelLabel || 'Cancel'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.confirmButton, 
                { backgroundColor: type === 'error' ? '#EF4444' : '#1E63D3' },
                type !== 'confirm' && { flex: 0, width: '100%' }
              ]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {options.confirmLabel || (type === 'confirm' ? 'Confirm' : 'OK')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: width * 0.85,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {},
  confirmButton: {
    shadowColor: '#1E63D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
