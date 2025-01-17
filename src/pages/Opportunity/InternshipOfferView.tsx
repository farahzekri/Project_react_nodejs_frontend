import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import DefaultLayout from '../../layout/DefaultLayout';
import { internshipService, jobService } from '../Browsing/API/Services';
import PhoneInput from 'react-phone-input-2';
import ApplicationService from '../Applications/API/Services';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../ApiSlices/authSlice';
import PhoneNumber from '../Authentication/SignUpFiles/PhoneNumber';

const InternshipOfferView = () => {
  const {internshipId} = useParams();
  const [internship, setInternship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const phoneInputRef = useRef(null);

  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const fetchedInternship = await internshipService.getInternshipById(internshipId);
        setInternship(fetchedInternship);
        console.log(internship.interCommpanyName)
      } catch (error) {
        console.error('Error fetching internship:', error);
      }
    };

    fetchInternship();
  }, [internshipId]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('upload_preset', 'hestia');

      try {
        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dasrakdbi/image/upload',
          {
            method: 'POST',
            body: data,
          })
        if (response.ok) {
          const result = await response.json();
          setSelectedFile(result.secure_url)
        }
      }
      catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  }

  const handlePhoneNumberChange = (value: string, isValid: boolean) => {
    setPhoneNumber(value); // Store the phone number in state
    console.log('Phone Number:', value);
    console.log('Is Valid:', isValid);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const motivationLetter = formData.get('motivationLetter');
    const resume = selectedFile
    if (!fullName || !email || !phoneNumber || !motivationLetter || !resume) {
      setErrorMessage('Please fill in all fields');
      setTimeout(() => {
        setErrorMessage('');
      }, 2000);
      return;
    }

    try {
      await ApplicationService.saveInternshipApplication({
        fullName,
        email,
        phoneNumber,
        applicantUsername : currentUser.username,
        motivationLetter,
        resume,
        userId : currentUser._id,
        internshipId : internshipId,
        companyName : internship.interCommpanyName,
        companyLogo : internship.interImage,
        jobTitle : internship.interTitle,
      });
      setSuccessMessage('Application submitted successfully');
      setErrorMessage('');
      setTimeout(() => {
        setSuccessMessage('');
        toggleModal();
      }, 2000);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data && error.response.data.error === 'User has already applied for this internship') {
        setErrorMessage('You have already submitted an application for this internship offer');
      } else if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Failed to submit application');
      }

      setTimeout(() => {
        setErrorMessage('');
      }, 2000);
    }
  };
  return (
    <DefaultLayout>
      {internship && (
        <div
          className="p-6 mx-26 bg-gray border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-10 mr-5">
            <div className="order-2 md:order-1 flex items-end justify-start md:justify-end">
              <div
                className="p-6 bg-white border border-gray-200 w-full h-1/2 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-semibold mb-2">{internship.interTitle}</h2>
                  <h4 className="text-xl font-semibold mb-2">{internship.interPost}</h4>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 flex items-center justify-end">
              <div
                className="profile-card w-[300px]  rounded-md shadow-lg overflow-hidden z-[100] relative
                cursor-pointer snap-start shrink-0 bg-white flex flex-col items-center justify-center gap-3
                transition-all duration-300 group"
              >
                <div
                  className="avatar w-full pt-5 flex items-center justify-center flex-col gap-1"
                >
                  <div
                    className="img_container w-full flex items-center justify-center relative z-40 after:absolute
                    after:h-[6px] after:w-full after:bg-red-900 after:top-4 after:group-hover:size-[1%] after:delay-300
                    after:group-hover:delay-0 after:group-hover:transition-all after:group-hover:duration-300
                    after:transition-all after:duration-300 before:absolute before:h-[6px] before:w-full
                    before:bg-red-900 before:bottom-4 before:group-hover:size-[1%] before:delay-300
                    before:group-hover:delay-0 before:group-hover:transition-all before:group-hover:duration-300
                    before:transition-all before:duration-300"
                  >
                    <svg
                      className="size-36 z-40 border-4 border-white rounded-full group-hover:border-8 group-hover:transition-all group-hover:duration-300 transition-all duration-300"
                      id="avatar"
                      viewBox="0 0 100 100"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        backgroundImage: `url(${internship.interImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        justifyContent: 'center'
                      }}>

                    </svg>

                    <div
                      className="absolute bg-red-700 z-10 size-[60%] w-full group-hover:size-[1%]
                      group-hover:transition-all group-hover:duration-300 transition-all duration-300 delay-700
                       group-hover:delay-0"
                    ></div>
                  </div>
                </div>
                <div className="headings *:text-center *:leading-4">
                  <p className="text-xl font-serif font-semibold text-[#434955]">{internship.interCommpanyName}</p>
                </div>
                <div className="w-full items-center justify-center flex">
                  <ul
                    className="flex flex-col items-start gap-2 has-[:last]:border-b-0 *:inline-flex *:gap-2 *:items-center *:justify-center *:border-b-[1.5px] *:border-b-stone-700 *:border-dotted *:text-xs *:font-semibold *:text-[#434955] pb-3"
                  >
                    <li>
                      <svg
                        id="phone"
                        viewBox="0 0 24 24"
                        className="fill-stone-700 group-hover:fill-red-700"
                        height="15"
                        width="15"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M0 0h24v24H0V0z" fill="none"></path>
                        <path
                          d="M19.23 15.26l-2.54-.29c-.61-.07-1.21.14-1.64.57l-1.84 1.84c-2.83-1.44-5.15-3.75-6.59-6.59l1.85-1.85c.43-.43.64-1.03.57-1.64l-.29-2.52c-.12-1.01-.97-1.77-1.99-1.77H5.03c-1.13 0-2.07.94-2 2.07.53 8.54 7.36 15.36 15.89 15.89 1.13.07 2.07-.87 2.07-2v-1.73c.01-1.01-.75-1.86-1.76-1.98z"
                        ></path>
                      </svg>
                      <p>{internship.contactNumber}</p>
                    </li>
                    <li>
                      <svg
                        className="fill-stone-700 group-hover:fill-red-700"
                        height="15"
                        width="15"
                        id="mail"
                        viewBox="0 0 32 32"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16,14.81,28.78,6.6A3,3,0,0,0,27,6H5a3,3,0,0,0-1.78.6Z"
                          fill="#231f20"
                        ></path>
                        <path
                          d="M16.54,16.84h0l-.17.08-.08,0A1,1,0,0,1,16,17h0a1,1,0,0,1-.25,0l-.08,0-.17-.08h0L2.1,8.26A3,3,0,0,0,2,9V23a3,3,0,0,0,3,3H27a3,3,0,0,0,3-3V9a3,3,0,0,0-.1-.74Z"
                          fill="#231f20"
                        ></path>
                      </svg>
                      <p>smkys@gmail.com</p>
                    </li>
                    <li>
                      <svg
                        className="fill-stone-700 group-hover:fill-red-700"
                        height="15"
                        width="15"
                        id="globe"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g data-name="Layer 2">
                          <path
                            data-name="globe"
                            d="M22 12A10 10 0 0 0 12 2a10 10 0 0 0 0 20 10 10 0 0 0 10-10zm-2.07-1H17a12.91 12.91 0 0 0-2.33-6.54A8 8 0 0 1 19.93 11zM9.08 13H15a11.44 11.44 0 0 1-3 6.61A11 11 0 0 1 9.08 13zm0-2A11.4 11.4 0 0 1 12 4.4a11.19 11.19 0 0 1 3 6.6zm.36-6.57A13.18 13.18 0 0 0 7.07 11h-3a8 8 0 0 1 5.37-6.57zM4.07 13h3a12.86 12.86 0 0 0 2.35 6.56A8 8 0 0 1 4.07 13zm10.55 6.55A13.14 13.14 0 0 0 17 13h2.95a8 8 0 0 1-5.33 6.55z"
                          ></path>
                        </g>
                      </svg>
                      <p>smkydevelopr.com</p>
                    </li>
                    <li>
                      <svg
                        id="map"
                        viewBox="0 0 16 16"
                        className="fill-stone-700 group-hover:fill-[#58b0e0]"
                        height="15"
                        width="15"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 0C5.2 0 3 2.2 3 5s4 11 5 11 5-8.2 5-11-2.2-5-5-5zm0 8C6.3 8 5 6.7 5 5s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"
                          fill="#444"
                        ></path>
                      </svg>
                      <p>{internship.jobAdress}</p>
                    </li>
                  </ul>
                </div>
                <hr
                  className="w-full group-hover:h-5 h-3 bg-red-700 group-hover:transition-all group-hover:duration-300 transition-all duration-300"
                />
              </div>
            </div>

          </div>
          <div className="border bg-white border-gray-200 rounded-lg  p-4 shadow-lg dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Job Details</h3>
            <p><span className="font-semibold">Description:</span> {internship.interDescription}</p>
            <p><span className="font-semibold">Required Skills:</span> {internship.interRequiredSkills}</p>
            <p><span className="font-semibold">Required Education:</span> {internship.interRequiredEducation}</p>
            <p><span className="font-semibold">Field:</span> {internship.interfield}</p>
            <p><span className="font-semibold">Location:</span> {internship.interLocation}</p>
            <p><span className="font-semibold">Address:</span> {internship.interAdress}</p>
            <p><span className="font-semibold">Internship Type:</span> {internship.interType} DT</p>
            <p><span className="font-semibold">Other Information:</span> {internship.interOtherInformation}</p>
            <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
            <p><span className="font-semibold">Contact Number:</span> {internship.contactNumber}</p>
          </div>


        </div>

      )}
      <button
        className=" z-30 font-sans after:-z-20 after:absolute after:h-1 after:w-1 after:bg-red-800 after:left-5
        overflow-hidden after:bottom-0 after:translate-y-full after:rounded-md after:hover:scale-[300]
        after:hover:transition-all after:hover:duration-700 after:transition-all after:duration-700 transition-all
        duration-700 [text-shadow:3px_5px_2px_#be123c;] hover:[text-shadow:2px_2px_2px_#fda4af] text-2xl
        sticky bottom-10 left-1/2 transform -translate-x-1/2 mb-10 bg-red-600
        text-white font-bold py-3 px-6 rounded"
        onClick={toggleModal}
      >
        Apply Now
      </button>
      {isModalOpen && (
        <div
          id="authentication-modal"
          className="fixed top-10 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-gray-800 bg-opacity-50"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Job Application Form</h3>
              <button
                onClick={toggleModal}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Your Name..."
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <PhoneNumber onChange={(value, isValid) => handlePhoneNumberChange(value, isValid)} />
              </div>
              <div>
                <label htmlFor="motivationLetter" className="block text-sm font-medium text-gray-700">
                  Motivation Letter
                </label>
                <textarea
                  name="motivationLetter"
                  id="motivationLetter"
                  rows="4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Write your letter of motivation here..."
                  required
                ></textarea>
              </div>
              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                  Resume (PDF)
                </label>
                <input
                  type="file"
                  name="resume"
                  id="resume"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-700"
              >
                Submit Application
              </button>
            </form>

          </div>
          {successMessage && (
            <div className="fixed bg-green-200 top-50 justify-center items-center  text-green-800 p-4 rounded-md my-4">{successMessage}</div>
          )}

          {errorMessage && (
            <div className="fixed bg-red-200 top-50 justify-center items-center text-red-800 p-4 rounded-md my-4">{errorMessage}</div>
          )}
        </div>

      )}

    </DefaultLayout>
  );
};

export default InternshipOfferView;
