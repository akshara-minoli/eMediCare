import React, { useState, useEffect } from 'react';
import { getAdmins, deleteAdmin } from '../services/api';

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
      fetchAdmins(); // Refresh
    } catch (err) {
      alert('Error deactivating admin');
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
          + Add New Admin
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3 text-left tracking-wider">Name</th>
              <th className="px-6 py-3 text-left tracking-wider">Email</th>
              <th className="px-6 py-3 text-left tracking-wider">Role</th>
              <th className="px-6 py-3 text-left tracking-wider">Status</th>
              <th className="px-6 py-3 text-center tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.length > 0 ? (
              admins.map((admin) => (
                <tr key={admin._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block mr-2 ${admin.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {admin.isActive ? 'Active' : 'Deactivated'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                    {admin.isActive && (
                      <button onClick={() => handleDelete(admin._id)} className="text-red-600 hover:text-red-900">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">No admins registered in the system</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This dashboard communicates directly with the new Admin Microservice via the API Gateway.
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
