import React from 'react';
import { Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import toast from 'react-hot-toast';

export default function ProductCard({ product, onAddToCart }) {

  const navigate = useNavigate();


  // View product details
  const handleViewProduct = () => {
    navigate(`/products/${product.id}`);
  };


  // Wishlist
  const handleWishlist = () => {

    const user = JSON.parse(
      localStorage.getItem("user")
    );


    if (!user) {
      toast.error("Please login to add wishlist items");
      navigate("/login");
      return;
    }


    const wishlist =
      JSON.parse(localStorage.getItem("wishlist")) || [];


    const alreadyAdded = wishlist.find(
      item => item.id === product.id
    );


    if(alreadyAdded){
      toast.error("Product already in wishlist");
      return;
    }


    wishlist.push(product);


    localStorage.setItem(
      "wishlist",
      JSON.stringify(wishlist)
    );


    toast.success("Added to wishlist");

  };



  return (
    <div className="group bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col">


      {/* Product Image */}
      <div 
        className="relative aspect-square bg-slate-900 overflow-hidden cursor-pointer"
        onClick={handleViewProduct}
      >

        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />


        <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-cyan-400 border border-cyan-500/30 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded">
          {product.tag}
        </span>



        {/* Hover Actions */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">


          {/* View Details */}
          <button
            onClick={handleViewProduct}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 text-white"
          >
            <Eye className="w-4 h-4"/>
          </button>



          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-full border border-slate-700 text-pink-400"
          >
            <Heart className="w-4 h-4"/>
          </button>


        </div>

      </div>




      {/* Product Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">


        <div>

          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {product.category}
          </span>


          <h3
            onClick={handleViewProduct}
            className="cursor-pointer text-base font-semibold text-slate-200 mt-1 group-hover:text-cyan-400 transition-colors"
          >
            {product.name}
          </h3>


          <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>


        </div>



        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-900">


          <span className="text-lg font-bold text-white">
            {product.price}
          </span>



          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => onAddToCart(product)}
          >
            Add to Cart
          </Button>


        </div>


      </div>


    </div>
  );
}