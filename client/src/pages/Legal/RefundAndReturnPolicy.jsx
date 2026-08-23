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

const RefundAndReturnPolicy = () => {
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
                        Refund &amp; Return Policy
                    </p>
                    <h1 className="text-3xl font-bold text-[#0c115d] mb-2">
                        Refund &amp; Return Policy
                    </h1>
                    <p className="text-gray-600 mb-8">
                        At Corp Culture – Complete Office Solutions, customer
                        satisfaction is important to us. This Refund Policy
                        explains the conditions under which refunds may be
                        provided for products purchased through our website,
                        mobile application, or direct sales channels.
                    </p>

                    <Section title="1. Product Sales">
                        <p>
                            Refunds are applicable only for physical products
                            sold by Corp Culture, subject to the terms below.
                        </p>
                        <p>A refund may be approved if:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>
                                The product delivered is damaged during transit.
                            </li>
                            <li>An incorrect product was delivered.</li>
                            <li>
                                The product has a verified manufacturing defect.
                            </li>
                            <li>
                                The product is missing essential parts or
                                accessories.
                            </li>
                            <li>
                                The product cannot be replaced due to
                                unavailability.
                            </li>
                        </ul>
                        <p>
                            Customers must raise a refund request within 7
                            (seven) calendar days from the date of delivery.
                        </p>
                    </Section>

                    <Section title="2. Return Conditions">
                        <p>
                            To be eligible for a refund, the product must:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Be unused and in its original condition.</li>
                            <li>Be returned with the original packaging.</li>
                            <li>
                                Include all accessories, manuals, and warranty
                                cards (if applicable).
                            </li>
                            <li>
                                Be accompanied by the original invoice or proof
                                of purchase.
                            </li>
                        </ul>
                        <p>
                            Corp Culture reserves the right to inspect the
                            returned product before approving any refund.
                        </p>
                    </Section>

                    <Section title="3. Non-Refundable Products">
                        <p>Refunds will not be provided for:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Customized or made-to-order products.</li>
                            <li>
                                Opened or used toner cartridges, ink cartridges,
                                or other consumables.
                            </li>
                            <li>
                                Software, digital licenses, or downloadable
                                products.
                            </li>
                            <li>
                                Products damaged due to misuse, negligence,
                                improper installation, or unauthorized repairs.
                            </li>
                            <li>
                                Clearance, promotional, or final sale items,
                                unless required by applicable law.
                            </li>
                        </ul>
                    </Section>

                    <Section title="4. Services and Rental">
                        <p>
                            Services and Rentals are generally non-refundable
                            after commencement/completion, subject to duplicate
                            or failed payments, accepted cancellation, material
                            non-performance and applicable law.
                        </p>
                        <p>This includes, but is not limited to:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Printer Rental Services</li>
                            <li>Annual Maintenance Contracts (AMC)</li>
                            <li>Comprehensive Maintenance Contracts (CMC)</li>
                            <li>Printer Repair Services</li>
                            <li>CCTV Installation and Maintenance</li>
                            <li>Networking Installation and Maintenance</li>
                            <li>On-site Engineer Visits</li>
                            <li>Technical Support Services</li>
                            <li>Installation Charges</li>
                            <li>Inspection Charges</li>
                            <li>Service Call Charges</li>
                            <li>Consultancy or Site Survey Charges</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-[#0c115d] pt-2">
                            Service Refunds
                        </h3>
                        <p>
                            Service, installation, repair, inspection and
                            engineer-visit charges are generally non-refundable
                            after the relevant service has been satisfactorily
                            completed, subject to service-failure exceptions and
                            applicable law.
                        </p>
                        <p>
                            Printer Rental Services are non-refundable. Once the
                            rental agreement has commenced, rental charges paid
                            are non-refundable, except where a refund is
                            expressly required under applicable law or otherwise
                            agreed to in writing by Corp Culture.
                        </p>
                        <p>
                            In the event of early termination by the customer,
                            utilised rental charges, notice period charges,
                            pro-rata rental charges, early termination charges,
                            and any other applicable deductions shall be governed
                            by the applicable Rental Agreement. No refund shall
                            be payable for any unused rental period unless
                            specifically provided for in the Rental Agreement or
                            required by applicable law.
                        </p>
                        <p>
                            Upon termination or expiry of the rental agreement,
                            the customer must:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>
                                Return the equipment in good working condition,
                                subject to normal wear and tear, within 7 to 10
                                business days from the date of approval or
                                termination of the Agreement.
                            </li>
                            <li>
                                Return all accessories, cables, adapters and
                                other items supplied with the equipment.
                            </li>
                            <li>
                                Allow Corp Culture to inspect the equipment
                                before accepting its return.
                            </li>
                            <li>
                                Settle all outstanding rental charges, service
                                charges, penalties, and other applicable dues.
                            </li>
                        </ul>
                        <p>
                            Corp Culture reserves the right to recover the cost
                            of any physical damage (other than normal wear and
                            tear), missing accessories, or unpaid dues in
                            accordance with the Rental Agreement.
                        </p>
                    </Section>

                    <Section title="5. Refund Process">
                        <p>
                            Once the returned product has been received and
                            inspected:
                        </p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>
                                If approved, the refund will be processed to the
                                original payment method or by bank transfer, as
                                applicable.
                            </li>
                            <li>
                                Approved refunds will ordinarily be initiated
                                within 7 to 10 business days from the date of
                                approval. The time required for the amount to
                                reflect in the customer&apos;s account may vary
                                depending on the payment gateway and the
                                customer&apos;s bank.
                            </li>
                        </ul>
                    </Section>

                    <Section title="6. Cancellation Before Dispatch">
                        <p>
                            The Customer may cancel an order before dispatch by
                            submitting a cancellation request to the Company.
                            Cancellation requests will be processed only after
                            confirmation by the Company. Orders for customised,
                            made-to-order, or specially procured products are
                            non-cancellable once production or procurement has
                            commenced. Where applicable, approved refunds shall
                            be processed within 7 to 10 business days after
                            confirmation of the cancellation, subject to
                            deduction of any applicable processing charges,
                            taxes, or costs already incurred by the Company.
                        </p>
                        <p>
                            After dispatch, cancellation or return requests will
                            be processed according to the Refund &amp; Return
                            Policy. Applicable outward and return-shipping
                            charges may be deducted, subject to statutory
                            consumer rights and applicable law.
                        </p>
                    </Section>

                    <Section title="7. Contact Us">
                        <p>
                            For refund-related questions or to submit a refund
                            request, please contact:
                        </p>
                        <div className="bg-[#f1f3f6] rounded-md p-4 space-y-1">
                            <p className="font-semibold text-[#0c115d]">
                                Corp Culture – Complete Office Solutions
                            </p>
                            <p>
                                A Block, Liberty Plaza, No. 12/30, Vada Agaram
                                Road, Mehta Nagar, Aminjikarai, Chennai – 600029
                            </p>
                            <p>
                                <span className="font-semibold">Phone:</span>{" "}
                                <a
                                    href="tel:+917397724205"
                                    className="text-cyan-700 hover:underline"
                                >
                                    +91 73977 24205
                                </a>
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
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default RefundAndReturnPolicy;
