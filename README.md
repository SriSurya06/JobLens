# JobLens

JobLens is a campus placement management application with a React frontend, a Node.js/Express API, and MongoDB. Docker Compose runs the complete application stack.

## Overview

JobLens centralizes campus placement workflows for students and placement coordinators. It provides drive management, eligibility and application tracking, student feedback, notifications, and AI-assisted career.
## Problem and solution

Placement activities can be spread across spreadsheets, email, and disconnected tools. This makes it harder to track applications, check eligibility, coordinate recruitment rounds, and help students assess external opportunities.

JobLens brings these workflows into one role-based application, with a shared placement database, a web dashboard, and a REST API.

## Features

### Students

- Manage a profile and upload a resume.
- Browse on-campus and off-campus opportunities, apply to on-campus drives, and follow application and round status.
- Receive placement notifications and submit or browse company feedback.
- Use  job-link generation, and a placement chatbot.

### Coordinators

- Create and update on-campus drives and manage recruitment rounds.
- Review eligible students and drive applications.
- Manage off-campus opportunities, review student information, and send placement notifications.
- Review feedback and placement activity.

### AI-assisted tools

- Job-link generation creates external job-search links from student criteria.
- The chatbot assists with placement-related questions.

## Architecture

```text
Student or coordinator browser
		   |
	  React frontend
	  served by Nginx
	   /           \
   /api requests   /uploads
	   \           /
	   Express REST API
			|
		  MongoDB
```

In Docker Compose, Nginx serves the frontend and proxies `/api` and `/uploads` requests to the backend. MongoDB and uploaded files use named Docker volumes.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, React Router, Axios |
| Web server | Nginx |
| Backend | Node.js 20, Express |
| Database | MongoDB 7, Mongoose |
| Authentication | JWT, bcryptjs, role-based middleware |
| File uploads | Multer |
| Optional AI and safety integrations | Claude, Groq, Google Safe Browsing, heuristic checks |
| Containers | Docker, Docker Compose |

## Security

- JWT-protected API routes with student/coordinator authorization.
- Password hashing with bcryptjs.
- Secrets and provider keys are configured through environment variables; do not commit actual `.env` files or credentials.
- Uploaded files are stored separately from the container filesystem using a named volume in Compose.

## API reference

The API health check is `GET /api/health`. The list below covers the routes currently mounted by the backend. `:id` segments are path parameters.

### Health

- `GET /api/health`

### Authentication (`/api/auth`)

- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `PATCH /api/auth/change-password` (authenticated)
- `GET /api/auth/me` (authenticated)

### Student (`/api/student`, authenticated student role)

- `GET /api/student/profile`
- `PATCH /api/student/profile`
- `POST /api/student/resume`
- `GET /api/student/dashboard`
- `GET /api/student/drives/oncampus`
- `POST /api/student/drives/oncampus/:driveId/apply`
- `GET /api/student/drives/oncampus/:driveId/status`
- `GET /api/student/drives/offcampus`
- `POST /api/student/job-links`
- `POST /api/student/resume-match`
- `GET /api/student/notifications`
- `PATCH /api/student/notifications/read-all`
- `PATCH /api/student/notifications/:id/read`
- `DELETE /api/student/notifications`
- `DELETE /api/student/notifications/:id`

### Coordinator (`/api/coordinator`, authenticated coordinator role)

- `GET /api/coordinator/dashboard`
- `GET /api/coordinator/placement-stats/:batch`
- `GET /api/coordinator/students`
- `GET /api/coordinator/students/skills`
- `GET /api/coordinator/students/:studentId`
- `POST /api/coordinator/notify`
- `GET /api/coordinator/audit-logs`

### On-campus drives (`/api/oncampus`, authenticated)

- `POST /api/oncampus` (coordinator)
- `GET /api/oncampus` (coordinator)
- `PATCH /api/oncampus/:id` (coordinator)
- `GET /api/oncampus/:id/eligible-students` (coordinator)
- `GET /api/oncampus/:id/applications` (coordinator)
- `GET /api/oncampus/:id` (student or coordinator)

