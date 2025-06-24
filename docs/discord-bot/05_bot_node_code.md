# Guia Bot Discord: Código do Bot (Node.js)

Esta seção contém o código JavaScript para o seu bot do Discord, incluindo a configuração inicial e os manipuladores de comandos.

## Instalação de Dependências

No terminal, na pasta do seu bot (`gerr-discord-bot`), execute:

```bash
npm init -y
npm install discord.js dotenv
```

Seu `package.json` deve ter o `type` como `"module"` e um script de início:

```json
// package.json
{
  "name": "gerr-discord-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/bot.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1",
    "dotenv": "^16.3.1"
  }
}
```

## `src/utils/presenceHandler.js`

```javascript
// gerr-discord-bot/src/utils/presenceHandler.js
import dotenv from 'dotenv';
dotenv.config();

const presenceFunctionUrl = process.env.SUPABASE_PRESENCE_FUNCTION_URL;
const edgeFunctionSecret = process.env.EDGE_FUNCTION_SECRET_KEY;

export async function recordPresence(discordId) {
    if (!presenceFunctionUrl) {
        console.error("[Bot Error] URL da Edge Function de Presença não configurada.");
        return { success: false, messageForBot: "Erro de configuração interna do bot (URL Presença)." };
    }

    try {
        const response = await fetch(presenceFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${edgeFunctionSecret}`,
            },
            body: JSON.stringify({ discord_id: discordId }),
        });

        const data = await response.json();
        return { success: response.ok, ...data };
    } catch (error) {
        console.error("[Bot Error] Erro de rede ao chamar Edge Function de presença:", error.message);
        return { success: false, messageForBot: "Erro de comunicação com o sistema de presença (rede)." };
    }
}
```

## `src/utils/justificationHandler.js`

```javascript
// gerr-discord-bot/src/utils/justificationHandler.js
import dotenv from 'dotenv';
dotenv.config();

const justificationFunctionUrl = process.env.SUPABASE_JUSTIFICATION_FUNCTION_URL;
const edgeFunctionSecret = process.env.EDGE_FUNCTION_SECRET_KEY;

export async function recordJustification(payload) {
    if (!justificationFunctionUrl) {
        console.error("[Bot Error] URL da Edge Function de Justificativa não configurada.");
        return { success: false, message: "Erro de configuração interna do bot (URL Justificativa)." };
    }

    try {
        const response = await fetch(justificationFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${edgeFunctionSecret}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return { success: response.ok, message: data.message };
    } catch (error) {
        console.error("[Bot Error] Erro de rede ao chamar Edge Function de justificativa:", error.message);
        return { success: false, message: "Erro de comunicação com o sistema (rede)." };
    }
}
```

## `src/bot.js` (Arquivo Principal)

```javascript
// gerr-discord-bot/src/bot.js
import { Client, GatewayIntentBits, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { recordPresence } from './utils/presenceHandler.js';
import { recordJustification } from './utils/justificationHandler.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = "!";
const PRESENCE_COMMAND = "presença";
const JUSTIFY_COMMAND = "justificar";
const ALLOWED_CHANNEL_ID = process.env.ALLOWED_CHANNEL_ID;
const BOT_TOKEN = process.env.DISCORD_TOKEN;

client.once(Events.ClientReady, c => {
    console.log(`[Bot Online] Bot ${c.user.tag} está online!`);
    client.user.setActivity(`comandos no canal GERR`, { type: 'LISTENING' });
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (ALLOWED_CHANNEL_ID && message.channel.id !== ALLOWED_CHANNEL_ID) return;

    const commandInput = message.content.toLowerCase().trim();

    // Comando !presença
    if (commandInput === `${PREFIX}${PRESENCE_COMMAND}`) {
        await message.channel.sendTyping();
        const result = await recordPresence(message.author.id);
        await message.reply(result.messageForBot || "Ocorreu um erro ao processar.");
    }

    // Comando !justificar
    if (commandInput === `${PREFIX}${JUSTIFY_COMMAND}`) {
        const modal = new ModalBuilder()
            .setCustomId('justificationModal')
            .setTitle('Formulário de Justificativa');

        const reasonInput = new TextInputBuilder().setCustomId('reasonInput').setLabel("Motivo da ausência?").setStyle(TextInputStyle.Paragraph).setRequired(true);
        const startDateInput = new TextInputBuilder().setCustomId('startDateInput').setLabel("Data de Início (DD/MM/AAAA)").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(10).setMaxLength(10);
        const endDateInput = new TextInputBuilder().setCustomId('endDateInput').setLabel("Data de Retorno (DD/MM/AAAA)").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(10).setMaxLength(10);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(startDateInput),
            new ActionRowBuilder().addComponents(endDateInput)
        );
        await message.showModal(modal);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'justificationModal') {
        await interaction.deferReply({ ephemeral: true });

        const reason = interaction.fields.getTextInputValue('reasonInput');
        const startDate = interaction.fields.getTextInputValue('startDateInput');
        const endDate = interaction.fields.getTextInputValue('endDateInput');

        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(startDate) || !/^\d{2}\/\d{2}\/\d{4}$/.test(endDate)) {
            await interaction.editReply({ content: '❌ Formato de data inválido. Use DD/MM/AAAA.' });
            return;
        }
        
        const payload = {
            discord_id: interaction.user.id,
            member_name: interaction.user.globalName || interaction.user.username,
            reason,
            start_date: startDate,
            end_date: endDate
        };
        
        const result = await recordJustification(payload);
        await interaction.editReply({ content: result.message });
    }
});

client.login(BOT_TOKEN);
```