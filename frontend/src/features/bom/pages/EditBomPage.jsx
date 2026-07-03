import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBomDetailsQuery, useUpdateBomMutation } from '../hooks/useBom';
import BomForm from '../components/BomForm';
import { ArrowLeft, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const EditBomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  // Queries & Mutations
  const { data: bomData, isLoading, error, refetch } = useBomDetailsQuery(id);
  const updateMutation = useUpdateBomMutation();

  const handleSubmit = async (payload) => {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({ id, data: payload });
      navigate('/bom');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to update the BoM recipe. Please try again.');
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit BoM Recipe</h1>
          <p className="text-slate-400 text-sm font-medium">
            Update recipe specifications and component quantities for{' '}
            <span className="text-slate-200 font-semibold">{bomData?.finished_good_name || 'Loading...'}</span>
          </p>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center space-x-2.5 rounded-xl border border-red-950/40 bg-red-950/20 p-4 text-sm font-semibold text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading recipe detail...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-950/45 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
          <div className="flex justify-center text-red-500 mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-red-400">Failed to load recipe</h3>
          <p className="text-xs text-slate-400 mt-2">Check connection or verify this recipe exists in catalog.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center space-x-1.5 rounded-lg border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-900 transition-all"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Form Container */}
      {!isLoading && !error && bomData && (
        <BomForm
          initialData={bomData}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isLoading}
        />
      )}
    </div>
  );
};

export default EditBomPage;
