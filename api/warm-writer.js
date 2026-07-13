// Pre-compiles the concept schema for the selected writer, so the first real
// Generate doesn't eat a grammar compile inside its 52s budget and 504.
//
// The client fires this in the background when OpenAI is selected. It is
// advisory: if it fails, nothing breaks — the next generate just pays full
// price. So it never returns an error status.

import { handler } from '../lib/http.js';
import { warmSchema } from '../lib/text/index.js';
import { CONCEPT_SCHEMA } from '../lib/concept.js';

export default handler('POST', async (body) => {
    const { textProvider } = body;

    try {
        return await warmSchema(textProvider, CONCEPT_SCHEMA);
    } catch (error) {
        // A warm failure is not a user-facing failure.
        return { warmed: false, error: error.message };
    }
});
