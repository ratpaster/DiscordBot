const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("unlockdown")
    .setDescription('Unlock all channels in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for ending server lockdown')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, user } = interaction;

        const reason = interaction.options.getString('reason') || 'Lockdown ended';

        try {
            const channels = guild.channels.cache.filter(channel => 
                channel.type === ChannelType.GuildText || 
                channel.type === ChannelType.GuildVoice || 
                channel.type === ChannelType.GuildAnnouncement
            );

            let unlocked = 0;
            let failed = 0;

            for (const [id, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: null,
                        AddReactions: null
                    }, { reason: `Unlockdown by ${user.tag}: ${reason}` });
                    unlocked++;
                } catch (err) {
                    console.error(`Failed to unlock ${channel.name}:`, err);
                    failed++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🔓 Server Unlocked')
                .setDescription('The server lockdown has been lifted.')
                .addFields(
                    {
                        name: 'Channels Unlocked',
                        value: `\`${unlocked}\``,
                        inline: true
                    },
                    {
                        name: 'Failed',
                        value: `\`${failed}\``,
                        inline: true
                    },
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
            console.error('Unlockdown command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to unlock server: ${error.message}` 
            });
        }
    }
}