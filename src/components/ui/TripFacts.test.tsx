import { describe, expect, test } from 'vitest';
import { specialtyDateFacts, type TripFact } from './TripFacts';

const westwater: TripFact[] = [
    { label: 'Starts at', value: '$599' },
    { label: 'Duration', value: '2/3/4 Days' },
    { label: 'Whitewater', value: 'Class IV' },
    { label: 'Season', value: 'April to October' },
    { label: 'Min Age', value: '8' },
    { label: 'River', value: 'Colorado River', href: '/rivers/westwater' },
];

const byLabel = (facts: TripFact[]) =>
    Object.fromEntries(facts.map((fact) => [fact.label, fact.value]));

describe('specialtyDateFacts', () => {
    test('uses Arctic’s fare and length when nothing is typed, and drops the season', () => {
        const facts = specialtyDateFacts(westwater, {
            fare: '$1,560',
            days: 4,
        });
        expect(facts.map((fact) => fact.label)).toEqual([
            'Price',
            'Duration',
            'Whitewater',
            'Min Age',
            'River',
        ]);
        expect(byLabel(facts)).toMatchObject({
            Price: '$1,560',
            Duration: '4 Days',
            'Min Age': '8',
        });
    });

    test('what is typed for the date wins over Arctic', () => {
        const facts = specialtyDateFacts(westwater, {
            fare: '$1,560',
            days: 4,
            minAge: 18,
            priceText: ' $890 ',
            lengthText: '3 Days',
        });
        expect(byLabel(facts)).toMatchObject({
            Price: '$890',
            Duration: '3 Days',
            'Min Age': '18',
        });
        // The link on an untouched fact survives.
        expect(facts.at(-1)).toEqual(westwater.at(-1));
    });

    test('uses what is typed when Arctic has no match', () => {
        expect(
            byLabel(
                specialtyDateFacts(westwater, {
                    minAge: 18,
                    priceText: '$890',
                    lengthText: '3 Days',
                }),
            ),
        ).toMatchObject({ Price: '$890', Duration: '3 Days', 'Min Age': '18' });
    });

    test('treats blank text and a zero age as not set', () => {
        expect(
            byLabel(
                specialtyDateFacts(westwater, {
                    fare: '$1,560',
                    days: 4,
                    minAge: 0,
                    priceText: '   ',
                    lengthText: '',
                }),
            ),
        ).toMatchObject({
            Price: '$1,560',
            Duration: '4 Days',
            'Min Age': '8',
        });
    });

    test('a minimum age for the date wins even when Arctic lists it', () => {
        expect(
            byLabel(
                specialtyDateFacts(westwater, {
                    fare: '$599',
                    days: 3,
                    minAge: 18,
                }),
            )['Min Age'],
        ).toBe('18');
    });

    test('keeps the trip’s own facts with no match and no overrides', () => {
        expect(byLabel(specialtyDateFacts(westwater, {}))).toMatchObject({
            'Starts at': '$599',
            Duration: '2/3/4 Days',
            'Min Age': '8',
        });
    });

    test('says 1 Day for a one-day departure', () => {
        expect(
            byLabel(specialtyDateFacts(westwater, { days: 1 })).Duration,
        ).toBe('1 Day');
    });

    test('adds what the date sets when the trip has none of its own', () => {
        const facts = specialtyDateFacts(
            [{ label: 'Whitewater', value: 'Class III' }],
            { priceText: '$890', lengthText: '3 Days', minAge: 18 },
        );
        expect(facts).toEqual([
            { label: 'Price', value: '$890' },
            { label: 'Duration', value: '3 Days' },
            { label: 'Whitewater', value: 'Class III' },
            { label: 'Min Age', value: '18' },
        ]);
    });
});
