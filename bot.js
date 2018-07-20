const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = "Prefix";
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const { Client, Util } = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const client = new Discord.Client();
client.on('ready', () => {
    console.log('I am ready!');
});


/*
Packages.
npm install discord.js
npm install ytdl-core
npm install get-youtube-id
npm install youtube-info
npm install simple-youtube-api
npm install queue
*/



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`in ${client.guilds.size} servers `)
    console.log(`[Codes] ${client.users.size}`)
    client.user.setStatus("idle")
});


const prefix = "S"
client.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	
	if (!msg.content.startsWith(prefix)) return undefined;
	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(" ")[0];
	command = command.slice(prefix.length)

	if (command === `play`) {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('لازم تكون بروم ي حلو :face_palm:');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			
			return msg.channel.send('** ليست لدي أي صلاحية للتكلم بهذا الروم **');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('** ليست لدي أي صلاحية للتكلم بهذا الروم **');
		}

		if (!permissions.has('EMBED_LINKS')) {
			return msg.channel.sendMessage("** لازم يكون عندي :joy: `EMBED LINKS` **")
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(` **${playlist.title}** تمت الإضافة الي قآئمة التشغيل `);
		} else {
			try {

				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 5);
					let index = 0;
					const embed1 = new Discord.RichEmbed()
			        .setDescription(`** الرجآء من حضرتكك إختيآر رقم المقطع , ** :
${videos.map(video2 => `[**${++index} **] \`${video2.title}\``).join('\n')}`)

					.setFooter("CODES")
					msg.channel.sendEmbed(embed1).then(message =>{message.delete(20000)})
					
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 15000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send(' لم يتم إختيآر مقطع صوتي ');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send(':X: لاتوجد نتآئج بحث  ');
				}
			}

			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === `skip`) {
		if (!msg.member.voiceChannel) return msg.channel.send(' لازم تكون بروم صوتي يـ (: ');
		if (!serverQueue) return msg.channel.send('لا يتوفر مقطع لتجآوزه ');
		serverQueue.connection.dispatcher.end('تم تجاوز هذا المقطع');
		return undefined;
	} else if (command === `stop`) {
		if (!msg.member.voiceChannel) return msg.channel.send(' لازم تكون بروم صوتي يـ (: ');
		if (!serverQueue) return msg.channel.send('لايتوفر مقطع لإيقافهه');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('تم إيقاف المقطع');
		return undefined;
	} else if (command === `vol`) {
		if (!msg.member.voiceChannel) return msg.channel.send(' لازم تكون بروم صوتي يـ (: ');
		if (!serverQueue) return msg.channel.send('لايوجد شيء شغآل ');
		if (!args[1]) return msg.channel.send(`:loud_sound: مستوى الصوت **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 50);
		return msg.channel.send(`:speaker: تم تغير الصوت الى **${args[1]}**`);
	} else if (command === `np`) {
		if (!serverQueue) return msg.channel.send('لا يوجد شيء يعمل حاليآا');
		const embedNP = new Discord.RichEmbed()
	.setDescription(`:notes: الآن يتم التشغيل: **${serverQueue.songs[0].title}**`)
		return msg.channel.sendEmbed(embedNP);
	} else if (command === `list`) {
		
		if (!serverQueue) return msg.channel.send('لا يوجد شيء يعمل حاليآا');
		let index = 0;
		
		const embedqu = new Discord.RichEmbed()

.setDescription(`**Songs list**
${serverQueue.songs.map(song => `**${++index} -** ${song.title}`).join('\n')}
**الآن يتم التشغيل** ${serverQueue.songs[0].title}`)
		return msg.channel.sendEmbed(embedqu);
	} else if (command === `pause`) {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('تم إيقاف الموسيقى مؤقتآا');
		}
		return msg.channel.send('لا يوجد شيء يعمل حاليآا');
	} else if (command === "resume") {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('إستأنفت الموسيقى بالنسبهة لكك ');
		}
		return msg.channel.send('لا يوجد شيء يعمل حاليآا');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	
//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`لآ أستطيع دخول هذا الروم  ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(` **${song.title}** تمت إضافهةة الأغنيهه الى القآائمة`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);
	
	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`بدء التشغيل : **${song.title}**`);
}

const adminprefix = "S";
const devs = ['413685264565927967'];
client.on('message', message => {
  var argresult = message.content.split(` `).slice(1).join(' ');
    if (!devs.includes(message.author.id)) return;
    
if (message.content.startsWith(adminprefix + 'sgame')) {
  client.user.setGame(argresult);
    message.channel.sendMessage(`**${argresult} تم تغيير بلايينق البوت الى **`)
} else 
  if (message.content.startsWith(adminprefix + 'sname')) {
client.user.setUsername(argresult).then
    message.channel.sendMessage(`**${argresult}** : تم تغيير اسم البوت الى`)
return message.reply("**يجب عليك الإنتظآار ساعتين لتغيرر الإسم مرهة اخرى **");
} else
  if (message.content.startsWith(adminprefix + 'savatar')) {
client.user.setAvatar(argresult);
  message.channel.sendMessage(`**${argresult}** : تم تغيير أفتآر البوت الي`);
      } else     
if (message.content.startsWith(adminprefix + 'st')) {
  client.user.setGame(argresult, "https://www.twitch.tv/idk");
    message.channel.sendMessage(`**تم تغير تويتش البوت الى  ${argresult}**`)
}

});

client.on("message", message => {
 if (message.content === `${prefix}`) {
  const embed = new Discord.RichEmbed() 
      .setColor("#000000")
      .setDescription(`
	  **
 ● ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ●
 [ ${prefix}play ] [ لتشغيل اغنية برابط او بأسم ]
 [ ${prefix}skip ] [ لتجاوز الأغنية الحالية ]
 [ ${prefix}pause ] [ لإيقاف الأغنية مؤقتا ]
 [ ${prefix}resume ] [ لإكمال الأغنية بعد إيقافها ]
 [ ${prefix}vol ] [ لتغيير درجة الصوت من 100 - 0 ]
 [ ${prefix}stop ] [ لإيقاف الأغنية ]
 [ ${prefix}np ] [ لمعرفة الأغنية المشغلة حاليا ]
 [ ${prefix}queue ] [ لمعرفة الأغاني التي سوف يتم تشغيلها ]
 ● ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ●
**
 `)
   message.channel.sendEmbed(embed)
    
   }
   }); 



client.login(process.env.BOT_TOKEN);
