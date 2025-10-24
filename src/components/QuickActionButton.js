import React from 'react';
import { Button } from 'react-native-paper';

const QuickActionButton = ({ icon, text, onPress }) => (
  <Button icon={icon} mode="contained" onPress={onPress}>
    {text}
  </Button>
);

export default QuickActionButton;
