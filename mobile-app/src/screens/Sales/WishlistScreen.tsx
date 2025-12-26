import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';

const WishlistScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMore, setIsLoadMore] = useState(false);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (token && user?.role !== 1) {
      fetchWishlist(page);
    }
  }, [page, token, user]);

  const fetchWishlist = async (pageNum: number) => {
    try {
      setIsLoading(pageNum === 1);
      const response = await axios.get(
        `${getApiBaseUrl()}/user/wishlist-products?page=${pageNum}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const newItems = response.data.wishlistItems || [];
      if (pageNum === 1) {
        setWishlistItems(newItems);
      } else {
        setWishlistItems((prev) => [...prev, ...newItems]);
      }
      setCount(response.data?.totalItems || 0);
      setIsLoadMore(false);
    } catch (error: any) {
      console.error('Error fetching wishlist items:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load wishlist items',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (wishlistItems.length < count && !isLoadMore) {
      setIsLoadMore(true);
      setPage((prevPage) => {
        const nextPage = prevPage + 1;
        if (nextPage <= Math.ceil(count / pageSize)) {
          return nextPage;
        }
        return prevPage;
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await axios.post(
        `${getApiBaseUrl()}/user/update-wishlist`,
        { productId, type: 'remove' },
        {
          headers: { Authorization: token },
        }
      );
      Toast.show({
        type: 'success',
        text1: 'Removed',
        text2: 'Product removed from wishlist',
      });
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      setCount((prev) => prev - 1);
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item',
      });
    }
  };

  const getDiscount = (price: number, discountPrice: number) => {
    return (((price - discountPrice) / price) * 100).toFixed(0);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail' as never, { productId: item._id } as never)}
    >
      <Image
        source={{
          uri: item.images && item.images.length > 0 ? item.images[0].url : 'https://via.placeholder.com/150',
        }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <View style={styles.productTitleContainer}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.ratings && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingBadge}>
                  <Icon name="star" size={14} color="#fff" />
                  <Text style={styles.ratingText}>{item.ratings}</Text>
                </View>
                {item.numOfReviews && (
                  <Text style={styles.reviewCount}>({item.numOfReviews.toLocaleString()})</Text>
                )}
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => removeFromWishlist(item._id)}
          >
            <Icon name="delete" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.discountPrice}>₹{item.discountPrice?.toLocaleString()}</Text>
          <Text style={styles.originalPrice}>₹{item.price?.toLocaleString()}</Text>
          <Text style={styles.discountPercent}>
            {getDiscount(item.price, item.discountPrice)}% off
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading wishlist...</Text>
      </View>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={{
            uri: 'https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/mywishlist-empty_39f7a5.png',
          }}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyText}>Empty Wishlist</Text>
        <Text style={styles.emptySubtext}>You have no items in your wishlist. Start adding!</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Products' as never)}
        >
          <Text style={styles.browseButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist ({count})</Text>
      </View>
      <FlatList
        data={wishlistItems}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && page === 1}
            onRefresh={() => {
              setPage(1);
              fetchWishlist(1);
            }}
          />
        }
        ListFooterComponent={
          count > wishlistItems.length ? (
            <View style={styles.loadMoreContainer}>
              {isLoadMore ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                  <Text style={styles.loadMoreText}>Load more items</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22ba20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  discountPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22ba20',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WishlistScreen;
