# Next Flow Barber

Plataforma de agendamento para barbearias com controle de planos (SaaS), limites de agendamento e notificações de expiração.

## Funcionalidades principais
- **Agendamentos Inteligentes:** Permite que clientes agendem horários de forma fácil.
- **Gestão de Planos SaaS:** Barbearias podem assinar planos (Mensal, Anual) com limites de recursos e diferenciais.
- **Painel Administrativo para Barbearias:** Gerenciamento de sua assinatura, agendamentos e informações do estabelecimento.
- **Painel Super Admin:** Gestão global de barbearias, planos e faturamento.
- **Integração no WhatsApp:** Links diretos para notificar clientes sobre faturas/planos vencidos.

## Tecnologias Utilizadas
- **Next.js (App Router)**
- **Tailwind CSS** para estilização
- **Prisma ORM** para integração com banco de dados
- **PostgreSQL / SQLite** (via Prisma)
- **Framer Motion** para animações na Landing Page e UI
- **Lucide React** para ícones

## Como rodar localmente

**Pré-requisitos:** Node.js (v18+)

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure suas variáveis de ambiente copiando o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Não se esqueça de preencher as chaves necessárias, como o `DATABASE_URL` do Prisma)*

3. Inicialize o banco de dados e as sementes (caso exista):
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. Execute a aplicação (modo desenvolvimento):
   ```bash
   npm run dev
   ```

5. Abra `http://localhost:3000` no seu navegador para ver o resultado.
