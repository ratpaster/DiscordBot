const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription('Bulk delete messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option => option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName('contains')
        .setDescription('Only delete messages containing this text')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const { channel, options } = interaction;

        const amount = options.getInteger('amount');
        const targetUser = options.getUser('user');
        const containsText = options.getString('contains');

        try {
            let messages = await channel.messages.fetch({ limit: amount });

            if (targetUser) {
                messages = messages.filter(msg => msg.author.id === targetUser.id);
            }

            if (containsText) {
                messages = messages.filter(msg => 
                    msg.content.toLowerCase().includes(containsText.toLowerCase())
                );
            }

            const deletedMessages = await channel.bulkDelete(messages, true);

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🗑️ Messages Purged')
                .addFields(
                    {
                        name: 'Messages Deleted',
                        value: `\`${deletedMessages.size}\``,
                        inline: true
                    },
                    {
                        name: 'Channel',
                        value: `${channel}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Purged by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            if (targetUser) {
                embed.addFields({
                    name: 'User Filter',
                    value: `${targetUser.tag}`,
                    inline: true
                });
            }

            if (containsText) {
                embed.addFields({
                    name: 'Text Filter',
                    value: `\`${containsText}\``,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);

        } catch (error) {
            console.error('Purge command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to purge messages: ${error.message}\n\nNote: Messages older than 14 days cannot be bulk deleted.` 
            });
        }
    }
}