const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription('Set channel slowmode delay')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addIntegerOption(option => option
        .setName('duration')
        .setDescription('Slowmode duration in seconds (0 to disable, max 21600)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('Channel to set slowmode in (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for setting slowmode')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, user, options } = interaction;

        const duration = options.getInteger('duration');
        const channel = options.getChannel('channel') || interaction.channel;
        const reason = options.getString('reason') || 'No reason provided';

        try {
            await channel.setRateLimitPerUser(duration, `${user.tag}: ${reason}`);

            const formatDuration = (seconds) => {
                if (seconds === 0) return 'Disabled';
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;

                let result = '';
                if (hours > 0) result += `${hours}h `;
                if (minutes > 0) result += `${minutes}m `;
                if (secs > 0) result += `${secs}s`;
                
                return result.trim();
            };

            const embed = new EmbedBuilder()
                .setColor(duration === 0 ? 'Green' : 'Orange')
                .setTitle(duration === 0 ? '⏱️ Slowmode Disabled' : '⏱️ Slowmode Enabled')
                .setDescription(`Slowmode has been ${duration === 0 ? 'disabled' : 'set'} in ${channel}`)
                .addFields(
                    {
                        name: 'Duration',
                        value: `\`${formatDuration(duration)}\``,
                        inline: true
                    },
                    {
                        name: 'Set By',
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
            console.error('Slowmode command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to set slowmode: ${error.message}` 
            });
        }
    }
}