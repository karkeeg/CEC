import emailjs from "@emailjs/browser";


const SERVICE_ID = "service_nhdcjry"; 
const PUBLIC_KEY = "oyORtlfQbRmDt0zE5";

const TEMPLATE_INQUIRY_ADMIN =  "template_z430wpr"; // teacher_confirmation

const TEMPLATE_LEGACY_FOOTER = "template_z430wpr";

// Optional: admin email for inquiry routing via template variable {{to_email}}
const INQUIRY_ADMIN_EMAIL = "karkibibek642@gmail.com";

const TEMPLATE_INQUIRY_USER = null; // No user confirmation by default

export async function sendConfirmationEmail({ to_name, to_email, role }) {
  
  const templateId = "template_sfb75qi"; // Shared template for all roles
  const firstTimePassword = "password123"; // Default password for first login
let title = "Registration Confirmation ";
  if(role === 'teacher'){
    title ="Teacher Registration Confirmation ";
  }else if(role === 'student'){
    title ="Student Registration Confirmation ";
  }


  await emailjs.send(
    "service_pcsz14l",
    templateId,
    {
      title,
      name: to_name,
      email: to_email,
      role, // Pass the role so the template can show different content if needed
      password: firstTimePassword,
      time: new Date().toLocaleString(),
    },
    "oyORtlfQbRmDt0zE5"
  );
}


export async function sendInquiry({ name, email, message, title = "Website Inquiry", time = new Date().toLocaleString() }) {
  const params = buildInquiryParams({ name, email, message, title, time });
  // Provide optional HTML for templates that render {{html}}
  params.html = buildInquiryHtml({ name, email, message, time });
  if (INQUIRY_ADMIN_EMAIL) {
    params.to_email = INQUIRY_ADMIN_EMAIL;
  }

  // If no dedicated templates configured, use legacy single-send behavior
  if (!TEMPLATE_INQUIRY_ADMIN && !TEMPLATE_INQUIRY_USER) {
    return emailjs.send(SERVICE_ID, TEMPLATE_LEGACY_FOOTER, params, PUBLIC_KEY);
  }

  const tasks = [];
  if (TEMPLATE_INQUIRY_ADMIN) {
    tasks.push(emailjs.send(SERVICE_ID, TEMPLATE_INQUIRY_ADMIN, params, PUBLIC_KEY));
  }
  if (TEMPLATE_INQUIRY_USER) {
    tasks.push(emailjs.send(SERVICE_ID, TEMPLATE_INQUIRY_USER, params, PUBLIC_KEY));
  }
  return Promise.all(tasks);
}

// ---------- Message Template Builders ----------
export function buildConfirmationParams({ name, email, role = "teacher", password = "password123", time = new Date().toLocaleString() }) {
  const roleTitle = role?.toLowerCase() === 'student' ? 'Student Registration Confirmation' : 'Teacher Registration Confirmation';
  return {
    name,
    email,
    role,
    password,
    time,
    title: roleTitle,
  };
}

export function buildInquiryParams({ name, email, message, title, time }) {
  const computedTitle = title || `Website Inquiry from ${name || 'User'}`;
  const computedTime = time || new Date().toLocaleString();
  const composedMessage = `A message by ${name || 'User'} has been received.\n\n` +
    `Sender Email: ${email || 'N/A'}\n` +
    `Sent At: ${computedTime}\n\n` +
    `${message || ''}`;
  return {
    name,
    email,
    message: composedMessage,
    title: computedTitle,
    time: computedTime,
  };
}


