import emailjs from "@emailjs/browser";


const SERVICE_ID = "service_3a5hpe6"; 
const PUBLIC_KEY = "aPeTqOEpJFZgdaWl6";

const TEMPLATE_INQUIRY_ADMIN =  "template_z430wpr"; 

// Optional: admin email for inquiry routing via template variable {{to_email}}
const INQUIRY_ADMIN_EMAIL = "karkibibek642@gmail.com";



export async function sendConfirmationEmail({ to_name, to_email, role }) {
  
  const templateId = "template_4bzwcrp"; 
  const firstTimePassword = "password123"; // Default password for first login
let title = "Registration Confirmation ";
  if(role === 'teacher'){
    title ="Teacher Registration Confirmation ";
  }else if(role === 'student'){
    title ="Student Registration Confirmation ";
  }


  await emailjs.send(
    "service_3a5hpe6",
    templateId,
    {
      title,
      name: to_name,
      email: to_email,
      role, // Pass the role so the template can show different content if needed
      password: firstTimePassword,
      time: new Date().toLocaleString(),
    },
    PUBLIC_KEY
  );
}


export async function sendInquiry({ name, email, message, title = "Website Inquiry", to_email = INQUIRY_ADMIN_EMAIL, time = new Date().toLocaleString() }) {
  // Send only the fields required by the EmailJS template
  const params = {
    name,
    email,
    message,
    title,
    to_email,
    time,
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_INQUIRY_ADMIN, params, PUBLIC_KEY);
}


