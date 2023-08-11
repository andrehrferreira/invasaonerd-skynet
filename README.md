# Instalação

O projeto requer alguns componentes básicos para seu funcionamento, para a v1 são necessário arquivos do AngularJS já previamente configurados no Bower

```bash
$ npm install
$ npm install -g bower
$ bower install
```

Obviamente as dependencias do NPM tambem devem ser carregadas

```bash
$ npm update --progress=false
```

# Modo Dev

Para iniciar o projeto em modo desenvolvimento basta utilizar o seguinte comando

```bash
$ node server.js
```

# Produção

O ideal que seja iniciada aplicação em Docker Compose, porem existem algumas opções pré-configuradas

## Docker Compose

```bash
$ docker-compose build
$ docker-compose up -d
```

## PM2

```bash
$ npm install -g pm2
$ pm2 start ecosystem.json
```

## Systemctl

```
[Unit]
Description=Skynet
After=network.target

[Service]
Type=simple
Nice=7
WorkingDirectory=/opt/skynet/
LimitFSIZE=infinity
LimitCPU=infinity
LimitAS=infinity
LimitNOFILE=infinity
StandardOutput=syslog
StandardError=syslog
KillSignal=SIGTERM
ExecStart=/usr/bin/node cluster.js
Restart=always
SyslogIdentifier=skynet

[Install]
WantedBy=multi-user.target
```

## Configuração NGINX Servidor (Simples)

Favor criar um site-enable

```bash
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name sitedecupom.com.br;
    location / {
        proxy_pass http://localhost:8555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    access_log /var/log/nginx/skynet-access.log;
    error_log /var/log/nginx/skynet-error.log;
}

server {
    listen 443 http2 ssl default_server;
    listen [::]:442 http2 ssl default_server;
    server_name invasaonerd.com.br www.invasaonerd.com.br;
    location / {
        proxy_pass http://localhost:8555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    access_log /var/log/nginx/skynet-access.log;
    error_log /var/log/nginx/skynet-error.log;

    ssl_certificate /etc/letsencrypt/live/invasaonerd.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/invasaonerd.com.br/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

## Configuração NGINX do Servidor (Loadbalance)

Para grandes fluxos de acesso sera necessário configurar Loadbalance

nginx/backend.d/invasao.conf
```bash
upstream invasao  {
    server 127.0.0.1:5050;
    #server 127.0.0.1:5051;
    #server 127.0.0.1:5052;
    keepalive 60;
}
```

nginx/properties.d/invasao.conf
```bash
location / {
    proxy_set_header HOST $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
    proxy_connect_timeout 10s;
    proxy_send_timeout 15s;
    proxy_read_timeout 20s;
    proxy_pass  http://invasao;
    proxy_buffering off;
    break;
}
```

nginx/sites-available/invasao.conf
```bash
server {
    listen 8889 default;
    listen [::]:8889 default;
    include properties.d/invasao.conf;
    access_log /var/log/nginx/invasao-access.log;
    error_log /var/log/nginx/invasao-error.log;
}
```

nginx/nginx.conf
```bash
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 120;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    #more_set_headers 'Server';
    #more_set_headers 'X-Powered-By';
    client_max_body_size 0;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;

    include /etc/nginx/backend.d/*.conf;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

## Configuração MongoDB

No arquivo server.js esta a configuração da conexão para o MongoDB em modo desenvolvimento e modo produção, basta editar o arquivo e lembrar de liberar firewall caso o banco esteja locado em outro servidor.

```js
settings: (env) => {
    const defaultSettings = {
        dev: {
            production: false,
            mongodb: { url: "mongodb://localhost:27017", database: "skynet"},
            session: { secret: "noix", timeout: 24 * 60 * 60 }
        },
        prod: {
            production: true,
            mongodb: { url: "mongodb://mongo.invasaonerd.com.br:27017", database: "skynet"},
            session: { secret: "noix", timeout: 24 * 60 * 60 }
        }
    };

    return defaultSettings[env];
}
```
