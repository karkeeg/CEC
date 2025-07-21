import emailjs from "@emailjs/browser";

export async function sendConfirmationEmail({ to_name, to_email, role }) {
  console.log("sendConfirmationEmail called:", { to_name, to_email, role });

  const templateId =
    role === "student" ? "template_sfb75qi" : "template_z430wpr";

  const message = `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
      <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
        <div style="background: #0a2b5c; padding: 24px 0; text-align: center;">
          <img src="https://yourdomain.com/assets/email.png" alt="Central Engineering College" style="height: 60px; margin-bottom: 8px;" />
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="text-align:center; color:#222; margin-bottom: 0;">WELCOME TO CENTRAL ENGINEERING COLLEGE DASHBOARD</h2>
          <h3 style="text-align:center; color:#bfa046; margin-top: 8px; margin-bottom: 24px;">YOUR ACCOUNT IS READY 🎉</h3>
          <p style="font-size: 18px; margin-bottom: 8px;">Hi ${to_name},</p>
          <p style="margin-bottom: 24px;">
            Welcome to the Central Engineering College Dashboard.<br>
            Your ${role} account is now active.
          </p>
          <p style="font-weight: bold; margin-bottom: 12px;">Here's what you can do next:</p>
          <ul style="list-style: none; padding: 0; margin-bottom: 24px;">
            <li style="margin-bottom: 8px;">✅ View class schedules and announcements</li>
            <li style="margin-bottom: 8px;">✅ Submit assignments and check results</li>
            <li style="margin-bottom: 8px;">✅ Connect with faculty and classmates</li>
          </ul>
          <div style="text-align:center; margin-bottom: 24px;">
            <a href="https://cec.edu.np/dashboard" style="background: #222; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">LOG IN TO YOUR DASHBOARD</a>
          </div>
          <p style="font-size: 15px; color: #444; margin-bottom: 0;">
            If you have any questions or need assistance, feel free to contact our support team at:<br>
            <a href="mailto:support@cec.edu.np" style="color: #0a2b5c;">support@cec.edu.np</a>
          </p>
          <p style="font-size: 15px; color: #444;">We're thrilled to have you as part of CEC family!</p>
        </div>
      </div>
    </div>
  `;

  try {
    const result = await emailjs.send(
      "service_pcsz14l",
      templateId,
      {
        name: "Central Engineering College",
        email: to_email,
        title: "Account Setup Confirmation",
        message,
        time: new Date().toLocaleString(),
      },
      "oyORtlfQbRmDt0zE5"
    );
    console.log("EmailJS send result:", result);
    // Optionally: show a success message or log
  } catch (error) {
    console.error("EmailJS send error:", error);
    throw error; // rethrow so handler can catch
  }
}
