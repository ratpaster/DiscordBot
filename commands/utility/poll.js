const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription('Create a poll with up to 10 options')
    .addStringOption(option => option
        .setName('question')
        .setDescription('Poll question/title')
        .setMaxLength(256)
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('options')
        .setDescription('Poll options separated by commas (e.g., Yes, No, Maybe)')
        .setRequired(true)
    )
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('Channel to post poll in (defaults to current channel)')
        .setRequired(false)
    )
    .addIntegerOption(option => option
        .setName('duration')
        .setDescription('Poll duration in minutes (optional)')
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(false)
    )
    .addBooleanOption(option => option
        .setName('allow-multiple')
        .setDescription('Allow users to select multiple options (default: false)')
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const { user, guild, options } = interaction;

        const question = options.getString('question');
        const optionsStr = options.getString('options');
        const channel = options.getChannel('channel') || interaction.channel;
        const duration = options.getInteger('duration');
        const allowMultiple = options.getBoolean('allow-multiple') || false;

        const pollOptions = optionsStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (pollOptions.length < 2) {
            return interaction.editReply({ 
                content: '❌ You need at least 2 options for a poll. Separate options with commas.' 
            });
        }

        if (pollOptions.length > 10) {
            return interaction.editReply({ 
                content: '❌ Maximum 10 options allowed. You provided ' + pollOptions.length 
            });
        }

        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

        try {
            const embed = new EmbedBuilder()
                .setTitle(`📊 ${question}`)
                .setColor('Blue')
                .setAuthor({ name: `Poll by ${user.tag}`, iconURL: user.displayAvatarURL() })
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            let description = '';
            for (let i = 0; i < pollOptions.length; i++) {
                description += `${emojis[i]} ${pollOptions[i]}\n`;
            }

            if (allowMultiple) {
                description += '\n*You can vote for multiple options*';
            }

            if (duration) {
                const endTime = Math.floor((Date.now() + duration * 60 * 1000) / 1000);
                description += `\n\n⏰ Ends <t:${endTime}:R>`;
            }

            embed.setDescription(description);

            const pollMessage = await channel.send({ embeds: [embed] });

            for (let i = 0; i < pollOptions.length; i++) {
                await pollMessage.react(emojis[i]);
            }

            const confirmEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Poll Created')
                .addFields(
                    {
                        name: 'Channel',
                        value: `${channel}`,
                        inline: true
                    },
                    {
                        name: 'Options',
                        value: `${pollOptions.length}`,
                        inline: true
                    }
                )
                .setTimestamp();

            if (duration) {
                confirmEmbed.addFields({
                    name: 'Duration',
                    value: `${duration} minute${duration > 1 ? 's' : ''}`,
                    inline: true
                });

                setTimeout(async () => {
                    try {
                        const msg = await channel.messages.fetch(pollMessage.id);
                        const reactions = msg.reactions.cache;
                        
                        let results = '';
                        let maxVotes = 0;
                        let winners = [];

                        for (let i = 0; i < pollOptions.length; i++) {
                            const reaction = reactions.get(emojis[i]);
                            const count = reaction ? reaction.count - 1 : 0;
                            results += `${emojis[i]} ${pollOptions[i]}: **${count} vote${count !== 1 ? 's' : ''}**\n`;
                            
                            if (count > maxVotes) {
                                maxVotes = count;
                                winners = [pollOptions[i]];
                            } else if (count === maxVotes && count > 0) {
                                winners.push(pollOptions[i]);
                            }
                        }

                        const resultEmbed = new EmbedBuilder()
                            .setTitle(`📊 ${question}`)
                            .setDescription(results)
                            .setColor('Gold')
                            .setAuthor({ name: `Poll by ${user.tag}`, iconURL: user.displayAvatarURL() })
                            .setTimestamp()
                            .setFooter({ text: '🔒 Poll Closed' });

                        if (winners.length > 0) {
                            resultEmbed.addFields({
                                name: '🏆 Winner' + (winners.length > 1 ? 's' : ''),
                                value: winners.join(', ') + ` (${maxVotes} vote${maxVotes !== 1 ? 's' : ''})`,
                                inline: false
                            });
                        }

                        await msg.edit({ embeds: [resultEmbed] });
                    } catch (error) {
                        console.error('Error closing poll:', error);
                    }
                }, duration * 60 * 1000);
            }

            await interaction.editReply({ embeds: [confirmEmbed] });

        } catch (error) {
            console.error('Poll command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to create poll: ${error.message}` 
            });
        }
    }
}