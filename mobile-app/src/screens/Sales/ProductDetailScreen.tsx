import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedProduct, setLoading } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { productService } from '../../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const getDeliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toUTCString().substring(0, 11);
};

const ProductDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { productId } = route.params as { productId: string };
  const dispatch = useDispatch();
  const { selectedProduct, isLoading } = useSelector((state: RootState) => state.product);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewAllReviews, setViewAllReviews] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    dispatch(setLoading(true));
    try {
      const response = await productService.getProduct(productId);
      dispatch(setSelectedProduct(response.data.product));
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const itemInCart = cartItems.some((item) => item.productId === productId);

  const getPriceForQuantity = (qty: number, prod: any) => {
    if (!prod?.priceRange?.length) return prod?.discountPrice ?? prod?.price ?? 0;
    const range = prod.priceRange.find(
      (r: any) => qty >= parseFloat(r.from) && qty <= parseFloat(r.to)
    );
    return range ? parseFloat(range.price) : (prod?.discountPrice ?? prod?.price ?? 0);
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      const product = selectedProduct as any;
      const productImage = product.images && product.images.length > 0
        ? product.images[0].url
        : 'https://via.placeholder.com/300';

      dispatch(
        addToCart({
          productId: product._id,
          name: product.name,
          price: product.price || 0,
          discountPrice: product.discountPrice,
          quantity,
          image: productImage,
          images: product.images,
          priceRange: product.priceRange,
          deliveryCharge: product.deliveryCharge ?? 0,
          installationCost: product.installationCost ?? 0,
          isInstalation: product.isInstalation ?? false,
          sendInvoice: product.sendInvoice ?? false,
          brandName: product.brand?.name ?? product.brandName,
          stock: product.stock,
        })
      );
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${product.name} added to cart`,
      });
    }
  };

  const goToCart = () => {
    (navigation as any).navigate('Cart');
  };

  const buyNow = () => {
    handleAddToCart();
    (navigation as any).navigate('Cart');
  };

  const renderImageItem = ({ item, index }: { item: any; index: number }) => (
    <Image
      source={{ uri: item.url || 'https://via.placeholder.com/300' }}
      style={styles.productImage}
      resizeMode="contain"
    />
  );

  if (isLoading || !selectedProduct) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const product = selectedProduct as any;
  const productImages = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://via.placeholder.com/300' }];

  const currentUnitPrice = getPriceForQuantity(quantity, product);
  const currentTotal = currentUnitPrice * quantity;
  const maxStock = Math.max(1, product.stock ?? 1);
  const reviews = product.reviews ?? [];
  const displayedReviews = viewAllReviews ? reviews : reviews.slice(-3);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <FlatList
            data={productImages}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => item._id || index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          />
          {productImages.length > 1 && (
            <View style={styles.imageIndicatorContainer}>
              {productImages.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.imageIndicator,
                    currentImageIndex === index && styles.imageIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>

          <Text style={styles.specialPriceLabel}>Special Price</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{Number(product.price ?? 0).toLocaleString()}</Text>
            {product.discountPrice != null && (
              <Text style={styles.originalPrice}>
                ₹{Number(product.discountPrice).toLocaleString()}
              </Text>
            )}
          </View>

          {product.ratings > 0 && (
            <Text style={styles.rating}>
              ⭐ {Number(product.ratings).toFixed(1)} ({product.numOfReviews ?? 0} Reviews)
            </Text>
          )}
          <Text style={styles.stock}>Stock: {product.stock ?? 0} available</Text>

          {product.stock > 0 && (
            <>
              <View style={styles.quantitySection}>
                <Text style={styles.quantitySectionTitle}>Quantity</Text>
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.priceForQuantityRow}>
                  <Text style={styles.priceForQuantityLabel}>
                    Price for {quantity} unit{quantity > 1 ? 's' : ''}:
                  </Text>
                  <Text style={styles.priceForQuantityValue}>
                    ₹{currentUnitPrice.toLocaleString()}
                    {quantity > 1 && (
                      <Text style={styles.priceTotalHint}>
                        {' '}(Total: ₹{currentTotal.toLocaleString()})
                      </Text>
                    )}
                  </Text>
                </View>
                {product.priceRange?.length > 0 && (
                  <View style={styles.priceRangeSection}>
                    <Text style={styles.priceRangeTitle}>Price by quantity</Text>
                    <View style={styles.priceRangeBadges}>
                      {product.priceRange.map((range: any, i: number) => (
                        <View
                          key={i}
                          style={[
                            styles.priceRangeBadge,
                            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
                              ? styles.priceRangeBadgeActive
                              : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.priceRangeBadgeText,
                              quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
                                ? styles.priceRangeBadgeTextActive
                                : null,
                            ]}
                          >
                            {range.from}-{range.to}: ₹{parseFloat(range.price).toLocaleString()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {product.stock <= 10 && product.stock > 0 && (
            <Text style={styles.lowStock}>
              Hurry, Only {product.stock} left!
            </Text>
          )}

          {(product.warranty != null || product.brand?.name || product.corpcultureWarranty || product.orderReferenceNo) && (
            <View style={styles.warrantyRow}>
              {product.warranty != null && (
                <Text style={styles.warrantyText}>
                  {product.warranty === 0 ? 'No Warranty' : `${product.warranty} Year Brand Warranty`}
                </Text>
              )}
              {product.brand?.name && (
                <Text style={styles.warrantyText}>Brand: {product.brand.name}</Text>
              )}
              {product.corpcultureWarranty && (
                <Text style={styles.warrantyText}>Corpculture Warranty: {product.corpcultureWarranty}</Text>
              )}
              {product.orderReferenceNo && (
                <Text style={styles.warrantyText}>Order Ref: {product.orderReferenceNo}</Text>
              )}
            </View>
          )}

          {product.deliveryCharge != null && (
            <Text style={styles.delivery}>
              Delivery by {getDeliveryDate()} | ₹{product.deliveryCharge}
            </Text>
          )}

          <Text style={styles.description}>{product.description}</Text>

          {product.specifications?.length > 0 && (
            <View style={styles.specsSection}>
              <Text style={styles.specsTitle}>Specifications</Text>
              <Text style={styles.specsSubtitle}>General</Text>
              {product.specifications.map((spec: any, i: number) => (
                <View key={i} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.title}</Text>
                  <Text style={styles.specValue}>{spec.description}</Text>
                </View>
              ))}
            </View>
          )}

          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.reviewsTitle}>Ratings & Reviews</Text>
              <View style={styles.reviewsSummary}>
                <Text style={styles.reviewsScore}>
                  {Number(product.ratings ?? 0).toFixed(1)} ⭐
                </Text>
                <Text style={styles.reviewsCount}>({reviews.length} Reviews)</Text>
              </View>
              {displayedReviews.slice().reverse().map((rev: any, i: number) => (
                <View key={i} style={styles.reviewItem}>
                  <Text style={styles.reviewStars}>
                    {'★'.repeat(Math.round(rev.rating))}{'☆'.repeat(5 - Math.round(rev.rating))}
                  </Text>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                  <Text style={styles.reviewBy}>by {rev.name}</Text>
                </View>
              ))}
              {reviews.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllReviewsBtn}
                  onPress={() => setViewAllReviews(!viewAllReviews)}
                >
                  <Text style={styles.viewAllReviewsText}>
                    {viewAllReviews ? 'View Less' : 'View All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {product.stock > 0 && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.addToCartButton, styles.halfButton]}
                onPress={itemInCart ? goToCart : handleAddToCart}
              >
                <Text style={styles.addToCartText}>
                  {itemInCart ? 'Go to Cart' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buyNowButton, styles.halfButton]}
                onPress={buyNow}
              >
                <Text style={styles.addToCartText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          )}
          {product.stock <= 0 && (
            <View style={styles.outOfStockButton}>
              <Text style={styles.addToCartText}>Out of Stock</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
    backgroundColor: '#f9f9f9',
  },
  productImage: {
    width: width,
    height: 350,
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  content: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  specialPriceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  discountPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quantitySection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  quantitySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  priceForQuantityRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
  },
  priceForQuantityLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceForQuantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  priceTotalHint: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  priceRangeSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceRangeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  priceRangeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceRangeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  priceRangeBadgeActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priceRangeBadgeText: {
    fontSize: 12,
    color: '#666',
  },
  priceRangeBadgeTextActive: {
    color: '#fff',
  },
  lowStock: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c00',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  warrantyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  warrantyText: {
    fontSize: 14,
    color: '#555',
  },
  delivery: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  specsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  specsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  specsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
    width: '35%',
  },
  specValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  reviewsSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reviewsScore: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  reviewsCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  reviewStars: {
    fontSize: 14,
    color: '#ffc107',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reviewBy: {
    fontSize: 12,
    color: '#888',
  },
  viewAllReviewsBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  viewAllReviewsText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  halfButton: {
    flex: 1,
  },
  buyNowButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  outOfStockButton: {
    backgroundColor: '#999',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    lineHeight: 24,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  stock: {
    fontSize: 14,
    color: '#34C759',
    marginBottom: 20,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    marginRight: 15,
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 18,
    marginHorizontal: 15,
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;

