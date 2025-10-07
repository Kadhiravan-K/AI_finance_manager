
import { Note } from '../types';

const FOREST_SURVIVAL_CONTENT = `
### Lost in the Forest: A Step-by-Step Guide

If you find yourself lost, the most important thing is to stay calm. Use the **S.T.O.P.** acronym:

**S - Stop:** The moment you realize you might be lost, stop moving. Panicking and walking aimlessly will only worsen the situation. Sit down, take a deep breath, and drink some water.

**T - Think:** Assess your situation. How did you get here? What resources do you have (water, food, map, compass, phone)? What is the weather like? How much daylight is left?

**O - Observe:** Look for landmarks, listen for sounds (cars, water, people), and check your surroundings for resources like shelter materials or a water source. Try to determine which direction you came from.

**P - Plan:** Based on your thinking and observation, make a plan.
- **If it's late or the weather is bad:** Prioritize building a simple shelter and a fire.
- **If you have a map/compass:** Try to orient yourself and find your way back.
- **If you are truly lost:** Stay put. It's easier for rescuers to find a stationary person than a moving one. Find a clear, open area to make yourself visible.

#### Do's and Don'ts

- **DO** find a source of water. Water is more critical than food.
- **DO** build a shelter to protect yourself from the elements.
- **DO** create signals for rescuers (three fires in a triangle, a large 'X' on the ground with rocks or branches).
- **DON'T** eat any plants or berries unless you are 100% certain they are safe.
- **DON'T** wander aimlessly, especially at night.
- **DON'T** cross large bodies of water unless absolutely necessary.
`;

const DISASTER_PREPAREDNESS_CONTENT = `
### Disaster Preparedness Guide

Natural disasters can strike with little warning. Being prepared is your best defense.

#### Before a Disaster
- **Make a Plan:** Have a family emergency plan. Know your evacuation routes and have a designated meeting place.
- **Build a Kit:** Prepare an emergency kit with water (one gallon per person per day for several days), non-perishable food, a flashlight, a first-aid kit, batteries, a whistle, and any necessary medications.
- **Stay Informed:** Sign up for local emergency alerts and monitor weather reports.
- **Secure Your Home:** Learn how to shut off utilities. Secure heavy items that could fall.

#### During a Disaster
- **Follow Orders:** Evacuate immediately if authorities tell you to do so.
- **Shelter:** If not evacuating, take shelter in a small, interior room on the lowest level away from windows.
- **Listen:** Use a battery-powered radio to listen for official updates.
- **Stay Put:** Do not go outside until authorities say it is safe.

#### After a Disaster
- **Check for Injuries:** Provide first aid where needed. Do not move seriously injured people unless they are in immediate danger.
- **Communicate:** Let family and friends know you are safe. Use text messages or social media, as phone lines may be overwhelmed.
- **Inspect for Damage:** Check your home for damage. Be cautious of gas leaks, electrical damage, and structural issues.
- **Avoid Hazards:** Stay away from downed power lines and flooded areas.
`;

const WILDERNESS_DANGERS_CONTENT = `
### Wilderness Dangers & Survival

Understanding and respecting wildlife is key to staying safe.

#### Avoiding Dangerous Animals
- **Bears:** Make noise while hiking (talk, sing, clap) to avoid surprising them. Store food in bear-resistant containers or hung high in a tree, far from your campsite. If you encounter a bear, do not run. Stand your ground, make yourself look large, and back away slowly.
- **Snakes:** Watch where you step, especially in rocky or brushy areas. Wear sturdy boots. If bitten, stay calm, keep the bite below heart level, and seek medical attention immediately. Do not try to suck out the venom.
- **Mountain Lions / Cougars:** They are elusive. Avoid hiking alone at dawn or dusk. If you encounter one, make noise, make yourself look large, and do not run or turn your back. Fight back if attacked.

#### Insects
- **Ticks:** Wear long sleeves and pants. Use insect repellent with DEET. Check your body thoroughly after hiking. Remove any ticks promptly with tweezers, pulling straight out.
- **Mosquitoes & Biting Flies:** Wear light-colored clothing and use repellent. They are most active at dawn and dusk.

#### Marine Life
- **Sharks:** Avoid swimming at dawn/dusk, in murky water, or near schools of fish. If you see a shark, calmly and slowly leave the water. Do not thrash.
- **Jellyfish:** Be aware of local warnings. If stung, rinse the area with vinegar (not fresh water). Remove any tentacles with a flat object, not your bare hands.
- **Rip Currents:** If caught in one, don't fight it. Swim parallel to the shore until you are out of the current, then swim back to land.

#### Birds
- While most birds are harmless, some can be aggressive when protecting nests, especially during spring. If a bird is swooping at you, it's best to calmly leave the area. Do not harass them.
`;

export const createSurvivalNotesForTrip = (tripId: string): Note[] => {
    const now = new Date().toISOString();
    return [
        {
            id: self.crypto.randomUUID(),
            title: "Survival Guide: Lost in the Forest",
            content: FOREST_SURVIVAL_CONTENT.trim(),
            type: 'note',
            createdAt: now,
            updatedAt: now,
            tripId: tripId,
        },
        {
            id: self.crypto.randomUUID(),
            title: "Survival Guide: Disaster Preparedness",
            content: DISASTER_PREPAREDNESS_CONTENT.trim(),
            type: 'note',
            createdAt: now,
            updatedAt: now,
            tripId: tripId,
        },
        {
            id: self.crypto.randomUUID(),
            title: "Survival Guide: Wilderness Dangers",
            content: WILDERNESS_DANGERS_CONTENT.trim(),
            type: 'note',
            createdAt: now,
            updatedAt: now,
            tripId: tripId,
        }
    ];
};
