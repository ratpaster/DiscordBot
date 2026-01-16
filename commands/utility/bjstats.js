const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const BlackjackStats = require('../../models/blackjackStats');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("bjstats")
    .setDescription('View blackjack statistics')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User to view stats for')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply();
        const { guild, options } = interaction;

        const target = options.getUser('user') || interaction.user;

        try {
            const stats = await BlackjackStats.findOne({
                where: { userId: target.id, guildId: guild.id }
            });

            if (!stats || stats.gamesPlayed === 0) {
                return interaction.editReply({ 
                    content: `${target.tag} hasn't played blackjack yet!` 
                });
            }

            const winRate = ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1);
            const netProfit = stats.totalWinnings - stats.totalLosses;
            const profitColor = netProfit >= 0 ? 'Green' : 'Red';

            const embed = new EmbedBuilder()
                .setColor(profitColor)
                .setTitle('🃏 Blackjack Statistics')
                .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                .addFields(
                    {
                        name: 'Games Played',
                        value: `${stats.gamesPlayed}`,
                        inline: true
                    },
                    {
                        name: 'Win Rate',
                        value: `${winRate}%`,
                        inline: true
                    },
                    {
                        name: 'Blackjacks',
                        value: `${stats.blackjacks}`,
                        inline: true
                    },
                    {
                        name: 'Wins',
                        value: `${stats.gamesWon}`,
                        inline: true
                    },
                    {
                        name: 'Losses',
                        value: `${stats.gamesLost}`,
                        inline: true
                    },
                    {
                        name: 'Pushes',
                        value: `${stats.gamesPushed}`,
                        inline: true
                    },
                    {
                        name: 'Total Winnings',
                        value: `${stats.totalWinnings} XP`,
                        inline: true
                    },
                    {
                        name: 'Total Losses',
                        value: `${stats.totalLosses} XP`,
                        inline: true
                    },
                    {
                        name: 'Net Profit',
                        value: `${netProfit >= 0 ? '+' : ''}${netProfit} XP`,
                        inline: true
                    },
                    {
                        name: 'Biggest Win',
                        value: `${stats.biggestWin} XP`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('BJ Stats command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to fetch stats: ${error.message}` 
            });
        }
    }
}