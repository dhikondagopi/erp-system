import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useCreateProductMutation } from '../hooks/useProducts';

const CreateProductPage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateProductMutation();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(formData);
      // Success redirection
      navigate('/products');
    } catch (err) {
      setSubmitError(
        err.message || 'Failed to register the new product item. Please verify fields and try again.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Create Product</h1>
        <p className="text-slate-400 font-medium">Add a new finished furniture item or raw production material to the catalog.</p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-4 text-sm font-semibold text-red-400">
          {submitError}
        </div>
      )}

      <ProductForm 
        onSubmit={handleSubmit} 
        isSubmitting={createMutation.isLoading} 
        isEdit={false} 
      />
    </div>
  );
};

export default CreateProductPage;
