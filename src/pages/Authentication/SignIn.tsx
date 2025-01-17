import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGithubCallbackMutation,
  useGoogleCallbackTeacherMutation,
  useLoginMutation
} from '../../ApiSlices/authApiSlice';
import { selectIsAuthorized, setCredentials } from '../../ApiSlices/authSlice';
import DefaultLayoutLogin from '../../layout/DefaultLayoutLogin';
import { useDispatch, useSelector } from 'react-redux';
import usePersist from '../../hooks/userPersist';
import userLogin from '../../images/cover/UserLogin.png';
import userLoginDark from '../../images/cover/UserLoginDark.png';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import SigninBreadcrumbs from '../../components/Breadcrumbs/SigninBreadcrumbs';
import Reaptcha from 'reaptcha';


const SignIn: React.FC = () => {
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const userRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [showMessageText, setShowMessageText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [errMsg, setErrMsg] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch();
  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const isAuthorized = useSelector(selectIsAuthorized);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showLoginLimitMessage, setShowLoginLimitMessage] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (isAuthorized) {
      setShowMessageText('Redirecting you to your profile...');
      setShowMessage(true);
      const timeout = setTimeout(() => {
        setShowMessage(false);
        navigate('/Profile', { replace: true });
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isAuthorized, location, navigate]);


  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showLoginLimitMessage) {
      const timer = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (countdown === 0) {
      setShowLoginLimitMessage(false);
    }
  }, [showLoginLimitMessage, countdown]);

  const [googleCallback, { isLoading: googleCallbackLoading }] = useGoogleCallbackTeacherMutation();
  const [githubCallback, { isLoading: githubCallbackLoading }] = useGithubCallbackMutation();
  const initiateGitHubLogin = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      console.log('Initiating GitHub login...');
      window.location.href = `https://github.com/login/oauth/authorize?client_id=7ca6d0248ea91f703c9e`; // Replace with your GitHub OAuth URL
      navigate('/Profile');
    } catch (error) {
      console.error('GitHub login initiation failed', error);
      setErrorMessage('Failed to initiate GitHub login');
    }
  };
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const cred = jwtDecode(credentialResponse.credential);
      const { data } = await googleCallback({
        email: cred.email,
        firstName: cred.given_name,
        lastName: cred.family_name,
        role: 'jobSeeker'
      });

      const { accessToken, currentUser } = data;
      dispatch(setCredentials({ accessToken: accessToken, currentUser: currentUser }));
      navigate('/Profile');
    } catch (error) {
      console.log('Error occurred during Google login callback:', error);
    }
  };

  const verify = () => {
    captchaRef.current.getResponse().then(res => {
      setCaptchaToken(res);
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginAttempts(prevAttempts => prevAttempts + 1);


    if (loginAttempts >= 5) {
      setShowLoginLimitMessage(true);
      const countdownInterval = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown - 1);
      }, 1000);
      setTimeout(() => {
        setShowLoginLimitMessage(false);
        setLoginAttempts(0);
        setCountdown(60);
        clearInterval(countdownInterval);
      }, 43000);
      return;
    }

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (!captchaToken) {
      setErrorMessage('Please complete the reCAPTCHA.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      const { accessToken, currentUser } = await login({ email, password }).unwrap();
      dispatch(setCredentials({ accessToken, currentUser }));
      setEmail('');
      setPassword('');
      const successMessageText = currentUser.role === 'admin' ? 'Welcome back Admin' : 'Login successful!';
      setSuccessMessage(successMessageText);
      setTimeout(() => {
        setSuccessMessage('');
        navigate(currentUser.role === 'admin' ? `/Dashboard` : '/Feed');
      }, 500);
    } catch (err) {
      if (!err.status) {
        setErrorMessage('No Server Response');
      } else if (err.status === 400) {
        setErrorMessage('Invalid email or password.');
      } else if (err.status === 401) {
        setErrorMessage('Invalid email or password.');
      } else if (err.status === 403) {
        console.log(err.data.error)
        if (err.data.error === 'Your profile is deactivated') {
          setErrorMessage('Your profile is deactivated. Please contact support at <a href="mailto:hestia2024.5@outlook.com">hestia2024.5@outlook.com</a>.');
        } else if (err.data.error === 'Your profile has been banned') {
          setErrorMessage('Your profile has been banned. Please contact support at <a href="mailto:hestia2024.5@outlook.com">hestia2024.5@outlook.com</a>.');
        }
      } else {
        setErrorMessage('An error occurred during login. Please try again.');
      }
      errRef.current?.focus();
    }
  };
  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePwdInput = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);
  const errClass = errMsg ? 'errmsg' : 'offscreen';
  if (loginLoading) return <span className="loading loading-dots loading-lg"></span>;

  const initiateLinkedInLogin = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    try {
      console.log('Initiating LinkedIn login...');
      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?client_id=773qhnfkn4hbwy&redirect_uri=http://localhost:3001/auth/linkedin/callback&response_type=code&scope=r_liteprofile%20r_emailaddress`;
    } catch (error) {
      console.error('LinkedIn login initiation failed', error);
      setErrorMessage('Failed to initiate LinkedIn login');
    }
  };
  const handleErrorMessage = (message: string) => {
    return { __html: message };
  };

  return (
    <DefaultLayoutLogin>
      <SigninBreadcrumbs pageName="Sign In" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ">

        <div className="flex py-1">
          <div className="hidden xl:block xl:w-1/2">
            <div className="py-5 px-16 text-center">
              <img className="dark:hidden" src={userLogin} alt="Logo" />
              <img className="hidden dark:block" src={userLoginDark} alt="Logo" />
            </div>
          </div>

          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
            <div className="w-full p-1 sm:p-6 xl:p-4">
              <span className="mb-1.5 block font-medium text-center">Welcome</span>
              <h2 className="mb-2 text-2xl font-bold text-black dark:text-white sm:text-title-xl2 text-center">
                Sign In
              </h2>

              <form>
                <div className="mb-2">
                  <label className="mb-2 block font-medium text-black dark:text-white">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      ref={userRef}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    <span className="absolute right-4 top-4">
                      <svg
                        className="fill-current"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.5">
                          <path
                            d="M19.2516 3.30005H2.75156C1.58281 3.30005 0.585938 4.26255 0.585938 5.46567V16.6032C0.585938 17.7719 1.54844 18.7688 2.75156 18.7688H19.2516C20.4203 18.7688 21.4172 17.8063 21.4172 16.6032V5.4313C21.4172 4.26255 20.4203 3.30005 19.2516 3.30005ZM19.2516 4.84692C19.2859 4.84692 19.3203 4.84692 19.3547 4.84692L11.0016 10.2094L2.64844 4.84692C2.68281 4.84692 2.71719 4.84692 2.75156 4.84692H19.2516ZM19.2516 17.1532H2.75156C2.40781 17.1532 2.13281 16.8782 2.13281 16.5344V6.35942L10.1766 11.5157C10.4172 11.6875 10.6922 11.7563 10.9672 11.7563C11.2422 11.7563 11.5172 11.6875 11.7578 11.5157L19.8016 6.35942V16.5688C19.8703 16.9125 19.5953 17.1532 19.2516 17.1532Z"
                            fill=""
                          />
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      placeholder="6+ Characters, 1 Capital letter"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    <span className="absolute right-4 top-4 " onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: 'pointer' }}>
                      <svg
                        className="fill-current"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          opacity: showPassword ? 1 : 0.8,
                          stroke: showPassword ? '#333' : 'none',
                          strokeWidth: showPassword ? '0' : '1'
                        }}
                      >
                        <g opacity="0.5">
                          <path
                            d="M16.1547 6.80626V5.91251C16.1547 3.16251 14.0922 0.825009 11.4797 0.618759C10.0359 0.481259 8.59219 0.996884 7.52656 1.95938C6.46094 2.92188 5.84219 4.29688 5.84219 5.70626V6.80626C3.84844 7.18438 2.33594 8.93751 2.33594 11.0688V17.2906C2.33594 19.5594 4.19219 21.3813 6.42656 21.3813H15.5016C17.7703 21.3813 19.6266 19.525 19.6266 17.2563V11C19.6609 8.93751 18.1484 7.21876 16.1547 6.80626ZM8.55781 3.09376C9.31406 2.40626 10.3109 2.06251 11.3422 2.16563C13.1641 2.33751 14.6078 3.98751 14.6078 5.91251V6.70313H7.38906V5.67188C7.38906 4.70938 7.80156 3.78126 8.55781 3.09376ZM18.1141 17.2906C18.1141 18.7 16.9453 19.8688 15.5359 19.8688H6.46094C5.05156 19.8688 3.91719 18.7344 3.91719 17.325V11.0688C3.91719 9.52189 5.15469 8.28438 6.70156 8.28438H15.2953C16.8422 8.28438 18.1141 9.52188 18.1141 11V17.2906Z"
                            fill=""
                          />
                          <path
                            d="M10.9977 11.8594C10.5852 11.8594 10.207 12.2031 10.207 12.65V16.2594C10.207 16.6719 10.5508 17.05 10.9977 17.05C11.4102 17.05 11.7883 16.7063 11.7883 16.2594V12.6156C11.7883 12.2031 11.4102 11.8594 10.9977 11.8594Z"
                            fill=""
                          />
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <Reaptcha
                    sitekey="6LfCb54pAAAAAIZXklwFBaumrf_3ASn14XiD0agR"
                    ref={captchaRef}
                    onVerify={verify}

                  />
                </div>
                <div className="mb-5">
                  <input
                    type="submit"
                    value="Sign In"
                    onClick={(event) => handleSubmit(event)}
                    className="w-full cursor-pointer rounded-lg border
                    border-red-900 bg-red-800 p-4 text-white transition
                    hover:bg-opacity-90 dark:bg-cyan-900
               dark:hover:bg-cyan-700 dark:focus:ring-cyan-400 dark:border-cyan-900"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex w-full items-center justify-center
                    gap-3.5 rounded-lg border border-stroke bg-gray p-4 hover:bg-opacity-50 dark:border-strokedark
                    dark:bg-meta-4 dark:hover:bg-opacity-50">
                    <GoogleLogin
                      locale="english"
                      theme="outline"
                      size="large"
                      logo_alignment="center"
                      onSuccess={handleGoogleLoginSuccess}
                      onError={() => {
                        console.log('Login Failed');
                      }}
                    >
                      <span>Sign in with Google</span>
                    </GoogleLogin></div>

                  <button
                    className="flex w-full items-center justify-center gap-3.5 rounded-lg border border-stroke bg-gray p-4 hover:bg-opacity-50 dark:border-strokedark dark:bg-meta-4 dark:hover:bg-opacity-50"
                    onClick={initiateGitHubLogin}
                  >
                    <span>
                      <svg
                        className="w-5"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z"
                          fill="currentColor"
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </span>
                    Sign in with GitHub
                  </button>

                </div>
                <div className="mt-4 text-center">
                  <p>
                    Don’t have any account?{' '}
                    <Link to="/" className=" text-red-900 dark:text-cyan-500">
                      Sign Up
                    </Link>
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <Link to="/auth/EmailVerif" className="text-red-900 dark:text-cyan-500">
                    Forgot your password?
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {showMessage && !successMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-green-200 border border-green-500 text-green-700 px-6 py-4 rounded-lg relative z-50"
            role="alert">
            <strong className="font-bold">You are already signed in.</strong>
            <span className="block sm:inline">{showMessageText}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50"
          onClick={() => setSuccessMessage('')}>
          <div className="bg-green-200 border border-green-500 text-green-700 px-6 py-4 rounded-lg relative z-50"
            role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline">{successMessage}</span>
          </div>
        </div>
      )}
      {showLoginLimitMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-red-200 border border-red-500 text-red-700 px-6 py-4 rounded-lg relative z-50"
            role="alert">
            <strong className="font-bold">Error!</strong>
            <span
              className="block sm:inline"> Too many login attempts. Please try again after {countdown} seconds.</span>
          </div>
        </div>
      )}
      {errorMessage !== '' && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50"
          onClick={() => setErrorMessage('')}>
          <div className="bg-red-200 border border-red-500 text-red-700 px-6 py-4 rounded-lg relative z-50"
            role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline" dangerouslySetInnerHTML={handleErrorMessage(errorMessage)}></span>
          </div>
        </div>
      )}
    </DefaultLayoutLogin>
  )
    ;
};

export default SignIn;
