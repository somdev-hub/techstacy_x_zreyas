# TechStacy x Zreyas

A comprehensive event management system for Silicon Institute of Technology, Sambalpur's technical, cultural, and sports events.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Project Description](#project-description)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Event Management](#event-management)
- [Payment System](#payment-system)
- [Notification System](#notification-system)
- [Security](#security)
- [API Documentation](#api-documentation)

## Overview

TechStacy x Zreyas is a Next.js-based web application designed to streamline the management of various college events. It handles event registration, team formation, attendance tracking, notifications, and result management.

## Features

- User authentication and role-based access (SUPERADMIN, ADMIN, USER)
- Event registration and team management
- QR code-based attendance tracking
- Real-time notifications using Firebase Cloud Messaging and server-client pooling
- Payment integration for events and merchandise with Razorpay payment button integration
- Result declaration and prize pool management
- Treasure hunt event management with clue tracking
- Proper Role-based access control for different user roles
- Seperate dashboards for superadmin, admins, and users
- Rate limiting to prevent abuse
- Input validation using Zod
- Secure file uploads to AWS S3
- Error logging and monitoring with Sentry
- Responsive design using Tailwind CSS
- Support for multiple event types (technical, non-technical, cultural, sports)
- Support for multiple participation types (solo, duo, trio, quad, quintet, group)
- Support for partial registration
- Support for event coordinators (EventHeads)
- Support for event attendance tracking
- Support for event notifications
- Support for event results and position tracking
- Session recording and heatmap generation using Microsift Clarity
- Web analytics using Vercel Analytics and Google Analytics

## Tech Stack

- **Programming Languages**: TypeScript
- **Framework**: Next.js 15
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Azure MySQL with Prisma ORM
- **Design and UI**: Tailwind CSS, Shadcn UI, Aceternity UI
- **State Management**: React Context API
- **Form Handling**: React Hook Form, Zod for validation
- **Routing**: Next.js App Router
- **Deployment**: Vercel
- **Authentication**: JWT with JOSE library
- **Storage**: AWS S3 for file uploads
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Real-time**: Server-Sent Events (SSE)
- **Rate Limiting**: Upstash Redis
- **Payment**: Razorpay
- **Error Monitoring**: Sentry
- **Analytics**: Vercel Analytics, Google Analytics
- **Session Recording**: Microsoft Clarity

## Project Structure

```
TECHSTACY_X_ZREYAS/
├── public/ # Static assets like images, fonts and manifest
├── prisma/ # Database schema and migrations
│ ├── migrations/ # Database migration history
│ └── schema.prisma # Prisma schema definition file
│
├── src/
│ ├── app/ # Next.js app router pages and layouts
│ │ ├── api/ # API routes for backend functionality
│ │ ├── admin/ # Admin dashboard and features
│ │ ├── dashboard/ # User dashboard interface
│ │ └── super-admin/ # Super admin controls and management
│ │
│ ├── components/ # Reusable React components
│ │ ├── ui/ # Base UI components and primitives
│ │ └── forms/ # Form-related components
│ │
│ ├── context/ # React context providers and hooks
│ ├── hooks/ # Custom React hooks
│ ├── lib/ # Utility functions and shared logic
│ │ ├── auth/ # Authentication related utilities
│ │ └── api/ # API helper functions
│ │
│ ├── types/ # TypeScript type definitions
│ ├── utils/ # Helper functions and constants
│ └── styles/ # Global styles and Tailwind config
│
├── .env # Environment variables
├── .env.example # Example environment variables
├── package.json # Project dependencies and scripts
├── tsconfig.json # TypeScript configuration
├── next.config.js # Next.js configuration
└── README.md # Project documentation
```

## Project Description

This project is a comprehensive event management system designed for the Silicon Institute of Technology, Sambalpur. It provides a user-friendly interface for managing various types of events, including technical, non-technical, cultural, and sports events. The system allows users to register for events, form teams, track attendance, and receive real-time notifications. The application also includes a payment integration system for event registration fees and merchandise purchases. The backend is built using Next.js API routes, with a MySQL database managed through Prisma ORM. The frontend is developed using Next.js 15 and Tailwind CSS, ensuring a responsive and modern user experience.
The system is designed with security in mind, implementing JWT-based authentication, role-based access control, and secure file uploads to AWS S3. The application also includes features for event coordinators, attendance tracking, and result management. Additionally, the system supports a treasure hunt event with clue tracking and a notification system using Firebase Cloud Messaging.

### Role-based Access Control

The system implements role-based access control to ensure that users have appropriate permissions based on their roles. The roles include:

- **SUPERADMIN**: Full access to all features and settings.
- **ADMIN**: Access to check users registration and attendance management and special access to treasure hunt management.
- **USER**: Basic access to register for events, view notifications, and manage their profile.

### Event Management

The event management system allows users to create, manage, and participate in various events. Users can register for events, form teams, and track their participation status. The system supports multiple event types and participation formats, including solo, duo, trio, quad, quintetm, and group registrations. The superadmin can create events and manage event details, including registration fees, prize pools, and event schedules. The system also includes features for event coordinators (EventHeads) to manage their respective events. Superadmin adds admins to manage events and users. The admins can check the registration and attendance of users for the events. The system also includes a notification system to keep users informed about event updates, results, and other important information.

### Payment System

The payment system is integrated with Razorpay to handle merchandise fees. Users can make payments for merchandise purchases securely. The system supports various payment methods, including credit/debit cards, net banking, and UPI. The payment process is streamlined to ensure a smooth user experience, with real-time updates on payment status.

### Notification System

The notification system uses Firebase Cloud Messaging (FCM) and pooling based request-response model to send real-time notifications to users. The system supports various types of notifications, including event updates, reminders, and alerts. Users can receive notifications on their devices, ensuring they stay informed about important events and updates. The notification system also includes features for managing notification preferences and viewing notification history.

### Security

The application implements several security measures to protect user data and ensure secure access to the system. These measures include:

- Password hashing using bcrypt
- JOSE based JWT authentication
- Role-based access control
- Rate limiting to prevent abuse
- Input validation using Zod
- Secure file uploads to AWS S3

### Monitoring and Analytics

The application includes monitoring and analytics features to track user behavior and system performance. The system uses Sentry for error logging and monitoring, allowing developers to identify and resolve issues quickly. Additionally, the application integrates with Vercel Analytics and Google Analytics to provide insights into user interactions and engagement.
The system also includes session recording and heatmap generation using Microsoft Clarity, providing valuable data on user interactions and behavior. The comprehensive analytics system includes:

- Vercel Analytics for performance monitoring
- Google Analytics for user behavior tracking
- Microsoft Clarity for session recording and heatmap generation
- Upstash Redis for rate limiting and caching
- Sentry for error logging and monitoring

### QR Code-based Attendance Tracking

The attendance tracking system uses QR codes to verify user attendance at events. Users can scan their QR codes at the event venue to mark their attendance. The system tracks attendance status and generates reports for event coordinators and admins. The QR code-based system ensures accurate attendance tracking and simplifies the check-in process for users.

### Treasure Hunt Management

The treasure hunt management system allows users to participate in a treasure hunt event. The system includes features for clue tracking, clue object management, and winner declaration. Users can scan clues to progress through the treasure hunt, and the system tracks their progress and results. The treasure hunt management system is designed to provide an engaging and interactive experience for users.

### Result Management

The result management system allows event coordinators and admins to declare event results and manage prize pools. The system tracks user positions and generates reports for event results. Users can view their results and receive notifications about their performance in events. The result management system ensures transparency and accuracy in event results, providing users with a clear understanding of their performance.

## Getting Started

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up environment variables:
   \`\`\`
   DATABASE_URL="mysql://..."
   NEXT_PUBLIC_FCM_VAPID_KEY="..."
   AWS_ACCESS_KEY="..."
   AWS_SECRET_KEY="..."
   JWT_SECRET="..."
   \`\`\`
4. Run database migrations:
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`
5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Database Schema

### Core Tables

1. **User**

   - Basic info (name, email, phone, college)
   - SIC (Student ID)
   - Role (SUPERADMIN, ADMIN, USER)
   - FCM token for notifications
   - Event participation tracking

2. **Event**

   - Name and type (TECHNICAL, NON_TECHNICAL, CULTURAL, SPORTS)
   - Participation type (SOLO, DUO, TRIO, GROUP etc.)
   - Registration fee and prize pool
   - Date, time, venue
   - Description and image
   - Partial registration flag

3. **EventParticipant**

   - Event-user relationship
   - Team management (mainParticipantId for team leader)
   - QR code for verification
   - Attendance and confirmation status

4. **EventResult**

   - Position tracking
   - Event-user relationship
   - Creation timestamp

5. **Payment Tables**
   - AllPayments (general payments)
   - EventPayments (event-specific)
   - TshirtPayments (merchandise)

### Supporting Tables

- EventHead (event coordinators)
- EventAttendance
- Notification and NotificationQueue
- RefreshToken
- TreasureHunt related tables (Clues, ClueObject, ClueScans, WinnerClue)

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Refresh token rotation
- Role-based access control
- Rate limiting
- Input validation using Zod
- Secure file uploads
- Error logging and monitoring with Sentry

## API Routes

The application uses Next.js API routes under \`/api\`:

- /api/auth/\* - Authentication endpoints
- /api/events/\* - Event management
- /api/notifications/\* - Notification handling
- /api/payments/\* - Payment processing
- /api/users/\* - User management

## Environment Setup

Ensure the following environment variables are set:

- Database configuration
- AWS credentials for S3
- Firebase configuration
- JWT secrets
- Redis configuration
- Sentry DSN

For detailed API documentation and development guidelines, refer to the comments in the source code and related markdown files in the repository.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Copyright © 2024-2025 https://github.com/somdev-hub. All rights reserved.
