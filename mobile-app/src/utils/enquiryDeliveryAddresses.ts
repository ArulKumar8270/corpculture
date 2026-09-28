export const listEnquiryDeliveryAddresses = (company: any): string[] =>
  (Array.isArray(company?.serviceDeliveryAddresses) ? company.serviceDeliveryAddresses : [])
    .map((addr: any) => {
      const address = String(addr?.address || '').trim();
      const pincode = String(addr?.pincode || '').trim();
      if (address && pincode) return `${address} - ${pincode}`;
      return address || pincode;
    })
    .filter(Boolean);
