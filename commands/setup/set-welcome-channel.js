const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { ownerID } = require('../../config/config.json');
const Guild = require('../../models/guild')

module.exports = {
    data: new SlashCommandBuilder()
    .setName("set-welcome-channel")
    .setDescription('Sets welcome channel ID."')
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('Channel to send the welcome message in. (NoArgs disables feature)')
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const { options, member } = interaction;
        if(interaction.guild.ownerId !== member.id && member.id !== ownerID) return interaction.editReply(`You can't use this command.`);

        const channel = await options.getChannel('channel');
        const [ guild, created ] = await Guild.findOrCreate({ where: { id: interaction.guild.id}});

        if(!channel) await guild.update({ welcomeChannelId: null });
        else await guild.update({ welcomeChannelId: channel.id });

        if(!channel) interaction.editReply(`No welcome message`);
        else interaction.editReply(`Set the channel for welcome messages to ${channel}`);
    }
}