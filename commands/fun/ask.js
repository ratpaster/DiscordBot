const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerID, geminiApiKey } = require('../../config/config.json');

// Store conversation history per user
const conversationHistory = new Map();

// Cooldown system (in milliseconds)
const cooldowns = new Map();
const COOLDOWN_TIME = 5000; // 5 seconds between requests per user

let prompt1 = 'You are a helpful AI assistant for a gaming Discord community called Moribund. Be friendly, concise, and helpful. You may be asked some repeated questions that I can give you my knowledge on. If someone asks about anyhting regarding the moribund minecraft server or anyhting regarding a minecraft server in general you are to direct them to a staff team member. The staff members are as follows: Race (owner), Rochade (owner), Shwong(admin), Kam(admin), Gumby(admin). Keep responses under 1000 characters.'

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription('Ask the Moribund any question: powered by Gemini')
    .addStringOption(option => option
        .setName('question')
        .setDescription('Your question for the AI')
        .setRequired(true)
    )
    .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Make the response visible only to you (default: false)')
        .setRequired(false)
    )
    .addBooleanOption(option => option
        .setName('reset')
        .setDescription('Reset conversation history (default: false)')
        .setRequired(false)
    ),

    async execute(interaction) {
        const { member, options, user } = interaction;
        
        // Remove this line if you want everyone to use it
        // if(member.id !== ownerID) return interaction.reply({ content: `You can't use this command.`, ephemeral: true });

        // Check cooldown
        if (cooldowns.has(user.id)) {
            const expirationTime = cooldowns.get(user.id);
            const timeLeft = (expirationTime - Date.now()) / 1000;
            
            if (timeLeft > 0) {
                return interaction.reply({
                    content: `⏱️ Please wait ${timeLeft.toFixed(1)} more seconds before using this command again.`,
                    ephemeral: true
                });
            }
        }

        const question = options.getString('question');
        const isEphemeral = options.getBoolean('ephemeral') ?? false;
        const shouldReset = options.getBoolean('reset') ?? false;

        // Reset conversation if requested
        if (shouldReset) {
            conversationHistory.delete(user.id);
            return interaction.reply({ 
                content: '🔄 Conversation history reset!', 
                ephemeral: true 
            });
        }

        // Defer reply since AI might take a moment
        await interaction.deferReply({ ephemeral: isEphemeral });

        try {
            // Get or create user's conversation history
            if (!conversationHistory.has(user.id)) {
                conversationHistory.set(user.id, [
                    {
                        role: "user",
                        parts: [{text: prompt1}]
                    },
                    {
                        role: "model",
                        parts: [{text: "Understood! I'll be friendly, concise, and helpful for the Moribund gaming community. What can I help you with?"}]
                    }
                ]);
            }

            const history = conversationHistory.get(user.id);
            
            // Add user's question to history
            history.push({
                role: "user",
                parts: [{text: question}]
            });

            // Keep only system message + last 10 exchanges
            const messagesToSend = history.length > 21 
                ? [history[0], history[1], ...history.slice(-20)] 
                : history;

            // Call Gemini API with gemini-2.5-flash
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: messagesToSend,
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 500,
                        }
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                // Check if it's a rate limit error
                if (data.error?.message?.includes('quota') || data.error?.message?.includes('rate limit')) {
                    throw new Error('Rate limit reached. Please wait a moment and try again.');
                }
                throw new Error(data.error?.message || `API Error: ${response.status}`);
            }

            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

            // Set cooldown for this user
            cooldowns.set(user.id, Date.now() + COOLDOWN_TIME);
            setTimeout(() => cooldowns.delete(user.id), COOLDOWN_TIME);

            // Add AI response to history
            history.push({
                role: "model",
                parts: [{text: aiResponse}]
            });

            // Keep history manageable (system + last 20 messages)
            if (history.length > 22) {
                conversationHistory.set(user.id, [history[0], history[1], ...history.slice(-20)]);
            }

            // Create embed with response
            const e = new EmbedBuilder()
                .setTitle('🤖 AI Response')
                .setDescription(aiResponse.length > 4096 ? aiResponse.substring(0, 4093) + '...' : aiResponse)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp()
                .setColor('Random')
                .addFields(
                    {
                        name: '❓ Question',
                        value: question.length > 1024 ? question.substring(0, 1021) + '...' : question,
                        inline: false
                    }
                )
                .setFooter({ text: `Powered by Gemini 2.5 Flash | Messages: ${(history.length - 2) / 2} | Cooldown: 5s` });

            await interaction.editReply({
                embeds: [e]
            });

        } catch (error) {
            console.error('Gemini API Error:', error);
            
            let errorMessage = 'An error occurred while processing your request.';
            
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
                errorMessage = '⏱️ Rate limit reached. Please wait about 15-60 seconds and try again.\n\nTip: The free tier allows 15 requests per minute.';
            } else if (error.message.includes('API_KEY_INVALID')) {
                errorMessage = 'Invalid API key. Get a new one from https://aistudio.google.com/app/apikey';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription(errorMessage)
                .setColor('Red')
                .setTimestamp();

            await interaction.editReply({
                embeds: [errorEmbed]
            });
        }
    }
}