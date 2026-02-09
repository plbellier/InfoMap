# Stage 1: Build
FROM node:20-alpine as build-stage

WORKDIR /app

# Upgrade npm
RUN npm install -g npm@latest

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine as production-stage

# Create a non-privileged user for security (though Nginx usually runs as nginx)
# In alpine, the nginx user usually exists already.

# Copy build assets from stage 1
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
