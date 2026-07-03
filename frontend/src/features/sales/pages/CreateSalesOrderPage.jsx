import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesOrderForm from '../components/SalesOrderForm';
import { useCreateSalesOrderMutation } from '../hooks/useSales';

const CreateSalesOrderPage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateSalesOrderMutation();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(formData);
      navigate('/sales-orders');
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to establish the sales order draft.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Draft Sales Order</h1>
        <p className="text-slate-400 font-medium">Create a new customer purchase order draft, specifying quantities and products.</p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-955/40 bg-red-955/20 p-4 text-sm font-semibold text-red-400">
          {submitError}
        </div>
      )}

      <SalesOrderForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isLoading}
      />
    </div>
  );
};

export default CreateSalesOrderPage;
