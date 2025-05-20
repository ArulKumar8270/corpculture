import React from 'react';
import { ShoppingCart } from 'lucide-react';


const books = [
  {
    id: 1,
    category: "Rental",
    description: "Sed ac arcu sed felis vulputate molestie. Nullam at urna",
    discount: "25% OFF",
    image: "https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  },
  {
    id: 2,
    category: "Credit",
    description: "Sed ac arcu sed felis vulputate molestie. Nullam at urna",
    discount: "25% OFF",
    image: "https://images.pexels.com/photos/3747139/pexels-photo-3747139.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  },
  {
    id: 3,
    category: "AMC / AMLC",
    description: "Sed ac arcu sed felis vulputate molestie. Nullam at urna",
    discount: "25% OFF",
    image: "https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  }
];

const BookShowcase = () => {
  return (
    <section className="py-16 px-4 md:px-8 w-full bg-white rounded-3xl">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books?.map((book) => (
            <div 
              key={book.id}
              className="relative rounded-3xl overflow-hidden group cursor-pointer"
              style={{ height: '400px' }}
            >
              <div className="absolute inset-0">
                <img 
                  src={book.image} 
                  alt={book.category}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
              </div>
              
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-red-500 text-sm font-medium">{book.discount}</span>
              </div>
              
              <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <ShoppingCart size={20} className="text-gray-800" />
              </button>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{book.category}</h3>
                <p className="text-white/80 text-sm mb-4">{book.description}</p>
                <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-300 px-6 py-2 rounded-full text-sm font-medium">
                  View Collection
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookShowcase;