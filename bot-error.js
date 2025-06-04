require('dotenv').config();
const { readFile, writeFile } = require('node:fs/promises');
const { Client, GatewayIntentBits } = require('discord.js');
const { BOT_TOKEN, BOT_CHANNEL_ID, BOT_COMMIT_LINK_PATTERN } = process.env;
const testMode = process.argv.some(arg => arg === '--test');
const envArgIndex = process.argv.indexOf('--env');
const dataFile = './data.json';
let envDescription = '';

if (envArgIndex > -1) {
	let envName = process.argv[envArgIndex + 1];
	envDescription = ` no ambiente de ${envName}`;
}

(async function() {
	if (BOT_TOKEN && BOT_CHANNEL_ID) {
		let data = {};
		
		let messageContent = `🔴 Deploy executado com erro${envDescription}.`;
		
		if (testMode) {
			console.log(messageContent);
			return;
		}
		
		try {
			data = await readFile(dataFile, { encoding: 'utf8' } );
			data = JSON.parse(data);
		}
		catch (e) {
		}
		
		const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

		client.once('ready', async () => {
			const channel = await client.channels.fetch(BOT_CHANNEL_ID);
			const message = await channel.messages.fetch(data.messageId);
			
			if (channel && message) {
				await message.edit(messageContent);
				
				setTimeout(() => {
					client.destroy();
					process.exit();
				}, 100);
			}
		});

		client.login(BOT_TOKEN);
	}
	else {
		console.log('Env params BOT_TOKEN or BOT_CHANNEL_ID are not defined!');
	}
})();