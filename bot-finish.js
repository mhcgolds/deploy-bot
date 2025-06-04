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

const revArgIndex = process.argv.indexOf('--rev-path');
let revisionFilePath = null;

if (revArgIndex > -1) {
	revisionFilePath = process.argv[revArgIndex + 1] + '/revisions.log';
}

(async function() {
	if (BOT_TOKEN && BOT_CHANNEL_ID) {
		let data = {};
		
		try {
			data = await readFile(dataFile, { encoding: 'utf8' } );
			data = JSON.parse(data);
		}
		catch (e) {
		}
		
		let messageContent;
		try {
			const revisionsContent = await readFile(revisionFilePath, { encoding: 'utf8' });
			const latestTwoLines = revisionsContent.split(/\r\n|\r|\n/).slice(-2);
			const revisionCurrent = ((!latestTwoLines[1] || latestTwoLines[1] === '') ? latestTwoLines[0] : latestTwoLines[1]);
			const revisionSegments = revisionCurrent.split(' ');
			const branch = revisionSegments[1];
			let commit = revisionSegments[3].replace(/[^a-z0-9]/g, '');
			
			if (BOT_COMMIT_LINK_PATTERN) {
				commit = BOT_COMMIT_LINK_PATTERN.replace(/\{commit\}/g, revisionSegments[3].replace(/[^a-z0-9]/g, ''));
			}
			
			const user = revisionSegments[9];
			messageContent = `🟢 Deploy executado com sucesso${envDescription} por ${user}. Branch: ${branch}. Commit: [${commit.replace(/^.+\//, '').substring(0, 7)}](${commit}).`;
		}
		catch (e) {
			messageContent = `🔴 Deploy executado com erro${envDescription}. Exception: ` + e.toString();
		}
		
		if (testMode) {
			console.log(messageContent);
			return;
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