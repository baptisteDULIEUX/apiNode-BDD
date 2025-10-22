FROM node:22-alpine
LABEL authors="SamSoul"

ENTRYPOINT ["npm", "run build"]
ENTRYPOINT ["node", "dist/index.js"]