require('dotenv').config();
const { readFile, writeFile } = require('node:fs/promises');
const { Client, GatewayIntentBits } = require('discord.js');
const { BOT_TOKEN, BOT_CHANNEL_ID, BOT_REVISION_LOG_PATH, BOT_COMMIT_LINK_PATTERN } = process.env;
const COMMIT_NUMBER_FILE = './commit-number.txt';

(async function() {
	if (BOT_TOKEN && BOT_CHANNEL_ID && BOT_REVISION_LOG_PATH) {
		let commitNumber;
		
		try {
			commitNumber = await readFile(COMMIT_NUMBER_FILE, { encoding: 'utf8' } );
		}
		catch (e) {
			commitNumber = 1;
		}
		
		writeFile(COMMIT_NUMBER_FILE, (commitNumber + 1).toString());
		
		let messageContent;
		try {
			const revisionsContent = await readFile(BOT_REVISION_LOG_PATH, { encoding: 'utf8' });
			const revisionCurrent = revisionsContent.split(/\r\n|\r|\n/).slice(-2)[0];
			const revisionSegments = revisionCurrent.split(' ');
			const branch = revisionSegments[1];
			let commit = revisionSegments[3].replace(/[^a-z0-9]/g, '');
			
			if (BOT_COMMIT_LINK_PATTERN) {
				commit = BOT_COMMIT_LINK_PATTERN.replace(/\{commit\}/g, revisionSegments[3].replace(/[^a-z0-9]/g, ''));
			}
			
			const date = new Date(revisionSegments[7].replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1/$2/$3 $4:$5:$6'));
			const user = revisionSegments[9];
			messageContent = `🟢 Deploy #${commitNumber} executado em ${date.toLocaleString()} por ${user}. ${commit}`;
		}
		catch (e) {
			messageContent = '🔴 Erro ao ler informações do deploy: ' + e.toString();
		}
		
		const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

		client.once('ready', () => {		
			const channel = client.channels.cache.get(BOT_CHANNEL_ID);
			if (channel) {
				channel.send(messageContent);
				
				setTimeout(() => {
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