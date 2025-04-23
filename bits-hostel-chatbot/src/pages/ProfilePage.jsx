// import React, { useState } from 'react';
// import AWS from 'aws-sdk';
// import { v4 as uuidv4 } from 'uuid';

// // Configure AWS SDK
// AWS.config.update({
//   region: 'us-east-1',
//   accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID, 
//   secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY
// });

// const s3 = new AWS.S3();

// const ProfilePage = () => {
//   const [name, setName] = useState('');
//   const [image, setImage] = useState(null);
//   const [imageUrl, setImageUrl] = useState(null);

//   const handleImageChange = (e) => {
//     setImage(e.target.files[0]);
//   };

//   const handleNameChange = (e) => {
//     setName(e.target.value);
//   };

//   const uploadImageToS3 = () => {
//     const fileName = `${uuidv4()}-${image.name}`;
//     const params = {
//       Bucket: 'your-s3-bucket-name', // replace with your bucket name
//       Key: fileName,
//       Body: image,
//       ContentType: image.type,
//       ACL: 'public-read', // or adjust permissions as needed
//     };

//     s3.upload(params, (err, data) => {
//       if (err) {
//         console.error('Error uploading file: ', err);
//         return;
//       }
//       console.log('File uploaded successfully: ', data);
//       setImageUrl(data.Location); // Save the URL of the image
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // Here you can send the `name` and `imageUrl` to your backend to update the user profile.
//     console.log('Name:', name);
//     console.log('Image URL:', imageUrl);
//   };

//   return (
//     <div className="p-4 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-4">
//       <h2 className="text-2xl font-semibold">Update Profile</h2>
//       <form onSubmit={handleSubmit}>
//         <div>
//           <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//             Name
//           </label>
//           <input
//             id="name"
//             type="text"
//             value={name}
//             onChange={handleNameChange}
//             className="mt-1 p-2 w-full border border-gray-300 rounded-md"
//             required
//           />
//         </div>

//         <div>
//           <label htmlFor="image" className="block text-sm font-medium text-gray-700">
//             Profile Picture
//           </label>
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleImageChange}
//             className="mt-1 w-full"
//             required
//           />
//         </div>

//         <button
//           type="button"
//           onClick={uploadImageToS3}
//           className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md"
//         >
//           Upload Image
//         </button>

//         {imageUrl && (
//           <div className="mt-4">
//             <img src={imageUrl} alt="Profile" className="w-24 h-24 rounded-full" />
//           </div>
//         )}

//         <button
//           type="submit"
//           className="mt-4 py-2 px-4 bg-green-500 text-white rounded-md"
//         >
//           Save Profile
//         </button>
//       </form>
//     </div>
//   );
// };

// export default ProfilePage;
