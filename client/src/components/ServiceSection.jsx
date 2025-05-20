import React from 'react';
const ServiceSection = ({ services }) => {
  return (
    <section className="py-20 w-full servicesection" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Services
          </h2>
          <div className="h-1 w-24 bg-teal-500 mx-auto mb-6"></div>
          <p className="text-lg text-white max-w-2xl mx-auto">
            We offer a comprehensive range of technical services to meet all your business needs
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
            >
              <div 
                className={`${service.bgColor} p-6 flex justify-center items-center transition-all duration-300 group-hover:scale-105`}
              >
                <div className="bg-white/20 p-4 rounded-full">
                  {service.icon}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;