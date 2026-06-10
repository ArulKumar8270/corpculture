import { normalizeSendDetailsTo } from './normalizeSendDetailsTo.js';

function contactPersonByEmail(contactPersons, email) {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return null;
    return (contactPersons || []).find(
        (p) => String(p?.email || '').trim().toLowerCase() === e
    );
}

function contactPersonToSendToEntry(person, fallbackEmail = '') {
    if (person) {
        return {
            name: String(person.name || '').trim(),
            email: String(person.email || '').trim(),
            mobile: String(person.mobile || '').trim(),
            designation: String(person.designation || '').trim(),
            dob: person.dob != null ? String(person.dob).trim() : '',
        };
    }
    const email = String(fallbackEmail || '').trim();
    return {
        name: email,
        email,
        mobile: '',
        designation: '',
        dob: '',
    };
}

function emailFromSendToItem(item) {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        return String(item.email || '').trim();
    }
    const s = String(item ?? '').trim();
    if (!s) return '';
    if (s.includes('@') && !/Email:/i.test(s)) {
        return s;
    }
    const parsed = normalizeSendDetailsTo([s])[0];
    return parsed?.email || '';
}

/**
 * Expand sendTo (stored as emails or legacy strings) into full contact objects
 * using the company's contactPersons list.
 */
export function enrichSendTo(sendTo, contactPersons = []) {
    const persons = Array.isArray(contactPersons) ? contactPersons : [];
    const raw = Array.isArray(sendTo) ? sendTo : sendTo != null && sendTo !== '' ? [sendTo] : [];
    const results = [];
    const seen = new Set();

    for (const item of raw) {
        let entry;

        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const email = String(item.email || '').trim();
            const person = contactPersonByEmail(persons, email);
            entry = person
                ? contactPersonToSendToEntry(person)
                : {
                      name: String(item.name || email).trim(),
                      email,
                      mobile: String(item.mobile || '').trim(),
                      designation: String(item.designation || '').trim(),
                      dob: item.dob != null ? String(item.dob).trim() : '',
                  };
        } else {
            const s = String(item ?? '').trim();
            if (!s) continue;
            const email = emailFromSendToItem(s);
            const person = contactPersonByEmail(persons, email || s);
            entry = contactPersonToSendToEntry(person, email || s);
        }

        const key = (entry.email || entry.name).toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        results.push(entry);
    }

    return results;
}
