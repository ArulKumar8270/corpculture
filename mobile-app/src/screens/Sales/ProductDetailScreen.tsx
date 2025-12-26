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
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedProduct, setLoading } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { productService } from '../../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const ProductDetailScreen = () => {
  const route = useRoute();
  const { productId } = route.params as { productId: string };
  const dispatch = useDispatch();
  const { selectedProduct, isLoading } = useSelector((state: RootState) => state.product);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
          deliveryCharge: product.deliveryCharge || 0,
          installationCost: product.installationCost || 0,
          isInstalation: false, // Default to false, user can toggle in cart
          sendInvoice: false, // Default to false, user can toggle in cart
          brandName: product.brandName,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView}>
      {/* Image Carousel */}
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
        <View style={styles.priceContainer}>
          {product.discountPrice ? (
            <>
              <Text style={styles.discountPrice}>₹{product.discountPrice}</Text>
              <Text style={styles.originalPrice}>₹{product.price}</Text>
            </>
          ) : (
            <Text style={styles.price}>₹{product.price}</Text>
          )}
        </View>
        <Text style={styles.description}>{product.description}</Text>
        {product.ratings > 0 && (
          <Text style={styles.rating}>
            ⭐ {product.ratings.toFixed(1)} ({product.numOfReviews} reviews)
          </Text>
        )}
        <Text style={styles.stock}>Stock: {product.stock} available</Text>

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
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
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

