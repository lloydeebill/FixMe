import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    isRepairer: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/users', form);
      alert('User registered successfully!');
      console.log(res.data);
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert('Registration failed!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <label>
        <input type="checkbox" name="isRepairer" onChange={handleChange} />
        Register as Repairer
      </label>
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
