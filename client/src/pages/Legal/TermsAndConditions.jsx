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

const TermsAndConditions = () => {
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
                        Terms &amp; Conditions
                    </p>
                    <h1 className="text-3xl font-bold text-[#0c115d] mb-2">
                        Terms &amp; Conditions
                    </h1>
                    <p className="text-gray-600 mb-8">
                        By registering, purchasing, or using our services, you
                        agree to these Terms &amp; Conditions.
                    </p>

                    <Section title="Eligibility">
                        <p>
                            Users must be at least 18 years old and legally
                            capable of entering into a binding contract to create
                            an account or purchase products or services through
                            the platform.
                        </p>
                    </Section>

                    <Section title="Customer Account">
                        <p>You agree to:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Provide accurate information</li>
                            <li>Maintain password confidentiality</li>
                            <li>Update profile information promptly</li>
                            <li>
                                Accept responsibility for all activities under
                                your account
                            </li>
                        </ul>
                    </Section>

                    <Section title="Orders">
                        <p>Corp Culture reserves the right to:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Reject orders</li>
                            <li>Cancel orders</li>
                            <li>Verify customer information</li>
                            <li>Limit order quantities</li>
                            <li>Correct pricing errors</li>
                        </ul>
                    </Section>

                    <Section title="Pricing">
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Prices may change without prior notice.</li>
                            <li>GST will be charged as applicable.</li>
                            <li>
                                Quotations are valid only for the period
                                mentioned.
                            </li>
                        </ul>
                    </Section>

                    <Section title="Payment Gateway & Payment Processing">
                        <p>
                            All online payments are securely processed through
                            authorized third-party payment gateway service
                            providers. Corp Culture does not collect, store, or
                            retain complete debit/credit card details, CVV, or
                            other sensitive payment credentials.
                        </p>
                        <p>
                            In the event of a failed transaction, duplicate
                            debit, or an amount being debited without successful
                            order confirmation, customers should contact our
                            customer support team with the relevant transaction
                            details for verification. After payment verification,
                            eligible orders will be processed or the applicable
                            refund will be initiated in accordance with our
                            Refund Policy.
                        </p>
                        <p>
                            Chargebacks and payment disputes shall be handled in
                            accordance with the applicable rules of the payment
                            gateway, banking partners, card networks, and
                            applicable law. Corp Culture reserves the right to
                            request supporting documents and investigate
                            disputed transactions before processing any claim.
                        </p>
                        <p>Payment methods include:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>UPI</li>
                            <li>Net Banking</li>
                            <li>Credit/Debit Cards</li>
                            <li>Bank Transfer</li>
                            <li>Corporate Credit (Approved Customers)</li>
                        </ul>
                        <p>
                            Applicable charges, including any cancellation or
                            late fees, shall be as specified in the signed
                            quotation, proposal, or service agreement.
                        </p>
                    </Section>

                    <Section title="Shipping & Delivery Policy">
                        <p>
                            <span className="font-semibold text-gray-800">
                                Dispatch Timelines:
                            </span>{" "}
                            Orders will be processed and dispatched within the
                            estimated timelines communicated at the time of order
                            confirmation, subject to product availability,
                            payment verification, and operational requirements.
                            Delivery timelines are estimates and may vary based
                            on the destination and logistics partner.
                        </p>
                        <p>
                            <span className="font-semibold text-gray-800">
                                Shipping Charges:
                            </span>{" "}
                            Applicable shipping, handling, or delivery charges,
                            if any, will be displayed or communicated to the
                            customer before order confirmation. Additional
                            charges may apply for expedited delivery, remote
                            locations, or special handling requirements.
                        </p>
                        <p>
                            <span className="font-semibold text-gray-800">
                                Serviceable Locations:
                            </span>{" "}
                            Delivery is available only to locations serviced by
                            our logistics partners. Corp Culture reserves the
                            right to accept, reject, or cancel orders for
                            locations that are outside our serviceable areas.
                        </p>
                        <p>
                            <span className="font-semibold text-gray-800">
                                Order Tracking:
                            </span>{" "}
                            Tracking details will be provided, where available,
                            after dispatch through the website, mobile
                            application, email, SMS, or other communication
                            channels.
                        </p>
                        <p>
                            <span className="font-semibold text-gray-800">
                                Delays and Lost Shipments:
                            </span>{" "}
                            While Corp Culture makes reasonable efforts to ensure
                            timely delivery, delays may occur due to weather
                            conditions, transportation issues, government
                            restrictions, strikes, force majeure events, or other
                            circumstances beyond our reasonable control. If a
                            shipment is delayed or lost in transit, customers
                            should notify our customer support team, and we will
                            coordinate with the logistics partner to investigate
                            and resolve the matter.
                        </p>
                        <p>
                            <span className="font-semibold text-gray-800">
                                Risk of Loss:
                            </span>{" "}
                            The risk of loss or damage to the product passes to
                            the customer upon successful delivery to the customer
                            or an authorised recipient at the delivery address.
                            Any visible damage or shortages should be reported
                            immediately upon delivery and in accordance with our
                            Refund &amp; Return Policy.
                        </p>
                    </Section>

                    <Section title="Installation">
                        <p>Customer must ensure:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Site readiness</li>
                            <li>Electrical power availability</li>
                            <li>Network availability</li>
                            <li>Necessary permissions</li>
                        </ul>
                        <p>
                            Any additional work beyond the agreed scope will be
                            carried out only after the customer&apos;s approval
                            of the revised scope, timeline, and applicable
                            charges.
                        </p>
                    </Section>

                    <Section title="Rental Equipment">
                        <p>
                            Printer and rental equipment remain the property of
                            Corp Culture unless sold under a purchase agreement.
                        </p>
                        <p>Customers shall not:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Relocate equipment without approval</li>
                            <li>Tamper with hardware</li>
                            <li>Remove asset labels</li>
                            <li>Permit unauthorized repairs</li>
                        </ul>
                        <p>
                            Inspection, valuation, applicable deductions and
                            dispute resolution shall be governed by the
                            applicable Rental Agreement.
                        </p>
                    </Section>

                    <Section title="Warranty">
                        <p>
                            Warranty coverage is subject to manufacturer or
                            service agreement terms and excludes:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Physical damage</li>
                            <li>Water damage</li>
                            <li>Fire</li>
                            <li>Power surge</li>
                            <li>Unauthorized repair</li>
                            <li>Normal wear and tear</li>
                            <li>Consumable items</li>
                        </ul>
                        <p>
                            Warranty does not cover consumables unless
                            specifically mentioned.
                        </p>
                    </Section>

                    <Section title="Intellectual Property">
                        <p>
                            All content available on the website and mobile
                            application, including logos, trademarks, graphics,
                            software, text, layouts, and other intellectual
                            property, is owned by Corp Culture or its licensors,
                            as applicable.
                        </p>
                        <p>
                            No part may be copied, reproduced, distributed,
                            modified, or commercially exploited without prior
                            written consent.
                        </p>
                    </Section>

                    <Section title="Limitation of Liability">
                        <p>
                            Nothing in this policy excludes or limits any
                            liability that cannot be excluded under applicable
                            law, including liability for fraud, wilful
                            misconduct, or statutory obligations.
                        </p>
                    </Section>

                    <Section title="Suspension & Termination">
                        <p>
                            Corp Culture may suspend or terminate user accounts
                            for:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Fraudulent activity</li>
                            <li>Non-payment</li>
                            <li>Misuse of services</li>
                            <li>Violation of these Terms</li>
                            <li>Illegal activities</li>
                        </ul>
                    </Section>

                    <Section title="Force Majeure">
                        <p>
                            Corp Culture shall not be held responsible for delays
                            or failures caused by events beyond reasonable
                            control, including natural disasters, government
                            actions, strikes, pandemics, power failures, internet
                            outages, or supplier disruptions.
                        </p>
                    </Section>

                    <Section title="Governing Law">
                        <p>
                            These Terms and Conditions shall be governed by the
                            laws of India. Subject to mandatory consumer rights
                            and other statutory remedies, courts of competent
                            jurisdiction in Chennai, Tamil Nadu, shall have
                            jurisdiction over disputes arising from these Terms
                            and Conditions.
                        </p>
                    </Section>

                    <Section title="Savings Clause">
                        <p>
                            Nothing contained in these Website and Mobile
                            Application Legal Policies, including the Terms &amp;
                            Conditions, Privacy Policy, Refund &amp; Return
                            Policy, or any other related policy, shall limit,
                            exclude, or restrict any statutory consumer rights or
                            any liability that cannot be excluded or limited
                            under applicable law. This includes, without
                            limitation, liability arising from fraud, wilful
                            misconduct, gross negligence (where applicable), or
                            any other legal obligations that are non-waivable
                            under applicable law.
                        </p>
                    </Section>

                    <Section title="Contact Information — Grievance Redressal">
                        <p>
                            Corp Culture is committed to resolving customer
                            complaints and grievances in a fair, transparent, and
                            timely manner. Customers may contact our Grievance
                            Officer regarding any concerns relating to our
                            products, services, website, mobile application,
                            orders, payments, refunds, privacy practices, or any
                            other customer service issues.
                        </p>
                        <div className="bg-[#f1f3f6] rounded-md p-4 space-y-1">
                            <p>
                                <span className="font-semibold">
                                    Grievance Officer / Responsible Person:
                                </span>{" "}
                                R. Gopi
                            </p>
                            <p>
                                <span className="font-semibold">
                                    Designation:
                                </span>{" "}
                                Proprietor
                            </p>
                            <p>
                                <span className="font-semibold">Email:</span>{" "}
                                <a
                                    href="mailto:customer@corpculture.in"
                                    className="text-cyan-700 hover:underline"
                                >
                                    customer@corpculture.in
                                </a>
                            </p>
                            <p>
                                <span className="font-semibold">
                                    Telephone:
                                </span>{" "}
                                <a
                                    href="tel:+917397724205"
                                    className="text-cyan-700 hover:underline"
                                >
                                    +91 73977 24205
                                </a>
                            </p>
                            <p>
                                <span className="font-semibold">
                                    Business Hours:
                                </span>{" "}
                                Monday to Saturday, 9:00 AM to 7:00 PM (IST)
                            </p>
                            <p>
                                <span className="font-semibold">
                                    Acknowledgement Timeline:
                                </span>{" "}
                                All grievances will be acknowledged within 48
                                hours of receipt.
                            </p>
                            <p>
                                <span className="font-semibold">
                                    Resolution Timeline:
                                </span>{" "}
                                We aim to resolve all grievances within 15
                                business days from the date of acknowledgement.
                                If additional investigation or information is
                                required, the customer will be informed of the
                                revised timeline.
                            </p>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
