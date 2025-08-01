FROM node:18-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy all files (including source and config)
COPY . .

# Install all dependencies
RUN npm install && npm cache clean --force

# Build your app (if needed)
RUN npm run build

EXPOSE 8080

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({hostname: 'localhost', port: 8080, path: '/api/ping', timeout: 2000}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

CMD ["npm", "start"]
