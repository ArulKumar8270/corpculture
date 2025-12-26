import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
const MAX_IMAGES_COUNT = 4; // Maximum number of allowed images

const ProductCreateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useSelector((state: RootState) => state.auth);
  const params = route.params as any;
  const productFromParams = params?.product;
  const productId = params?.productId || productFromParams?._id;

  const [isSubmit, setIsSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [warranty, setWarranty] = useState('');
  const [brand, setBrand] = useState('');
  const [installationCost, setInstallationCost] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState('');

  // Specifications
  const [specs, setSpecs] = useState<Array<{ title: string; description: string }>>([]);
  const [specsInput, setSpecsInput] = useState({ title: '', description: '' });

  // Price Range
  const [priceRange, setPriceRange] = useState<Array<{ from: string; to: string; price: string; commission: string }>>([]);
  const [priceRangeInput, setPriceRangeInput] = useState({ from: '', to: '', price: '', commission: '' });

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [imagesPreview, setImagesPreview] = useState<string[]>([]);
  const [logo, setLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

  // Helper function to extract URL from image/logo object or string
  const extractUrl = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (item.url) return item.url;
    return '';
  };

  // Helper function to extract URLs from images array
  const extractImageUrls = (images: any[]): string[] => {
    if (!images || !Array.isArray(images)) return [];
    return images.map((img) => extractUrl(img)).filter((url) => url);
  };

  // Populate form from product data (used when product is passed directly)
  const populateFormFromProduct = (product: any) => {
    if (!product) return;
    
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.price?.toString() || '');
    setDiscountPrice(product.discountPrice?.toString() || '');
    setCategory(product.category?.name || product.category || '');
    setStock(product.stock?.toString() || '');
    setWarranty(product.warranty?.toString() || '');
    setBrand(product.brandName || product.brand?.name || '');
    setInstallationCost(product.installationCost?.toString() || '');
    setDeliveryCharge(product.deliveryCharge?.toString() || '');
    setHighlights(product.highlights || []);
    setSpecs(product.specifications || []);
    setPriceRange(product.priceRange || []);
    
    // Handle images - can be array of objects with url or array of strings
    const imageUrls = extractImageUrls(product.images);
    setImagesPreview(imageUrls);
    setImages(imageUrls);
    
    // Handle logo - can be object with url or string
    const logoUrl = extractUrl(product.logo || product.brand?.logo);
    setLogoPreview(logoUrl);
    setLogo(logoUrl);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      if (productFromParams) {
        // Use product passed directly from navigation
        populateFormFromProduct(productFromParams);
      } else if (productId) {
        // Fetch product from API
        fetchProduct();
      } else {
        resetForm();
      }
    }, [productId, productFromParams])
  );

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/category/all`,
        {
          headers: { Authorization: token || '' },
        }
      );
      if (response.status === 200) {
        setCategories(response.data.categories || []);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Error fetching categories. Please try again.',
      });
    }
  };

  const fetchProduct = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/product/${productId}`,
        {
          headers: { Authorization: token || '' },
        }
      );
      // Backend returns status 201 with success: true
      if (response.status === 201 && response.data?.success && response.data?.product) {
        populateFormFromProduct(response.data.product);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch product details.',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setCategory('');
    setStock('');
    setWarranty('');
    setBrand('');
    setInstallationCost('');
    setDeliveryCharge('');
    setHighlights([]);
    setHighlightInput('');
    setSpecs([]);
    setSpecsInput({ title: '', description: '' });
    setPriceRange([]);
    setPriceRangeInput({ from: '', to: '', price: '', commission: '' });
    setImages([]);
    setImagesPreview([]);
    setLogo('');
    setLogoPreview('');
  };

  const handleSpecsChange = (field: string, value: string) => {
    setSpecsInput({ ...specsInput, [field]: value });
  };

  const addSpecs = () => {
    if (!specsInput.title.trim() && !specsInput.description.trim()) return;
    setSpecs([...specs, specsInput]);
    setSpecsInput({ title: '', description: '' });
  };

  const deleteSpec = (index: number) => {
    setSpecs(specs.filter((s, i) => i !== index));
  };

  const handlePriceRangeChange = (field: string, value: string) => {
    setPriceRangeInput({ ...priceRangeInput, [field]: value });
  };

  const addPriceRange = () => {
    if (!priceRangeInput.from.trim() && !priceRangeInput.to.trim() && !priceRangeInput.price.trim()) return;
    setPriceRange([...priceRange, priceRangeInput]);
    setPriceRangeInput({ from: '', to: '', price: '', commission: '' });
  };

  const deletePriceRange = (index: number) => {
    setPriceRange(priceRange.filter((s, i) => i !== index));
  };

  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setHighlights([...highlights, highlightInput]);
    setHighlightInput('');
  };

  const deleteHighlight = (index: number) => {
    setHighlights(highlights.filter((h, i) => i !== index));
  };

  const handleLogoChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: (ImagePicker as any).MediaType?.Images || 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
        Toast.show({
          type: 'error',
          text1: 'Warning',
          text2: 'Logo image size exceeds 500 KB!',
        });
        return;
      }
      setLogoPreview(asset.uri);
      setLogo(asset.uri);
    }
  };

  const handleProductImageChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: (ImagePicker as any).MediaType?.Images || 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      if (result.assets.length > MAX_IMAGES_COUNT) {
        Toast.show({
          type: 'error',
          text1: 'Warning',
          text2: 'You can only upload up to 4 images',
        });
        return;
      }

      const validImages: string[] = [];
      result.assets.forEach((asset) => {
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
          Toast.show({
            type: 'error',
            text1: 'Warning',
            text2: 'One of the product images exceeds 500 KB',
          });
          return;
        }
        validImages.push(asset.uri);
      });

      setImagesPreview([...imagesPreview, ...validImages]);
      setImages([...images, ...validImages]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = imagesPreview.filter((_, i) => i !== index);
    const newImagesData = images.filter((_, i) => i !== index);
    setImagesPreview(newImages);
    setImages(newImagesData);
  };

  const newProductSubmitHandler = async () => {
    setIsSubmit(true);
    setLoading(true);

    try {
      // Required field checks
      if (!logo) {
        Toast.show({
          type: 'error',
          text1: 'Warning',
          text2: 'Please Add Brand Logo',
        });
        setIsSubmit(false);
        setLoading(false);
        return;
      }

      if (images.length <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Warning',
          text2: 'Please Add Product Images',
        });
        setIsSubmit(false);
        setLoading(false);
        return;
      }

      // Helper function to convert URI to base64
      const uriToBase64 = async (uri: string): Promise<string> => {
        // If already base64, return as is
        if (uri.startsWith('data:image')) {
          return uri;
        }
        
        try {
          // Try using expo-file-system first (React Native compatible)
          try {
            // @ts-ignore - expo-file-system types may not be available
            const FileSystem = require('expo-file-system');
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            // Determine MIME type from URI or default to jpeg
            const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
            return `data:${mimeType};base64,${base64}`;
          } catch (fsError) {
            // Fallback to fetch if expo-file-system fails
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Convert blob to base64 using FileReader (works in web and some RN environments)
            return new Promise((resolve, reject) => {
              // @ts-ignore - FileReader may not have types in React Native
              const reader = new FileReader();
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error('Failed to convert to base64'));
                }
              };
              reader.onerror = () => reject(new Error('FileReader error'));
              // @ts-ignore
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          throw new Error(`Failed to convert image to base64: ${error}`);
        }
      };

      // Check if we're in edit mode
      const isEditMode = !!productId;
      const originalProduct = productFromParams || null;

      // Helper to check if image is already uploaded (HTTP/HTTPS URL)
      const isUploadedImage = (uri: string): boolean => {
        return uri.startsWith('http://') || uri.startsWith('https://');
      };

      // Separate old and new images
      const oldImages: any[] = [];
      const newImageUris: string[] = [];
      
      images.forEach((imgUri) => {
        if (isUploadedImage(imgUri)) {
          // This is an existing uploaded image - find the original image object
          const originalImg = originalProduct?.images?.find((img: any) => {
            const imgUrl = typeof img === 'string' ? img : img.url;
            return imgUrl === imgUri;
          });
          if (originalImg) {
            oldImages.push(originalImg);
          }
        } else {
          // This is a new image that needs to be uploaded
          newImageUris.push(imgUri);
        }
      });

      // Convert new images to base64
      const imagesBase64: string[] = [];
      for (const imageUri of newImageUris) {
        try {
          const imageBase64 = await uriToBase64(imageUri);
          imagesBase64.push(imageBase64);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to process product images.',
          });
          setIsSubmit(false);
          setLoading(false);
          return;
        }
      }

      // Handle logo - check if it's already uploaded or new
      let logoBase64 = '';
      let oldLogo: any = null;
      
      if (logo) {
        if (isUploadedImage(logo)) {
          // Logo is already uploaded - preserve it
          const originalLogo = originalProduct?.logo || originalProduct?.brand?.logo;
          if (originalLogo) {
            oldLogo = typeof originalLogo === 'string' ? { url: originalLogo } : originalLogo;
          }
        } else {
          // New logo - convert to base64
          try {
            logoBase64 = await uriToBase64(logo);
          } catch (error) {
            console.error('Error converting logo to base64:', error);
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to process logo image.',
            });
            setIsSubmit(false);
            setLoading(false);
            return;
          }
        }
      }

      // Prepare request body - backend uses bodyParser.json, so send as JSON
      const requestBody: any = {
        name,
        description,
        price,
        discountPrice: discountPrice || '0',
        category,
        stock,
        warranty: warranty || '0',
        brandName: brand,
        installationCost: installationCost || '0',
        deliveryCharge: deliveryCharge || '0',
        highlights: highlights || [],
        specifications: specs.map((s) => JSON.stringify(s)),
        priceRange: (priceRange || []).map((s) => JSON.stringify(s)),
      };

      // For edit mode, handle images and logo differently
      if (isEditMode) {
        // Send old images as JSON string
        if (oldImages.length > 0) {
          requestBody.oldImages = JSON.stringify(oldImages);
        }
        // Send old logo as JSON string if not updating
        if (oldLogo && !logoBase64) {
          requestBody.oldLogo = JSON.stringify(oldLogo);
        }
        // Send new logo if provided
        if (logoBase64) {
          requestBody.logo = logoBase64;
        }
        // Send new images
        requestBody.images = imagesBase64;
      } else {
        // For new product, send all images and logo as base64
        requestBody.logo = logoBase64;
        requestBody.images = imagesBase64;
      }

      // Use update endpoint if editing, otherwise create new
      const endpoint = isEditMode
        ? `${getApiBaseUrl()}/product/update/${productId}`
        : `${getApiBaseUrl()}/product/new-product`;
      const method = isEditMode ? 'patch' : 'post';

      const response = await axios[method](
        endpoint,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token || '',
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: isEditMode ? 'Product Updated Successfully!' : 'Product Added Successfully!',
        });
        resetForm();
        (navigation as any).navigate('ProductList');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setIsSubmit(false);
      setLoading(false);
      if (error.response?.status === 500) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong! Please try after sometime.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.message || 'Failed to create product.',
        });
      }
    }
  };

  const selectedCategory = categories.find((c) => c.name === category);

  if (isSubmit && loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
        <Text style={styles.loadingText}>Submitting...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter product description"
          placeholderTextColor="#999"
          multiline
          numberOfLines={2}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Delivery Charge</Text>
            <TextInput
              style={styles.input}
              value={deliveryCharge}
              onChangeText={setDeliveryCharge}
              placeholder="Enter delivery charge"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Installation Cost</Text>
            <TextInput
              style={styles.input}
              value={installationCost}
              onChangeText={setInstallationCost}
              placeholder="Enter installation cost"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Discount Price</Text>
            <TextInput
              style={styles.input}
              value={discountPrice}
              onChangeText={setDiscountPrice}
              placeholder="Enter discount price"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <Text style={styles.pickerButtonText}>
                {selectedCategory?.name || '--select Category--'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Stock *</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="Enter stock"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Warranty</Text>
          <TextInput
            style={styles.input}
            value={warranty}
            onChangeText={setWarranty}
            placeholder="Enter warranty"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        {/* Highlights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          <View style={styles.highlightInputContainer}>
            <TextInput
              style={styles.highlightInput}
              value={highlightInput}
              onChangeText={setHighlightInput}
              placeholder="Enter highlight"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addHighlight}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.highlightsList}>
            {highlights.map((h, i) => (
              <View key={i} style={styles.highlightItem}>
                <Text style={styles.highlightText}>{h}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteHighlight(i)}
                >
                  <Icon name="delete" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Brand Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brand Details</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Brand *</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="Enter brand name"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.logoContainer}>
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={styles.logoPreview} />
              ) : (
                <Icon name="image" size={40} color="#999" />
              )}
              <Text style={styles.requiredText}>* (max 500KB)</Text>
            </View>
            <TouchableOpacity
              style={styles.chooseButton}
              onPress={handleLogoChange}
            >
              <Text style={styles.chooseButtonText}>Choose Logo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Specifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Specifications <Text style={styles.hintText}>(at least 2 required)</Text>
          </Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                value={specsInput.title}
                onChangeText={(text) => handleSpecsChange('title', text)}
                placeholder="Name (e.g., Model No.)"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                value={specsInput.description}
                onChangeText={(text) => handleSpecsChange('description', text)}
                placeholder="Description"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addSpecs}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.specsList}>
            {specs.map((spec, i) => (
              <View key={i} style={styles.specItem}>
                <Text style={styles.specTitle}>{spec.title}</Text>
                <Text style={styles.specDescription}>{spec.description}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSpec(i)}
                >
                  <Icon name="delete" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Price Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Product Price Range</Text>
          <View style={styles.priceRangeRow}>
            <View style={styles.quarterInput}>
              <TextInput
                style={styles.input}
                value={priceRangeInput.from}
                onChangeText={(text) => handlePriceRangeChange('from', text)}
                placeholder="From"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.quarterInput}>
              <TextInput
                style={styles.input}
                value={priceRangeInput.to}
                onChangeText={(text) => handlePriceRangeChange('to', text)}
                placeholder="To"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.quarterInput}>
              <TextInput
                style={styles.input}
                value={priceRangeInput.price}
                onChangeText={(text) => handlePriceRangeChange('price', text)}
                placeholder="Price"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.quarterInput}>
              <TextInput
                style={styles.input}
                value={priceRangeInput.commission}
                onChangeText={(text) => handlePriceRangeChange('commission', text)}
                placeholder="Commission"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addPriceRange}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.priceRangeList}>
            {priceRange.map((pr, i) => (
              <View key={i} style={styles.priceRangeItem}>
                <Text style={styles.priceRangeText}>{pr.from}</Text>
                <Text style={styles.priceRangeText}>{pr.to}</Text>
                <Text style={styles.priceRangeText}>{pr.price}</Text>
                <Text style={styles.priceRangeText}>{pr.commission}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePriceRange(i)}
                >
                  <Icon name="delete" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Product Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Product Images <Text style={styles.hintText}>(1-4 images, max 500KB each)</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {imagesPreview.map((image, i) => (
              <View key={i} style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(i)}
                >
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.chooseButton}
            onPress={handleProductImageChange}
          >
            <Text style={styles.chooseButtonText}>Choose Files</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (isSubmit || loading) && styles.submitButtonDisabled]}
          onPress={newProductSubmitHandler}
          disabled={isSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setCategory(item.name);
                    setCategoryPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setCategoryPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
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
  form: {
    padding: 15,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
  },
  quarterInput: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  highlightInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  highlightInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f7fafd',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  highlightsList: {
    gap: 6,
  },
  highlightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e6fbff',
    padding: 10,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  highlightText: {
    fontSize: 14,
    color: '#019ee3',
    fontWeight: '500',
    flex: 1,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: '#ffebee',
  },
  logoContainer: {
    width: 100,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  requiredText: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: '#999',
    right: -90,
  },
  chooseButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chooseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  specsList: {
    gap: 8,
    marginTop: 10,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e6fbff',
    padding: 10,
    borderRadius: 12,
    paddingHorizontal: 15,
    gap: 10,
  },
  specTitle: {
    fontSize: 14,
    color: '#019ee3',
    fontWeight: '500',
    flex: 1,
  },
  specDescription: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  priceRangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  priceRangeList: {
    gap: 8,
    marginTop: 10,
  },
  priceRangeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e6fbff',
    padding: 10,
    borderRadius: 12,
    paddingHorizontal: 15,
    gap: 8,
  },
  priceRangeText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  imagesContainer: {
    marginBottom: 10,
    maxHeight: 130,
  },
  imagePreview: {
    width: 120,
    height: 120,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#019ee3',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default ProductCreateScreen;
