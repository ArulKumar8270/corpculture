# Guest Access Implementation

## Overview
This document describes the implementation of guest (unauthenticated) access to the mobile app, allowing users to browse products and add items to cart without logging in, while requiring authentication for checkout and other protected actions.

## Changes Made

### 1. Navigation Structure

#### Created `GuestNavigator.tsx`
- New navigator for unauthenticated users
- Provides access to:
  - **Home** - Public home page
  - **Products** - Browse all products
  - **Product Details** - View product information
  - **Cart** - View cart items (login required for checkout)
  - **Login** - Access to login/register screens

#### Updated `AppNavigator.tsx`
- Modified to show `GuestNavigator` when user is not authenticated
- Previously showed `AuthNavigator` (login screen only)
- Now allows browsing while logged out

#### Updated `CustomerNavigator.tsx`
- Added `ProductsStack` for authenticated users
- Maintains full access to all features for logged-in customers

### 2. Screen Updates

#### `HomeScreen.tsx`
- **Guest Mode**: Shows generic welcome message
- **Authenticated Mode**: Shows personalized greeting and quick actions
- Hides "Quick Actions" section (Create Rental/Service Enquiry, Create Company) for guests
- Hides "Recent Activity" section for guests

#### `CartScreen.tsx`
- Added authentication check for checkout
- Shows "Login required to checkout" message for guests
- Displays alert prompting login when guest tries to checkout
- Allows viewing and modifying cart without login

#### `ProductDetailScreen.tsx`
- No changes needed - already allows adding to cart without authentication

#### `ProductsScreen.tsx`
- No changes needed - already accessible without authentication

### 3. Authentication Flow

#### Public Access (No Login Required)
- ✅ Home page
- ✅ Products listing
- ✅ Product details
- ✅ Add to cart
- ✅ View cart
- ✅ Modify cart (quantity, remove items)

#### Protected Actions (Login Required)
- ❌ Checkout from cart
- ❌ View orders
- ❌ Profile page
- ❌ Create Rental Enquiry
- ❌ Create Service Enquiry
- ❌ Create Company
- ❌ All admin/employee features

### 4. User Experience

#### Guest User Journey
1. Opens app → Sees public home page
2. Browses products → Can view all products
3. Views product details → Can see full product information
4. Adds to cart → Items added successfully
5. Views cart → Can see all cart items
6. Tries to checkout → Prompted to login
7. Logs in → Automatically redirected to authenticated view

#### Login Prompts
- **Cart Checkout**: Alert dialog with "Cancel" and "Login" options
- **Quick Actions**: Alert dialog when guest tries to access protected features
- **Navigation**: Login tab always available in bottom navigation

### 5. Technical Implementation

#### Redux State
- Uses existing `authSlice` to check `isAuthenticated` status
- Cart state persists across login/logout (stored in Redux)

#### Navigation Guards
- `AppNavigator` checks authentication status
- Routes to appropriate navigator based on auth state
- No manual navigation guards needed - handled at navigator level

#### Alert Dialogs
- Uses React Native's `Alert.alert()` for login prompts
- Provides clear call-to-action to login
- Maintains user context (doesn't lose cart or current screen)

## Testing Checklist

- [ ] Guest can access home page
- [ ] Guest can browse products
- [ ] Guest can view product details
- [ ] Guest can add items to cart
- [ ] Guest can view cart
- [ ] Guest can modify cart (quantity, remove)
- [ ] Guest is prompted to login when trying to checkout
- [ ] Guest is prompted to login when trying to access protected features
- [ ] After login, user sees authenticated view
- [ ] Cart persists after login
- [ ] User can logout and return to guest view
- [ ] All protected screens require authentication

## Future Enhancements

1. **Persistent Cart**: Save cart to AsyncStorage for guests
2. **Guest Checkout**: Allow guest checkout with email/phone
3. **Social Login**: Add Google/Facebook login options
4. **Wishlist**: Allow guests to save items for later
5. **Product Comparison**: Allow guests to compare products

## Notes

- Cart state is maintained in Redux and persists during session
- Login automatically switches navigator (no manual navigation needed)
- All protected screens are only accessible through authenticated navigators
- Guest navigator provides seamless browsing experience

