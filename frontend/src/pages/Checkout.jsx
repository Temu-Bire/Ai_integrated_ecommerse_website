import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { cart, subtotalCents, refreshCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: '+1 (555) 019-2834',
    address1: '1044 Tech Center Way',
    address2: 'Suite 400',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94107',
    country: 'US',
  });

  const [cardData, setCardData] = useState({
    cardNumber: '4242 •••• •••• 4242',
    expDate: '12/28',
    cvc: '123',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in or sign up before finalizing your order');
      navigate('/login?redirect=/checkout');
      return;
    }

    setLoading(true);
    try {
      // 1. Generate unique idempotency key
      const idempotencyKey = 'idemp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

      // 2. Create Stripe PaymentIntent
      const intentRes = await api.createPaymentIntent(idempotencyKey);

      // 3. Submit Order to transactional backend
      const orderPayload = {
        shipping_address: {
          full_name: formData.fullName,
          phone: formData.phone,
          address_line1: formData.address1,
          address_line2: formData.address2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
        },
        payment_intent_id: intentRes.payment_intent_id,
        idempotency_key: idempotencyKey,
        notes: 'Handle with high-tech care',
      };

      const orderRes = await api.submitOrder(orderPayload);
      setCompletedOrder(orderRes);
      setStep(3);
      await refreshCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3 && completedOrder) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
            <PackageCheck className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Order Confirmed</span>
          <h1 className="text-3xl font-extrabold text-white mt-2">Thank you for your order!</h1>
          <p className="text-sm text-slate-400 mt-2">
            A confirmation receipt and tracking notification have been dispatched.
          </p>

          <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left space-y-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Order Number</span>
              <span className="font-mono font-bold text-white">{completedOrder.order_number}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Payment Status</span>
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">{completedOrder.status}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total Settled</span>
              <span className="font-bold text-white">${(completedOrder.total_amount_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Shipping To</span>
              <span className="text-white text-right font-medium">
                {completedOrder.shipping_address?.full_name}, {completedOrder.shipping_address?.city}
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/orders"
              className="px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors shadow-lg"
            >
              Track in My Orders
            </Link>
            <Link
              to="/products"
              className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Stepper Header */}
        <div className="max-w-md mx-auto mb-10 flex items-center justify-between relative">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-500'
            }`}>
              1
            </div>
            <span className="text-xs mt-1.5 font-medium text-slate-300">Shipping</span>
          </div>

          <div className="h-0.5 flex-1 bg-slate-800 mx-3 -mt-5" />

          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-500'
            }`}>
              2
            </div>
            <span className="text-xs mt-1.5 font-medium text-slate-300">Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 p-6 sm:p-8 bg-slate-900/70 border border-slate-800 rounded-3xl">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Truck className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Recipient Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Street Address</label>
                    <input
                      type="text"
                      name="address1"
                      value={formData.address1}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Payment Method (Stripe Elements)</h2>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/60">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-bit Encrypted Card Payment
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                      Stripe Test Mode
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Card Number</label>
                    <input
                      type="text"
                      disabled
                      value={cardData.cardNumber}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Expires</label>
                      <input
                        type="text"
                        disabled
                        value={cardData.expDate}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">CVC</label>
                      <input
                        type="text"
                        disabled
                        value={cardData.cvc}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handlePlaceOrder}
                    className="flex-1 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing Order...' : 'Authorize & Pay Now'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mini Cart Summary */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-bold text-white text-base">Your Order</h3>
            <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
              {cart?.items?.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{item.variant?.title}</span>
                    <span className="text-slate-500 block">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-white">${(item.total_price_cents / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white text-base">
              <span>Total Amount</span>
              <span className="text-cyan-400">
                ${((subtotalCents + (subtotalCents >= 10000 ? 0 : 1000) + subtotalCents * 0.08) / 100).toFixed(2)}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
