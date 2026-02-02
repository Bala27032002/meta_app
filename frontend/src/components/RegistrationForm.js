import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestOTP } from '../services/api';
import './RegistrationForm.css';

const RegistrationForm = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    // Validation functions
    const validateName = (name) => {
        if (!name.trim()) return 'Name is required';
        if (name.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
    };

    const validatePhone = (phone) => {
        if (!phone.trim()) return 'Phone number is required';
        // E.164 format validation
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone.trim())) {
            return 'Phone must be in E.164 format (e.g., +919876543210)';
        }
        return null;
    };

    const validateEmail = (email) => {
        if (!email.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return 'Please enter a valid email address';
        }
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
        if (alert) setAlert(null);
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let error = null;

        switch (name) {
            case 'name':
                error = validateName(value);
                break;
            case 'phone':
                error = validatePhone(value);
                break;
            case 'email':
                error = validateEmail(value);
                break;
            default:
                break;
        }

        if (error) {
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const validateForm = () => {
        const newErrors = {
            name: validateName(formData.name),
            phone: validatePhone(formData.phone),
            email: validateEmail(formData.email),
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some((error) => error !== null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        if (!validateForm()) {
            setAlert({
                type: 'error',
                message: 'Please fix the errors before submitting',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await requestOTP({
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
            });

            if (response.success) {
                navigate('/verify-otp', {
                    state: {
                        otpId: response.otpId,
                        phone: formData.phone.trim(),
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        expiresIn: response.expiresIn,
                    },
                });
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                'Failed to send OTP. Please try again.';

            setAlert({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="registration-card">
                    <div className="registration-header">
                        <h1>Welcome</h1>
                        <p>Create your account with secure OTP verification</p>
                    </div>

                    {alert && (
                        <div className={`alert alert-${alert.type}`}>
                            <span>{alert.type === 'error' ? '' : '✓'}</span>
                            {alert.message}
                        </div>
                    )}

                    <form className="registration-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">
                                Full Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={loading}
                            />
                            {errors.name && (
                                <span className="error-message"> {errors.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                Phone Number <span className="required">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className={`form-input ${errors.phone ? 'error' : ''}`}
                                placeholder="+919876543210"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={loading}
                            />
                            {errors.phone && (
                                <span className="error-message"> {errors.phone}</span>
                            )}
                            {!errors.phone && (
                                <span className="input-hint">
                                    Include country code (e.g., +91 for India)
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={loading}
                            />
                            {errors.email && (
                                <span className="error-message"> {errors.email}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Sending OTP...
                                </>
                            ) : (
                                'Send OTP via WhatsApp'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegistrationForm;
