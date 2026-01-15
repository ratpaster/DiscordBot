const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription('Ask the 8ball a question')
    .addStringOption(option => option
        .setName('question')
        .setDescription('Yes or No questions only!')
        .setRequired(true)
    )
    .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Make the response visible only to you (default: false)')
        .setRequired(false)
    ),

    async execute(interaction) {
        const { options } = interaction;

        const question = options.getString('question');
        const isEphemeral = options.getBoolean('ephemeral') ?? false;

        const responses = [
            'Fuh nawh twin',
            'Hell yeah',
            'Idk gng maybe',
            'Without a doubt',
            'Absolutely not',
            'Ask again later',
            'Better not tell you now',
            'Cannot predict now',
            'Concentrate and ask again',
            'Don\'t count on it',
            'It is certain',
            'It is decidedly so',
            'Most likely',
            'My reply is no',
            'My sources say no',
            'Outlook not so good',
            'Outlook good',
            'Reply hazy, try again',
            'Signs point to yes',
            'Very doubtful',
            'Yes definitely',
            'You may rely on it',
            'As I see it, yes',
            'Nah bruh',
            'For sure for sure',
            'That\'s a hard no from me',
            'Looking kinda sus ngl',
            'The stars say yes',
            'The stars say no',
            'Touch grass and ask again',
            'Bro what? No.',
            'Yeah why not',
            'Absolutely',
            'Not in a million years',
            'Maybe touch some grass first',
            'I\'m not even gonna answer that',
            'Big if true',
            'Cap',
            'No cap, yes',
            'Skill issue tbh'
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        await interaction.deferReply({ ephemeral: isEphemeral });

        try {
            const e = new EmbedBuilder()
                .setTitle('🎱 Magic 8 Ball')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setColor('Random')
                .addFields(
                    {
                        name: '❓ Question',
                        value: question.length > 1024 ? question.substring(0, 1021) + '...' : question,
                        inline: false
                    },
                    {
                        name: '🎱 The 8 Ball says:',
                        value: response,
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.editReply({
                embeds: [e]
            });

        } catch (error) {
            console.error('Error:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription(`Error: ${error.message}`)
                .setColor('Red')
                .setTimestamp();

            await interaction.editReply({
                embeds: [errorEmbed]
            });
        }
    }
}