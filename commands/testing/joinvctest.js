const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerID } = require('../../config/config.json');
const joinVoiceChannel = require('@discordjs/voice').joinVoiceChannel;

module.exports = {
    data: new SlashCommandBuilder()
    .setName("vctest")
    .setDescription('join vc test command'),

    async execute(interaction) {
        const { member } = interaction;
        if(member.id !== ownerID) return interaction.reply(`You can't use this command.`);

        const channel = member.voice.channel;

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        connection.on('stateChange', (oldState, newState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });

        setTimeout(() => {
            console.log("Disconnecting...");
            connection.destroy();
        }, 30000);

        const e = new EmbedBuilder()
            .setTitle(`${interaction.user.username}`)
            .setDescription(`Command Run Successfully! Joined your voice channel for 30 seconds.`)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp()
            .setColor(`Random`)
            ;

        await interaction.reply({
            embeds: [e],
            //ephemeral: true //hidden or not
        });
    }
}