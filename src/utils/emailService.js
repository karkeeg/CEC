import emailjs from "@emailjs/browser";

export async function sendConfirmationEmail({ to_name, to_email, role }) {
  // Use the same template for both students and teachers
  const templateId = "template_sfb75qi"; // Shared template for all roles
  const firstTimePassword = "password123"; // Default password for first login

  await emailjs.send(
    "service_pcsz14l",
    templateId,
    {
      name: to_name,
      email: to_email,
      role, // Pass the role so the template can show different content if needed
      password: firstTimePassword,
      time: new Date().toLocaleString(),
    },
    "oyORtlfQbRmDt0zE5"
  );
}
