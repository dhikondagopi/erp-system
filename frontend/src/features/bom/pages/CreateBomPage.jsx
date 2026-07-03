import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateBomMutation } from '../hooks/useBom';
import BomForm from '../components/BomForm';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const CreateBomPage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateBomMutation();
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (payload) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(payload);
      navigate('/bom');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to publish the BoM recipe. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center space-x-4">
        <Link
          to="/bom"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:bg-slate-850 hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Create BoM Recipe</h1>
          <p className="text-slate-400 text-sm font-medium">Link a finished product to its raw material specifications and cost valuations.</p>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center space-x-2.5 rounded-xl border border-red-950/40 bg-red-950/20 p-4 text-sm font-semibold text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form Container */}
      <BomForm 
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isLoading}
      />
    </div>
  );
};

export default CreateBomPage;
