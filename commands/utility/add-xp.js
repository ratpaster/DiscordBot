const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerID } = require('../../config/config.json');
const Level = require('../../models/level');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("add-xp")
    .setDescription('Add XP to a user (Owner only)')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User to add XP to')
        .setRequired(true)
    )
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Amount of XP to add')
        .setRequired(true)
        .setMinValue(1)
    ),

    async execute(interaction) {
        if (interaction.user.id !== ownerID) {
            return interaction.reply({ content: '❌ Owner only command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: false });
        const { guild, options } = interaction;

        const target = options.getUser('user');
        const amount = options.getInteger('amount');

        try {
            const [userLevel] = await Level.findOrCreate({
                where: { userId: target.id, guildId: guild.id },
                defaults: {
                    xp: 0,
                    level: 0,
                    messageCount: 0,
                    lastMessageTimestamp: 0
                }
            });

            const oldXP = userLevel.xp;
            const oldLevel = userLevel.level;

            userLevel.xp += amount;
            userLevel.level = Math.floor(userLevel.xp / 100);
            await userLevel.save();

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('💰 XP Added')
                .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                .addFields(
                    {
                        name: 'Amount Added',
                        value: `+${amount} XP`,
                        inline: true
                    },
                    {
                        name: 'Old Balance',
                        value: `${oldXP} XP (Level ${oldLevel})`,
                        inline: true
                    },
                    {
                        name: 'New Balance',
                        value: `${userLevel.xp} XP (Level ${userLevel.level})`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Added by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Add XP command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to add XP: ${error.message}` 
            });
        }
    }
}