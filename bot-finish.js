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
		let data = {};
			
		try {
			data = await readFile(commitNumberFile, { encoding: 'utf8' } );
			data = JSON.parse(data);
			data.commitNumber = data.commitNumber + 1;
		}
		catch (e) {
			data.commitNumber = 0;
		}
		
		if (!testMode) {
            await writeFile(commitNumberFile, JSON.stringify(data));
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
			
			const date = new Date(revisionSegments[7].replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1/$2/$3 $4:$5:$6'));
			const dateDisplay = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} às ${(date.getHours() - 3).toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
			const user = revisionSegments[9];
			messageContent = `🟢 Deploy #${data.commitNumber} executado com sucesso${envDescription} em ${dateDisplay} por ${user}. Branch: ${branch}, commit: [${commit.replace(/^.+\//, '').substring(0, 7)}](${commit}).`;
		}
		catch (e) {
			const date = new Date();
			const dateDisplay = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} às ${(date.getHours()).toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
			messageContent = `🔴 Deploy #${data.commitNumber} executado com falha${envDescription} em ${dateDisplay}. Exception: ` + e.toString();
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
		console.log('Env params BOT_TOKEN, BOT_CHANNEL_ID or BOT_REVISION_LOG_PATH are not defined!');
	}
})();