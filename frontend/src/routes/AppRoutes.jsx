import React from 'react';
import Home from '../pages/Home';
import Loading from '../components/common/Loading';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ProductCard from '../components/product/ProductCard';
export default function AppRoutes() {
  return (
    <div>
      {/* If you haven't installed react-router-dom yet, just render Home directly */}
      <ProductCard/>
      
    </div>
  );
}