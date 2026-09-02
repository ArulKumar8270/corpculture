import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TrashViewMode } from '../utils/trashApi';

type Props = {
    viewMode: TrashViewMode;
    onChange: (mode: TrashViewMode) => void;
};

const TrashStatusToggle = ({ viewMode, onChange }: Props) => (
    <View style={styles.container}>
        <TouchableOpacity
            style={[styles.button, viewMode === 'active' && styles.activeButton]}
            onPress={() => onChange('active')}
        >
            <Text style={[styles.text, viewMode === 'active' && styles.activeText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.button, viewMode === 'trash' && styles.activeButton]}
            onPress={() => onChange('trash')}
        >
            <Text style={[styles.text, viewMode === 'trash' && styles.activeText]}>Trash</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#019ee3',
        alignSelf: 'flex-start',
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    activeButton: {
        backgroundColor: '#019ee3',
    },
    text: {
        color: '#019ee3',
        fontWeight: '600',
    },
    activeText: {
        color: '#fff',
    },
});

export default TrashStatusToggle;
