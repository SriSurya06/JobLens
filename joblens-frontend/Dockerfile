# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# CRA reads REACT_APP_* vars at build time
ARG REACT_APP_API_URL=/api
ARG REACT_APP_CLAUDE_API_KEY=
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_CLAUDE_API_KEY=${REACT_APP_CLAUDE_API_KEY}

RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
