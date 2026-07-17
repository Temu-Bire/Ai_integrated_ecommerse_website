import React, { useState } from 'react';
import ProductFilter from '../components/product/ProductFilter';
import ProductList from '../components/product/ProductList';
import { useNavigate } from "react-router-dom";
const ALL_PRODUCTS = [
  {
    id: 1,
    name: "NeuralBuds Pro",
    category: "Audio",
    price: "$189",
    description: "Adaptive AI noise cancellation that maps your ear canal in real-time.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    tag: "AI Adaptive"
  },
  {
    id: 2,
    name: "Aether Watch v4",
    category: "Wearables",
    price: "$299",
    description: "Predictive health monitoring powered by on-device machine learning.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    tag: "Predictive Health"
  },
  {
    id: 3,
    name: "Apex AI Smart Hub",
    category: "Smart Home",
    price: "$149",
    description: "Learns your daily routine to fully automate home climate and lighting.",
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbd1d5?auto=format&fit=crop&w=600&q=80",
    tag: "Self-Learning"
  },
  {
    id: 4,
    name: "Cognitive Vision Webcam",
    category: "Work",
    price: "$220",
    description: "AI framing and auto-lighting adjustment with neural processing unit.",
    image: "https://images.unsplash.com/photo-1600541519463-f60ab4ac3528?auto=format&fit=crop&w=600&q=80",
    tag: "NPU Enabled"
  }
];

export default function Products() {
 const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");


  const filteredProducts = ALL_PRODUCTS.filter(product => {

    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;


    return matchesSearch && matchesCategory;
  });


  // Add cart function
  const handleAddToCart = (product)=>{

    const user = JSON.parse(
      localStorage.getItem("user")
    );


    // not login
    if(!user){
      navigate("/login");
      return;
    }


    // get old cart
    const cart =
      JSON.parse(localStorage.getItem("cart")) || [];


    cart.push(product);


    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );


    navigate("/cart");

  };

   return (
    <div className="max-w-7xl mx-auto px-6 py-12">

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">
          Neural Hardware Catalog
        </h1>

        <p className="text-slate-500 text-sm mt-1">
          Explore consumer electronics integrated with local neural processing units.
        </p>
      </div>


      <ProductFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />


      <ProductList
        products={filteredProducts}
        onAddToCart={handleAddToCart}
      />

    </div>
  );
}
