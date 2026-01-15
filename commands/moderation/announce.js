const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription('Send an announcement to a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('Channel to send announcement to')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('message')
        .setDescription('Announcement message')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('title')
        .setDescription('Announcement title')
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName('color')
        .setDescription('Embed color (e.g., Red, Blue, Green, #FF0000)')
        .setRequired(false)
    )
    .addBooleanOption(option => option
        .setName('ping-everyone')
        .setDescription('Ping @everyone (default: false)')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const { guild, user, options } = interaction;

        const channel = options.getChannel('channel');
        const message = options.getString('message');
        const title = options.getString('title');
        const color = options.getString('color') || 'Blue';
        const pingEveryone = options.getBoolean('ping-everyone') || false;

        try {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setDescription(message)
                .setTimestamp()
                .setFooter({ text: `Posted by ${user.tag}`, iconURL: user.displayAvatarURL() });

            if (title) {
                embed.setTitle(title);
            }

            const messageContent = pingEveryone ? '@everyone' : '';

            await channel.send({ 
                content: messageContent,
                embeds: [embed] 
            });

            const confirmEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Announcement Posted')
                .addFields(
                    {
                        name: 'Channel',
                        value: `${channel}`,
                        inline: true
                    },
                    {
                        name: 'Pinged Everyone',
                        value: pingEveryone ? 'Yes' : 'No',
                        inline: true
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [confirmEmbed] });

        } catch (error) {
            console.error('Announce command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to send announcement: ${error.message}` 
            });
        }
    }
}