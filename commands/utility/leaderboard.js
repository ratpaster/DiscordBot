const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../../models/level');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription('View the server leaderboard')
    .addStringOption(option => option
        .setName('sort')
        .setDescription('Sort by XP, Level, or Messages')
        .addChoices(
            { name: 'XP', value: 'xp' },
            { name: 'Level', value: 'level' },
            { name: 'Messages', value: 'messageCount' }
        )
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply();
        const { guild, options } = interaction;

        const sortBy = options.getString('sort') || 'xp';

        try {
            const topUsers = await Level.findAll({
                where: { guildId: guild.id },
                order: [[sortBy, 'DESC']],
                limit: 10
            });

            if (topUsers.length === 0) {
                return interaction.editReply({ 
                    content: 'No one has earned any XP yet!' 
                });
            }

            let description = '';
            for (let i = 0; i < topUsers.length; i++) {
                const user = await interaction.client.users.fetch(topUsers[i].userId).catch(() => null);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                
                const username = user ? user.tag : 'Unknown User';
                description += `${medal} **${username}**\n`;
                description += `└ Level ${topUsers[i].level} • ${topUsers[i].xp} XP • ${topUsers[i].messageCount} messages\n\n`;
            }

            const sortLabels = {
                'xp': 'XP',
                'level': 'Level',
                'messageCount': 'Messages'
            };

            const embed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle(`🏆 Server Leaderboard`)
                .setDescription(description)
                .setTimestamp()
                .setFooter({ text: `Sorted by ${sortLabels[sortBy]} • ${guild.name}`, iconURL: guild.iconURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Leaderboard command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to fetch leaderboard: ${error.message}` 
            });
        }
    }
}