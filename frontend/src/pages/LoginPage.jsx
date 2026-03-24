import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const role = localStorage.getItem('role')
    if (role === 'admin') navigate('/admin', { replace: true })
    if (role === 'employee') navigate('/employee', { replace: true })
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { username, password })
      //const res = await axios.post('/auth/login', { username, password })
      const { token, user } = res.data

      localStorage.setItem('token', token)
      localStorage.setItem('role', user.role)

      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'employee') {
        navigate('/employee')
      }
    } catch (err) {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
    </div>
  )
}

export default LoginPage
