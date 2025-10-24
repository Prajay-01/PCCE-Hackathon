import React from 'react';
import { Card, Title, Paragraph } from 'react-native-paper';

const SummaryCard = ({ title, content }) => (
  <Card>
    <Card.Content>
      <Title>{title}</Title>
      <Paragraph>{content}</Paragraph>
    </Card.Content>
  </Card>
);

export default SummaryCard;
