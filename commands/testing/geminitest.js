const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerID, geminiApiKey } = require('../../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("gemini-test")
    .setDescription('Test Gemini API and list available models'),

    async execute(interaction) {
        const { member } = interaction;
        if(member.id !== ownerID) return interaction.reply({ content: `You can't use this command.`, ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        try {
            // List available models
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || `API Error: ${response.status}`);
            }

            const models = data.models || [];
            const generateModels = models.filter(m => 
                m.supportedGenerationMethods?.includes('generateContent')
            );

            let modelList = generateModels.map(m => `• ${m.name}`).join('\n') || 'No models found';

            const e = new EmbedBuilder()
                .setTitle('✅ Gemini API Working!')
                .setDescription(`Found ${generateModels.length} models that support generateContent`)
                .addFields({
                    name: 'Available Models',
                    value: modelList.length > 1024 ? modelList.substring(0, 1021) + '...' : modelList,
                    inline: false
                })
                .setColor('Green')
                .setTimestamp();

            await interaction.editReply({ embeds: [e] });

        } catch (error) {
            console.error('Gemini API Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ API Error')
                .setDescription(`Error: ${error.message}`)
                .setColor('Red')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
}