### Off-campus drives (`/api/offcampus`, authenticated)

- `POST /api/offcampus` (coordinator)
- `GET /api/offcampus` (coordinator)
- `PATCH /api/offcampus/:id` (coordinator)
- `DELETE /api/offcampus/:id` (coordinator)
- `GET /api/offcampus/:id` (student or coordinator)

### Recruitment rounds (`/api/rounds`, authenticated coordinator role)

- `POST /api/rounds`
- `PATCH /api/rounds/:id`
- `GET /api/rounds/drive/:driveId`
- `PATCH /api/rounds/:id/eligible-list`
- `PATCH /api/rounds/:id/attended-list`
- `PATCH /api/rounds/:id/qualified-list`

### Feedback (`/api/feedback`, authenticated)

- `POST /api/feedback` (student)
- `GET /api/feedback/companies` (student or coordinator)
- `GET /api/feedback/company/:companyName` (student or coordinator)
- `GET /api/feedback/drive/:driveId` (student or coordinator)

### Job verification (`/api/student/job-verifier`, authenticated student role)

- `POST /api/student/job-verifier/check`
- `GET /api/student/job-verifier/history`

### Chatbot (`/api/student/chatbot`)

- `POST /api/student/chatbot`
- `GET /api/student/chatbot/history`
- `GET /api/student/chatbot/history/:id`
- `DELETE /api/student/chatbot/history/:id`

The chatbot routes currently do not apply the authentication middleware used by the other protected route groups.

## Requirements

- Docker Desktop (or Docker Engine) with the Compose plugin
- Git, to clone the repository

## Run with Docker Compose

From the repository root, create the backend environment file if you do not already have one:

```bash
if [ ! -f CCPDMS_FINAL/.env ]; then
	cp CCPDMS_FINAL/.env.docker.example CCPDMS_FINAL/.env
fi
```

On Windows PowerShell:

```powershell
if (!(Test-Path CCPDMS_FINAL/.env)) {
	Copy-Item CCPDMS_FINAL/.env.docker.example CCPDMS_FINAL/.env
}
```

Edit `CCPDMS_FINAL/.env` and set `JWT_SECRET` to a strong, random value. Email and AI provider settings are optional and only needed for those features. Do not commit `.env` files or real API keys.

Build and start the app:

```bash
docker compose up --build
```

Open the frontend at [http://localhost:3000](http://localhost:3000). The API health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health). The frontend's Nginx server proxies API and uploaded-file requests to the backend container.

To run the demo-data seed script once:

```bash
docker compose exec backend node seed.js
```

Stop the services while preserving data:

```bash
docker compose down
```

To also delete the MongoDB and uploaded-file volumes:

```bash
docker compose down -v
```

## Services and data

| Service | Description | Host address |
| --- | --- | --- |
| `frontend` | React app served by Nginx | `http://localhost:3000` |
| `backend` | Express API | `http://localhost:5000` |
| `mongo` | MongoDB 7 | `localhost:27017` |

Compose creates named volumes for MongoDB data (`mongo_data`) and uploaded files (`uploads_data`). They survive container rebuilds and normal shutdowns. Use `docker compose down -v` to remove them.

## Configuration

The backend reads its environment from `CCPDMS_FINAL/.env`. Compose sets the MongoDB connection and frontend origin for the container network. Optional backend settings include email credentials and `CLAUDE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, and `GOOGLE_SAFE_BROWSING_API_KEY`; see `CCPDMS_FINAL/.env.docker.example` for the template. Do not put secrets in `REACT_APP_*` variables because Create React App embeds them in public browser assets.

## Project layout

```text
.
├── CCPDMS_FINAL/       # Express API, backend Dockerfile, and env template
├── joblens-frontend/   # React app, Nginx config, and frontend Dockerfile
├── docker-compose.yml  # MongoDB, backend, and frontend services
└── README.md
```
