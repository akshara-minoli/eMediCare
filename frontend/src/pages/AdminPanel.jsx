import React, { useState, useEffect } from 'react';
import { getAdmins, deleteAdmin } from '../services/api.js';

const AdminPanel = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await getAdmins();
      setAdmins(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch admins. Make sure you are logged in as a superadmin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this admin?')) return;
    try {
      await deleteAdmin(id);
      fetchAdmins();
    } catch (err) {
      alert('Error deactivating admin');
    }
  };

  if (loading) return (
    <div className="flex justify-center p-10">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );

  return (
    <main className="pt-[72px] min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">

        <div className="section-tag mb-3">Admin Panel</div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-heading font-bold">Admin Management</h1>
          <button className="btn-primary px-4 py-2">
            + Add New Admin
          </button>
        </div>

        {error && (
          <div className="alert-error mb-6">{error}</div>
        )}

        <div className="card p-0 overflow-hidden">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5 text-white/50 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left tracking-wider">Name</th>
                <th className="px-6 py-3 text-left tracking-wider">Email</th>
                <th className="px-6 py-3 text-left tracking-wider">Role</th>
                <th className="px-6 py-3 text-left tracking-wider">Status</th>
                <th className="px-6 py-3 text-center tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {admins.length > 0 ? (
                admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm font-medium">{admin.name}</td>
                    <td className="px-6 py-4 text-sm text-white/50">{admin.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`badge ${admin.role === 'superadmin' ? 'badge-primary' : 'badge-green'}`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full inline-block mr-2 ${admin.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {admin.isActive ? 'Active' : 'Deactivated'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm space-x-3">
                      <button className="text-blue-400 hover:text-blue-300">Edit</button>
                      {admin.isActive && (
                        <button onClick={() => handleDelete(admin._id)} className="text-red-400 hover:text-red-300">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-white/40 italic">
                    No admins registered in the system
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="alert-info mt-8">
          <strong>Note:</strong> This dashboard communicates directly with the Admin Microservice via the API Gateway.
        </div>

      </div>
    </main>
  );
};

export default AdminPanel;