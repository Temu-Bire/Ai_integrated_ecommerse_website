import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public Pages
import Home from '../pages/Home';
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import Orders from '../pages/Orders';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import ProductsManage from '../pages/admin/ProductsManage';
import OrdersManage from '../pages/admin/OrdersManage';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        
        {/* --- CLIENT / PUBLIC ROUTES --- */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
        <Route path="/products/:id" element={<MainLayout><ProductDetails /></MainLayout>} />
        <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
        <Route path="/orders" element={<MainLayout><Orders /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout><Register /></MainLayout>} />

        {/* --- ADMIN ROUTES --- */}
        <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/products" element={<AdminLayout><ProductsManage /></AdminLayout>} />
        <Route path="/admin/orders" element={<AdminLayout><OrdersManage /></AdminLayout>} />

        {/* --- FALLBACK ROUTE --- */}
        {/* Redirects any invalid routes back to the store homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}