import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';
import { useCustomerDetailsQuery, useUpdateCustomerMutation } from '../hooks/useCustomers';

const EditCustomerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading, error } = useCustomerDetailsQuery(id);
  const updateMutation = useUpdateCustomerMutation();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      navigate('/customers');
    } catch (err) {
      setSubmitError(
        err.message || 'Failed to update customer details. Please verify fields and try again.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading profile information...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
        <h3 className="text-sm font-bold text-red-400">Failed to load customer details</h3>
        <p className="text-xs text-slate-450 mt-2">The client profile you are trying to edit does not exist or could not be loaded.</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit Customer Profile</h1>
        <p className="text-slate-400 font-medium">Modify directory parameters or contact coordinates for this buyer account.</p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-4 text-sm font-semibold text-red-400">
          {submitError}
        </div>
      )}

      <CustomerForm
        initialValues={customer}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isLoading}
        isEdit={true}
      />
    </div>
  );
};

export default EditCustomerPage;
