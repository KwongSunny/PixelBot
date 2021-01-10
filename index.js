require('dotenv').config();

const Discord = require('discord.js');
const fs = require('fs');
const aws_reactionroles = require('./aws_reactionroles');

const client = new Discord.Client({partials: ["MESSAGE", "CHANNEL", "REACTION"]});
const prefix = '~';
client.commands = new Discord.Collection();

//read all commands from commands folder
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);
}

//on startup
client.once('ready', () => {
    console.log('PixelBot, online!');

})

//persist while bot is alive
client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    
    // const args = message.content.slice(prefix.length).split(/ +/);
    // const command = args.shift().toLowerCase();

    const args = message.content.slice(message.content.search(" ")+1);
    const command = message.content.slice(prefix.length).split(/ +/).shift().toLowerCase();

    //gives basic information about the bot
    if(command === 'info')
        client.commands.get('info').execute(message);
    //test function DONE
    else if(command === 'ping')
        client.commands.get('ping').execute(message);
    //stops the bot DONE
    else if(command === 'kill')
        client.commands.get('kill').execute(message, client);
    //modular reactionrole command
    else if(command === 'reactionrole')
        client.commands.get('reactionrole').execute(message, args, aws_reactionroles, Discord, client);
    //nonmodular reactionrole command - to be replaced by reactionrole DONE
    else if(command === 'reactionrole_destinyraiders')
        client.commands.get('reactionrole_destinyraiders').execute(message, args, Discord, client);
    //randomizer command, gives a random output based on the parameters NEED TO DO EMBEDS | ARGS SEPERATES SPACED ITEMS IN LIST (NEED TO GO OFF ENTIRE MESSAGE.CONTENT)
    else if(command === 'random')
        client.commands.get('random').execute(message, args, Discord)
    
});

//read active reactions, and gives out roles
client.on('messageReactionAdd', async(reaction, user) => {
    if(reaction.message.partial) await reaction.message.fetch();
    if(reaction.partial) await reaction.fetch();
    if(user.bot) return;
    if(!reaction.message.guild) return;

    let response = await aws_reactionroles.getItem(reaction.message.guild.id.toString());
    if(reaction.message.id === response.Item.reactionrole_post_id)
    {
        console.log("A");
        let roleString = response.Item.roles;

        let args = roleString.split(/, +/);
        let roleArgs = [];
        let roleList = []; 
    
        for(i = 0; i < args.length; i++)
        {
            roleArgs.push(args[i].split(':'));
            roleList.push(reaction.message.guild.roles.cache.find(role => role.name === roleArgs[i][0]));
        }
    
        for(i = 0; i < roleArgs.length; i++)
        {
            if(reaction.emoji.name === roleArgs[i][1])
                await reaction.message.guild.members.cache.get(user.id).roles.add(roleList[i]).catch(console.error);
        }
    }
});

//read active reactions, and gives out roles
client.on('messageReactionRemove', async(reaction, user) => {
    if(reaction.message.partial) await reaction.message.fetch();
    if(reaction.partial) await reaction.fetch();
    if(user.bot) return;
    if(!reaction.message.guild) return;

    let response = await aws_reactionroles.getItem(reaction.message.guild.id.toString());
    if(reaction.message.id === response.Item.reactionrole_post_id)
    {
        let roleString = response.Item.roles;

        let args = roleString.split(/, +/);
        let roleArgs = [];
        let roleList = []; 
    
        for(i = 0; i < args.length; i++)
        {
            roleArgs.push(args[i].split(':'));
            roleList.push(reaction.message.guild.roles.cache.find(role => role.name === roleArgs[i][0]));
        }
    
        for(i = 0; i < roleArgs.length; i++)
        {
            if(reaction.emoji.name === roleArgs[i][1])
                await reaction.message.guild.members.cache.get(user.id).roles.remove(roleList[i]).catch(console.error);
        }
    }
});

let deploy = 'HEROKU';

if(deploy === 'HEROKU') client.login(process.env.BOT_TOKEN);  //HEROKU PUBLIC BUILD 
if(deploy === 'PUBLIC'){
    let tokens = require('./tokens.js');
    client.login(tokens.BOT_TOKEN);       //LOCAL PUBLIC BUILD
} 
if(deploy === 'LOCAL') {
    let tokens = require('./tokens.js');
    client.login(tokens.DEV_TOKEN);        //LOCAL DEV BUILD
}