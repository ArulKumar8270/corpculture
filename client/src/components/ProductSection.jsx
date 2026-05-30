import React from 'react';
import { Link } from 'react-router-dom';
import {
    resolveCategoryForProduct,
    isComingSoonStatus,
    getCategoryProductsPath,
} from '../utils/resolveProductCategory';

const ProductSection = ({ products = [], categories = [] }) => {
    const enriched = products.map((product) => {
        const categoryName = resolveCategoryForProduct(product, categories);
        const comingSoon = isComingSoonStatus(product.status);
        const canBrowse = Boolean(categoryName);

        return {
            ...product,
            categoryName,
            comingSoon,
            canBrowse,
            href: getCategoryProductsPath(categoryName),
        };
    });

    const hasBrowsable = enriched.some((p) => p.canBrowse);

    return (
        <section className="py-20 bg-gray-50 w-full rounded-3xl" id="products">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        Our Products
                    </h2>
                    <div className="h-1 w-24 bg-teal-500 mx-auto mb-6"></div>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {hasBrowsable
                            ? 'Browse products by category — select a collection below.'
                            : 'Explore our product categories — link categories in Front Home Settings to enable filtered browsing.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {enriched.map((product) => {
                        const cardInner = (
                            <>
                                <div className="absolute inset-0 overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-50" />
                                </div>

                                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                                    {/* <div
                                        className={`${product.bgColor} text-white font-bold py-1 px-3 rounded-full text-sm inline-block mb-3 w-fit`}
                                    >
                                        {product.status}
                                    </div> */}
                                    <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
                                    {product.categoryName && (
                                        <p className="text-sm text-white/80 mb-2">
                                            Category: {product.categoryName}
                                        </p>
                                    )}
                                    <div className="h-1 w-12 bg-white mb-2 opacity-80" />
                                    <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {product.canBrowse
                                            ? `View products in ${product.categoryName}`
                                            : product.comingSoon
                                              ? 'Coming soon — category will be linked when available.'
                                              : 'Set a sales category in admin to enable browsing.'}
                                    </p>
                                    {product.canBrowse && (
                                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full w-fit opacity-0 group-hover:opacity-100 transition-opacity">
                                            Shop now →
                                        </span>
                                    )}
                                </div>
                            </>
                        );

                        if (product.canBrowse) {
                            return (
                                <Link
                                    key={product.id}
                                    to={product.href}
                                    className="relative overflow-hidden rounded-xl shadow-lg group h-80 block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#019ee3]"
                                >
                                    {cardInner}
                                </Link>
                            );
                        }

                        return (
                            <div
                                key={product.id}
                                className="relative overflow-hidden rounded-xl shadow-lg group h-80 opacity-95"
                                aria-label={product.title}
                            >
                                {cardInner}
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Link
                        to="/products"
                        className="bg-[#019ee3] hover:bg-[#0180bd] text-white py-3 px-8 rounded-lg shadow-md transition-colors text-lg font-medium"
                    >
                        View all products
                    </Link>
                    {hasBrowsable && (
                        <p className="text-sm text-gray-500">
                            Tip: In admin, set &quot;Link category&quot; to the exact category name from Sales → Category.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ProductSection;
