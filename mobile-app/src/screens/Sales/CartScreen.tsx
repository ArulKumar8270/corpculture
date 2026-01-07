import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
  addToSaveLater,
  removeFromSaveLater,
  moveToCart,
  updateCartItem,
} from '../../store/slices/cartSlice';
import {
  setCompanyEnabled,
  setSelectedCompany,
  setCompanyDetails,
} from '../../store/slices/companySlice';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import CompanyToggleHeader from '../../components/CompanyToggleHeader';

const CartScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { items, saveLaterItems, total } = useSelector(
    (state: RootState) => state.cart
  );
  const { isAuthenticated, user, token } = useSelector(
    (state: RootState) => state.auth
  );
  const { isCompanyEnabled, selectedCompany, companyDetails } = useSelector(
    (state: RootState) => state.company
  );

  // Company-related states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);

  // New user form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDesignation, setNewUserDesignation] = useState('');
  const [newUserDob, setNewUserDob] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedCompany !== 'new' && isCompanyEnabled) {
      getCompanyUsers();
    } else if (selectedCompany === 'new' && isCompanyEnabled) {
      setShowCompanyModal(true);
    }
  }, [selectedCompany, isCompanyEnabled]);

  const getCompanyUsers = async () => {
    try {
      const companyResponse = companyDetails?.filter(
        (company) => company._id === selectedCompany
      );
      if (companyResponse?.length > 0) {
        setExistingUsers(
          companyResponse[0].contactPersons.map((user: any) => ({
            mobile: user.mobile,
            email: user.email,
            name: user.name,
            designation: user.designation || '',
            dob: user.dob || '',
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const handleRemove = (productId: string) => {
    dispatch(removeFromCart(productId));
    Toast.show({
      type: 'info',
      text1: 'Removed from Cart',
    });
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemove(productId);
    } else {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleSaveForLater = (item: any) => {
    dispatch(addToSaveLater(item));
    Toast.show({
      type: 'success',
      text1: 'Saved for Later',
      text2: 'Item moved to saved items',
    });
  };

  const handleRemoveFromSaveLater = (productId: string) => {
    dispatch(removeFromSaveLater(productId));
    Toast.show({
      type: 'info',
      text1: 'Removed from Saved Items',
    });
  };

  const handleMoveToCart = (item: any) => {
    dispatch(moveToCart(item));
    Toast.show({
      type: 'success',
      text1: 'Moved to Cart',
      text2: 'Item added back to cart',
    });
  };

  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    dispatch(setSelectedCompany(''));
  };

  const addNewUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPhone) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    const newUserParams = {
      name: newUserName,
      email: newUserEmail,
      password: newUserEmail,
      phone: newUserPhone,
      isSeller: false,
      companyId: selectedCompany,
      parentId: user?._id,
      serviceDeliveryAddresses: user?.address
        ? [{ address: user.address, pincode: '000000' }]
        : [],
    };

    let companyPayload = {
      contactPersons: [
        ...existingUsers,
        { 
          name: newUserName, 
          mobile: newUserPhone, 
          email: newUserEmail,
          designation: newUserDesignation,
          dob: newUserDob
        },
      ],
    };

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1'}/auth/register`,
        newUserParams
      );

      if (isCompanyEnabled && selectedCompany && selectedCompany !== 'new') {
        await axios.put(
          `${getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1'}/company/update/${selectedCompany}`,
          companyPayload,
          {
            headers: {
              Authorization: token || '',
            },
          }
        );
      }

      setNewUserEmail('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserDesignation('');
      setNewUserDob('');
      setIsLoading(false);

      if (response.status === 200) {
        Toast.show({
          type: 'info',
          text1: 'Email Already Registered',
          text2: 'Please login with this email',
        });
      } else if (response.status === 201) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'New user registered successfully!',
        });
        setAdditionalEmails([...additionalEmails, newUserEmail]);
        await fetchCompanyDetails();
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong!',
      });
    }
  };

  const handleRemoveEmail = (email: string) => {
    setAdditionalEmails(additionalEmails.filter((e) => e !== email));
  };

  // Helper function to get delivery date
  const getDeliveryDate = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(new Date().getDate() + 7);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[deliveryDate.getDay()]}, ${deliveryDate.getDate()} ${months[deliveryDate.getMonth()]}`;
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !user || !token) {
      Alert.alert('Login Required', 'Please log in to place an order.', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => {
              navigation.navigate('Login' as never);
            },
          },
      ]);
      return;
    }

    if (items.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is Empty',
        text2: 'Add items to cart before checkout',
      });
      return;
    }

    // Set sessionId similar to client's placeOrderHandler
    await AsyncStorage.setItem('sessionId', 'sdfas09df8as7');
    
    // Navigate to shipping screen (equivalent to /shipping/confirm)
    navigation.navigate('Shipping' as never);
  };

  // Helper function to get the correct price for an item based on quantity
  const getPrice = (item: any) => {
    const quantity = item.quantity || 0;
    const priceRange = item.priceRange?.find(
      (range: any) =>
        quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
    );
    return priceRange ? parseFloat(priceRange.price) : item.discountPrice || item.price || 0;
  };

  // Calculate price details
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = getPrice(item);
    return sum + itemPrice * (item.quantity || 0);
  }, 0);

  const totalDiscount = items.reduce((sum, item) => {
    const regularPrice = (item.price || 0) * (item.quantity || 0);
    const actualPrice = getPrice(item) * (item.quantity || 0);
    return sum + (regularPrice - actualPrice);
  }, 0);

  const totalDeliveryCharges = items.reduce(
    (sum, item) => sum + (item.deliveryCharge || 0),
    0
  );

  const totalInstallationCharges = items.reduce((sum, item) => {
    return sum + (item.isInstalation ? item.installationCost || 0 : 0);
  }, 0);

  const totalAmount = subtotal + totalDeliveryCharges + totalInstallationCharges;

  const handleSendInvoiceToggle = (productId: string, currentValue: boolean) => {
    dispatch(
      updateCartItem({
        productId,
        updates: { sendInvoice: !currentValue },
      })
    );
  };

  const handleInstallationToggle = (productId: string, currentValue: boolean) => {
    dispatch(
      updateCartItem({
        productId,
        updates: { isInstalation: !currentValue },
      })
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const productImage =
      item.images && item.images.length > 0
      ? item.images[0].url 
      : item.image 
        ? item.image 
        : 'https://via.placeholder.com/100';
    
    const sendInvoice = item.sendInvoice || false;
    const isInstalation = item.isInstalation || false;
    
    return (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: productImage }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          
          {/* Delivery Info */}
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryText}>
              Delivery by {getDeliveryDate()} |{' '}
              <Text style={styles.strikethrough}>₹40</Text>{' '}
              <Text style={styles.freeText}>Free</Text>
            </Text>
          </View>

          {/* Checkboxes */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => handleSendInvoiceToggle(item.productId, sendInvoice)}
            >
              <View style={[styles.checkbox, sendInvoice && styles.checkboxChecked]}>
                {sendInvoice && <Icon name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Send Quotation with this item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => handleInstallationToggle(item.productId, isInstalation)}
            >
              <View style={[styles.checkbox, isInstalation && styles.checkboxChecked]}>
                {isInstalation && <Icon name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Installation Required</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.itemPrice}>₹{getPrice(item).toFixed(2)}</Text>
          {item.discountPrice && item.price > item.discountPrice && (
            <Text style={styles.discountPrice}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
          )}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.productId, item.quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.productId, item.quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.saveLaterButton}
              onPress={() => handleSaveForLater(item)}
            >
              <Text style={styles.saveLaterText}>Save for Later</Text>
            </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item.productId)}
      >
              <Icon name="delete" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSaveLaterItem = ({ item }: { item: any }) => {
    const productImage =
      item.images && item.images.length > 0
        ? item.images[0].url
        : item.image
        ? item.image
        : 'https://via.placeholder.com/100';

    return (
      <View style={styles.saveLaterItem}>
        <Image
          source={{ uri: productImage }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>₹{getPrice(item).toFixed(2)}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.moveToCartButton}
              onPress={() => handleMoveToCart(item)}
            >
              <Text style={styles.moveToCartText}>Move to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFromSaveLater(item.productId)}
            >
              <Icon name="delete" size={20} color="#FF3B30" />
      </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0 && saveLaterItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Icon name="shopping-cart" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add items to get started</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Company Toggle */}
      <View style={styles.topHeader}>
        <CompanyToggleHeader />
      </View>
      <ScrollView style={styles.scrollView}>
        {/* Cart Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Cart ({items.length})</Text>
          </View>
          {items.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No items in cart</Text>
            </View>
          ) : (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId}
              scrollEnabled={false}
            />
          )}

          {/* Company User Selection (only show if authenticated and company enabled) */}
          {isAuthenticated && isCompanyEnabled && items.length > 0 && (
            <View style={styles.companySection}>
              <Text style={styles.companySectionTitle}>
                Send Invoice To Existing Users:
              </Text>
              <View style={styles.userCheckboxContainer}>
                {existingUsers?.map((user, index) => {
                  const isChecked = selectedUserIds.includes(user.email);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.userCheckbox}
                      onPress={() => {
                        if (isChecked) {
                          setSelectedUserIds(
                            selectedUserIds.filter((id) => id !== user.email)
                          );
                        } else {
                          setSelectedUserIds([...selectedUserIds, user.email]);
                        }
                      }}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && (
                          <Icon name="check" size={16} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.userCheckboxText}>{user.email}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected users display */}
              {selectedUserIds.length > 0 && (
                <View style={styles.selectedUsersContainer}>
                  {selectedUserIds.map((id) => {
                    const user = existingUsers?.find((u) => u.email === id);
                    return user ? (
                      <View key={id} style={styles.selectedUserChip}>
                        <Text style={styles.selectedUserText}>{user.email}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            setSelectedUserIds(
                              selectedUserIds.filter((uid) => uid !== id)
                            )
                          }
                        >
                          <Icon name="close" size={16} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    ) : null;
                  })}
                </View>
              )}

              {/* Add New User Form */}
              <Text style={styles.companySectionTitle}>Add New User:</Text>
              <View style={styles.newUserForm}>
                <TextInput
                  style={styles.formInput}
                  value={newUserName}
                  onChangeText={setNewUserName}
                  placeholder="Enter Name"
                />
                <TextInput
                  style={styles.formInput}
                  value={newUserEmail}
                  onChangeText={setNewUserEmail}
                  placeholder="Enter Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.formInput}
                  value={newUserPhone}
                  onChangeText={setNewUserPhone}
                  placeholder="Enter Phone"
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.formInput}
                  value={newUserDesignation}
                  onChangeText={setNewUserDesignation}
                  placeholder="Enter Designation"
                />
                <TextInput
                  style={styles.formInput}
                  value={newUserDob}
                  onChangeText={setNewUserDob}
                  placeholder="Date of Birth (YYYY-MM-DD)"
                  keyboardType="default"
                />
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={addNewUser}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.addUserButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Additional emails display */}
              {additionalEmails.length > 0 && (
                <View style={styles.additionalEmailsContainer}>
                  {additionalEmails.map((email) => (
                    <View key={email} style={styles.emailChip}>
                      <Text style={styles.emailChipText}>{email}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveEmail(email)}
                      >
                        <Icon name="close" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Place Order Button */}
          {isAuthenticated && items.length > 0 && (
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handleCheckout}
            >
              <Text style={styles.placeOrderText}>PLACE ORDER</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Price Details Section */}
        {items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PRICE DETAILS</Text>
            </View>
            <View style={styles.priceDetails}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Price ({items.length} item)
                </Text>
                <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              {totalDiscount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Discount</Text>
                  <Text style={styles.discountValue}>
                    - ₹{totalDiscount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Charges</Text>
                <Text style={styles.priceValue}>
                  ₹{totalDeliveryCharges.toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Installation Charges</Text>
                <Text style={styles.priceValue}>
                  ₹{totalInstallationCharges.toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
              </View>
              {totalDiscount > 0 && (
                <View style={styles.savingsContainer}>
                  <Text style={styles.savingsText}>
                    You will save ₹{totalDiscount.toFixed(2)} on this order
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Saved For Later Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Saved For Later ({saveLaterItems.length})
            </Text>
          </View>
          {saveLaterItems.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                No items saved for later
              </Text>
            </View>
          ) : (
            <FlatList
              data={saveLaterItems}
              renderItem={renderSaveLaterItem}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Footer with Checkout Button */}
      {items.length > 0 && (
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmountFooter}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        {!isAuthenticated && (
          <Text style={styles.loginPrompt}>
            Login required to checkout
          </Text>
        )}
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
      )}

      {/* Company Registration Modal */}
      <Modal
        visible={showCompanyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseCompanyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Company</Text>
              <TouchableOpacity
                onPress={handleCloseCompanyModal}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={styles.navigateToCompanyButton}
                onPress={() => {
                  setShowCompanyModal(false);
                  navigation.navigate('CreateCompany' as never);
                }}
              >
                <Text style={styles.navigateToCompanyText}>
                  Go to Company Registration
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topHeader: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySection: {
    padding: 20,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#999',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  saveLaterItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#019ee3',
    marginBottom: 5,
  },
  discountPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#019ee3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  saveLaterButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  saveLaterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  moveToCartButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  moveToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 5,
  },
  companySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  companySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  userCheckboxContainer: {
    marginBottom: 15,
  },
  userCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#019ee3',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#019ee3',
  },
  checkboxContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#333',
  },
  deliveryInfo: {
    marginTop: 4,
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 12,
    color: '#666',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  freeText: {
    color: '#4caf50',
    fontWeight: '600',
  },
  userCheckboxText: {
    fontSize: 14,
    color: '#333',
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedUserText: {
    fontSize: 12,
    color: '#019ee3',
    marginRight: 6,
  },
  newUserForm: {
    marginTop: 10,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  addUserButton: {
    backgroundColor: '#019ee3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addUserButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  additionalEmailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  emailChipText: {
    fontSize: 12,
    color: '#856404',
    marginRight: 6,
  },
  placeOrderButton: {
    backgroundColor: '#fb641b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceDetails: {
    paddingVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
  },
  priceDivider: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  savingsContainer: {
    backgroundColor: '#f7fafd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalAmountFooter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  checkoutButton: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPrompt: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    maxHeight: 500,
    padding: 15,
  },
  navigateToCompanyButton: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  navigateToCompanyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;
