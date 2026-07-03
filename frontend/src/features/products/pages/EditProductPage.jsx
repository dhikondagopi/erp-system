import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useProductDetailsQuery, useUpdateProductMutation } from '../hooks/useProducts';

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: product, isLoading, error } = useProductDetailsQuery(id);
  const updateMutation = useUpdateProductMutation();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      // Redirect on success
      navigate('/products');
    } catch (err) {
      setSubmitError(
        err.message || 'Failed to update product details. Please check constraints and try again.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading product information...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
        <h3 className="text-sm font-bold text-red-400">Failed to load product details</h3>
        <p className="text-xs text-slate-400 mt-2">The product you are trying to edit does not exist or could not be loaded.</p>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 px-4 py-2 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit Product</h1>
          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-850">
            {product.sku}
          </span>
        </div>
        <p className="text-slate-400 font-medium">Modify attributes or cost rules for this item profile.</p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-4 text-sm font-semibold text-red-400">
          {submitError}
        </div>
      )}

      <ProductForm
        initialValues={product}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isLoading}
        isEdit={true}
      />
    </div>
  );
};

export default EditProductPage;
