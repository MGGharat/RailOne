import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/extraApis';
import {
  BarChart3,
  Users,
  Ticket,
  DollarSign,
  Train,
  ShieldAlert,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'users' | 'audit' | 'management'>('overview');
  const qc = useQueryClient();

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getDashboardStats
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => adminApi.getAllBookings(),
    enabled: activeTab === 'bookings'
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getUsers(),
    enabled: activeTab === 'users'
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: adminApi.getAuditLogs,
    enabled: activeTab === 'audit'
  });

  // Modal State for adding Station
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [stationForm, setStationForm] = useState({
    code: '',
    name: '',
    city: '',
    state: '',
    zone: 'CR'
  });

  const createStationMutation = useMutation({
    mutationFn: adminApi.createStation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      setIsStationModalOpen(false);
      setStationForm({ code: '', name: '', city: '', state: '', zone: 'CR' });
      alert('Station added successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || 'Failed to add station');
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Operations & Oversight</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">RailOne Control Center</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'bookings', label: 'All Bookings', icon: Ticket },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'audit', label: 'Audit Logs', icon: FileText },
              { id: 'management', label: 'Infrastructure', icon: Train }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stats ? (
              <>
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Total Revenue
                      </span>
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-3">
                      ₹{stats.total_revenue?.toLocaleString('en-IN') || 0}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>From confirmed ticket bookings</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Total Bookings
                      </span>
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Ticket className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-3">
                      {stats.total_bookings}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {stats.today_bookings} reservations made today
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Registered Users
                      </span>
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-3">
                      {stats.total_users}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Passenger & admin accounts</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Active Trains
                      </span>
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                        <Train className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-3">
                      {stats.active_trains}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Superfast, Rajdhani & Express</div>
                  </div>
                </div>

                {/* Distributions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Routes */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Top Passenger Routes</h3>
                    <div className="space-y-3">
                      {stats.popular_routes && stats.popular_routes.length > 0 ? (
                        stats.popular_routes.map((rt, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                              <span className="text-sm font-semibold text-slate-800">{rt.route}</span>
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                              {rt.count} bookings
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">No route stats recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Class Distribution */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Coach Class Distribution</h3>
                    <div className="space-y-3">
                      {stats.class_distribution && stats.class_distribution.length > 0 ? (
                        stats.class_distribution.map((cls, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <span className="text-sm font-semibold text-slate-800">
                              Class {cls.class_name}
                            </span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-full">
                              {cls.count} seats booked
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">No class stats recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">All Passenger Bookings</h2>
            {bookingsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                      <th className="pb-3">PNR</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Train</th>
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Class</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-blue-600">{b.pnr}</td>
                        <td className="py-3.5 text-slate-700 font-medium">{b.user_email}</td>
                        <td className="py-3.5 text-slate-800">
                          {b.train_name} <span className="text-xs text-slate-400">({b.train_number})</span>
                        </td>
                        <td className="py-3.5 text-slate-600">{b.route}</td>
                        <td className="py-3.5 text-slate-500 text-xs">{b.journey_date}</td>
                        <td className="py-3.5 font-semibold text-slate-700">{b.coach_class}</td>
                        <td className="py-3.5 font-bold text-slate-900">₹{b.total_amount}</td>
                        <td className="py-3.5">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">User Accounts</h2>
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                      <th className="pb-3">#</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Mobile</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Active Status</th>
                      <th className="pb-3">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers.map((u: any, idx: number) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 font-semibold text-slate-800">{u.full_name}</td>
                        <td className="py-3.5 text-slate-600">{u.email}</td>
                        <td className="py-3.5 text-slate-600">{u.mobile}</td>
                        <td className="py-3.5">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              u.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">System Security & Audit Trail</h2>
            {logsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Resource Type</th>
                      <th className="pb-3">Resource ID</th>
                      <th className="pb-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 text-slate-500 font-sans">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 font-bold text-blue-700">{log.action}</td>
                        <td className="py-3 text-slate-600">{log.resource_type}</td>
                        <td className="py-3 text-slate-800">{log.resource_id || '-'}</td>
                        <td className="py-3 text-slate-600 font-sans">{log.details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* INFRASTRUCTURE TAB */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Station Infrastructure</h3>
                  <p className="text-slate-500 text-sm">Register new railway stations into the national network</p>
                </div>
                <button
                  onClick={() => setIsStationModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Station
                </button>
              </div>
            </div>

            {/* Add Station Modal */}
            <Modal
              isOpen={isStationModalOpen}
              onClose={() => setIsStationModalOpen(false)}
              title="Add New Railway Station"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createStationMutation.mutate(stationForm);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Station Code (3-4 Letters)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. BRC, PNBE"
                    value={stationForm.code}
                    onChange={(e) => setStationForm({ ...stationForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Station Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vadodara Junction"
                    value={stationForm.name}
                    onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Vadodara"
                      value={stationForm.city}
                      onChange={(e) => setStationForm({ ...stationForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Gujarat"
                      value={stationForm.state}
                      onChange={(e) => setStationForm({ ...stationForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Railway Zone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="WR, CR, NR, ER, SR"
                    value={stationForm.zone}
                    onChange={(e) => setStationForm({ ...stationForm, zone: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsStationModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStationMutation.isPending}
                    className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {createStationMutation.isPending ? 'Saving...' : 'Add Station'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
}
