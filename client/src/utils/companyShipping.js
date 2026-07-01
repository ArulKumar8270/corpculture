import states from './states';

const resolveStateCode = (stateValue) => {
    if (!stateValue) return '';
    const trimmed = String(stateValue).trim();
    if (!trimmed) return '';
    if (trimmed.length <= 3) {
        const byCode = states.find(
            (s) => s.code.toLowerCase() === trimmed.toLowerCase()
        );
        return byCode?.code || trimmed;
    }
    const byName = states.find(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    return byName?.code || trimmed;
};

export const getCompanyShippingDefaults = (company, userPhone = '') => {
    if (!company) return null;

    const deliveries = Array.isArray(company.serviceDeliveryAddresses)
        ? company.serviceDeliveryAddresses
        : [];
    const primaryDelivery = deliveries.find((addr) => addr?.address?.trim());

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
        phoneNo: contactPhone || userPhone?.trim() || '',
        landmark: '',
        country: 'IN',
    };
};

export const storeCompanyShippingInfo = (company, userPhone = '') => {
    const defaults = getCompanyShippingDefaults(company, userPhone);
    if (!defaults?.address) return false;
    localStorage.setItem('shippingInfo', JSON.stringify(defaults));
    return true;
};
