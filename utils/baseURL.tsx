import axios from "axios";

export default function baseURL() {
  return process.env.EXPO_PUBLIC_BASE_URL ?? ''
};

export const axiosInstance = axios.create({  
  baseURL: baseURL(),
  timeout: 4000,  
  headers: { 
    'Accept': 'application/json', 
    'Content-Type': 'application/json'
   },  
});  

// // Add a response interceptor  
// axiosInstance.interceptors.response.use(  
//   response => {  
//     // Handle successful responses  
//     return response;  
//   },  
//   error => {  
//     // Handle errors  
//     if (error.response) {  
//       // The request was made and the server responded with a status code  
//       console.error('Error Response:', error.response.data);  
//       console.error('Status Code:', error.response.status);  
//       console.error('Headers:', error.response.headers);  
      
//       // Log the request that caused the error  
//       console.error('Request Config:', error.config);  
//       console.error('Request URL:', error.config.url);  
//       console.error('Request Method:', error.config.method);  
//       console.error('Request Data:', error.config.data); // For POST/PUT requests  

//       // Handle specific status codes  
//       if (error.response.status === 400) {  
//         console.error('Bad Request:', error.response.data);  
//       }  
//     } else if (error.request) {  
//       // The request was made but no response was received  
//       console.error('No Response Received:', error.request);  
//       console.error('Request Config:', error.config);  
//     } else {  
//       // Something happened in setting up the request that triggered an Error  
//       console.error('Error Message:', error.message);  
//     }  

//     // Optionally, return a rejected promise to be handled later  
//     return Promise.reject(error);  
//   }  
// );  