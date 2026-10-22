import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Appointment_Key {
  id: UUIDString;
  __typename?: 'Appointment_Key';
}

export interface CancelAppointmentData {
  appointment_update?: Appointment_Key | null;
}

export interface CancelAppointmentVariables {
  id: UUIDString;
}

export interface Client_Key {
  id: UUIDString;
  __typename?: 'Client_Key';
}

export interface CreateAppointmentData {
  appointment_insert: Appointment_Key;
}

export interface CreateAppointmentVariables {
  fecha: DateString;
  hora: string;
  estado: string;
  clientId: UUIDString;
  professionalId: UUIDString;
  procedureId: UUIDString;
}

export interface ListAppointmentsData {
  appointments: ({
    id: UUIDString;
    fecha: DateString;
    hora: string;
    estado: string;
    client: {
      id: UUIDString;
      rut: string;
      nombre: string;
      apellido: string;
    } & Client_Key;
    professional: {
      id: UUIDString;
      nombre: string;
      apellido: string;
      especialidad: string;
    } & Professional_Key;
    procedure: {
      id: UUIDString;
      nombre: string;
      precio: number;
      duracion: number;
    } & Procedure_Key;
  } & Appointment_Key)[];
}

export interface ListClientsData {
  clients: ({
    id: UUIDString;
    rut: string;
    nombre: string;
    apellido: string;
    telefono: number;
    correo?: string | null;
  } & Client_Key)[];
}

export interface ListOffersData {
  offers: ({
    id: UUIDString;
    nombre: string;
    descuento: number;
    fechaInicio: DateString;
    fechaFin?: DateString | null;
  } & Offer_Key)[];
}

export interface ListProceduresData {
  procedures: ({
    id: UUIDString;
    nombre: string;
    descripcion: string;
    precio: number;
    duracion: number;
  } & Procedure_Key)[];
}

export interface ListProfessionalsData {
  professionals: ({
    id: UUIDString;
    rut: string;
    nombre: string;
    apellido: string;
    especialidad: string;
  } & Professional_Key)[];
}

export interface OfferProcedure_Key {
  offerId: UUIDString;
  procedureId: UUIDString;
  __typename?: 'OfferProcedure_Key';
}

export interface Offer_Key {
  id: UUIDString;
  __typename?: 'Offer_Key';
}

export interface Procedure_Key {
  id: UUIDString;
  __typename?: 'Procedure_Key';
}

export interface Professional_Key {
  id: UUIDString;
  __typename?: 'Professional_Key';
}

/** Generated Node Admin SDK operation action function for the 'CancelAppointment' Mutation. Allow users to execute without passing in DataConnect. */
export function cancelAppointment(dc: DataConnect, vars: CancelAppointmentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CancelAppointmentData>>;
/** Generated Node Admin SDK operation action function for the 'CancelAppointment' Mutation. Allow users to pass in custom DataConnect instances. */
export function cancelAppointment(vars: CancelAppointmentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CancelAppointmentData>>;

/** Generated Node Admin SDK operation action function for the 'CreateAppointment' Mutation. Allow users to execute without passing in DataConnect. */
export function createAppointment(dc: DataConnect, vars: CreateAppointmentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAppointmentData>>;
/** Generated Node Admin SDK operation action function for the 'CreateAppointment' Mutation. Allow users to pass in custom DataConnect instances. */
export function createAppointment(vars: CreateAppointmentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAppointmentData>>;

/** Generated Node Admin SDK operation action function for the 'ListAppointments' Query. Allow users to execute without passing in DataConnect. */
export function listAppointments(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAppointmentsData>>;
/** Generated Node Admin SDK operation action function for the 'ListAppointments' Query. Allow users to pass in custom DataConnect instances. */
export function listAppointments(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAppointmentsData>>;

/** Generated Node Admin SDK operation action function for the 'ListClients' Query. Allow users to execute without passing in DataConnect. */
export function listClients(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListClientsData>>;
/** Generated Node Admin SDK operation action function for the 'ListClients' Query. Allow users to pass in custom DataConnect instances. */
export function listClients(options?: OperationOptions): Promise<ExecuteOperationResponse<ListClientsData>>;

/** Generated Node Admin SDK operation action function for the 'ListOffers' Query. Allow users to execute without passing in DataConnect. */
export function listOffers(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListOffersData>>;
/** Generated Node Admin SDK operation action function for the 'ListOffers' Query. Allow users to pass in custom DataConnect instances. */
export function listOffers(options?: OperationOptions): Promise<ExecuteOperationResponse<ListOffersData>>;

/** Generated Node Admin SDK operation action function for the 'ListProcedures' Query. Allow users to execute without passing in DataConnect. */
export function listProcedures(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListProceduresData>>;
/** Generated Node Admin SDK operation action function for the 'ListProcedures' Query. Allow users to pass in custom DataConnect instances. */
export function listProcedures(options?: OperationOptions): Promise<ExecuteOperationResponse<ListProceduresData>>;

/** Generated Node Admin SDK operation action function for the 'ListProfessionals' Query. Allow users to execute without passing in DataConnect. */
export function listProfessionals(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListProfessionalsData>>;
/** Generated Node Admin SDK operation action function for the 'ListProfessionals' Query. Allow users to pass in custom DataConnect instances. */
export function listProfessionals(options?: OperationOptions): Promise<ExecuteOperationResponse<ListProfessionalsData>>;

