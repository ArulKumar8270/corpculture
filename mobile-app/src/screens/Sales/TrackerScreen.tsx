import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface TrackerScreenProps {
  activeStep: number;
  orderOn?: string;
}

const formatDate = (dt: string) => {
  if (!dt) return '';
  return new Date(dt).toUTCString().substring(0, 16);
};

const TrackerScreen: React.FC<TrackerScreenProps> = ({ activeStep, orderOn }) => {
  const steps = [
    {
      status: 'Ordered',
      dt: orderOn ? formatDate(orderOn) : undefined,
    },
    {
      status: 'Shipped',
    },
    {
      status: 'Out For Delivery',
    },
    {
      status: 'Delivered',
    },
  ];

  return (
    <View style={styles.container}>
      {steps.map((item, index) => {
        const isCompleted = activeStep >= index;
        const isActive = activeStep === index;

        return (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepContent}>
              <View style={[styles.stepIcon, isCompleted ? styles.stepIconCompleted : styles.stepIconPending]}>
                {isCompleted ? (
                  <Icon name="check-circle" size={24} color="#22ba20" />
                ) : (
                  <Icon name="radio-button-unchecked" size={24} color="#ccc" />
                )}
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepStatus, isCompleted ? styles.stepStatusCompleted : styles.stepStatusPending]}>
                  {item.status}
                </Text>
                {item.dt && isCompleted && (
                  <Text style={styles.stepDate}>{item.dt}</Text>
                )}
              </View>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.connector, isCompleted ? styles.connectorCompleted : styles.connectorPending]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
  },
  stepContainer: {
    position: 'relative',
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconCompleted: {
    backgroundColor: '#e8f5e9',
  },
  stepIconPending: {
    backgroundColor: '#f5f5f5',
  },
  stepInfo: {
    flex: 1,
    paddingTop: 4,
  },
  stepStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepStatusCompleted: {
    color: '#22ba20',
  },
  stepStatusPending: {
    color: '#999',
  },
  stepDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  connector: {
    width: 2,
    height: 30,
    marginLeft: 15,
    marginBottom: 8,
  },
  connectorCompleted: {
    backgroundColor: '#22ba20',
  },
  connectorPending: {
    backgroundColor: '#e0e0e0',
  },
});

export default TrackerScreen;
