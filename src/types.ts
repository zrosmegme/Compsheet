export interface DataRow {
    [key: string]: any;
}

export interface Criterion {
    id: string;
    column: string;
    min?: number | string;
    max?: number | string;
    text?: string;
    active: boolean;
}
