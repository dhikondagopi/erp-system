import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VendorForm = ({ initialValues, onSubmit, isSubmitting, isEdit = false }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        address: initialValues.address || ''
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name || form.name.trim() === '') {
      tempErrors.name = 'Vendor name is required.';
    }

    if (!form.email || form.email.trim() === '') {
      tempErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(form.email.trim())) {
      tempErrors.email = 'Please provide a valid, structurally correct email address.';
    }

    if (form.phone && form.phone.trim() !== '') {
      if (form.phone.trim().length < 5) {
        tempErrors.phone = 'Phone number must contain at least 5 digits.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto rounded-xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-md">
      {/* Vendor Name */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Supplier Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Timber Supply Corp, Jane Doe"
          className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
        />
        {errors.name && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.name}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="e.g. orders@supplier.com"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="e.g. +91 99988 77766"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
          />
          {errors.phone && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.phone}</p>}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billing / Supplier Depot Address</label>
        <textarea
          name="address"
          rows="4"
          value={form.address}
          onChange={handleChange}
          placeholder="Enter corporate supplier street details, city, postal code..."
          className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3.5 pt-4 border-t border-slate-900">
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="px-5 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all font-semibold text-sm active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-semibold text-sm shadow-md shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving changes...' : isEdit ? 'Update Profile' : 'Register Vendor'}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;
