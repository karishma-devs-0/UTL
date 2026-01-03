import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#00875A',
  white: '#fff',
  textPrimary: '#333',
  borderLight: '#eee',
};

const InverterAppBar = ({ 
  title, 
  onBackPress,
  onMenuPress,
  showMenu = false,
  menuIconName = 'more-vert',
  rightActionLabel,
  rightActionIconName,
  onRightActionPress,
  rightActionColor
}) => {
  const navigation = useNavigation();

  const showRightAction = !showMenu && (rightActionLabel || rightActionIconName) && typeof onRightActionPress === 'function';
  const effectiveRightActionColor = rightActionColor || COLORS.primary;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.white}
        translucent={false}
      />
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.iconButton}
          hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text numberOfLines={1} style={styles.title}>{title || 'Inverter Details'}</Text>

        {showMenu ? (
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Icon name={menuIconName || 'more-vert'} size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : showRightAction ? (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={styles.rightActionButton}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
            activeOpacity={0.85}
          >
            {rightActionIconName ? (
              <Icon name={rightActionIconName} size={18} color={effectiveRightActionColor} />
            ) : null}
            {rightActionLabel ? (
              <Text style={[styles.rightActionText, { color: effectiveRightActionColor }]} numberOfLines={1}>
                {rightActionLabel}
              </Text>
            ) : null}
          </TouchableOpacity>
        ) : (
          <>
            {/* Empty view to balance spacing */}
            <View style={styles.iconPlaceholder} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
    width: '100%',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    height: 50,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  rightActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    maxWidth: 160,
    paddingHorizontal: 10,
  },
  rightActionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginHorizontal: 8,
    textAlign: 'center',
  },
});

export default InverterAppBar;