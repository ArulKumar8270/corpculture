import AsyncStorage from '@react-native-async-storage/async-storage';

const STATE_OPTIONS = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chandigarh' },
  { code: 'CH', name: 'Chhattisgarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli' },
  { code: 'DD', name: 'Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

const resolveStateCode = (stateValue: unknown) => {
  if (!stateValue) return '';
  const trimmed = String(stateValue).trim();
  if (!trimmed) return '';
  if (trimmed.length <= 3) {
    const byCode = STATE_OPTIONS.find(
      (s) => s.code.toLowerCase() === trimmed.toLowerCase()
    );
    return byCode?.code || trimmed;
  }
  const byName = STATE_OPTIONS.find(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase()
  );
  return byName?.code || trimmed;
};

export const getCompanyShippingDefaults = (company: any, userPhone = '') => {
  if (!company) return null;

  const deliveries = Array.isArray(company.serviceDeliveryAddresses)
    ? company.serviceDeliveryAddresses
    : [];
  const primaryDelivery = deliveries.find((addr: any) => addr?.address?.trim());

  const address =
    primaryDelivery?.address?.trim() ||
    company.billingAddress?.trim() ||
    '';
  const pincode =
    primaryDelivery?.pincode?.trim() ||
    company.pincode?.trim() ||
    '';
  const contactPhone = company.contactPersons?.[0]?.mobile?.trim();

  return {
    address,
    city: company.city?.trim() || '',
    state: resolveStateCode(company.state),
    pincode,
    phoneNo: contactPhone || String(userPhone || '').trim(),
    landmark: '',
    country: 'IN',
  };
};

export const storeCompanyShippingInfo = async (company: any, userPhone = '') => {
  const defaults = getCompanyShippingDefaults(company, userPhone);
  if (!defaults?.address) return false;
  await AsyncStorage.setItem('shippingInfo', JSON.stringify(defaults));
  return true;
};
