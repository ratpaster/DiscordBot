const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription('Lock all channels in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for server lockdown')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, user } = interaction;

        const reason = interaction.options.getString('reason') || 'Server lockdown';

        try {
            const channels = guild.channels.cache.filter(channel => 
                channel.type === ChannelType.GuildText || 
                channel.type === ChannelType.GuildVoice || 
                channel.type === ChannelType.GuildAnnouncement
            );

            let locked = 0;
            let failed = 0;

            for (const [id, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false,
                        AddReactions: false
                    }, { reason: `Lockdown by ${user.tag}: ${reason}` });
                    locked++;
                } catch (err) {
                    console.error(`Failed to lock ${channel.name}:`, err);
                    failed++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔒 Server Lockdown')
                .setDescription('The server has been locked down.')
                .addFields(
                    {
                        name: 'Channels Locked',
                        value: `\`${locked}\``,
                        inline: true
                    },
                    {
                        name: 'Failed',
                        value: `\`${failed}\``,
                        inline: true
                    },
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
            console.error('Lockdown command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to lockdown server: ${error.message}` 
            });
        }
    }
}