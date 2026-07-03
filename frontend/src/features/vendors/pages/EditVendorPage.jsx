import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VendorForm from '../components/VendorForm';
import { useVendorDetailsQuery, useUpdateVendorMutation } from '../hooks/useVendors';

const EditVendorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: vendor, isLoading, error } = useVendorDetailsQuery(id);
  const updateMutation = useUpdateVendorMutation();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      navigate('/vendors');
    } catch (err) {
      setSubmitError(
        err.message || 'Failed to update vendor details. Please verify fields and try again.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading profile information...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
        <h3 className="text-sm font-bold text-red-400">Failed to load vendor details</h3>
        <p className="text-xs text-slate-405 mt-2">The supplier profile you are trying to edit does not exist or could not be loaded.</p>
        <button
          onClick={() => navigate('/vendors')}
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit Vendor Profile</h1>
        <p className="text-slate-400 font-medium">Modify directory parameters or contact coordinates for this supplier account.</p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-950/40 bg-red-950/20 p-4 text-sm font-semibold text-red-400">
          {submitError}
        </div>
      )}

      <VendorForm
        initialValues={vendor}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isLoading}
        isEdit={true}
      />
    </div>
  );
};

export default EditVendorPage;
