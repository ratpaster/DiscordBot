const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription('Lock a channel to prevent members from sending messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('Channel to lock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for locking the channel')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, options, user } = interaction;

        const channel = options.getChannel('channel') || interaction.channel;
        const reason = options.getString('reason') || 'No reason provided';

        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: false,
                AddReactions: false
            }, { reason: `Locked by ${user.tag}: ${reason}` });

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔒 Channel Locked')
                .setDescription(`${channel} has been locked.`)
                .addFields(
                    {
                        name: 'Locked By',
                        value: `${user.tag}`,
                        inline: true
                    },
                    {
                        name: 'Reason',
                        value: `\`${reason}\``,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Lock command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to lock channel: ${error.message}` 
            });
        }
    }
}