import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [email, setEmail] = useState('');

  // Product carousel data
  const carouselData = [
    {
      id: '1',
      title: 'Infinix Zero30 5G',
      subtitle: '128GB',
      price: '₹21,999',
      offer: 'AXIS BANK +₹2000',
      image: 'https://via.placeholder.com/300',
      badge: 'Sale Is On',
    },
  ];

  // Service categories
  const serviceCategories = [
    {
      id: '1',
      title: 'Rental',
      description: 'Get your desired products on rent for a specific period of time.',
      image: 'https://via.placeholder.com/400x300?text=Rental',
      color: '#34C759',
    },
    {
      id: '2',
      title: 'Credit',
      description: 'Get your desired products on credit for a specific period of time.',
      image: 'https://via.placeholder.com/400x300?text=Credit',
      color: '#FF3B30',
      badge: '20% OFF',
    },
    {
      id: '3',
      title: 'AMC / AMLC',
      description: 'Get your desired products on AMC / AMLC for a specific period of time.',
      image: 'https://via.placeholder.com/400x300?text=AMC',
      color: '#34C759',
      badge: '20% OFF',
    },
  ];

  // Services list
  const services = [
    {
      id: '1',
      title: 'AC Service',
      description: 'Professional AC Installation, repair and maintenance services.',
      icon: 'ac-unit',
      color: '#FF3B30',
    },
    {
      id: '2',
      title: 'Printer Service',
      description: 'Expert printer repair, maintenance and troubleshooting.',
      icon: 'print',
      color: '#9C27B0',
    },
    {
      id: '3',
      title: 'Toner & Cartridge',
      description: 'Quality toner and cartridge refill for all printer models.',
      icon: 'inventory',
      color: '#FF9800',
    },
    {
      id: '4',
      title: 'Waterproof & Paint',
      description: 'Professional waterproofing and painting solutions.',
      icon: 'format-paint',
      color: '#4CAF50',
    },
    {
      id: '5',
      title: 'Mobile Service',
      description: 'Complete mobile repair and maintenance services.',
      icon: 'phone-android',
      color: '#00BCD4',
    },
    {
      id: '6',
      title: 'Computer Service',
      description: 'Comprehensive computer repair and support services.',
      icon: 'computer',
      color: '#9C27B0',
    },
    {
      id: '7',
      title: 'CCTV/Camera Fixing',
      description: 'Professional CCTV installation and maintenance services.',
      icon: 'videocam',
      color: '#E91E63',
    },
  ];

  // Products (Coming Soon)
  const products = [
    {
      id: '1',
      title: 'Foods',
      image: 'https://via.placeholder.com/400x300?text=Foods',
      badgeColor: '#FF3B30',
    },
    {
      id: '2',
      title: 'Events Management',
      image: 'https://via.placeholder.com/400x300?text=Events',
      badgeColor: '#9C27B0',
    },
    {
      id: '3',
      title: 'Printer & Toner',
      image: 'https://via.placeholder.com/400x300?text=Printer',
      badgeColor: '#4CAF50',
    },
    {
      id: '4',
      title: 'CCTV Camera Fixing',
      image: 'https://via.placeholder.com/400x300?text=CCTV',
      badgeColor: '#9C27B0',
    },
    {
      id: '5',
      title: 'Computer Service',
      image: 'https://via.placeholder.com/400x300?text=Computer',
      badgeColor: '#007AFF',
    },
    {
      id: '6',
      title: 'Stationery',
      image: 'https://via.placeholder.com/400x300?text=Stationery',
      badgeColor: '#666',
    },
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Create Rental Enquiry',
      icon: 'receipt-long',
      screen: 'CreateRentalEnquiry',
      color: '#007AFF',
      requiresAuth: true,
    },
    {
      id: '2',
      title: 'Create Service Enquiry',
      icon: 'build',
      screen: 'CreateServiceEnquiry',
      color: '#34C759',
      requiresAuth: true,
    },
    {
      id: '3',
      title: 'Create Company',
      icon: 'business',
      screen: 'CreateCompany',
      color: '#FF9500',
      requiresAuth: true,
    },
  ];

  const handleActionPress = (action: typeof quickActions[0]) => {
    if (action.requiresAuth && !isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to access this feature',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
      return;
    }
    navigation.navigate(action.screen as never);
  };

  const handleNewsletterSubmit = () => {
    if (email) {
      Alert.alert('Success', 'Thank you for subscribing!');
      setEmail('');
    }
  };

  const renderCarouselItem = ({ item }: { item: typeof carouselData[0] }) => (
    <View style={styles.carouselItem}>
      <View style={styles.carouselContent}>
        <View style={styles.carouselText}>
          <Text style={styles.carouselTitle}>{item.title}</Text>
          <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>
          <Text style={styles.carouselPrice}>From {item.price}</Text>
          <View style={styles.carouselBadge}>
            <Text style={styles.carouselBadgeText}>{item.badge}</Text>
          </View>
          <View style={styles.offerBadge}>
            <Text style={styles.offerText}>{item.offer}</Text>
          </View>
        </View>
        <Image source={{ uri: item.image }} style={styles.carouselImage} />
      </View>
    </View>
  );

  const renderServiceCategory = ({ item }: { item: typeof serviceCategories[0] }) => (
    <TouchableOpacity style={styles.categoryCard}>
      {item.badge && (
        <View style={[styles.categoryBadge, { backgroundColor: item.color }]}>
          <Text style={styles.categoryBadgeText}>{item.badge}</Text>
        </View>
      )}
      <Image source={{ uri: item.image }} style={styles.categoryImage} />
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
        <TouchableOpacity style={[styles.viewCollectionBtn, { borderColor: item.color }]}>
          <Text style={[styles.viewCollectionText, { color: item.color }]}>
            View Collection
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderService = ({ item }: { item: typeof services[0] }) => (
    <TouchableOpacity style={styles.serviceCard}>
      <View style={[styles.serviceIconContainer, { backgroundColor: item.color }]}>
        <Icon name={item.icon} size={30} color="#fff" />
      </View>
      <Text style={styles.serviceTitle}>{item.title}</Text>
      <Text style={styles.serviceDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: typeof products[0] }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={[styles.comingSoonBadge, { backgroundColor: item.badgeColor }]}>
        <Text style={styles.comingSoonText}>COMING SOON</Text>
      </View>
      <Text style={styles.productTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>
            corp <Text style={styles.logoAccent}>culture</Text>
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Cart' as never)}
            >
              <Icon name="shopping-cart" size={24} color="#fff" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                navigation.navigate(isAuthenticated ? 'Profile' : 'Login' as never)
              }
            >
              <Icon name="person" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {isAuthenticated && (
          <View style={styles.headerBottom}>
            <Text style={styles.greeting}>Welcome, {user?.name || 'User'}!</Text>
          </View>
        )}
      </View>

      {/* Product Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={carouselData}
          renderItem={renderCarouselItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentCarouselIndex(index);
          }}
        />
        <View style={styles.carouselIndicators}>
          {carouselData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentCarouselIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Service Categories */}
      <View style={styles.section}>
        <FlatList
          data={serviceCategories}
          renderItem={renderServiceCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Our Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <Text style={styles.sectionSubtitle}>
          We offer a comprehensive range of technological solutions to excel in your business.
        </Text>
        <FlatList
          data={services}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.servicesList}
        />
      </View>

      {/* Quick Actions (Authenticated Only) */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleActionPress(action)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                <Icon name={action.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Icon name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Our Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Products</Text>
        <Text style={styles.sectionSubtitle}>
          Featuring new product lines coming soon to expand our offerings.
        </Text>
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsList}
        />
        <TouchableOpacity style={styles.getUpdatesButton}>
          <Text style={styles.getUpdatesText}>Get Updates</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>
          corp <Text style={styles.footerLogoAccent}>culture</Text>
        </Text>

        {/* Newsletter */}
        <View style={styles.newsletterContainer}>
          <Text style={styles.newsletterTitle}>Sign Up For Offers And Promotions!</Text>
          <View style={styles.newsletterInputContainer}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="Enter your email address..."
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.newsletterButton}
              onPress={handleNewsletterSubmit}
            >
              <Icon name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          <Text style={styles.contactText}>Phone: 9830010031</Text>
          <Text style={styles.contactText}>Email: corp.culture@gmail.com</Text>
          <Text style={styles.contactText}>
            A Block, Sunny Plaza No. 15/18, Kaka Ayyan Road, Metro Nagar, Selaiyur, Chennai -
            600 073
          </Text>
          <TouchableOpacity style={styles.directionsButton}>
            <Text style={styles.directionsText}>Get Directions +</Text>
          </TouchableOpacity>
        </View>

        {/* Hours */}
        <View style={styles.hoursContainer}>
          <Text style={styles.hoursTitle}>Hours of Operation</Text>
          <Text style={styles.hoursText}>Open 7 Days a Week</Text>
          <Text style={styles.hoursText}>9:00 AM - 7:00 PM</Text>
          <Text style={styles.hoursText}>
            Closed On: New Year's Day, Diwali, Thanksgiving Day, Christmas Day
          </Text>
        </View>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={styles.footerLink}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          Corp Culture © 2023. All Rights Reserved.
        </Text>
        <Text style={styles.designCredit}>Designed by Nickname Infotech</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoAccent: {
    color: '#4CAF50',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  carouselContainer: {
    height: 200,
    backgroundColor: '#fff',
  },
  carouselItem: {
    width,
    height: 200,
  },
  carouselContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    height: '100%',
  },
  carouselText: {
    flex: 1,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  carouselSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  carouselPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  carouselBadge: {
    backgroundColor: '#FF3B30',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginBottom: 10,
  },
  carouselBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  offerBadge: {
    alignSelf: 'flex-start',
  },
  offerText: {
    fontSize: 12,
    color: '#666',
  },
  carouselImage: {
    width: 120,
    height: 160,
    resizeMode: 'contain',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
    width: 20,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  categoryList: {
    paddingRight: 20,
  },
  categoryCard: {
    width: width * 0.85,
    marginRight: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  categoryContent: {
    padding: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  viewCollectionBtn: {
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  viewCollectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  servicesList: {
    paddingTop: 10,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    margin: 5,
    alignItems: 'center',
    minHeight: 150,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productsList: {
    paddingTop: 10,
  },
  productCard: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 10,
    textAlign: 'center',
  },
  getUpdatesButton: {
    backgroundColor: '#00BCD4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  getUpdatesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#1a237e',
    padding: 20,
    marginTop: 10,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  footerLogoAccent: {
    color: '#4CAF50',
  },
  newsletterContainer: {
    marginBottom: 25,
  },
  newsletterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  newsletterInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  newsletterInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  newsletterButton: {
    backgroundColor: '#00BCD4',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactContainer: {
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
    lineHeight: 20,
  },
  directionsButton: {
    marginTop: 10,
  },
  directionsText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  hoursContainer: {
    marginBottom: 20,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  hoursText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  footerLink: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  copyright: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 5,
  },
  designCredit: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default HomeScreen;
