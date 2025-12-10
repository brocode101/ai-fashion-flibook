import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Share2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    url: string;
    title: string;
    price: string;
  } | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product }) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] w-full max-w-4xl h-[80vh] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/10 relative"
            >
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 z-10 p-2 bg-black/20 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
              >
                <X size={20} />
              </button>

              {/* Image Section */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden group">
                <motion.img
                  layoutId={`image-${product.title}`}
                  src={product.url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between text-white">
                <div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <span className="px-3 py-1 rounded-full border border-white/20 text-xs uppercase tracking-widest bg-white/5">
                      New Collection
                    </span>
                    <span className="text-green-400 text-xs uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      In Stock
                    </span>
                  </motion.div>

                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-serif text-5xl md:text-6xl italic mb-2"
                  >
                    {product.title}
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-light opacity-90 mb-8"
                  >
                    {product.price}
                  </motion.p>

                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/60 font-sans leading-relaxed text-sm md:text-base max-w-sm"
                  >
                    Crafted with precision for the modern silhouette. This piece embodies the Dualite philosophy of digital elegance meeting physical texture. Limited edition run for the Fall/Winter 2025 season.
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-4 mt-8"
                >
                  <button className="flex-1 bg-white text-black py-4 rounded-full font-sans font-medium uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group">
                    <ShoppingBag size={18} />
                    <span>Add to Cart</span>
                  </button>
                  <button className="px-6 py-4 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                    <Share2 size={18} />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
