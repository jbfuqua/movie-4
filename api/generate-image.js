import { handler } from '../lib/http.js';
import { generateImage } from '../lib/image/index.js';
import { imagePrompt } from '../lib/concept.js';

export default handler('POST', async (body) => {
    const { concept, provider, quality, creditsMode = 'model', referenceImages = [] } = body;

    if (!concept?.title || !concept?.art_direction || !concept?.title_treatment) {
        const error = new Error('A full concept (title, art_direction, title_treatment) is required');
        error.status = 400;
        throw error;
    }

    // Rebuild the prompt server-side rather than trusting one from the client —
    // it's deterministic from the concept anyway.
    const prompt = imagePrompt(concept, { creditsMode });

    const image = await generateImage({ provider, prompt, referenceImages, quality });

    return {
        imageUrl: `data:${image.mimeType};base64,${image.base64}`,
        provider: image.provider,
        model: image.model,
        size: image.size,
        quality: image.quality ?? null,
        creditsMode,
        prompt
    };
});
