import 'dotenv/config';

async function listModels() {
    try {
        console.log('Fetching available Gemini models...\n');

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('Available models:');
            console.log('='.repeat(70));

            data.models.forEach(model => {
                console.log(`\nModel: ${model.name}`);
                console.log(`Display Name: ${model.displayName || 'N/A'}`);
                console.log(`Description: ${model.description || 'N/A'}`);
                console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
                console.log(`Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
                console.log(`Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
                console.log('-'.repeat(70));
            });

            // Filter models that support generateContent
            console.log('\n\nModels that support generateContent:');
            console.log('='.repeat(70));
            const generateModels = data.models.filter(m =>
                m.supportedGenerationMethods?.includes('generateContent')
            );
            generateModels.forEach(m => console.log(`✓ ${m.name}`));

        } else {
            console.error('No models found or error:', data);
        }

    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
