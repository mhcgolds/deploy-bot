require('dotenv').config();
const { readFile, writeFile } = require('node:fs/promises');
const { Client, GatewayIntentBits } = require('discord.js');
const { BOT_TOKEN, BOT_CHANNEL_ID, BOT_COMMIT_LINK_PATTERN } = process.env;
const testMode = process.argv.some(arg => arg === '--test');
const envArgIndex = process.argv.indexOf('--env');
let commitNumberFile = './data.json';
let envDescription = '';

if (envArgIndex > -1) {
	let envName = process.argv[envArgIndex + 1];
	commitNumberFile = `./data-${envName}.json`;
	envDescription = ` no ambiente de ${envName}`;
}

const revArgIndex = process.argv.indexOf('--rev-path');
let revisionFilePath = null;

if (revArgIndex > -1) {
	revisionFilePath = process.argv[revArgIndex + 1] + '/revisions.log';
}

(async function() {
	if (BOT_TOKEN && BOT_CHANNEL_ID) {
		let data = {
			commitNumber: 0
		};
			
		try {
			data = await readFile(commitNumberFile, { encoding: 'utf8' } );
			data = JSON.parse(data);
			data.commitNumber = data.commitNumber + 1;
		}
		catch (e) {
		}
		
		let messageContent = `🟡 Deploy #${commitNumber} iniciado${envDescription}.`;
		
		if (testMode) {
			console.log(messageContent);
			return;
		}
		
		const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

		client.once('ready', () => {		
			const channel = client.channels.fetch(BOT_CHANNEL_ID);
			if (channel) {
				const messageData = channel.send(messageContent);
				
				if (!testMode) {
					data.messageId = messageData.id;
					await writeFile(commitNumberFile, JSON.stringify(data));
				}
				
				setTimeout(() => {
					client.destroy();
					process.exit();
				}, 100);
			}
		});

		client.login(BOT_TOKEN);
	}
	else {
		console.log('Env params BOT_TOKEN, BOT_CHANNEL_ID or BOT_REVISION_LOG_PATH are not defined!');
	}
})();