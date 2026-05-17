# Massoterapia RJ Painel

Painel operacional separado do CORE PS para a equipe Massoterapia RJ.

## Objetivo

- Manter o CORE PS como sistema interno da IA Guru.
- Dar aos colaboradores uma interface própria para agenda.
- Reaproveitar a API e o banco central de agendamentos do CORE PS.
- Abrir WhatsApp manualmente com mensagem pronta, sem API de WhatsApp.

## Executar

```bash
docker compose up -d --build
```

Validar:

```bash
curl -I http://127.0.0.1:8093
curl -I http://127.0.0.1:8093/painel/
```

## Proxy

No Nginx Proxy Manager, criar Proxy Host apontando para:

- Forward Hostname/IP: `127.0.0.1`
- Forward Port: `8093`
- SSL: Let's Encrypt
- Force HTTPS: ativo

## Integração

O frontend usa `/painel/api` para acessar internamente `coreps_api:3001/api` pela rede Docker `proxy_net`.
