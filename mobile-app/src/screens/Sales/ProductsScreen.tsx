import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setProducts, setLoading } from '../../store/slices/productSlice';
import { categoryService } from '../../services/api';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import CompanyToggleHeader from '../../components/CompanyToggleHeader';

const ProductsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.product);
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter states
  const [price, setPrice] = useState([0, 200000]);
  const [category, setCategory] = useState('');
  const [ratings, setRatings] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchFilteredProducts();
  }, []);

  useEffect(() => {
    fetchFilteredProducts();
  }, [price, category, ratings]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1'}/product/filtered-products`,
        {
          params: {
            category: category,
            priceRange: [
              parseInt(price[0].toFixed()),
              parseInt(price[1].toFixed()),
            ],
            ratings: ratings,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        setProducts(response.data.products || []);
        setCurrentPage(1); // Reset to first page when filters change
      } else if (response.status === 404) {
        setProducts([]);
        Toast.show({
          type: 'info',
          text1: 'No Products Found',
          text2: 'Try adjusting your filters',
        });
      }
    } catch (error: any) {
      console.error('Error fetching filtered products:', error);
      if (error.response?.status === 500) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong! Please try after sometime.',
        });
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (values: number[]) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setPrice(values);
    }, 500);
  };

  const clearFilters = () => {
    setPrice([0, 200000]);
    setCategory('');
    setRatings(0);
  };

  const renderProduct = ({ item }: { item: any }) => {
    // Get the first image from the images array, or use placeholder
    const productImage = item.images && item.images.length > 0 
      ? item.images[0].url 
      : 'https://via.placeholder.com/300';
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => (navigation as any).navigate('ProductDetail', { productId: item._id })}
      >
        <Image
          source={{ uri: productImage }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <View style={styles.priceContainer}>
            {item.discountPrice ? (
              <>
                <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
                <Text style={styles.originalPrice}>₹{item.price}</Text>
              </>
            ) : (
              <Text style={styles.price}>₹{item.price}</Text>
            )}
          </View>
          {item.ratings > 0 && (
            <Text style={styles.rating}>⭐ {item.ratings} ({item.numOfReviews} reviews)</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <SafeAreaView style={styles.modalOverlay} edges={['top']}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.filterContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterContentContainer}
          >
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>PRICE</Text>
              <View style={styles.priceInputContainer}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={price[0].toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      if (num >= 0 && num <= 200000) {
                        handlePriceChange([num, price[1]]);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <Text style={styles.priceToText}>to</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={price[1].toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 200000;
                      if (num >= 0 && num <= 200000 && num >= price[0]) {
                        handlePriceChange([price[0], num]);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="200000"
                  />
                </View>
              </View>
              <View style={styles.priceRangeInfo}>
                <Text style={styles.priceRangeInfoText}>Range: ₹0 - ₹2,00,000</Text>
              </View>
            </View>

            {/* Category */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>CATEGORY</Text>
              <ScrollView style={styles.categoryList}>
                <TouchableOpacity
                  style={[styles.categoryOption, !category && styles.categoryOptionSelected]}
                  onPress={() => setCategory('')}
                >
                  <Text style={[styles.categoryOptionText, !category && styles.categoryOptionTextSelected]}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[styles.categoryOption, category === cat.name && styles.categoryOptionSelected]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text style={[styles.categoryOptionText, category === cat.name && styles.categoryOptionTextSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Ratings */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>RATINGS</Text>
              <View style={styles.ratingsContainer}>
                {[4, 3, 2, 1].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[styles.ratingOption, ratings === rating && styles.ratingOptionSelected]}
                    onPress={() => setRatings(ratings === rating ? 0 : rating)}
                  >
                    <Text style={[styles.ratingStars, ratings === rating && styles.ratingStarsSelected]}>
                      {'⭐'.repeat(rating)} {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Icon name="filter-list" size={24} color="#007AFF" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <CompanyToggleHeader />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={currentProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={fetchFilteredProducts}
          />
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Text style={styles.paginationButtonText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                Page {currentPage} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.paginationButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 10,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  filterContentContainer: {
    paddingBottom: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#afcb09',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    color: '#333',
  },
  priceToText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceRangeInfo: {
    marginTop: 10,
  },
  priceRangeInfoText: {
    fontSize: 12,
    color: '#666',
  },
  categoryList: {
    maxHeight: 200,
  },
  categoryOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#333',
  },
  categoryOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  ratingsContainer: {
    gap: 10,
  },
  ratingOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ratingOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ratingStars: {
    fontSize: 14,
    color: '#333',
  },
  ratingStarsSelected: {
    color: '#fff',
  },
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductsScreen;

