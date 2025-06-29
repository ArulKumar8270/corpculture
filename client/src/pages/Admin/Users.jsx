import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth';

const Users = () => {
  const { auth } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // State to track expanded parent IDs
  const [expandedParents, setExpandedParents] = useState(new Set());
  useEffect(() => {
    // Replace with your actual API endpoint
    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/auth/all-users`, {
      headers: {
        Authorization: auth.token,
      },
    })
      .then(res => {
        let fetchedUsers = res.data.users || [];
        setUsers(fetchedUsers);
        setLoading(false);
        // Optionally expand all parents by default after fetching
        // const initialExpanded = new Set(fetchedUsers.filter(user => !user.parentId).map(user => user._id));
        // setExpandedParents(initialExpanded);
      })
      .catch(() => setLoading(false));
  }, []);

  // Function to toggle expand/collapse for a parent
  const toggleExpand = (parentId) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  // Function to toggle commission status
  const handleToggleCommission = async (userId, currentStatus, email) => {
    const newStatus = !currentStatus;
    // --- Backend API Call ---
    // You need to implement a backend endpoint to update the user's commission enabled status.
    // Example (replace with your actual endpoint and method):
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
        {
          isCommissionEnabled: newStatus ? 1 : 0,
          email: email,
        },
      );
      if (response.status === 200) {
        // Update the user list in state with the new status
        setUsers(users.map(user =>
          user._id === userId ? { ...user, isCommissionEnabled: newStatus } : user
        ));
      }
    } catch (error) {
      console.error("Error updating commission status:", error);
    }
    // --- End Backend API Call ---

    // For now, just update the state locally (remove this block when backend is ready)
    setUsers(users.map(user =>
      user._id === userId ? { ...user, isCommissionEnabled: newStatus } : user
    ));
  };


  return (
    <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">Users</h1>
      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">Address</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Commission</th>
                <th className="py-2 px-3">Is Commission</th>
                <th className="py-2 px-3">PAN Number</th>
                <th className="py-2 px-3">PAN Name</th>
                <th className="py-2 px-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-400">No users found.</td>
                </tr>
              ) : (
                // Group users by parentId
                users
                  .filter(user => !user.parentId && user?.role !== 3 && user?.role !== 1) // Only top-level users
                  .map(parent => (
                    <React.Fragment key={parent._id}>
                      {/* Parent Row - Clickable */}
                      <tr
                        className="border-b last:border-b-0 hover:bg-blue-50 font-semibold cursor-pointer"
                        onClick={() => toggleExpand(parent._id)}
                      >
                        <td className="py-2 px-3 flex items-center gap-2">
                          {/* Expand/Collapse Icon */}
                          {users.some(child => String(child.parentId) === String(parent._id)) && ( // Only show icon if parent has children
                            <svg
                              className={`w-4 h-4 transform transition-transform ${expandedParents.has(parent._id) ? 'rotate-90' : 'rotate-0'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          )}
                          {parent.name}
                        </td>
                        <td className="py-2 px-3">{parent.email}</td>
                        <td className="py-2 px-3">{parent.phone}</td>
                        <td className="py-2 px-3">{parent.address}</td>
                        <td className="py-2 px-3">{parent.role === 1 ? "Admin" : "User"}</td>
                        <td className="py-2 px-3">{parent.commission?.toFixed(2)}</td> {/* Display commission rate */}
                        {/* New cell for Commission Enabled toggle */}
                        <td className="py-2 px-3">
                          {/* Only show toggle for parent users */}
                          {!parent.parentId && (
                            <input
                              type="checkbox"
                              checked={parent.isCommissionEnabled || false} // Use the new field
                              onChange={() => handleToggleCommission(parent._id, parent.isCommissionEnabled, parent.email)}
                              className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                            />
                          )}
                        </td>
                        <td className="py-2 px-3">{parent.pan?.number || "-"}</td>
                        <td className="py-2 px-3">{parent.pan?.name || "-"}</td>
                        <td className="py-2 px-3">{parent.createdAt ? new Date(parent.createdAt).toLocaleDateString() : "-"}</td>
                      </tr>
                      {/* Render child users conditionally */}
                      {expandedParents.has(parent._id) && (
                        users
                          .filter(child => String(child.parentId) === String(parent._id))
                          .map(child => (
                            <tr key={child._id} className="border-b last:border-b-0 bg-blue-50">
                              <td className="py-2 px-3 pl-8 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                {child.name}
                              </td>
                              <td className="py-2 px-3">{child.email}</td>
                              <td className="py-2 px-3">{child.phone}</td>
                              <td className="py-2 px-3">{child.address}</td>
                              <td className="py-2 px-3">{child.role === 1 ? "Admin" : "User"}</td>
                              <td className="py-2 px-3">{child.commission?.toFixed(2)}</td>
                              <td className="py-2 px-3">{child.pan?.number || "-"}</td>
                              <td className="py-2 px-3">{child.pan?.name || "-"}</td>
                              <td className="py-2 px-3">{child.wishlist?.length || 0}</td>
                              <td className="py-2 px-3">{child.createdAt ? new Date(child.createdAt).toLocaleDateString() : "-"}</td>
                            </tr>
                          ))
                      )}
                    </React.Fragment>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Users;