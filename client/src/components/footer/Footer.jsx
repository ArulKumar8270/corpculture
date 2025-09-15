import React from "react";
import logo from "../../assets/images/logo.png";

const Footer = () => (
    <footer className="w-full bg-[#0c115d] text-white relative overflow-hidden pt-16">
        {/* Top Wave SVG */}
        <div className="absolute top-[-89px] left-[100px] right-[100px] w-full">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-24">
                <path fill="#7ee8fa" fillOpacity="1" d="M0,32L48,53.3C96,75,192,117,288,117.3C384,117,480,75,576,53.3C672,32,768,32,864,58.7C960,85,1056,139,1152,154.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            </svg>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
                {/* Contact Us */}
                <div className="flex-1 mb-8 md:mb-0">
                    <h3 className="font-bold text-lg mb-3">Contact Us</h3>
                    <div className="mb-2">
                        <span className="font-semibold">Phone:</span> 9003240001
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">Email:</span> <a href="mailto:customer@corpculture.in" className="text-cyan-300 hover:underline">customer@corpculture.in</a>
                    </div>
                    <div className="mb-2">
                    A Block , liberty Plaza, No. 12/30, Vada Agaram Road , Mehta Nagar, Aminjikarai, Chennai- 600 002
                    </div>
                    <a href="#" className="text-cyan-300 hover:underline">Get Directions &rarr;</a>
                    <div className="flex gap-3 mt-6">
                        <a href="#" className="hover:text-cyan-300"><i className="fab fa-facebook-f text-xl"></i></a>
                        <a href="#" className="hover:text-cyan-300"><i className="fab fa-twitter text-xl"></i></a>
                        <a href="#" className="hover:text-cyan-300"><i className="fab fa-instagram text-xl"></i></a>
                        <a href="#" className="hover:text-cyan-300"><i className="fab fa-youtube text-xl"></i></a>
                        <a href="#" className="hover:text-cyan-300"><i className="fab fa-pinterest text-xl"></i></a>
                    </div>
                </div>
                {/* Logo & Newsletter */}
                <div className="flex-1 flex flex-col items-center">
                    <img src={logo} alt="logo" className="h-16 mb-2" />
                    <div className="font-bold mb-2 text-center">Sign Up For Offers And Promotions!</div>
                    <form className="flex w-full max-w-xs mx-auto">
                        <input
                            type="email"
                            placeholder="Your email address..."
                            className="rounded-l-lg px-4 py-2 w-full text-gray-900 focus:outline-none"
                        />
                        <button type="submit" className="bg-cyan-400 hover:bg-cyan-500 px-4 py-2 rounded-r-lg flex items-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m0 0l4-4m-4 4l4 4" />
                            </svg>
                        </button>
                    </form>
                </div>
                {/* Hours of Operation */}
                <div className="flex-1 text-right md:text-left">
                    <h3 className="font-bold text-lg mb-3">Hours of Operation</h3>
                    <div className="mb-2">
                        <span className="font-semibold">Open 7 Days a Week</span>
                        <br />
                        8:00AM - 7:00 PM
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">Closed on:</span>
                        <br />
                        New Year's Day, Easter,<br />
                        Thanksgiving Day, Christmas Day
                    </div>
                </div>
            </div>
            {/* Footer Navigation */}
            <div className="border-t border-cyan-900 mt-10 pt-6 flex flex-col items-center">
                <nav className="flex flex-wrap justify-center gap-6 text-cyan-200 text-sm mb-4">
                    <a href="#" className="hover:underline">About</a>
                    <a href="#" className="hover:underline">Products</a>
                    <a href="#" className="hover:underline">Testimonials</a>
                </nav>
                <div className="text-cyan-100 text-xs">
                    Copyright &copy; {new Date().getFullYear()} Corpculture. All Rights Reserved.
                </div>
                <h6 class="mb-0">Designed by <a href="https://nicknameinfotech.com" target="_blank" class="text-white text-decoration-underline">Nickname Infotech</a></h6>
            </div>
        </div>
    </footer>
);

export default Footer;