export function buildTeacherConfirmationHtml({ name, email, role = 'teacher', password = 'password123', time = new Date().toLocaleString() }) {
  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
  <div style="background: linear-gradient(135deg, #0a2b5c 0%, #1e3a8a 100%); padding: 30px 20px; text-align: center;">
    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 50%; margin-bottom: 15px;">
      <img src="https://cec-8.vercel.app/src/assets/logo.png" alt="Central Engineering College Logo" style="width: 80px; height: 80px; object-fit: contain; filter: brightness(0) invert(1);" />
    </div>
    <div style="color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Central Engineering College</div>
    <div style="color: #bfa046; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Excellence in Engineering Education</div>
  </div>
  <div style="padding: 40px 30px">
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="font-size: 28px; font-weight: 700; color: #0a2b5c; margin-bottom: 10px;">Welcome to CEC Dashboard!</h1>
      <h2 style="font-size: 18px; color: #bfa046; font-weight: 600; margin-bottom: 20px;">Your Account is Ready 🎉</h2>
    </div>
    <p style="font-size: 20px; color: #333; margin-bottom: 25px; font-weight: 500;">Hello ${name},</p>
    <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;">Welcome to the Central Engineering College Dashboard! We're excited to have you join our academic community.</p>
    <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;">Your <span style="display: inline-block; background: linear-gradient(135deg, #bfa046, #d4af37); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${role}</span> account has been successfully created and is now active.</p>
    <div style="margin: 30px 0; text-align: center">
      <div style="display: inline-block; background: #f3f4f6; border-radius: 8px; padding: 18px 28px; box-shadow: 0 2px 8px #0001;">
        <div style="font-size: 15px; color: #0a2b5c; font-weight: 600; margin-bottom: 8px;">Your Login Details</div>
        <div style="font-size: 15px; color: #333"><strong>Email:</strong> ${email}<br /><strong>Password:</strong> ${password}</div>
        <div style="font-size: 12px; color: #bfa046; margin-top: 8px">(You can change your password after logging in)</div>
      </div>
    </div>
    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 25px; margin: 30px 0; border-left: 4px solid #0a2b5c;">
      <h3 style="font-size: 18px; font-weight: 600; color: #0a2b5c; margin-bottom: 15px;">What you can do with your account:</h3>
      <ul style="list-style: none; padding: 0">
        <li style="display: flex; align-items: center; margin-bottom: 12px; font-size: 15px; color: #555;"><div style="width: 20px; height: 20px; background-color: #bfa046; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: white; font-weight: bold; font-size: 12px;">✓</div>Access your personalized dashboard and course materials</li>
        <li style="display: flex; align-items: center; margin-bottom: 12px; font-size: 15px; color: #555;"><div style="width: 20px; height: 20px; background-color: #bfa046; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: white; font-weight: bold; font-size: 12px;">✓</div>View class schedules, assignments, and announcements</li>
        <li style="display: flex; align-items: center; margin-bottom: 12px; font-size: 15px; color: #555;"><div style="width: 20px; height: 20px; background-color: #bfa046; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: white; font-weight: bold; font-size: 12px;">✓</div>Submit assignments and track your academic progress</li>
        <li style="display: flex; align-items: center; margin-bottom: 12px; font-size: 15px; color: #555;"><div style="width: 20px; height: 20px; background-color: #bfa046; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: white; font-weight: bold; font-size: 12px;">✓</div>Connect with faculty members and fellow students</li>
        <li style="display: flex; align-items: center; margin-bottom: 12px; font-size: 15px; color: #555;"><div style="width: 20px; height: 20px; background-color: #bfa046; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; color: white; font-weight: bold; font-size: 12px;">✓</div>Access library resources and study materials</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 35px 0">
      <a href="https://cec-8.vercel.app/" style="display: inline-block; background: linear-gradient(135deg, #0a2b5c, #1e3a8a); color: white; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-weight: 600; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(10, 43, 92, 0.3);">Access Your Dashboard</a>
    </div>
    <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;"><strong>Next Steps:</strong> Log in to your dashboard using your registered email and password to start exploring all the features available to you.</p>
  </div>
  <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
    <p style="font-size: 14px; color: #666; margin-bottom: 15px">Need help? Contact our support team at:<br />
      <a href="mailto:support@cec.edu.np" style="color: #0a2b5c; text-decoration: none; font-weight: 500">support@cec.edu.np</a>
    </p>
    <p style="font-size: 13px; color: #888; font-style: italic">We're thrilled to have you as part of the CEC family!<br />
      <small>Email sent on ${time}</small>
    </p>
  </div>
</div>`;
}

export function buildInquiryHtml({ name, email, message, time = new Date().toLocaleString() }) {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#0a2b5c,#1e3a8a); color:#fff; padding:18px 20px;">
      <h2 style="margin:0; font-size:18px;">New Website Inquiry</h2>
    </div>
    <div style="padding:20px; color:#333; font-size:14px; line-height:1.6;">
      <p style="margin:0 0 10px 0;">A message by <strong>${name || 'User'}</strong> has been received.</p>
      <p style="margin:0 0 10px 0;"><strong>Sender Email:</strong> ${email || 'N/A'}</p>
      <p style="margin:0 0 10px 0;"><strong>Sent At:</strong> ${time}</p>
      <hr style="border:none; border-top:1px solid #eee; margin:15px 0;"/>
      <div style="white-space:pre-wrap;">${(message || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>
  </div>`;
}
