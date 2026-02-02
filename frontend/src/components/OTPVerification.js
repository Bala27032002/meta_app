import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, requestOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './OTPVerification.css';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Get data from navigation state
    const { otpId, phone, name, email, expiresIn } = location.state || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [timeLeft, setTimeLeft] = useState((expiresIn || 5) * 60); // Convert to seconds
    const [canResend, setCanResend] = useState(false);
    const [currentOtpId, setCurrentOtpId] = useState(otpId);

    const inputRefs = useRef([]);

    useEffect(() => {
        if (!otpId || !phone) {
            navigate('/', { replace: true });
        }
    }, [otpId, phone, navigate]);

    useEffect(() => {
        if (timeLeft <= 0) {
            setCanResend(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (alert) setAlert(null);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('');
            if (fullOtp.length === 6) {
                handleVerify(fullOtp);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
                const digits = text.replace(/\D/g, '').slice(0, 6).split('');
                const newOtp = [...otp];
                digits.forEach((digit, i) => {
                    if (i < 6) newOtp[i] = digit;
                });
                setOtp(newOtp);

                const lastIndex = Math.min(digits.length, 5);
                inputRefs.current[lastIndex]?.focus();
            });
        }
    };

    const handleVerify = async (otpValue = null) => {
        const otpString = otpValue || otp.join('');

        if (otpString.length !== 6) {
            setAlert({
                type: 'error',
                message: 'Please enter all 6 digits',
            });
            return;
        }

        setLoading(true);
        setAlert(null);

        try {
            const response = await verifyOTP({
                otpId: currentOtpId,
                otp: otpString,
                phone,
            });

            if (response.success) {
                login(response.token, response.user);
                setAlert({
                    type: 'success',
                    message: 'Verification successful! Redirecting...',
                });

                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 1500);
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                'Verification failed. Please try again.';

            setAlert({
                type: 'error',
                message: errorMessage,
            });

            inputRefs.current.forEach((input) => {
                if (input) input.classList.add('error');
            });
            setTimeout(() => {
                inputRefs.current.forEach((input) => {
                    if (input) input.classList.remove('error');
                });
            }, 400);

            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setLoading(true);
        setAlert(null);

        try {
            const response = await requestOTP({ name, phone, email });

            if (response.success) {
                setCurrentOtpId(response.otpId);
                setTimeLeft((response.expiresIn || 5) * 60);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();

                setAlert({
                    type: 'success',
                    message: 'New OTP sent to your WhatsApp!',
                });
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                'Failed to resend OTP. Please try again.';

            setAlert({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/', { replace: true });
    };

    return (
        <div className="otp-verification-page">
            <div className="otp-container">
                <div className="otp-card">
                    <div className="otp-header">
                        <div className="otp-icon">📱</div>
                        <h1>Verify OTP</h1>
                        <p>
                            Enter the 6-digit code sent to{' '}
                            <span className="phone-display">{phone}</span>
                        </p>
                    </div>

                    {alert && (
                        <div className={`alert alert-${alert.type}`}>
                            <span>{alert.type === 'error' ? '⚠️' : '✓'}</span>
                            {alert.message}
                        </div>
                    )}

                    <form className="otp-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="otp-input-container">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`otp-input ${digit ? 'filled' : ''}`}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={loading}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <div className="timer-container">
                            <div className={`timer ${timeLeft <= 0 ? 'expired' : ''}`}>
                                <span>⏱️</span>
                                <span>
                                    {timeLeft > 0 ? formatTime(timeLeft) : 'OTP Expired'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="submit-button"
                            onClick={() => handleVerify()}
                            disabled={loading || otp.join('').length !== 6}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Verifying...
                                </>
                            ) : (
                                'Verify OTP'
                            )}
                        </button>

                        <div className="resend-container">
                            <p className="resend-text">
                                Didn't receive the code?{' '}
                                <button
                                    type="button"
                                    className="resend-button"
                                    onClick={handleResend}
                                    disabled={!canResend || loading}
                                >
                                    {canResend ? 'Resend OTP' : `Resend in ${formatTime(timeLeft)}`}
                                </button>
                            </p>
                        </div>

                        <button
                            type="button"
                            className="back-button"
                            onClick={handleBack}
                            disabled={loading}
                        >
                            ← Back to Registration
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
