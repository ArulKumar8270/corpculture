import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedProduct, setLoading } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { productService } from '../../services/api';
import Toast from 'react-native-toast-message';

const ProductDetailScreen = () => {
  const route = useRoute();
  const { productId } = route.params as { productId: string };
  const dispatch = useDispatch();
  const { selectedProduct } = useSelector((state: RootState) => state.product);
  const [quantity, setQuantity] = useState(1);

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
      dispatch(
        addToCart({
          productId: selectedProduct._id,
          name: selectedProduct.name,
          price: selectedProduct.discountPrice || selectedProduct.price,
          quantity,
          image: selectedProduct.image,
        })
      );
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${selectedProduct.name} added to cart`,
      });
    }
  };

  if (!selectedProduct) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: selectedProduct.image || 'https://via.placeholder.com/300' }}
        style={styles.productImage}
      />
      <View style={styles.content}>
        <Text style={styles.productName}>{selectedProduct.name}</Text>
        <Text style={styles.category}>{selectedProduct.category}</Text>
        <View style={styles.priceContainer}>
          {selectedProduct.discountPrice ? (
            <>
              <Text style={styles.discountPrice}>₹{selectedProduct.discountPrice}</Text>
              <Text style={styles.originalPrice}>₹{selectedProduct.price}</Text>
            </>
          ) : (
            <Text style={styles.price}>₹{selectedProduct.price}</Text>
          )}
        </View>
        <Text style={styles.description}>{selectedProduct.description}</Text>
        {selectedProduct.rating && (
          <Text style={styles.rating}>
            ⭐ {selectedProduct.rating} ({selectedProduct.reviews} reviews)
          </Text>
        )}
        <Text style={styles.stock}>Stock: {selectedProduct.stock} available</Text>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
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

