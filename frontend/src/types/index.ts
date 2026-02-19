export type Rolle = 'OP_PFLEGE' | 'OBERARZT' | 'CHEFARZT' | 'OP_MANAGER' | 'AEMP_MITARBEITER';

export type SiebTyp = 'FACHABTEILUNGSSPEZIFISCH' | 'FACHUEBERGREIFEND';

export type SiebStatus = 'ENTWURF' | 'AKTIV' | 'INAKTIV' | 'ARCHIVIERT';

export type AenderungStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AenderungTyp = 'ADD_INSTRUMENT' | 'REMOVE_INSTRUMENT' | 'MODIFY_ANZAHL' | 'MODIFY_POSITION' | 'CREATE_SIEB' | 'DEACTIVATE_SIEB';

export interface User {
  id: string;
  username: string;
  email: string;
  vorname: string;
  nachname: string;
  rolle: Rolle;
  fachabteilung?: Fachabteilung;
  active?: boolean;
  createdAt?: string;
}

export interface Fachabteilung {
  id: string;
  name: string;
  kuerzel: string;
  beschreibung?: string;
  chefArzt?: User;
  _count?: { siebe: number; user: number };
}

export interface Hersteller {
  id: string;
  name: string;
  katalogPfad?: string;
  website?: string;
  kontaktEmail?: string;
  _count?: { instrumente: number };
}

export interface Instrument {
  id: string;
  artikelNr: string;
  bezeichnung: string;
  beschreibung?: string;
  bildPfad?: string;
  herstellerId: string;
  hersteller?: Hersteller;
  createdAt?: string;
}

export interface SiebInhalt {
  id: string;
  siebId: string;
  instrumentId: string;
  instrument: Instrument;
  anzahl: number;
  position?: string;
  hinweis?: string;
}

export interface Sieb {
  id: string;
  name: string;
  beschreibung?: string;
  typ: SiebTyp;
  status: SiebStatus;
  version: number;
  bildGepacktPfad?: string;
  fachabteilungId?: string;
  fachabteilung?: Fachabteilung;
  erstelltVon?: User;
  instrumente: SiebInhalt[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Aenderung {
  id: string;
  siebId: string;
  sieb?: Sieb;
  typ: AenderungTyp;
  altDaten?: Record<string, unknown>;
  neuDaten: Record<string, unknown>;
  kommentar?: string;
  status: AenderungStatus;
  beantragtVon?: User;
  beantragtAm: string;
  genehmigtVon?: User;
  genehmigtAm?: string;
  ablehnungsGrund?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
}
