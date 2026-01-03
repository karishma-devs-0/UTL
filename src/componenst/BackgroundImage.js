import React from 'react';
import { Image } from 'react-native';
import bgImg from '../assets/cover.jpg';
import styles from '../styles/style';

const BackgroundImage = () => {
  return <Image source={bgImg} style={styles.image} />;
};

export default BackgroundImage;