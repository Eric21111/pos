import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get('window');

const initialNotifications = [
  { 
    id: "1", 
    title: "Product #ILY143 is updated", 
    description: "The product details have been successfully updated.",
    time: "2 mins ago",
    isRead: false 
  },
  { 
    id: "2", 
    title: "PIN was changed successfully", 
    description: "Your account PIN has been updated.",
    time: "10 mins ago",
    isRead: false 
  },
  { 
    id: "3", 
    title: "Product #SKU111 is updated", 
    description: "New stock has been added to this product.",
    time: "1 hr ago",
    isRead: false 
  },
  { 
    id: "4", 
    title: "PIN was changed successfully", 
    description: "Your account PIN has been updated.",
    time: "12 hr ago",
    isRead: false 
  },
  { 
    id: "5", 
    title: "Product #SKU765 is updated", 
    description: "Product price has been adjusted.",
    time: "24 hr ago",
    isRead: false 
  },
  { 
    id: "6", 
    title: "Product #UYP123 is updated", 
    description: "Product category has been updated.",
    time: "24 hr ago",
    isRead: false 
  },
];

export default function Notification() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isMarkingAll, setIsMarkingAll] = useState(false);


  const handleMarkAsRead = () => {
    if (isMarkingAll) return;
    
    setIsMarkingAll(true);
    
    // Simulate API call
    setTimeout(() => {
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
      setIsMarkingAll(false);
    }, 500);
  };

  const markAsRead = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const fadeAnim = useState(new Animated.Value(1))[0];

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0.6,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      handleMarkAsRead();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#76462B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            onPress={handleMarkAll}
            style={[styles.markAllButton, (unreadCount === 0 || isMarkingAll) && styles.disabledButton]}
            disabled={unreadCount === 0 || isMarkingAll}
            activeOpacity={0.7}
          >
            <Text style={[styles.markAllText, unreadCount === 0 && styles.disabledText]}>
              {isMarkingAll ? 'Marking...' : 'Mark All Read'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
            </Text>
          </View>
        )}
      </View>

      {/* Notification List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.card,
                !item.isRead && styles.unreadCard
              ]}
              activeOpacity={0.8}
              onPress={() => !item.isRead && markAsRead(item.id)}
            >
              <View style={[
                styles.iconContainer,
                item.isRead ? styles.iconRead : styles.iconUnread
              ]}>
                <Ionicons 
                  name={item.isRead ? "notifications-off-outline" : "notifications-outline"} 
                  size={20} 
                  color={item.isRead ? "#888" : "#AD7F65"} 
                />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={[
                    styles.title,
                    item.isRead && styles.readTitle
                  ]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.description}>
                  {item.description}
                </Text>
                <Text style={styles.time}>
                  {item.time}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={60} color="#E0E0E0" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>You're all caught up!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F5F0",
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0E6DD',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3E3E3E',
    marginLeft: 15,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 12,
    marginLeft: 8,
    backgroundColor: '#F5EFE9',
  },
  disabledButton: {
    opacity: 0.5,
  },
  unreadBadge: {
    backgroundColor: '#FFE8E0',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 10,
    marginLeft: 20,
  },
  unreadText: {
    color: '#D45D3E',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    paddingTop: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#D45D3E',
    backgroundColor: '#FFFCFA',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  iconUnread: {
    backgroundColor: '#FFEDE6',
  },
  iconRead: {
    backgroundColor: '#F5F5F5',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginRight: 6,
    lineHeight: 20,
  },
  readTitle: {
    color: '#6E6E6E',
    fontWeight: '500',
  },
  description: {
    fontSize: 13.5,
    color: '#5A5A5A',
    marginBottom: 8,
    lineHeight: 19,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#8E8E8E',
    fontWeight: '500',
    marginTop: 2,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0E6DD',
  },
  markAllText: {
    color: '#76462B',
    fontWeight: '600',
    fontSize: 13,
  },
  disabledText: {
    color: '#AAA',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D45D3E',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E3E3E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
  },
});
