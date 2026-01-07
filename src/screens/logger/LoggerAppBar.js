import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#00875A',
  white: '#fff',
  textPrimary: '#333',
  borderLight: '#eee',
};

const LoggerAppBar = ({ 
  title, 
  onBackPress, 
  onMenuPress,
  showMenu = true,
  menuIconName = 'more-vert'
}) => {
  const navigation = useNavigation();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.white}
        translucent={false}
      />
      <View style={styles.container}>
        <View style={styles.appBar}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.title}>{title || 'Logger Details'}</Text>

          {showMenu ? (
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
            >
              <Icon name={menuIconName || 'more-vert'} size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
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
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginHorizontal: 8,
    textAlign: 'center',
  },
});

export default LoggerAppBar; import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#00875A',
  white: '#fff',
  textPrimary: '#333',
  borderLight: '#eee',
};

const LoggerAppBar = ({ 
  title, 
  onBackPress, 
  onMenuPress,
  showMenu = true 
}) => {
  const navigation = useNavigation();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.white}
        translucent={false}
      />
      <View style={styles.container}>
        <View style={styles.appBar}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.title}>{title || 'Logger Details'}</Text>

          {showMenu ? (
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
            >
              <Icon name="more-vert" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
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
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginHorizontal: 8,
    textAlign: 'center',
  },
});


export default LoggerAppBar; 
