import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SYNC_LOGS_KEY = '@sync_logs';

const SyncLog = () => {
  const [syncLogs, setSyncLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  // Load sync logs from AsyncStorage on component mount
  useEffect(() => {
    loadSyncLogs();
  }, []);

  const createSampleLogs = () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    return [
      {
        timestamp: now - oneHour, // 1 hour ago
        status: 'success',
        itemsSynced: [
          { name: 'Products', status: 'success' },
          { name: 'Inventory', status: 'success' },
          { name: 'Customers', status: 'success' },
          { name: 'Orders', status: 'success' },
        ]
      },
      {
        timestamp: now - 3 * oneHour, // 3 hours ago
        status: 'failed',
        itemsSynced: [
          { name: 'Products', status: 'success' },
          { name: 'Inventory', status: 'failed' },
          { name: 'Customers', status: 'success' },
          { name: 'Orders', status: 'pending' },
        ]
      },
      {
        timestamp: now - oneDay, // 1 day ago
        status: 'success',
        itemsSynced: [
          { name: 'Products', status: 'success' },
          { name: 'Inventory', status: 'success' },
          { name: 'Customers', status: 'success' },
        ]
      },
      {
        timestamp: now - 2 * oneDay, // 2 days ago
        status: 'success',
        itemsSynced: [
          { name: 'Products', status: 'success' },
          { name: 'Inventory', status: 'success' },
          { name: 'Price List', status: 'success' },
        ]
      }
    ];
  };

  const loadSyncLogs = async () => {
    try {
      let logsJson = await AsyncStorage.getItem(SYNC_LOGS_KEY);
      let logs = [];
      
      if (logsJson) {
        logs = JSON.parse(logsJson);
      } else {
        // If no logs exist, create sample logs
        logs = createSampleLogs();
        await AsyncStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(logs));
      }
      
      setSyncLogs(logs);
    } catch (error) {
      console.error('Failed to load sync logs', error);
    }
  };

  // Format date to readable string
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render each sync log item
  const renderLogItem = ({ item }) => (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => setSelectedLog(item)}
    >
      <View style={styles.logHeader}>
        <MaterialIcons 
          name={item.status === 'success' ? 'check-circle' : 'error'} 
          size={24} 
          color={item.status === 'success' ? '#4CAF50' : '#F44336'} 
        />
        <Text style={styles.logDate}>{formatDate(item.timestamp)}</Text>
        <Text style={[styles.logStatus, { color: item.status === 'success' ? '#4CAF50' : '#F44336' }]}>
          {item.status === 'success' ? 'Success' : 'Failed'}
        </Text>
      </View>
      <Text style={styles.logSummary}>
        {item.itemsSynced?.length || 0} items synced
      </Text>
    </TouchableOpacity>
  );

  // Render sync details
  const renderLogDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>Sync Details</Text>
        <TouchableOpacity onPress={() => setSelectedLog(null)}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.detailText}>
        <Text style={styles.detailLabel}>Date: </Text>
        {formatDate(selectedLog.timestamp)}
      </Text>
      
      <Text style={styles.detailText}>
        <Text style={styles.detailLabel}>Status: </Text>
        <Text style={{ color: selectedLog.status === 'success' ? '#4CAF50' : '#F44336' }}>
          {selectedLog.status === 'success' ? 'Success' : 'Failed'}
        </Text>
      </Text>
      
      <Text style={styles.detailLabel}>Items Synced ({selectedLog.itemsSynced?.length || 0}):</Text>
      
      <ScrollView style={styles.itemsList}>
        {selectedLog.itemsSynced?.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemStatus}>
              {item.status === 'success' ? '✓' : '✗'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync operation (replace with your actual sync logic)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a new sync log entry
      const newLog = {
        timestamp: Date.now(),
        status: 'success',
        itemsSynced: [
          { name: 'Products', status: 'success' },
          { name: 'Inventory', status: 'success' },
          { name: 'Customers', status: 'success' },
        ]
      };
      
      // Save the new log
      const updatedLogs = [newLog, ...syncLogs];
      await AsyncStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(updatedLogs));
      setSyncLogs(updatedLogs);
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Sync History</Text>
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          <MaterialIcons 
            name={isSyncing ? 'refresh' : 'sync'} 
            size={20} 
            color="#fff"
            style={isSyncing ? styles.rotate : null}
          />
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {selectedLog ? (
        renderLogDetails()
      ) : (
        <FlatList
          data={syncLogs.sort((a, b) => b.timestamp - a.timestamp)}
          renderItem={renderLogItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sync history found</Text>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  logItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logDate: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  logStatus: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  logSummary: {
    color: '#666',
    fontSize: 14,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  detailText: {
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  itemsList: {
    maxHeight: 300,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    flex: 1,
    color: '#333',
  },
  itemStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#AD7F65',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
  },
  syncButtonDisabled: {
    backgroundColor: '#AD7F65',
  },
  syncButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  rotate: {
    transform: [{ rotate: '360deg' }],
    animationKey: 'spin',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
});

export default SyncLog;