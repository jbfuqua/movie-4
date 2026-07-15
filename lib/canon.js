// THE CANON — the taste anchor.
//
// This is the thing seven rounds of prompt-tuning never had: a concrete,
// shared definition of "good". These are REAL films, with their real taglines,
// chosen to mark the bar the studio is aiming at — monster/creature/slasher/
// body-horror pulp that is lean, specific, and sells a ticket. The pitch aims at
// this level; the critic judges against it.
//
// OWNER: this is yours to edit. Swap in the films YOU would kill to have made,
// cut the ones that are not your taste, add decades that are missing. The whole
// system points at whatever is in this list — so this list, not my prose, is now
// where the taste lives. Taglines here are the real ones (spot-checked); the
// loglines are short paraphrases of the real premise.
export const CANON = [
    { title: 'Alien', year: 1979, tagline: 'In space no one can hear you scream.', logline: 'A towing crew answers a distress call and carries aboard a parasite that gestates inside a man and grows into a perfect predator, hunting them through the ship one by one.' },
    { title: 'The Thing', year: 1982, tagline: 'Man is the warmest place to hide.', logline: 'An Antarctic research team is infiltrated by a shapeshifter that perfectly copies the men it kills, until no one can prove who is still human.' },
    { title: 'The Fly', year: 1986, tagline: 'Be afraid. Be very afraid.', logline: 'A scientist tests his teleporter on himself with a housefly in the pod, and begins fusing, slowly and horribly, into something no longer a man.' },
    { title: 'The Blob', year: 1958, tagline: 'Terror has no shape.', logline: 'A meteorite splits open and lets out a creeping mass that swallows everyone it touches and grows larger with each one.' },
    { title: 'Dawn of the Dead', year: 1978, tagline: 'When there is no more room in Hell, the dead will walk the earth.', logline: 'As the dead rise and feed on the living, four survivors barricade themselves inside a shopping mall.' },
    { title: 'Poltergeist', year: 1982, tagline: 'They\'re here.', logline: 'A suburban family\'s small daughter is pulled into the walls of their new house by the things that came through the television.' },
    { title: 'A Nightmare on Elm Street', year: 1984, tagline: 'Whatever you do, don\'t fall asleep.', logline: 'A burned killer stalks teenagers in their dreams, and to die in the dream is to die for real.' },
    { title: 'Halloween', year: 1978, tagline: 'The night HE came home.', logline: 'An escaped patient returns to his hometown to stalk the babysitters of one quiet street on Halloween night.' },
    { title: 'The Texas Chain Saw Massacre', year: 1974, tagline: 'Who will survive and what will be left of them?', logline: 'Five friends on a back-road trip wander into the farmhouse of a family of cannibals and their chainsaw-wielding son.' },
    { title: 'Gremlins', year: 1984, tagline: 'Don\'t feed him after midnight.', logline: 'A boy\'s odd new pet spawns a horde of vicious little monsters that tear through a small town on Christmas Eve.' }
];

/** The canon as a prompt block — the bar, shown. */
export function canonBlock() {
    return CANON.map((f) => `  ${f.title.toUpperCase()} — "${f.tagline}"  (${f.logline})`).join('\n');
}
