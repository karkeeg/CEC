# CEC - College Education Center

A comprehensive **React-based College Management System** with role-based dashboards for students, teachers, and administrators. Built with modern web technologies and Supabase backend.

## Features

### 🎯 Core Functionality
- **Multi-role Authentication System** (Student, Teacher, Admin)
- **Real-time Dashboard Analytics** with Chart.js and Recharts
- **Assignment Management System** with submission tracking
- **Attendance Management** with detailed reporting
- **Student & Teacher Profile Management**
- **Department & Course Management**
- **Notice & Announcement System**
- **File Upload & Download System**
- **Grade Management & Analytics**
- **Email Integration** with EmailJS
- **PDF Generation** for reports and assignments

### 🎨 User Interfaces
- **Responsive Design** with Tailwind CSS
- **Modern UI/UX** with React Icons and SweetAlert2
- **Loading States** with React Loading Skeleton
- **Interactive Charts** and Data Visualization
- **Form Validation** and Error Handling
- **Modal Components** for enhanced UX

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - Modern React with latest features
- **Vite 7.0.0** - Fast build tool and dev server
- **React Router DOM 7.6.3** - Client-side routing
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS processing

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase JS Client 2.50.3** - Real-time database operations

### UI/UX Libraries
- **React Icons 5.5.0** - Icon library
- **React Select 5.10.2** - Advanced select components
- **React Tooltip 5.29.1** - Tooltip components
- **SweetAlert2 11.22.2** - Beautiful alert dialogs
- **React Loading Skeleton 3.5.0** - Loading placeholders

### Data Visualization
- **Chart.js 4.5.0** - Charting library
- **React Chart.js 2 5.3.0** - React wrapper for Chart.js
- **Recharts 3.1.0** - Composable charting library

### Utilities
- **Date-fns 4.1.0** - Date manipulation
- **Bcryptjs 3.0.2** - Password hashing
- **HTML2PDF.js 0.10.3** - PDF generation
- **jsPDF 3.0.1** - PDF creation
- **jsPDF AutoTable 5.0.2** - PDF table generation

### Email & Communication
- **EmailJS Browser 4.4.1** - Email service integration
- **EmailJS Com 3.2.0** - Email templates

### Development Tools
- **ESLint 9.29.0** - Code linting
- **ESLint React Hooks 5.2.0** - React Hooks linting
- **ESLint React Refresh 0.4.20** - Fast refresh linting

## 📁 Project Structure

```
CEC/
├── src/
│   ├── Components/           # Reusable UI components
│   │   ├── AdminDashboard/   # Admin-specific components
│   │   ├── StudentDashboard/ # Student dashboard components
│   │   ├── TeacherDashboard/ # Teacher dashboard components
│   │   ├── Forms/           # Form components
│   │   └── ...              # Other UI components
│   ├── Pages/               # Page components
│   ├── contexts/            # React contexts
│   │   └── UserContext.jsx  # User authentication context
│   ├── supabaseConfig/      # Supabase configuration
│   │   ├── supabaseClient.js # Supabase client setup
│   │   └── supabaseApi.js   # API functions
│   ├── utils/               # Utility functions
│   ├── assets/              # Static assets
│   └── data/                # Static data files
├── public/                  # Public assets
├── package.json             # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── eslint.config.js        # ESLint configuration
└── vercel.json             # Vercel deployment config
```

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase Account** for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CEC
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Set up your Supabase project
   - Import the database schema from `add_assignment_submissions.sql`
   - Configure authentication providers in Supabase dashboard

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🏗️ Architecture Overview

### Authentication Flow
- **Role-based Access Control** with AuthGuard components
- **JWT-based Authentication** via Supabase Auth
- **Persistent Sessions** with localStorage
- **Protected Routes** for different user roles

### State Management
- **React Context API** for global state management
- **UserContext** for authentication and user data
- **Local State** for component-specific data
- **Supabase Real-time** for live data updates

### API Structure
- **Centralized API Layer** in `supabaseApi.js`
- **CRUD Operations** for all entities
- **Error Handling** with try-catch blocks
- **Type-safe Operations** with proper data validation

### Component Architecture
- **Functional Components** with React Hooks
- **Composable Design** for reusability
- **Separation of Concerns** between UI and logic
- **Responsive Design** with mobile-first approach

##  Key Features Deep Dive

### Dashboard Analytics
- **Real-time Charts** using Chart.js and Recharts
- **Performance Metrics** for students and teachers
- **Attendance Analytics** with date range filtering
- **Assignment Submission Rates** by subject/class
- **Grade Distribution** visualizations

### Assignment System
- **Multi-file Upload** support
- **Due Date Management** with notifications
- **Submission Tracking** with status updates
- **Grade Assignment** with feedback
- **PDF Generation** for assignment reports

### Attendance Management
- **Bulk Attendance** entry for teachers
- **Date Range Filtering** for reports
- **Student-specific** attendance tracking
- **Analytics Dashboard** for attendance patterns
- **Export Functionality** for reports

### User Management
- **Student Registration** with profile creation
- **Teacher Management** with department assignment
- **Admin Controls** for user permissions
- **Profile Updates** with image upload
- **Password Management** with secure hashing

## 🔒 Security Features

- **JWT Authentication** via Supabase
- **Password Hashing** with bcryptjs
- **Role-based Access Control**
- **Protected API Endpoints**
- **Input Validation** and sanitization
- **CORS Configuration** for production

##  Responsive Design

- **Mobile-first** approach with Tailwind CSS
- **Breakpoint-specific** layouts
- **Touch-friendly** interfaces
- **Progressive Web App** features
- **Cross-browser** compatibility

##  Deployment

### Vercel Deployment
The project is configured for Vercel deployment with:
- **SPA Routing** configuration in `vercel.json`
- **Environment Variables** setup
- **Build Optimization** with Vite
- **CDN Distribution** for static assets

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Style
- **ESLint** configuration for code quality
- **Prettier** for code formatting
- **React Hooks** best practices
- **Component naming** conventions
- **File structure** organization

##  Performance Optimization

- **Code Splitting** with React Router
- **Lazy Loading** for components
- **Image Optimization** with proper formats
- **Bundle Analysis** with Vite
- **Caching Strategies** for static assets

##  Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Ensure proper CORS configuration

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check for dependency conflicts
   - Verify Node.js version compatibility

3. **Authentication Issues**
   - Clear localStorage
   - Check Supabase Auth configuration
   - Verify user roles and permissions

## 📈 Future Enhancements

- **Real-time Notifications** with WebSockets
- **Advanced Analytics** with machine learning
- **Mobile App** with React Native
- **API Rate Limiting** and caching
- **Multi-language Support** with i18n
- **Advanced Reporting** with custom dashboards

## 📄 License

This project is licensed under the NextWave & Bibek Karki License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support and questions:
- **Documentation**: Check the inline code comments
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team (karkibibek642@gmail.com)

---

**Build By Bibek Karki & NextWaveAi Team.**