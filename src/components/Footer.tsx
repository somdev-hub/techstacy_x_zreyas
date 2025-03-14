import React from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              <span className="font-starblazer">Techstacy X</span>
              <span className="font-samarkan text-3xl"> Zreyas</span>
            </h3>
            <p className="text-gray-400 mb-4">
              Join us for an incredible tech festival experience that brings
              together innovation and creativity.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex justify-start w-full items-start">
            <Image
              src={"/assets/silicon-logo.png"}
              alt="Silicon Institute of Technology"
              width={200}
              height={200}
            />
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              Contact Us
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone size={18} />
                <span>Satyabrat Panigrahi: +91 789 723 9782</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} />
                <span>Saswat Ranjan Pattnaik: +91 893 849 3849</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} />
                <span>Ankit Roy: +91 898 989 8320</span>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin size={18} />
                <span>Silicon Institute of Technology, Sambalpur</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p>© 2024 Techstacy X Zreyas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
