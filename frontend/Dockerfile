FROM node:20-alpine

# Create a non-privileged user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Upgrade npm
RUN npm install -g npm@latest

COPY package*.json ./
RUN npm install

COPY . .

# Ensure appuser owns everything including node_modules
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
