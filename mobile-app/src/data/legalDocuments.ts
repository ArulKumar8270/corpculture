export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'h3'; text: string }
  | { type: 'contact'; rows: { label?: string; value: string }[] };

export type LegalSection = { title: string; blocks: LegalBlock[] };

export type LegalDocumentType = 'privacy' | 'terms' | 'refund';

export type LegalDocument = {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  sections: LegalSection[];
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentType, LegalDocument> = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: August 12, 2026',
    sections: [
      {
        title: '1. Introduction',
        blocks: [
          { type: 'p', text: 'Corp Culture ("Company", "we", "our", "us") respects your privacy.' },
          {
            type: 'p',
            text: 'This Privacy Policy explains how we collect, process, store, share, and protect your personal information when you use our website, mobile application, or purchase products and services from us. By providing personal information and giving consent through the website, mobile application, or other authorized channels, the user agrees to the collection and processing of such information for the stated purposes. Users may withdraw their consent at any time by contacting customer support, subject to applicable legal and contractual requirements.',
          },
        ],
      },
      {
        title: '2. Information We Collect',
        blocks: [
          { type: 'h3', text: 'Personal Information' },
          {
            type: 'ul',
            items: [
              'Full Name',
              'Company Name',
              'GST Number',
              'Mobile Number',
              'Email Address',
              'Billing Address',
              'Shipping Address',
              'Delivery Contact Person',
            ],
          },
          { type: 'h3', text: 'Account Information' },
          {
            type: 'ul',
            items: [
              'Username',
              'Password credentials are securely hashed and are not stored in plain text',
              'Customer ID',
              'Vendor ID',
              'Employee ID',
            ],
          },
          { type: 'h3', text: 'Payment Information' },
          {
            type: 'ul',
            items: ['UPI Reference', 'Bank Details (where applicable)', 'Transaction ID', 'Payment Status'],
          },
          {
            type: 'p',
            text: 'Note: Card information is processed only through authorized payment gateways. Corp Culture does not store complete debit or credit card details.',
          },
          { type: 'h3', text: 'Device Information' },
          {
            type: 'p',
            text: 'We may collect a persistent device identifier, with your consent where required, for security and service improvement. The information is retained only as necessary or as required by law.',
          },
          {
            type: 'ul',
            items: ['Device Model', 'Android/iOS Version', 'Browser Information', 'IP Address', 'App Version'],
          },
          { type: 'h3', text: 'Location Information' },
          {
            type: 'p',
            text: 'Location access is optional and can be withdrawn anytime through your device settings. Background location is collected only with your explicit consent.',
          },
          {
            type: 'ul',
            items: ['Engineer visit tracking', 'Service location', 'Delivery tracking', 'Installation confirmation'],
          },
          { type: 'h3', text: 'Usage Information' },
          {
            type: 'ul',
            items: ['Login Time', 'Logout Time', 'Click Activity', 'Products Viewed', 'Orders Placed', 'App Usage Analytics'],
          },
          {
            type: 'p',
            text: 'Where applicable, usage analytics are collected to improve our services and retained only as necessary.',
          },
        ],
      },
      {
        title: '3. How We Use Your Information',
        blocks: [
          { type: 'p', text: 'Your information is used to:' },
          {
            type: 'ul',
            items: [
              'To create and manage customer accounts.',
              'To verify customer identity',
              'To process orders',
              'To deliver products',
              'To schedule installations',
              'To manage rental contracts',
              'To generate GST invoices',
              'To process refunds',
              'To handle warranty claims',
              'To send order updates',
              'To improve customer service',
              'To prevent fraud',
              'To maintain legal compliance',
            ],
          },
        ],
      },
      {
        title: '4. Cookies',
        blocks: [
          { type: 'p', text: 'Our website uses cookies to:' },
          {
            type: 'ul',
            items: [
              'Keep you logged in',
              'Remember preferences',
              'Improve website performance and user experience.',
              'Analyze visitor traffic',
              'Provide personalized content',
            ],
          },
        ],
      },
      {
        title: '5. Information Sharing',
        blocks: [
          { type: 'p', text: 'We may share information only with:' },
          {
            type: 'ul',
            items: [
              'Payment Gateway Providers',
              'Technical Service Engineers',
              'OEM Manufacturers',
              'Government Authorities',
              'Legal Agencies when required by law',
            ],
          },
          {
            type: 'p',
            text: 'We do not sell, rent or trade personal information to third parties for their independent marketing purposes.',
          },
        ],
      },
      {
        title: '6. Data Retention',
        blocks: [
          {
            type: 'p',
            text: 'Corp Culture retains personal information only for as long as necessary to fulfil the purposes for which it was collected, provide our products and services, comply with applicable legal, regulatory, taxation, and accounting obligations, resolve disputes, enforce our agreements, and protect our legitimate business interests. When personal information is no longer required, it will be securely deleted, anonymised, or disposed of in accordance with applicable law and our internal data retention practices.',
          },
          { type: 'p', text: 'We retain customer information for as long as necessary to:' },
          {
            type: 'ul',
            items: ['Complete transactions', 'Meet legal obligations', 'Resolve disputes', 'Maintain financial records'],
          },
        ],
      },
      {
        title: '7. Data Security',
        blocks: [
          { type: 'p', text: 'We implement appropriate technical and organizational security measures including:' },
          {
            type: 'ul',
            items: [
              'SSL Encryption',
              'Role-Based Access Control',
              'Firewall Protection',
              'Sensitive information is encrypted at rest, where applicable, using appropriate security measures.',
              'Secure Login Authentication',
              'Multi-factor authentication (MFA) is implemented for applicable users and services',
            ],
          },
        ],
      },
      {
        title: '8. Your Rights',
        blocks: [
          { type: 'p', text: 'Subject to applicable law, customers may request:' },
          {
            type: 'ul',
            items: [
              'Access to personal data',
              'Correction of information',
              'Requests are processed after identity verification. Certain information may be retained as required by law, and we aim to respond within a reasonable timeframe.',
              'Download of personal information',
              'Marketing communication opt-out',
            ],
          },
        ],
      },
      {
        title: '9. Consent Withdrawal & Account Deletion',
        blocks: [
          {
            type: 'p',
            text: 'Customers may withdraw their consent for applicable data processing or request deletion of their account at any time by contacting our customer support team through the contact details provided in this Policy. Upon verification of the request, Corp Culture will process the request within a reasonable timeframe. Certain information may be retained where required by applicable law, for regulatory compliance, fraud prevention, dispute resolution, or the establishment, exercise, or defence of legal claims.',
          },
        ],
      },
      {
        title: '10. Data Breach Notification',
        blocks: [
          {
            type: 'p',
            text: 'Corp Culture maintains appropriate technical and organisational security measures to protect personal information. In the event of a reportable personal data breach, we will take appropriate remedial measures and, where required by applicable law, notify affected users and the relevant regulatory authorities within the prescribed timelines.',
          },
        ],
      },
      {
        title: '11. Third-Party Analytics & Service Providers',
        blocks: [
          {
            type: 'p',
            text: 'Corp Culture may engage authorised third-party service providers, including payment gateway providers, cloud hosting providers, analytics providers, communication platforms, logistics partners, OEM manufacturers, and technical support providers, solely for the purpose of providing, operating, maintaining, securing, and improving our products and services. Such third parties are authorised to process personal information only as necessary to perform their services and are required to protect the information in accordance with applicable laws and contractual obligations.',
          },
        ],
      },
      {
        title: '12. Children\'s Privacy',
        blocks: [
          {
            type: 'p',
            text: 'Our website and mobile application are intended for use by individuals who are 18 years of age or older. We do not knowingly collect, use, or disclose personal information from children or minors without the consent of a parent or legal guardian where required by applicable law. If we become aware that personal information of a minor has been collected without the necessary consent, we will take reasonable steps to delete such information promptly.',
          },
        ],
      },
      {
        title: '13. External Links Disclaimer',
        blocks: [
          {
            type: 'p',
            text: 'Our website and mobile application may contain links to third-party websites, applications, or services for the convenience of users. Such external websites are governed by their own terms, privacy policies, and practices. Corp Culture does not control, endorse, or assume responsibility for the content, security, availability, or privacy practices of any third-party websites or services. Users are encouraged to review the applicable policies before providing any personal information.',
          },
        ],
      },
      {
        title: '14. Policy Updates',
        blocks: [
          {
            type: 'p',
            text: 'Corp Culture reserves the right to modify or update this Privacy Policy and other legal policies from time to time to reflect changes in our business practices, legal requirements, or regulatory obligations. Any revised version will be published on our website and mobile application with the updated "Last Updated" date. Continued use of our website, mobile application, products, or services after such updates constitutes acceptance of the revised policy, to the extent permitted by applicable law.',
          },
        ],
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'By registering, purchasing, or using our services, you agree to these Terms & Conditions.',
    sections: [
      {
        title: 'Eligibility',
        blocks: [
          {
            type: 'p',
            text: 'Users must be at least 18 years old and legally capable of entering into a binding contract to create an account or purchase products or services through the platform.',
          },
        ],
      },
      {
        title: 'Customer Account',
        blocks: [
          { type: 'p', text: 'You agree to:' },
          {
            type: 'ul',
            items: [
              'Provide accurate information',
              'Maintain password confidentiality',
              'Update profile information promptly',
              'Accept responsibility for all activities under your account',
            ],
          },
        ],
      },
      {
        title: 'Orders',
        blocks: [
          { type: 'p', text: 'Corp Culture reserves the right to:' },
          {
            type: 'ul',
            items: ['Reject orders', 'Cancel orders', 'Verify customer information', 'Limit order quantities', 'Correct pricing errors'],
          },
        ],
      },
      {
        title: 'Pricing',
        blocks: [
          {
            type: 'ul',
            items: [
              'Prices may change without prior notice.',
              'GST will be charged as applicable.',
              'Quotations are valid only for the period mentioned.',
            ],
          },
        ],
      },
      {
        title: 'Payment Gateway & Payment Processing',
        blocks: [
          {
            type: 'p',
            text: 'All online payments are securely processed through authorized third-party payment gateway service providers. Corp Culture does not collect, store, or retain complete debit/credit card details, CVV, or other sensitive payment credentials.',
          },
          {
            type: 'p',
            text: 'In the event of a failed transaction, duplicate debit, or an amount being debited without successful order confirmation, customers should contact our customer support team with the relevant transaction details for verification. After payment verification, eligible orders will be processed or the applicable refund will be initiated in accordance with our Refund Policy.',
          },
          {
            type: 'p',
            text: 'Chargebacks and payment disputes shall be handled in accordance with the applicable rules of the payment gateway, banking partners, card networks, and applicable law. Corp Culture reserves the right to request supporting documents and investigate disputed transactions before processing any claim.',
          },
          { type: 'p', text: 'Payment methods include:' },
          {
            type: 'ul',
            items: ['UPI', 'Net Banking', 'Credit/Debit Cards', 'Bank Transfer', 'Corporate Credit (Approved Customers)'],
          },
          {
            type: 'p',
            text: 'Applicable charges, including any cancellation or late fees, shall be as specified in the signed quotation, proposal, or service agreement.',
          },
        ],
      },
      {
        title: 'Shipping & Delivery Policy',
        blocks: [
          {
            type: 'p',
            text: 'Dispatch Timelines: Orders will be processed and dispatched within the estimated timelines communicated at the time of order confirmation, subject to product availability, payment verification, and operational requirements. Delivery timelines are estimates and may vary based on the destination and logistics partner.',
          },
          {
            type: 'p',
            text: 'Shipping Charges: Applicable shipping, handling, or delivery charges, if any, will be displayed or communicated to the customer before order confirmation. Additional charges may apply for expedited delivery, remote locations, or special handling requirements.',
          },
          {
            type: 'p',
            text: 'Serviceable Locations: Delivery is available only to locations serviced by our logistics partners. Corp Culture reserves the right to accept, reject, or cancel orders for locations that are outside our serviceable areas.',
          },
          {
            type: 'p',
            text: 'Order Tracking: Tracking details will be provided, where available, after dispatch through the website, mobile application, email, SMS, or other communication channels.',
          },
          {
            type: 'p',
            text: 'Delays and Lost Shipments: While Corp Culture makes reasonable efforts to ensure timely delivery, delays may occur due to weather conditions, transportation issues, government restrictions, strikes, force majeure events, or other circumstances beyond our reasonable control. If a shipment is delayed or lost in transit, customers should notify our customer support team, and we will coordinate with the logistics partner to investigate and resolve the matter.',
          },
          {
            type: 'p',
            text: 'Risk of Loss: The risk of loss or damage to the product passes to the customer upon successful delivery to the customer or an authorised recipient at the delivery address. Any visible damage or shortages should be reported immediately upon delivery and in accordance with our Refund & Return Policy.',
          },
        ],
      },
      {
        title: 'Installation',
        blocks: [
          { type: 'p', text: 'Customer must ensure:' },
          {
            type: 'ul',
            items: ['Site readiness', 'Electrical power availability', 'Network availability', 'Necessary permissions'],
          },
          {
            type: 'p',
            text: "Any additional work beyond the agreed scope will be carried out only after the customer's approval of the revised scope, timeline, and applicable charges.",
          },
        ],
      },
      {
        title: 'Rental Equipment',
        blocks: [
          {
            type: 'p',
            text: 'Printer and rental equipment remain the property of Corp Culture unless sold under a purchase agreement.',
          },
          { type: 'p', text: 'Customers shall not:' },
          {
            type: 'ul',
            items: [
              'Relocate equipment without approval',
              'Tamper with hardware',
              'Remove asset labels',
              'Permit unauthorized repairs',
            ],
          },
          {
            type: 'p',
            text: 'Inspection, valuation, applicable deductions and dispute resolution shall be governed by the applicable Rental Agreement.',
          },
        ],
      },
      {
        title: 'Warranty',
        blocks: [
          { type: 'p', text: 'Warranty coverage is subject to manufacturer or service agreement terms and excludes:' },
          {
            type: 'ul',
            items: [
              'Physical damage',
              'Water damage',
              'Fire',
              'Power surge',
              'Unauthorized repair',
              'Normal wear and tear',
              'Consumable items',
            ],
          },
          { type: 'p', text: 'Warranty does not cover consumables unless specifically mentioned.' },
        ],
      },
      {
        title: 'Intellectual Property',
        blocks: [
          {
            type: 'p',
            text: 'All content available on the website and mobile application, including logos, trademarks, graphics, software, text, layouts, and other intellectual property, is owned by Corp Culture or its licensors, as applicable.',
          },
          {
            type: 'p',
            text: 'No part may be copied, reproduced, distributed, modified, or commercially exploited without prior written consent.',
          },
        ],
      },
      {
        title: 'Limitation of Liability',
        blocks: [
          {
            type: 'p',
            text: 'Nothing in this policy excludes or limits any liability that cannot be excluded under applicable law, including liability for fraud, wilful misconduct, or statutory obligations.',
          },
        ],
      },
      {
        title: 'Suspension & Termination',
        blocks: [
          { type: 'p', text: 'Corp Culture may suspend or terminate user accounts for:' },
          {
            type: 'ul',
            items: ['Fraudulent activity', 'Non-payment', 'Misuse of services', 'Violation of these Terms', 'Illegal activities'],
          },
        ],
      },
      {
        title: 'Force Majeure',
        blocks: [
          {
            type: 'p',
            text: 'Corp Culture shall not be held responsible for delays or failures caused by events beyond reasonable control, including natural disasters, government actions, strikes, pandemics, power failures, internet outages, or supplier disruptions.',
          },
        ],
      },
      {
        title: 'Governing Law',
        blocks: [
          {
            type: 'p',
            text: 'These Terms and Conditions shall be governed by the laws of India. Subject to mandatory consumer rights and other statutory remedies, courts of competent jurisdiction in Chennai, Tamil Nadu, shall have jurisdiction over disputes arising from these Terms and Conditions.',
          },
        ],
      },
      {
        title: 'Savings Clause',
        blocks: [
          {
            type: 'p',
            text: 'Nothing contained in these Website and Mobile Application Legal Policies, including the Terms & Conditions, Privacy Policy, Refund & Return Policy, or any other related policy, shall limit, exclude, or restrict any statutory consumer rights or any liability that cannot be excluded or limited under applicable law. This includes, without limitation, liability arising from fraud, wilful misconduct, gross negligence (where applicable), or any other legal obligations that are non-waivable under applicable law.',
          },
        ],
      },
      {
        title: 'Contact Information — Grievance Redressal',
        blocks: [
          {
            type: 'p',
            text: 'Corp Culture is committed to resolving customer complaints and grievances in a fair, transparent, and timely manner. Customers may contact our Grievance Officer regarding any concerns relating to our products, services, website, mobile application, orders, payments, refunds, privacy practices, or any other customer service issues.',
          },
          {
            type: 'contact',
            rows: [
              { label: 'Grievance Officer / Responsible Person', value: 'R. Gopi' },
              { label: 'Designation', value: 'Proprietor' },
              { label: 'Email', value: 'customer@corpculture.in' },
              { label: 'Telephone', value: '+91 73977 24205' },
              { label: 'Business Hours', value: 'Monday to Saturday, 9:00 AM to 7:00 PM (IST)' },
              { label: 'Acknowledgement Timeline', value: 'All grievances will be acknowledged within 48 hours of receipt.' },
              {
                label: 'Resolution Timeline',
                value:
                  'We aim to resolve all grievances within 15 business days from the date of acknowledgement. If additional investigation or information is required, the customer will be informed of the revised timeline.',
              },
            ],
          },
        ],
      },
    ],
  },
  refund: {
    title: 'Refund & Return Policy',
    subtitle:
      'At Corp Culture – Complete Office Solutions, customer satisfaction is important to us. This Refund Policy explains the conditions under which refunds may be provided for products purchased through our website, mobile application, or direct sales channels.',
    sections: [
      {
        title: '1. Product Sales',
        blocks: [
          {
            type: 'p',
            text: 'Refunds are applicable only for physical products sold by Corp Culture, subject to the terms below.',
          },
          { type: 'p', text: 'A refund may be approved if:' },
          {
            type: 'ul',
            items: [
              'The product delivered is damaged during transit.',
              'An incorrect product was delivered.',
              'The product has a verified manufacturing defect.',
              'The product is missing essential parts or accessories.',
              'The product cannot be replaced due to unavailability.',
            ],
          },
          {
            type: 'p',
            text: 'Customers must raise a refund request within 7 (seven) calendar days from the date of delivery.',
          },
        ],
      },
      {
        title: '2. Return Conditions',
        blocks: [
          { type: 'p', text: 'To be eligible for a refund, the product must:' },
          {
            type: 'ul',
            items: [
              'Be unused and in its original condition.',
              'Be returned with the original packaging.',
              'Include all accessories, manuals, and warranty cards (if applicable).',
              'Be accompanied by the original invoice or proof of purchase.',
            ],
          },
          {
            type: 'p',
            text: 'Corp Culture reserves the right to inspect the returned product before approving any refund.',
          },
        ],
      },
      {
        title: '3. Non-Refundable Products',
        blocks: [
          { type: 'p', text: 'Refunds will not be provided for:' },
          {
            type: 'ul',
            items: [
              'Customized or made-to-order products.',
              'Opened or used toner cartridges, ink cartridges, or other consumables.',
              'Software, digital licenses, or downloadable products.',
              'Products damaged due to misuse, negligence, improper installation, or unauthorized repairs.',
              'Clearance, promotional, or final sale items, unless required by applicable law.',
            ],
          },
        ],
      },
      {
        title: '4. Services and Rental',
        blocks: [
          {
            type: 'p',
            text: 'Services and Rentals are generally non-refundable after commencement/completion, subject to duplicate or failed payments, accepted cancellation, material non-performance and applicable law.',
          },
          { type: 'p', text: 'This includes, but is not limited to:' },
          {
            type: 'ul',
            items: [
              'Printer Rental Services',
              'Annual Maintenance Contracts (AMC)',
              'Comprehensive Maintenance Contracts (CMC)',
              'Printer Repair Services',
              'CCTV Installation and Maintenance',
              'Networking Installation and Maintenance',
              'On-site Engineer Visits',
              'Technical Support Services',
              'Installation Charges',
              'Inspection Charges',
              'Service Call Charges',
              'Consultancy or Site Survey Charges',
            ],
          },
          { type: 'h3', text: 'Service Refunds' },
          {
            type: 'p',
            text: 'Service, installation, repair, inspection and engineer-visit charges are generally non-refundable after the relevant service has been satisfactorily completed, subject to service-failure exceptions and applicable law.',
          },
          {
            type: 'p',
            text: 'Printer Rental Services are non-refundable. Once the rental agreement has commenced, rental charges paid are non-refundable, except where a refund is expressly required under applicable law or otherwise agreed to in writing by Corp Culture.',
          },
          {
            type: 'p',
            text: 'In the event of early termination by the customer, utilised rental charges, notice period charges, pro-rata rental charges, early termination charges, and any other applicable deductions shall be governed by the applicable Rental Agreement. No refund shall be payable for any unused rental period unless specifically provided for in the Rental Agreement or required by applicable law.',
          },
          { type: 'p', text: 'Upon termination or expiry of the rental agreement, the customer must:' },
          {
            type: 'ul',
            items: [
              'Return the equipment in good working condition, subject to normal wear and tear, within 7 to 10 business days from the date of approval or termination of the Agreement.',
              'Return all accessories, cables, adapters and other items supplied with the equipment.',
              'Allow Corp Culture to inspect the equipment before accepting its return.',
              'Settle all outstanding rental charges, service charges, penalties, and other applicable dues.',
            ],
          },
          {
            type: 'p',
            text: 'Corp Culture reserves the right to recover the cost of any physical damage (other than normal wear and tear), missing accessories, or unpaid dues in accordance with the Rental Agreement.',
          },
        ],
      },
      {
        title: '5. Refund Process',
        blocks: [
          { type: 'p', text: 'Once the returned product has been received and inspected:' },
          {
            type: 'ul',
            items: [
              'If approved, the refund will be processed to the original payment method or by bank transfer, as applicable.',
              "Approved refunds will ordinarily be initiated within 7 to 10 business days from the date of approval. The time required for the amount to reflect in the customer's account may vary depending on the payment gateway and the customer's bank.",
            ],
          },
        ],
      },
      {
        title: '6. Cancellation Before Dispatch',
        blocks: [
          {
            type: 'p',
            text: 'The Customer may cancel an order before dispatch by submitting a cancellation request to the Company. Cancellation requests will be processed only after confirmation by the Company. Orders for customised, made-to-order, or specially procured products are non-cancellable once production or procurement has commenced. Where applicable, approved refunds shall be processed within 7 to 10 business days after confirmation of the cancellation, subject to deduction of any applicable processing charges, taxes, or costs already incurred by the Company.',
          },
          {
            type: 'p',
            text: 'After dispatch, cancellation or return requests will be processed according to the Refund & Return Policy. Applicable outward and return-shipping charges may be deducted, subject to statutory consumer rights and applicable law.',
          },
        ],
      },
      {
        title: '7. Contact Us',
        blocks: [
          { type: 'p', text: 'For refund-related questions or to submit a refund request, please contact:' },
          {
            type: 'contact',
            rows: [
              { value: 'Corp Culture – Complete Office Solutions' },
              {
                value:
                  'A Block, Liberty Plaza, No. 12/30, Vada Agaram Road, Mehta Nagar, Aminjikarai, Chennai – 600029',
              },
              { label: 'Phone', value: '+91 73977 24205' },
              { label: 'Email', value: 'customer@corpculture.in' },
            ],
          },
        ],
      },
    ],
  },
};

export const getLegalDocument = (type?: string): LegalDocument => {
  if (type === 'privacy' || type === 'terms' || type === 'refund') {
    return LEGAL_DOCUMENTS[type];
  }
  return LEGAL_DOCUMENTS.privacy;
};
