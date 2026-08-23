import React from "react";
import { Link } from "react-router-dom";
import ScrollToTopOnRouteChange from "../../utils/ScrollToTopOnRouteChange";

const Section = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#0c115d] mb-3 border-b border-cyan-200 pb-2">
            {title}
        </h2>
        <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
);

const PrivacyPolicy = () => {
    return (
        <div className="bg-[#f1f3f6] min-h-[60vh]">
            <ScrollToTopOnRouteChange />
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="bg-white rounded-lg shadow-sm p-6 md:p-10">
                    <p className="text-sm text-cyan-700 mb-2">
                        <Link to="/" className="hover:underline">
                            Home
                        </Link>
                        {" / "}
                        Privacy Policy
                    </p>
                    <h1 className="text-3xl font-bold text-[#0c115d] mb-2">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-500 text-sm mb-8">
                        Last Updated: August 12, 2026
                    </p>

                    <Section title="1. Introduction">
                        <p>
                            Corp Culture (&quot;Company&quot;, &quot;we&quot;,
                            &quot;our&quot;, &quot;us&quot;) respects your
                            privacy.
                        </p>
                        <p>
                            This Privacy Policy explains how we collect,
                            process, store, share, and protect your personal
                            information when you use our website, mobile
                            application, or purchase products and services from
                            us. By providing personal information and giving
                            consent through the website, mobile application, or
                            other authorized channels, the user agrees to the
                            collection and processing of such information for
                            the stated purposes. Users may withdraw their
                            consent at any time by contacting customer support,
                            subject to applicable legal and contractual
                            requirements.
                        </p>
                    </Section>

                    <Section title="2. Information We Collect">
                        <h3 className="text-lg font-semibold text-[#0c115d]">
                            Personal Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Full Name</li>
                            <li>Company Name</li>
                            <li>GST Number</li>
                            <li>Mobile Number</li>
                            <li>Email Address</li>
                            <li>Billing Address</li>
                            <li>Shipping Address</li>
                            <li>Delivery Contact Person</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[#0c115d] pt-2">
                            Account Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Username</li>
                            <li>
                                Password credentials are securely hashed and are
                                not stored in plain text
                            </li>
                            <li>Customer ID</li>
                            <li>Vendor ID</li>
                            <li>Employee ID</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[#0c115d] pt-2">
                            Payment Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>UPI Reference</li>
                            <li>Bank Details (where applicable)</li>
                            <li>Transaction ID</li>
                            <li>Payment Status</li>
                        </ul>
                        <p>
                            <span className="font-semibold">Note:</span> Card
                            information is processed only through authorized
                            payment gateways. Corp Culture does not store
                            complete debit or credit card details.
                        </p>

                        <h3 className="text-lg font-semibold text-[#0c115d] pt-2">
                            Device Information
                        </h3>
                        <p>
                            We may collect a persistent device identifier, with
                            your consent where required, for security and
                            service improvement. The information is retained
                            only as necessary or as required by law.
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Device Model</li>
                            <li>Android/iOS Version</li>
                            <li>Browser Information</li>
                            <li>IP Address</li>
                            <li>App Version</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[#0c115d] pt-2">
                            Location Information
                        </h3>
                        <p>
                            Location access is optional and can be withdrawn
                            anytime through your device settings. Background
                            location is collected only with your explicit
                            consent.
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Engineer visit tracking</li>
                            <li>Service location</li>
                            <li>Delivery tracking</li>
                            <li>Installation confirmation</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[#0c115d] pt-2">
                            Usage Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Login Time</li>
                            <li>Logout Time</li>
                            <li>Click Activity</li>
                            <li>Products Viewed</li>
                            <li>Orders Placed</li>
                            <li>App Usage Analytics</li>
                        </ul>
                        <p>
                            Where applicable, usage analytics are collected to
                            improve our services and retained only as necessary.
                        </p>
                    </Section>

                    <Section title="3. How We Use Your Information">
                        <p>Your information is used to:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>To create and manage customer accounts.</li>
                            <li>To verify customer identity</li>
                            <li>To process orders</li>
                            <li>To deliver products</li>
                            <li>To schedule installations</li>
                            <li>To manage rental contracts</li>
                            <li>To generate GST invoices</li>
                            <li>To process refunds</li>
                            <li>To handle warranty claims</li>
                            <li>To send order updates</li>
                            <li>To improve customer service</li>
                            <li>To prevent fraud</li>
                            <li>To maintain legal compliance</li>
                        </ul>
                    </Section>

                    <Section title="4. Cookies">
                        <p>Our website uses cookies to:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Keep you logged in</li>
                            <li>Remember preferences</li>
                            <li>
                                Improve website performance and user experience.
                            </li>
                            <li>Analyze visitor traffic</li>
                            <li>Provide personalized content</li>
                        </ul>
                    </Section>

                    <Section title="5. Information Sharing">
                        <p>We may share information only with:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Payment Gateway Providers</li>
                            <li>Technical Service Engineers</li>
                            <li>OEM Manufacturers</li>
                            <li>Government Authorities</li>
                            <li>Legal Agencies when required by law</li>
                        </ul>
                        <p>
                            We do not sell, rent or trade personal information
                            to third parties for their independent marketing
                            purposes.
                        </p>
                    </Section>

                    <Section title="6. Data Retention">
                        <p>
                            Corp Culture retains personal information only for
                            as long as necessary to fulfil the purposes for
                            which it was collected, provide our products and
                            services, comply with applicable legal, regulatory,
                            taxation, and accounting obligations, resolve
                            disputes, enforce our agreements, and protect our
                            legitimate business interests. When personal
                            information is no longer required, it will be
                            securely deleted, anonymised, or disposed of in
                            accordance with applicable law and our internal data
                            retention practices.
                        </p>
                        <p>
                            We retain customer information for as long as
                            necessary to:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Complete transactions</li>
                            <li>Meet legal obligations</li>
                            <li>Resolve disputes</li>
                            <li>Maintain financial records</li>
                        </ul>
                    </Section>

                    <Section title="7. Data Security">
                        <p>
                            We implement appropriate technical and
                            organizational security measures including:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>SSL Encryption</li>
                            <li>Role-Based Access Control</li>
                            <li>Firewall Protection</li>
                            <li>
                                Sensitive information is encrypted at rest,
                                where applicable, using appropriate security
                                measures.
                            </li>
                            <li>Secure Login Authentication</li>
                            <li>
                                Multi-factor authentication (MFA) is implemented
                                for applicable users and services
                            </li>
                        </ul>
                    </Section>

                    <Section title="8. Your Rights">
                        <p>
                            Subject to applicable law, customers may request:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Access to personal data</li>
                            <li>Correction of information</li>
                            <li>
                                Requests are processed after identity
                                verification. Certain information may be
                                retained as required by law, and we aim to
                                respond within a reasonable timeframe.
                            </li>
                            <li>Download of personal information</li>
                            <li>Marketing communication opt-out</li>
                        </ul>
                    </Section>

                    <Section title="9. Consent Withdrawal & Account Deletion">
                        <p>
                            Customers may withdraw their consent for applicable
                            data processing or request deletion of their account
                            at any time by contacting our customer support team
                            through the contact details provided in this Policy.
                            Upon verification of the request, Corp Culture will
                            process the request within a reasonable timeframe.
                            Certain information may be retained where required
                            by applicable law, for regulatory compliance, fraud
                            prevention, dispute resolution, or the
                            establishment, exercise, or defence of legal claims.
                        </p>
                    </Section>

                    <Section title="10. Data Breach Notification">
                        <p>
                            Corp Culture maintains appropriate technical and
                            organisational security measures to protect personal
                            information. In the event of a reportable personal
                            data breach, we will take appropriate remedial
                            measures and, where required by applicable law,
                            notify affected users and the relevant regulatory
                            authorities within the prescribed timelines.
                        </p>
                    </Section>

                    <Section title="11. Third-Party Analytics & Service Providers">
                        <p>
                            Corp Culture may engage authorised third-party
                            service providers, including payment gateway
                            providers, cloud hosting providers, analytics
                            providers, communication platforms, logistics
                            partners, OEM manufacturers, and technical support
                            providers, solely for the purpose of providing,
                            operating, maintaining, securing, and improving our
                            products and services. Such third parties are
                            authorised to process personal information only as
                            necessary to perform their services and are required
                            to protect the information in accordance with
                            applicable laws and contractual obligations.
                        </p>
                    </Section>

                    <Section title="12. Children's Privacy">
                        <p>
                            Our website and mobile application are intended for
                            use by individuals who are 18 years of age or older.
                            We do not knowingly collect, use, or disclose
                            personal information from children or minors without
                            the consent of a parent or legal guardian where
                            required by applicable law. If we become aware that
                            personal information of a minor has been collected
                            without the necessary consent, we will take
                            reasonable steps to delete such information
                            promptly.
                        </p>
                    </Section>

                    <Section title="13. External Links Disclaimer">
                        <p>
                            Our website and mobile application may contain links
                            to third-party websites, applications, or services
                            for the convenience of users. Such external websites
                            are governed by their own terms, privacy policies,
                            and practices. Corp Culture does not control,
                            endorse, or assume responsibility for the content,
                            security, availability, or privacy practices of any
                            third-party websites or services. Users are
                            encouraged to review the applicable policies before
                            providing any personal information.
                        </p>
                    </Section>

                    <Section title="14. Policy Updates">
                        <p>
                            Corp Culture reserves the right to modify or update
                            this Privacy Policy and other legal policies from
                            time to time to reflect changes in our business
                            practices, legal requirements, or regulatory
                            obligations. Any revised version will be published
                            on our website and mobile application with the
                            updated &quot;Last Updated&quot; date. Continued use
                            of our website, mobile application, products, or
                            services after such updates constitutes acceptance of
                            the revised policy, to the extent permitted by
                            applicable law.
                        </p>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
