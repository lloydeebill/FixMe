import React from 'react';
import RegisterForm from '../Components/RegisterForm';
import GuestLayout from '../Layouts/GuestLayout';
export default function Register() {
    return <GuestLayout title="Create an account"><RegisterForm /></GuestLayout>;
}
