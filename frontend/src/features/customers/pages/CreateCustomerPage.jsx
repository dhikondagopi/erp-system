import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';
import { useCreateCustomerMutation } from '../hooks/useCustomers';

const CreateCustomerPage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateCustomerMutation();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(formData);
      navigate('/customers');
    } catch (err) {
      setSubmitError(
        err.message || 'Failed to register the new customer profile. Please verify data entries and try again.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Register Customer</h1>
        <p className="text-slate-400 font-medium">Add a new customer profile or commercial buyer account to the global directory.</p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-4 text-sm font-semibold text-red-400">
          {submitError}
        </div>
      )}

      <CustomerForm 
        onSubmit={handleSubmit} 
        isSubmitting={createMutation.isLoading} 
        isEdit={false} 
      />
    </div>
  );
};

export default CreateCustomerPage;
