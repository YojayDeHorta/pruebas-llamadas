# Etapa 1: Construcción
# Usar una imagen oficial de Node.js. La versión 'alpine' es ligera, ideal para producción.
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json (si existe)
COPY package.json ./

# Instalar las dependencias de producción
RUN npm install --only=production

# Etapa 2: Producción
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar las dependencias instaladas y los archivos de la aplicación desde la etapa de construcción
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY App.js ./
COPY public ./public

# Exponer el puerto en el que la aplicación se ejecuta
EXPOSE 3000

# Comando para iniciar la aplicación
CMD [ "node", "App.js" ]