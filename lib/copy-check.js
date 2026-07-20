// A light, advisory nudge on tagline punctuation. Nothing here rejects anything.
//
// This file used to ban a title SHAPE — "THE + [participle/mood] + [noun]" — to
// kill "The Listening Room". But that same regex also rejects "The Creeping Mass",
// "The Needleman", "The Whispering Hour" — the exact kind of good, classic genre
// title the old app produced with no rules at all. The ban was throwing out the
// baby. It is gone. Titles are the writer's call now, judged against the real
// canon in the brief, not against a regex.
//
// The old two-sentence tagline check went the same way: it flagged "IT THINKS. IT
// KNOWS. IT GROWS." as "drifting mood", when that is a genuinely good tagline.

export function checkTagline(tagline) {
    const t = String(tagline || '').trim();
    if (/[—–;]/.test(t)) {
        return `The tagline "${t}" uses an em-dash or semicolon. A full stop or comma reads stronger.`;
    }
    return null;
}

/** Returns an array of advisory notes, empty when the copy is fine. */
export function checkCopy(concept) {
    return [checkTagline(concept?.tagline)].filter(Boolean);
}
