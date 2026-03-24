import React, { useEffect, useState } from "react";
import axios from "axios";

const EmployeeManagementPage = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({ ...newEmployee, [name]: value });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/employees`,
        newEmployee,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchEmployees(); // Refresh the employee list
      setNewEmployee({ username: "", password: "" }); // Reset form
    } catch (err) {
      console.error("Error adding employee:", err);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmployees(); // Refresh the employee list
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  return (
    <div className="p-8">
      {/* Heading */}
      <h1 className="text-3xl font-bold mb-6">Employee Management</h1>

      {/* Add Employee Form */}
      <form onSubmit={handleAddEmployee} className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={newEmployee.username}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={newEmployee.password}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300"
        >
          Add Employee
        </button>
      </form>

      {/* Employee List Table */}
      <h2 className="text-xl font-semibold mb-4">All Employees</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Username</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee._id}>
              <td className="border p-2">{employee.username}</td>
              <td className="border p-2">{employee.role}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleDeleteEmployee(employee._id)}
                  className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition duration-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeManagementPage;
