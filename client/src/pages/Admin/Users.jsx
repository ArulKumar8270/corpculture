import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  CircularProgress,
  Select, MenuItem, FormControl, InputLabel, OutlinedInput, Chip, Box // Added new imports
} from '@mui/material';
import toast from 'react-hot-toast';

const Users = () => {
  const { auth } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedParents, setExpandedParents] = useState(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [categories, setCategories] = useState([]); // New state for categories

  useEffect(() => {
    fetchUsers();
    fetchCategories(); // Fetch categories when component mounts
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/auth/all-users`, {
        headers: {
          Authorization: auth.token,
        },
      });
      let fetchedUsers = res.data.users || [];
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch categories
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/category/all`, {
        headers: {
          Authorization: auth?.token,
        },
      });
      if (data?.success) {
        setCategories(data.categories);
      } else {
        toast.error(data?.message || 'Failed to fetch categories.');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Something went wrong while fetching categories.');
    }
  };

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

  const handleToggleCommission = async (userId, currentStatus, email) => {
    const newStatus = !currentStatus;
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
        {
          _id: userId,
          isCommissionEnabled: newStatus ? 1 : 0,
          email: email,
        },
        {
          headers: {
            Authorization: auth.token,
          },
        }
      );
      if (response.status === 200 && response.data.success) {
        toast.success(response.data.message || "Commission status updated successfully!");
        setUsers(users.map(user =>
          user._id === userId ? { ...user, isCommissionEnabled: newStatus } : user
        ));
      } else {
        toast.error(response.data.message || "Failed to update commission status.");
      }
    } catch (error) {
      console.error("Error updating commission status:", error);
      toast.error("Error updating commission status.");
    }
  };

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      commission: user.commission || 0,
      panNumber: user.pan?.number || '',
      panName: user.pan?.name || '',
      isCommissionEnabled: user.isCommissionEnabled || false,
      commissionCategorys: user.commissionCategorys || [], // Initialize with existing categories
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({});
    setIsUpdating(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const updatePayload = {
        _id: selectedUser._id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        commission: parseFloat(formData.commission),
        pan: {
          number: formData.panNumber,
          name: formData.panName,
        },
        isCommissionEnabled: formData.isCommissionEnabled, // Ensure this is sent if it's part of the form
        commissionCategorys: formData.commissionCategorys, // Include commissionCategorys
      };

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
        updatePayload,
        {
          headers: {
            Authorization: auth.token,
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        toast.success(response.data.message || "User details updated successfully!");
        fetchUsers();
        handleCloseModal();
      } else {
        toast.error(response.data.message || "Failed to update user details.");
      }
    } catch (error) {
      console.error("Error updating user details:", error);
      toast.error("Error updating user details.");
    } finally {
      setIsUpdating(false);
    }
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
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users?.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-6 text-gray-400">No users found.</td>
                </tr>
              ) : (
                users
                  .filter(user => !user.parentId && user?.role !== 3 && user?.role !== 1)
                  .map(parent => (
                    <React.Fragment key={parent._id}>
                      <tr
                        className="border-b last:border-b-0 hover:bg-blue-50 font-semibold"
                      >
                        <td className="py-2 px-3 flex items-center gap-2">
                          {users.some(child => String(child.parentId) === String(parent._id)) && (
                            <svg
                              className={`w-4 h-4 transform transition-transform cursor-pointer`}
                              onClick={() => toggleExpand(parent._id)}
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
                        <td className="py-2 px-3">{parent.commission?.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          {!parent.parentId && (
                            <input
                              type="checkbox"
                              checked={parent.isCommissionEnabled || false}
                              onChange={() => handleToggleCommission(parent._id, parent.isCommissionEnabled, parent.email)}
                              className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                            />
                          )}
                        </td>
                        <td className="py-2 px-3">{parent.pan?.number || "-"}</td>
                        <td className="py-2 px-3">{parent.pan?.name || "-"}</td>
                        <td className="py-2 px-3">{parent.createdAt ? new Date(parent.createdAt).toLocaleDateString() : "-"}</td>
                        <td className="py-2 px-3">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenModal(parent)}
                            className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-3 py-1 rounded"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
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
                              <td className="py-2 px-3"></td>
                              <td className="py-2 px-3">{child.pan?.number || "-"}</td>
                              <td className="py-2 px-3">{child.pan?.name || "-"}</td>
                              <td className="py-2 px-3">{child.createdAt ? new Date(child.createdAt).toLocaleDateString() : "-"}</td>
                              <td className="py-2 px-3">
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleOpenModal(child)}
                                  className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-3 py-1 rounded"
                                >
                                  Edit
                                </Button>
                              </td>
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

      {/* User Details Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle className="bg-[#019ee3] text-white">Edit User Details</DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
                type="email"
              />
              <TextField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <TextField
                label="Commission"
                name="commission"
                value={formData.commission}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
                type="number"
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <TextField
                label="PAN Name"
                name="panName"
                value={formData.panName}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              {/* New Multi-select for Commission Categories */}
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="commission-category-label">Commission Categories</InputLabel>
                <Select
                  labelId="commission-category-label"
                  id="commission-category-select"
                  multiple
                  name="commissionCategorys"
                  value={formData.commissionCategorys}
                  onChange={handleFormChange}
                  input={<OutlinedInput id="select-multiple-chip" label="Commission Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={categories.find(cat => cat._id === value)?.name || value} />
                      ))}
                    </Box>
                  )}
                >
                  {categories?.map((category) => (
                    <MenuItem
                      key={category._id}
                      value={category._id}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Display Role (read-only) */}
              <TextField
                label="Role"
                value={selectedUser.role === 1 ? "Admin" : "User"}
                fullWidth
                margin="normal"
                variant="outlined"
                InputProps={{ readOnly: true }}
              />
              {/* Display Created Date (read-only) */}
              <TextField
                label="Created At"
                value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "-"}
                fullWidth
                margin="normal"
                variant="outlined"
                InputProps={{ readOnly: true }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleUpdateUser}
            color="primary"
            variant="contained"
            disabled={isUpdating}
            startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isUpdating ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Users;