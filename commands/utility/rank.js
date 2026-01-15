const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../../models/level');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription('Check your or another user\'s rank')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User to check rank for')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply();
        const { guild, options } = interaction;

        const target = options.getUser('user') || interaction.user;

        try {
            const userLevel = await Level.findOne({
                where: {
                    userId: target.id,
                    guildId: guild.id
                }
            });

            if (!userLevel) {
                return interaction.editReply({ 
                    content: `${target.tag} hasn't sent any messages yet!` 
                });
            }

            const allUsers = await Level.findAll({
                where: { guildId: guild.id },
                order: [['xp', 'DESC']]
            });

            const rank = allUsers.findIndex(u => u.userId === target.id) + 1;
            const xpNeeded = (userLevel.level + 1) * 100;
            const progress = ((userLevel.xp % 100) / 100) * 100;

            const progressBar = createProgressBar(progress);

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                .setTitle('📊 Rank Card')
                .addFields(
                    {
                        name: 'Rank',
                        value: `#${rank}`,
                        inline: true
                    },
                    {
                        name: 'Level',
                        value: `${userLevel.level}`,
                        inline: true
                    },
                    {
                        name: 'Messages',
                        value: `${userLevel.messageCount}`,
                        inline: true
                    },
                    {
                        name: 'XP Progress',
                        value: `${progressBar}\n${userLevel.xp % 100}/${xpNeeded} XP`,
                        inline: false
                    }
                )
                .setThumbnail(target.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Rank command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to fetch rank: ${error.message}` 
            });
        }
    }
}

function createProgressBar(percentage) {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}