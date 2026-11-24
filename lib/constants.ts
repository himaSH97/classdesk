// Plain constants shared by server data helpers and client components.
// Kept separate from lib/data.ts so client code can use them without
// pulling the JSON data into the browser bundle.

/** Students below this overall attendance are flagged as at risk. */
export const AT_RISK_ATTENDANCE = 0.8;
