const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription('Unlock a channel to allow members to send messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('Channel to unlock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for unlocking the channel')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, options, user } = interaction;

        const channel = options.getChannel('channel') || interaction.channel;
        const reason = options.getString('reason') || 'No reason provided';

        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: null,
                AddReactions: null
            }, { reason: `Unlocked by ${user.tag}: ${reason}` });

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🔓 Channel Unlocked')
                .setDescription(`${channel} has been unlocked.`)
                .addFields(
                    {
                        name: 'Unlocked By',
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
            console.error('Unlock command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to unlock channel: ${error.message}` 
            });
        }
    }
}