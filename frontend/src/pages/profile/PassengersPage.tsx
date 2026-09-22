import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { passengerApi } from '../../api/extraApis';
import { PassengerProfile } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Users, Plus, Trash2, Edit2, UserCheck, AlertCircle } from 'lucide-react';

export function PassengersPage() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPax, setEditingPax] = useState<PassengerProfile | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    age: 28,
    gender: 'MALE',
    berth_preference: 'NO_PREFERENCE',
    nationality: 'INDIAN',
    id_type: 'AADHAAR',
    id_number_masked: 'XXXX-XXXX-1234'
  });

  const { data: passengers = [], isLoading } = useQuery({
    queryKey: ['savedPassengers'],
    queryFn: passengerApi.getPassengers
  });

  const createMutation = useMutation({
    mutationFn: passengerApi.createPassenger,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savedPassengers'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PassengerProfile> }) =>
      passengerApi.updatePassenger(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savedPassengers'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: passengerApi.deletePassenger,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savedPassengers'] })
  });

  const openAddModal = () => {
    setEditingPax(null);
    setFormData({
      full_name: '',
      age: 28,
      gender: 'MALE',
      berth_preference: 'NO_PREFERENCE',
      nationality: 'INDIAN',
      id_type: 'AADHAAR',
      id_number_masked: 'XXXX-XXXX-1234'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pax: PassengerProfile) => {
    setEditingPax(pax);
    setFormData({
      full_name: pax.full_name,
      age: pax.age,
      gender: pax.gender,
      berth_preference: pax.berth_preference,
      nationality: pax.nationality,
      id_type: pax.id_type,
      id_number_masked: pax.id_number_masked
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPax(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPax) {
      updateMutation.mutate({ id: editingPax.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Saved Passenger Master List</h1>
            <p className="text-slate-500 mt-1">Pre-fill passengers for faster 1-click booking checkout</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Passenger
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && passengers.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No Saved Passengers</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Save your family members or co-travelers to easily select them during ticket reservations.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add First Passenger
            </button>
          </div>
        )}

        {/* Passenger Grid */}
        {!isLoading && passengers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {passengers.map((pax) => (
              <div
                key={pax.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold">
                        {pax.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{pax.full_name}</h3>
                        <p className="text-xs text-slate-500">
                          {pax.age} years • {pax.gender} • {pax.nationality}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Berth Preference:</span>
                      <p className="font-semibold text-slate-700 capitalize">
                        {pax.berth_preference.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">ID Verification:</span>
                      <p className="font-semibold text-slate-700">
                        {pax.id_type} ({pax.id_number_masked})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(pax)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Passenger"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${pax.full_name} from saved list?`)) {
                        deleteMutation.mutate(pax.id);
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Passenger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Add / Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingPax ? 'Edit Passenger Profile' : 'Add New Passenger'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Full Name (as on Govt ID)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="TRANSGENDER">Transgender</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Berth Preference
              </label>
              <select
                value={formData.berth_preference}
                onChange={(e) => setFormData({ ...formData, berth_preference: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="NO_PREFERENCE">No Preference</option>
                <option value="LOWER">Lower</option>
                <option value="MIDDLE">Middle</option>
                <option value="UPPER">Upper</option>
                <option value="SIDE_LOWER">Side Lower</option>
                <option value="SIDE_UPPER">Side Upper</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  ID Document Type
                </label>
                <select
                  value={formData.id_type}
                  onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VOTER_ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Masked ID #
                </label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-1234"
                  value={formData.id_number_masked}
                  onChange={(e) => setFormData({ ...formData, id_number_masked: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingPax ? 'Save Changes' : 'Save Passenger'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
