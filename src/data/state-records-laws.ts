// State public-records statutes for the Toolkit's state-records letter
// (live audit P1-11: state mode addressed the letter to a federal FOIA office).
// Citations are the statute's short name and primary code location. Deadlines,
// fees and exemptions vary by state and change; the letter does not assert them.
export type StateRecordsLaw = { code: string; state: string; law: string; cite: string };

export const STATE_RECORDS_LAWS: StateRecordsLaw[] = [
  { code: "AZ", state: "Arizona", law: "Arizona Public Records Law", cite: "A.R.S. § 39-121 et seq." },
  { code: "CA", state: "California", law: "California Public Records Act", cite: "Cal. Gov. Code § 7920.000 et seq." },
  { code: "CO", state: "Colorado", law: "Colorado Open Records Act", cite: "C.R.S. § 24-72-201 et seq." },
  { code: "FL", state: "Florida", law: "Florida Public Records Act", cite: "Fla. Stat. ch. 119" },
  { code: "GA", state: "Georgia", law: "Georgia Open Records Act", cite: "O.C.G.A. § 50-18-70 et seq." },
  { code: "IL", state: "Illinois", law: "Illinois Freedom of Information Act", cite: "5 ILCS 140" },
  { code: "IA", state: "Iowa", law: "Iowa Open Records Law", cite: "Iowa Code ch. 22" },
  { code: "MA", state: "Massachusetts", law: "Massachusetts Public Records Law", cite: "M.G.L. c. 66, § 10" },
  { code: "MI", state: "Michigan", law: "Michigan Freedom of Information Act", cite: "MCL 15.231 et seq." },
  { code: "MN", state: "Minnesota", law: "Minnesota Government Data Practices Act", cite: "Minn. Stat. ch. 13" },
  { code: "MO", state: "Missouri", law: "Missouri Sunshine Law", cite: "RSMo ch. 610" },
  { code: "NJ", state: "New Jersey", law: "Open Public Records Act", cite: "N.J.S.A. 47:1A-1 et seq." },
  { code: "NY", state: "New York", law: "Freedom of Information Law", cite: "N.Y. Pub. Off. Law art. 6" },
  { code: "NC", state: "North Carolina", law: "North Carolina Public Records Act", cite: "N.C.G.S. ch. 132" },
  { code: "OH", state: "Ohio", law: "Ohio Public Records Act", cite: "Ohio Rev. Code § 149.43" },
  { code: "PA", state: "Pennsylvania", law: "Right-to-Know Law", cite: "65 P.S. § 67.101 et seq." },
  { code: "TX", state: "Texas", law: "Texas Public Information Act", cite: "Tex. Gov't Code ch. 552" },
  { code: "VA", state: "Virginia", law: "Virginia Freedom of Information Act", cite: "Va. Code § 2.2-3700 et seq." },
  { code: "WA", state: "Washington", law: "Washington Public Records Act", cite: "RCW 42.56" },
  { code: "WI", state: "Wisconsin", law: "Wisconsin Public Records Law", cite: "Wis. Stat. §§ 19.31–19.39" },
];

export const OTHER_STATE: StateRecordsLaw = {
  code: "OTHER",
  state: "Other state",
  law: "the applicable state public-records law",
  cite: "applicable state public-records statute",
};
