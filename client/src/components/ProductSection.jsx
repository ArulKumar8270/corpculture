import React from 'react';

const ProductSection = ({ products }) => {
  return (
    <section className="py-20 bg-gray-50 w-full rounded-3xl" id="products">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Our Products
          </h2>
          <div className="h-1 w-24 bg-teal-500 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Exciting new product lines coming soon to expand our offerings
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="relative overflow-hidden rounded-xl shadow-lg group h-80"
            >
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>
              
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <div className={`${product.bgColor} text-white font-bold py-1 px-3 rounded-full text-sm inline-block mb-3 w-fit`}>
                  {product.status}
                </div>
                <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
                <div className="h-1 w-12 bg-white mb-2 opacity-80"></div>
                <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Sign up to get notified when this product becomes available.
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-teal-500 hover:bg-teal-600 text-white py-3 px-8 rounded-lg shadow-md transition-colors text-lg font-medium">
            Get Updates
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;